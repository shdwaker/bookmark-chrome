// Content script for immersive page translation.
// Orchestrates: collect pieces -> clone blocks -> cache query -> concurrency
// pool -> inject translations -> start MutationObserver.
// Reuses background DO_TRANSLATE handler and createPool from inline.js.
//
// Mutual exclusion with inline translation is handled by translate-panel.js,
// which calls clearImmersive() before starting inline, and clearInline()
// before starting immersive.

import { collectPieces } from '../utils/translate/immersive/paragraph-detector.js'
import { createCache } from '../utils/translate/immersive/cache.js'
import { getSiteRule } from '../utils/translate/immersive/site-rules.js'
import {
  cloneBlockElement,
  injectTranslation,
  markFailed,
  setMode,
  clearAll
} from '../utils/translate/immersive/dom-injector.js'
import { createPool } from '../utils/translate/inline.js'

const CONTROL_BAR_HOST_ID = '__immersive_control_bar_host__'
const PARAGRAPH_LIMIT = 500
const CONCURRENCY = 3
const OBSERVER_DEBOUNCE_MS = 500
const OBSERVER_MAX_NEW_PIECES = 50

const CONTROL_BAR_HTML = `
<style>
  :host { all: initial; }
  .bar {
    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 8px;
    background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px; color: #333;
  }
  .bar.flash { animation: flash 0.5s ease; }
  @keyframes flash {
    0%, 100% { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    50% { box-shadow: 0 0 0 4px #4a90d9, 0 2px 12px rgba(0,0,0,0.15); }
  }
  .status { font-weight: 600; white-space: nowrap; }
  .count { color: #666; white-space: nowrap; }
  .hint { color: #e53935; font-size: 12px; }
  .spacer { flex: 1; }
  .btn {
    padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px;
    background: #fff; cursor: pointer; font-size: 12px; color: #333;
    white-space: nowrap;
  }
  .btn:hover { background: #f0f0f0; }
  .btn.active { background: #4a90d9; color: #fff; border-color: #4a90d9; }
  .btn-danger { color: #e53935; border-color: #e53935; }
  .btn-danger:hover { background: #ffebee; }
</style>
<div class="bar">
  <span class="status">沉浸式中…</span>
  <span class="count">0/0</span>
  <span class="hint"></span>
  <span class="spacer"></span>
  <button class="btn mode-btn" data-mode="original">原文</button>
  <button class="btn mode-btn" data-mode="translated">译文</button>
  <button class="btn mode-btn active" data-mode="dual">双语</button>
  <button class="btn btn-danger retry-btn" style="display:none;">重试失败</button>
  <button class="btn clear-btn">清除</button>
</div>
`

const state = {
  active: false,
  cancelled: false,
  mode: 'dual',
  direction: '',
  pieces: [],
  clones: new Map(),
  translatedSpans: [],
  completedCount: 0,
  failedCount: 0,
  totalCount: 0,
  pool: null,
  observer: null,
  debounceTimer: null,
  cache: null,
  controlBar: null,
  retryGen: 0
}

function getDirection() {
  return state.direction || 'auto'
}

async function translatePiece(text) {
  const direction = getDirection()
  let response
  try {
    response = await chrome.runtime.sendMessage({
      type: 'DO_TRANSLATE',
      text,
      direction
    })
  } catch (err) {
    const msg = err?.message || String(err)
    if (msg.includes('Extension context invalidated')) {
      throw new Error('插件已更新，请刷新页面后重试')
    }
    throw new Error(`通信失败：${msg}`)
  }
  if (!response) throw new Error('后台未响应翻译请求')
  if (response.error) throw new Error(response.error)
  return response.result
}

// --- Control bar ---

function createControlBar() {
  document.getElementById(CONTROL_BAR_HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = CONTROL_BAR_HOST_ID
  host.style.cssText = 'position:fixed; top:0; right:0; z-index:2147483647;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = CONTROL_BAR_HTML
  document.body.appendChild(host)

  shadow.querySelector('.clear-btn').addEventListener('click', handleClear)
  shadow.querySelector('.retry-btn').addEventListener('click', handleRetryFailed)
  shadow.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode
      handleModeSwitch(mode)
    })
  })

  state.controlBar = { host, shadow }
  updateControlBar()
}

