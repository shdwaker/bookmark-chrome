// Content script for inline paragraph-by-paragraph page translation.
// Orchestrates: collect paragraphs -> concurrency pool -> inject translations.
// Reuses background DO_TRANSLATE handler via chrome.runtime.sendMessage.
//
// Pure helpers (collectParagraphs, createPool) are imported from
// ../utils/translate/inline.js. This file owns DOM mutation and the
// floating control bar UI.

import { collectParagraphs, createPool } from '../utils/translate/inline.js'

const CONTROL_BAR_HOST_ID = '__mt_control_bar_host__'
const TRANSLATION_CLASS = 'mt-translation'
const FAILED_CLASS = 'mt-failed'
const TRANSLATED_ATTR = 'data-mt-translated'
const FAILED_ATTR = 'data-mt-failed'

const TRANSLATION_STYLE = [
  'display:block',
  'margin:8px 0 12px 0',
  'padding:8px 12px',
  'background:#f0f7ff',
  'border-left:3px solid #4a90d9',
  'color:#333',
  'font-size:0.95em',
  'line-height:1.6',
  'border-radius:0 4px 4px 0',
  'white-space:pre-wrap',
  'word-break:break-word'
].join(';')

const FAILED_STYLE = [
  'display:block',
  'margin:8px 0 12px 0',
  'padding:6px 12px',
  'background:#fff0f0',
  'border-left:3px solid #e53935',
  'color:#c62828',
  'font-size:0.85em',
  'cursor:pointer',
  'border-radius:0 4px 4px 0'
].join(';')

export function injectTranslation(paragraph, result) {
  if (paragraph.el.hasAttribute(TRANSLATED_ATTR)) return
  const host = document.createElement('div')
  host.className = TRANSLATION_CLASS
  host.setAttribute('data-mt-paragraph-id', paragraph.id)
  host.style.cssText = TRANSLATION_STYLE
  host.textContent = result.translation
  paragraph.el.after(host)
  paragraph.el.setAttribute(TRANSLATED_ATTR, '1')
  paragraph.status = 'translated'
  paragraph.injectedHost = host
}

export function markFailed(paragraph, err, onRetry) {
  if (paragraph.el.hasAttribute(FAILED_ATTR)) return
  const host = document.createElement('div')
  host.className = FAILED_CLASS
  host.style.cssText = FAILED_STYLE
  host.textContent = `翻译失败：${err.message}（点击重试）`
  host.addEventListener('click', () => onRetry(paragraph))
  paragraph.el.after(host)
  paragraph.el.setAttribute(FAILED_ATTR, '1')
  paragraph.status = 'failed'
  paragraph.injectedHost = host
}

export function clearParagraphMarker(paragraph) {
  if (paragraph.injectedHost) {
    paragraph.injectedHost.remove()
    paragraph.injectedHost = null
  }
  paragraph.el.removeAttribute(TRANSLATED_ATTR)
  paragraph.el.removeAttribute(FAILED_ATTR)
  paragraph.status = 'pending'
}

export function removeAllInjected() {
  document.querySelectorAll(`.${TRANSLATION_CLASS}, .${FAILED_CLASS}`).forEach(el => el.remove())
  document.querySelectorAll(`[${TRANSLATED_ATTR}], [${FAILED_ATTR}]`).forEach(el => {
    el.removeAttribute(TRANSLATED_ATTR)
    el.removeAttribute(FAILED_ATTR)
  })
}

const CONTROL_BAR_HTML = `
<style>
  .bar {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #333;
    white-space: nowrap;
  }
  .bar.flash { animation: mt-flash 0.4s ease; }
  @keyframes mt-flash {
    0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    50% { box-shadow: 0 4px 24px rgba(74,144,217,0.6); }
  }
  .count { font-weight: 600; color: #4a90d9; }
  .hint { color: #888; font-size: 12px; }
  .spacer { flex: 1; }
  .btn {
    background: transparent;
    border: 1px solid #ddd;
    color: #333;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  .btn:hover { background: #f0f0f0; }
  .btn-danger { color: #e53935; border-color: #e53935; }
  .btn-danger:hover { background: #ffebee; }
  .btn-primary { color: #4a90d9; border-color: #4a90d9; }
  .btn-primary:hover { background: #f0f7ff; }
</style>
<div class="bar">
  <span class="status">译文中…</span>
  <span class="count">0/0</span>
  <span class="hint"></span>
  <span class="spacer"></span>
  <button class="btn btn-primary retry-btn" style="display:none;">重试失败</button>
  <button class="btn btn-primary continue-btn" style="display:none;">继续翻译</button>
  <button class="btn btn-danger stop-btn" style="display:none;">停止</button>
  <button class="btn clear-btn">清除</button>
</div>
`