function updateControlBar() {
  if (!state.controlBar) return
  const shadow = state.controlBar.shadow
  const { active, completedCount, failedCount, totalCount } = state

  const statusEl = shadow.querySelector('.status')
  const countEl = shadow.querySelector('.count')
  const hintEl = shadow.querySelector('.hint')
  const retryBtn = shadow.querySelector('.retry-btn')

  if (active) {
    statusEl.textContent = '沉浸式中…'
  } else {
    statusEl.textContent = '完成'
  }

  countEl.textContent = `${completedCount + failedCount}/${totalCount}`

  if (!active && failedCount > 0) {
    hintEl.textContent = `${failedCount}段失败`
    retryBtn.style.display = ''
  } else {
    hintEl.textContent = ''
    retryBtn.style.display = 'none'
  }

  shadow.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode)
  })
}

function flashControlBar() {
  if (!state.controlBar) return
  const bar = state.controlBar.shadow.querySelector('.bar')
  bar.classList.remove('flash')
  void bar.offsetWidth
  bar.classList.add('flash')
}

function removeControlBar() {
  document.getElementById(CONTROL_BAR_HOST_ID)?.remove()
  state.controlBar = null
}

// --- Mode switching ---

function handleModeSwitch(mode) {
  state.mode = mode
  setMode(mode, state.clones, state.translatedSpans)
  updateControlBar()
}

// --- Cloning ---

function cloneBlockElements(pieces) {
  const seen = new Set()
  for (const piece of pieces) {
    if (!piece.blockEl || seen.has(piece.blockEl)) continue
    seen.add(piece.blockEl)
    const { clone } = cloneBlockElement(piece.blockEl)
    state.clones.set(piece.blockEl, clone)
  }
}

// --- Translation pool ---

async function runPool(pieces) {
  const pool = createPool({
    items: pieces,
    concurrency: CONCURRENCY,
    shouldCancel: () => state.cancelled,
    worker: async (piece) => {
      if (state.cancelled) return
      const result = await translatePiece(piece.text)
      if (state.cancelled) return
      const spans = injectTranslation(piece, result)
      state.translatedSpans.push(...spans)
      state.completedCount++
      setMode(state.mode, state.clones, spans)
      if (state.cache) {
        await state.cache.write([{
          text: piece.text,
          direction: getDirection(),
          translation: result
        }])
      }
      updateControlBar()
    }
  })
  state.pool = pool
  const result = await pool.promise
  state.pool = null

  // Process failed pieces: mark them in the DOM and update failedCount.
  if (result.failed.length > 0) {
    for (const { item: piece, error } of result.failed) {
      const spans = markFailed(piece, error, retrySinglePiece)
      state.translatedSpans.push(...spans)
      state.failedCount++
    }
    updateControlBar()
  }

  state.active = false
  updateControlBar()
}

// --- MutationObserver ---

function startObserver() {
  if (state.observer) return

  const observer = new MutationObserver(() => {
    if (state.debounceTimer) return
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null
      handleMutations()
    }, OBSERVER_DEBOUNCE_MS)
  })

  observer.observe(document.body, { childList: true, subtree: true })
  state.observer = observer
}

function handleMutations() {
  if (state.cancelled || !state.observer || !state.controlBar) return

  const rule = getSiteRule(location.href)
  const allPieces = collectPieces(document.body, {
    direction: getDirection(),
    limit: PARAGRAPH_LIMIT,
    rule
  })

  const newPieces = allPieces.filter(p => p.status === 'pending').slice(0, OBSERVER_MAX_NEW_PIECES)
  const trulyNew = newPieces.filter(p => !state.clones.has(p.blockEl))
  if (trulyNew.length === 0) return

  cloneBlockElements(trulyNew)
  translateNewPieces(trulyNew)
}

async function translateNewPieces(pieces) {
  const texts = pieces.map(p => p.text)
  const { hit, miss } = await state.cache.query(texts, getDirection())

  for (const piece of pieces) {
    if (hit.has(piece.text)) {
      const spans = injectTranslation(piece, hit.get(piece.text))
      state.translatedSpans.push(...spans)
      state.completedCount++
      setMode(state.mode, state.clones, spans)
    }
  }
  updateControlBar()

  const missPieces = pieces.filter(p => miss.includes(p.text))
  if (missPieces.length > 0) {
    await runPool(missPieces)
  }
}

// --- Stop / Clear / Retry ---

function handleStop() {
  state.cancelled = true
  if (state.pool) state.pool.cancel()
}

function handleClear() {
  state.cancelled = true
  if (state.pool) state.pool.cancel()
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer)
    state.debounceTimer = null
  }
  if (state.observer) {
    state.observer.disconnect()
    state.observer = null
  }
  clearAll(state.translatedSpans, state.clones)
  removeControlBar()
  state.active = false
  state.cancelled = false
  state.pieces = []
  state.clones = new Map()
  state.translatedSpans = []
  state.completedCount = 0
  state.failedCount = 0
  state.totalCount = 0
  state.mode = 'dual'
}

async function retrySinglePiece(piece) {
  const gen = state.retryGen
  if (state.cancelled || !state.controlBar) return
  // Remove only this piece's failed marker spans and restore original text nodes.
  // Match on originalNode membership, not blockEl (multiple pieces may share a blockEl).
  const pieceNodeSet = new Set(piece.textNodes)
  for (let i = state.translatedSpans.length - 1; i >= 0; i--) {
    if (pieceNodeSet.has(state.translatedSpans[i].originalNode)) {
      const { originalNode, translatedSpan } = state.translatedSpans[i]
      if (translatedSpan.parentNode) {
        translatedSpan.parentNode.replaceChild(originalNode, translatedSpan)
      }
      state.translatedSpans.splice(i, 1)
    }
  }
  piece.status = 'pending'
  state.failedCount = Math.max(0, state.failedCount - 1)
  try {
    const result = await translatePiece(piece.text)
    if (state.cancelled || !state.controlBar || gen !== state.retryGen) return
    const spans = injectTranslation(piece, result)
    state.translatedSpans.push(...spans)
    state.completedCount++
    setMode(state.mode, state.clones, spans)
    if (state.cache) {
      await state.cache.write([{
        text: piece.text,
        direction: getDirection(),
        translation: result
      }])
    }
  } catch (err) {
    if (state.cancelled || !state.controlBar || gen !== state.retryGen) return
    const spans = markFailed(piece, err, retrySinglePiece)
    state.translatedSpans.push(...spans)
    state.failedCount++
  }
  updateControlBar()
}

async function handleRetryFailed() {
  if (state.active) return
  const failedPieces = state.pieces.filter(p => p.status === 'failed')
  if (failedPieces.length === 0) return

  // Restore original text nodes for failed pieces before retrying.
  // markFailed replaced textNodes[0] with a failed span, orphaning the node.
  // injectTranslation will try to replaceChild on these nodes, which throws
  // if parentNode is null. We must restore them first.
  for (const piece of failedPieces) {
    const pieceNodeSet = new Set(piece.textNodes)
    for (let i = state.translatedSpans.length - 1; i >= 0; i--) {
      if (pieceNodeSet.has(state.translatedSpans[i].originalNode)) {
        const { originalNode, translatedSpan } = state.translatedSpans[i]
        if (translatedSpan.parentNode) {
          translatedSpan.parentNode.replaceChild(originalNode, translatedSpan)
        }
        state.translatedSpans.splice(i, 1)
      }
    }
    piece.status = 'pending'
  }

  state.retryGen++
  state.cancelled = false
  state.failedCount = 0
  state.active = true
  updateControlBar()

  await runPool(failedPieces)
}

// --- Public API ---

export async function startImmersive(direction) {
  if (state.active) {
    if (state.controlBar) flashControlBar()
    return
  }

  state.cancelled = false
  state.completedCount = 0
  state.failedCount = 0
  state.mode = 'dual'
  state.direction = direction || 'auto'
  state.clones = new Map()
  state.translatedSpans = []

  state.cache = createCache()
  await state.cache.init()

  const rule = getSiteRule(location.href)
  const pieces = collectPieces(document.body, {
    direction: getDirection(),
    limit: PARAGRAPH_LIMIT,
    rule
  })

  if (pieces.length === 0) {
    alert('未找到可翻译的段落')
    return
  }

  state.pieces = pieces
  state.totalCount = pieces.length
  state.active = true

  createControlBar()
  cloneBlockElements(pieces)

  const texts = pieces.map(p => p.text)
  const { hit, miss } = await state.cache.query(texts, getDirection())

  for (const piece of pieces) {
    if (hit.has(piece.text)) {
      const spans = injectTranslation(piece, hit.get(piece.text))
      state.translatedSpans.push(...spans)
      state.completedCount++
      setMode(state.mode, state.clones, spans)
    }
  }
  updateControlBar()

  const missPieces = pieces.filter(p => miss.includes(p.text))
  if (missPieces.length > 0) {
    await runPool(missPieces)
  }

  if (!state.cancelled) {
    startObserver()
  }
}

export function clearImmersive() {
  handleClear()
}