export function createControlBar({ onStop, onClear, onRetry, onContinue }) {
  document.getElementById(CONTROL_BAR_HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = CONTROL_BAR_HOST_ID
  host.style.cssText = 'position:fixed; top:20px; right:20px; z-index:2147483647;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = CONTROL_BAR_HTML
  document.body.appendChild(host)

  shadow.querySelector('.stop-btn').addEventListener('click', onStop)
  shadow.querySelector('.clear-btn').addEventListener('click', onClear)
  shadow.querySelector('.retry-btn').addEventListener('click', onRetry)
  shadow.querySelector('.continue-btn').addEventListener('click', onContinue)

  return { host, shadow }
}

export function updateControlBar(shadow, state) {
  const { active, cancelled, completedCount, failedCount, totalCount, overLimit } = state
  const statusEl = shadow.querySelector('.status')
  const countEl = shadow.querySelector('.count')
  const hintEl = shadow.querySelector('.hint')
  const stopBtn = shadow.querySelector('.stop-btn')
  const retryBtn = shadow.querySelector('.retry-btn')
  const continueBtn = shadow.querySelector('.continue-btn')

  if (active) {
    statusEl.textContent = '译文中…'
    stopBtn.style.display = ''
  } else {
    stopBtn.style.display = 'none'
    if (cancelled) {
      statusEl.textContent = '已停止'
    } else if (failedCount > 0) {
      statusEl.textContent = '完成'
    } else {
      statusEl.textContent = '完成'
    }
  }

  countEl.textContent = `${completedCount + failedCount}/${totalCount}`

  if (overLimit) {
    hintEl.textContent = `仅翻译前 ${totalCount} 段`
  } else if (!active && failedCount > 0) {
    hintEl.textContent = `${failedCount} 段失败`
  } else {
    hintEl.textContent = ''
  }

  retryBtn.style.display = (!active && failedCount > 0) ? '' : 'none'
  continueBtn.style.display = (!active && !cancelled && overLimit) ? '' : 'none'
}

export function removeControlBar() {
  document.getElementById(CONTROL_BAR_HOST_ID)?.remove()
}

export function flashControlBar(shadow) {
  const bar = shadow.querySelector('.bar')
  bar.classList.remove('flash')
  void bar.offsetWidth  // force reflow to restart animation
  bar.classList.add('flash')
}

const PARAGRAPH_LIMIT = 100
const CONCURRENCY = 3

const state = {
  active: false,
  cancelled: false,
  pool: null,
  paragraphs: [],
  completedCount: 0,
  failedCount: 0,
  totalCount: 0,
  overLimit: false,
  direction: '',
  retryGen: 0,  // bumped to invalidate in-flight single retries
  controlBar: null  // { host, shadow }
}

function getDirection() {
  return state.direction || 'auto'
}

async function translateParagraph(text) {
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

function refreshControlBar() {
  if (!state.controlBar) return
  updateControlBar(state.controlBar.shadow, state)
}

export async function startInlineTranslation(direction) {
  // Idempotent: if already active, flash the control bar and return.
  if (state.active) {
    if (state.controlBar) flashControlBar(state.controlBar.shadow)
    return
  }

  // Reset state for a fresh session.
  state.cancelled = false
  state.completedCount = 0
  state.failedCount = 0
  state.direction = direction || 'auto'

  // Collect paragraphs (snapshot at trigger time).
  const allParagraphs = collectParagraphs(document.body, PARAGRAPH_LIMIT, {
    direction: state.direction
  })
  // Heuristic: if we hit exactly the limit, there are probably more on the page.
  state.overLimit = allParagraphs.length === PARAGRAPH_LIMIT

  if (allParagraphs.length === 0) {
    alert('未找到可翻译的段落')
    return
  }

  state.paragraphs = allParagraphs
  state.totalCount = allParagraphs.length
  state.active = true

  // Create control bar.
  state.controlBar = createControlBar({
    onStop: handleStop,
    onClear: handleClear,
    onRetry: handleRetryFailed,
    onContinue: handleContinue
  })
  refreshControlBar()

  // Build and run the pool.
  await runPool(state.paragraphs)
}

async function runPool(paragraphs) {
  const pool = createPool({
    items: paragraphs,
    concurrency: CONCURRENCY,
    shouldCancel: () => state.cancelled,
    worker: async (paragraph) => {
      if (state.cancelled) return
      try {
        const result = await translateParagraph(paragraph.text)
        if (state.cancelled) return
        injectTranslation(paragraph, result)
        state.completedCount++
      } catch (err) {
        if (state.cancelled) return
        markFailed(paragraph, err, retrySingleParagraph)
        state.failedCount++
      }
      refreshControlBar()
    }
  })
  state.pool = pool
  await pool.promise
  state.active = false
  state.pool = null
  refreshControlBar()
}

function handleStop() {
  state.cancelled = true
  if (state.pool) state.pool.cancel()
}

async function handleContinue() {
  if (state.active) return
  // collectParagraphs skips elements with data-mt-translated/data-mt-failed,
  // so this naturally returns only the next untranslated batch.
  const newParagraphs = collectParagraphs(document.body, PARAGRAPH_LIMIT, {
    direction: state.direction
  })
  if (newParagraphs.length === 0) {
    state.overLimit = false
    refreshControlBar()
    return
  }
  state.overLimit = newParagraphs.length === PARAGRAPH_LIMIT
  state.paragraphs = state.paragraphs.concat(newParagraphs)
  state.totalCount += newParagraphs.length
  state.cancelled = false
  state.active = true
  refreshControlBar()
  await runPool(newParagraphs)
}

function handleClear() {
  state.cancelled = true
  if (state.pool) state.pool.cancel()
  removeAllInjected()
  removeControlBar()
  state.active = false
  state.paragraphs = []
  state.completedCount = 0
  state.failedCount = 0
  state.totalCount = 0
  state.overLimit = false
  state.controlBar = null
}

// Exported for mutual exclusion: translate-panel.js calls this before
// starting immersive translation to clear any active inline session.
export function clearInline() {
  handleClear()
}

async function retrySingleParagraph(paragraph) {
  // User clicked a single failed paragraph's retry marker.
  const gen = state.retryGen
  if (state.cancelled || !state.controlBar) return
  clearParagraphMarker(paragraph)
  try {
    const result = await translateParagraph(paragraph.text)
    // Re-check after await: session may have been cleared or a bulk retry
    // may have started (which bumps retryGen to invalidate us).
    if (state.cancelled || !state.controlBar || gen !== state.retryGen) return
    injectTranslation(paragraph, result)
    state.failedCount = Math.max(0, state.failedCount - 1)
    state.completedCount++
  } catch (err) {
    if (state.cancelled || !state.controlBar || gen !== state.retryGen) return
    markFailed(paragraph, err, retrySingleParagraph)
    // failedCount unchanged
  }
  refreshControlBar()
}

async function handleRetryFailed() {
  if (state.active) return
  const failedParagraphs = state.paragraphs.filter(p => p.status === 'failed')
  if (failedParagraphs.length === 0) return

  // Invalidate any in-flight single retries so their post-await guards bail.
  state.retryGen++
  // Clear their markers and reset failed count.
  for (const p of failedParagraphs) {
    clearParagraphMarker(p)
  }
  state.failedCount = 0
  // Reset cancelled flag (may be true from a prior Stop) so the new pool can run.
  state.cancelled = false
  state.active = true
  refreshControlBar()

  await runPool(failedParagraphs)
}
