// Content script for the AI translate right-click context menu.
// Loaded on every page at document_idle via manifest content_scripts.
// Listens for messages from the background worker and shows a floating
// Shadow DOM panel with the translation result and TTS controls.
//
// Inline page translation is imported as an ES module orchestrator; the rest of
// this file remains self-contained so the bundle stays small.
// Translation is delegated to the background worker via DO_TRANSLATE
// messages; TTS uses window.speechSynthesis directly.

const PANEL_HOST_ID = '__ai_translate_panel_host__'
const READ_ALOUD_HOST_ID = '__ai_translate_read_aloud_host__'
const POPPER_HOST_ID = '__ai_translate_popper_host__'
const POPUP_CONCURRENCY = 5
const PAGE_BATCH_SIZE = 5

import { startInlineTranslation, clearInline } from './inline-translate.js'
import { startImmersive, clearImmersive } from './immersive-translate.js'
import { splitTextIntoChunks, splitTextIntoParagraphs } from '../utils/translate/chunk.js'
import { splitSyllables } from '../utils/translate/syllable-splitter.js'
import { createPool } from '../utils/translate/inline.js'
import { extractPageParagraphs, PAGE_TEXT_LIMIT } from '../utils/translate/page-content.js'

// --- Settings cache (refreshed via storage.onChanged) ---
const cachedSettings = {
  interactionMode: 'selection',
  voiceChinese: '',
  voiceEnglish: ''
}

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get('settings')
    const t = data?.settings?.translate
    if (t) {
      cachedSettings.interactionMode = t.interactionMode || 'selection'
      cachedSettings.voiceChinese = t.voiceChinese || ''
      cachedSettings.voiceEnglish = t.voiceEnglish || ''
    }
  } catch { /* storage might be unavailable in some contexts */ }
}

// --- TTS state (module-level, shared across panels) ---
let voices = []
let playingKey = ''
let speakHint = ''

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

function pickVoice(lang) {
  const isChinese = lang.startsWith('zh')
  const configuredURI = isChinese ? cachedSettings.voiceChinese : cachedSettings.voiceEnglish
  if (configuredURI) {
    const v = voices.find(v => v.voiceURI === configuredURI)
    if (v) return v
  }
  // fallback: exact lang match, then prefix match
  let v = voices.find(v => v.lang === lang)
  if (v) return v
  const prefix = lang.split('-')[0]
  v = voices.find(v => v.lang.startsWith(prefix))
  return v || null
}

function speak(text, rate, key, onStateChange) {
  if (!('speechSynthesis' in window)) {
    speakHint = '当前浏览器不支持语音合成'
    onStateChange()
    return
  }
  loadVoices()
  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utter.lang = isChinese ? 'zh-CN' : 'en-US'
  const voice = pickVoice(utter.lang)
  if (voice) utter.voice = voice
  utter.rate = rate
  utter.pitch = 1
  utter.volume = 1

  utter.onstart = () => { playingKey = key; speakHint = ''; onStateChange() }
  utter.onend = () => { playingKey = ''; onStateChange() }
  utter.onerror = (e) => {
    playingKey = ''
    const err = e?.error || '未知错误'
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      speakHint = '浏览器拒绝了语音播放，请检查系统音频/语音权限'
    } else if (err === 'no-speech' || err === 'synthesis-failed') {
      speakHint = `朗读失败：系统可能未安装 ${utter.lang} 语音包（错误：${err}）`
    } else {
      speakHint = `朗读失败：${err}`
    }
    onStateChange()
  }

  // Chrome bug: speak() right after cancel() sometimes silently fails; defer
  setTimeout(() => synth.speak(utter), 50)
}

function stopSpeak() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  playingKey = ''
}

// --- Translate (delegated to background) ---
async function doTranslate(text, direction) {
  let response
  try {
    response = await chrome.runtime.sendMessage({
      type: 'DO_TRANSLATE',
      text,
      direction: direction || 'auto'
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

// --- Incremental translation for long text ---
// Splits text into chunks, translates each sequentially, and calls
// onPartial after each chunk so the UI can render results incrementally.
// Chunk splitting logic is shared via src/utils/translate/chunk.js.

async function doTranslateIncremental(text, direction, onPartial) {
  const chunks = splitTextIntoChunks(text)
  if (chunks.length <= 1) {
    const result = await doTranslate(text, direction)
    onPartial(result, true)
    return result
  }
  let fullTranslation = ''
  let lastNotes = ''
  for (let i = 0; i < chunks.length; i++) {
    const result = await doTranslate(chunks[i], direction)
    fullTranslation += (fullTranslation ? '\n' : '') + result.translation
    lastNotes = result.notes || lastNotes
    onPartial({ translation: fullTranslation, notes: lastNotes }, i === chunks.length - 1)
  }
  return { translation: fullTranslation, notes: lastNotes }
}

async function doTranslateParagraphs(items, direction, onParagraph) {
  const pool = createPool({
    items,
    concurrency: POPUP_CONCURRENCY,
    worker: async (item) => {
      const result = await doTranslate(item.text, direction)
      onParagraph(item, result)
      return result
    }
  })

  return pool.promise
}

// --- Panel ---
function removeExistingPanel() {
  document.getElementById(PANEL_HOST_ID)?.remove()
}

function createPanelHost(position) {
  removeExistingPanel()
  stopSpeak()
  speakHint = ''

  const host = document.createElement('div')
  host.id = PANEL_HOST_ID
  host.style.cssText = 'position:fixed; z-index:2147483647; max-width:440px;'

  if (position === 'corner') {
    host.style.top = '20px'
    host.style.right = '20px'
  } else {
    positionNearSelection(host)
  }

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = PANEL_HTML
  document.body.appendChild(host)

  wirePanelTabs(shadow)

  shadow.querySelector('.close-btn').addEventListener('click', () => {
    stopSpeak()
    host.remove()
  })

  return shadow
}

function wirePanelTabs(shadow) {
  shadow.querySelectorAll('.panel-tab').forEach(button => {
    button.addEventListener('click', () => setPanelTab(shadow, button.dataset.tab))
  })
  shadow.querySelector('.manual-translate-btn').addEventListener('click', () => {
    const text = shadow.querySelector('.manual-input').value.trim()
    if (!text) return
    startParagraphTranslation(shadow, getSelectionParagraphs(text), {
      paneSelector: '.manual-result',
      paged: false
    })
  })
}

function setPanelTab(shadow, tab) {
  shadow.querySelectorAll('.panel-tab').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tab)
  })
  shadow.querySelector('.page-pane').hidden = tab !== 'page'
  shadow.querySelector('.manual-pane').hidden = tab !== 'manual'
}

function positionNearSelection(host) {
  let top = 80, left = 80
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width > 0 || rect.height > 0) {
      top = rect.bottom + 10
      left = rect.left
    }
  }
  const panelWidth = 420
  const panelHeight = 320
  if (left + panelWidth > window.innerWidth - 20) {
    left = window.innerWidth - panelWidth - 20
  }
  if (left < 10) left = 10
  if (top + panelHeight > window.innerHeight - 20) {
    top = Math.max(10, (window.innerHeight - panelHeight) / 2)
  }
  host.style.top = top + 'px'
  host.style.left = left + 'px'
}

function showLoading(shadow) {
  shadow.querySelector('.body').innerHTML = '<div class="loading">翻译中...</div>'
}

// Renders translation results incrementally. On first call, creates the
// result container with a trailing loading indicator. On subsequent calls,
// updates the text in place. When isComplete, removes the loading
// indicator and adds notes + speak buttons.
function showIncrementalResult(shadow, partial, isComplete, truncated, originalText) {
  const body = shadow.querySelector('.body')

  // First call: build the structure.
  if (!body.querySelector('.result-text')) {
    // Original text section (only for selection translate with English text).
    const showOriginal = originalText && /[a-zA-Z]{2,}/.test(originalText)
    const originalHtml = showOriginal
      ? `<div class="original-section">
           <div class="section-row">
             <span class="section-label">原文</span>
             <button class="speak-btn syllable-btn" data-target="original">音节</button>
           </div>
           <div class="original-text"></div>
           <div class="speak-row">
             <button class="speak-btn" data-key="original-normal" data-rate="1">朗读原文</button>
             <button class="speak-btn" data-key="original-slow" data-rate="0.6">慢速原文</button>
           </div>
         </div>`
      : ''
    const truncatedHtml = truncated
      ? '<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>'
      : ''
    body.innerHTML = `
      ${originalHtml}
      ${truncatedHtml}
      <div class="result-text"></div>
      <div class="loading incremental-loading">翻译中...</div>
    `
    if (showOriginal) {
      const origEl = body.querySelector('.original-text')
      origEl.dataset.fullText = originalText
      origEl.textContent = originalText
      wireSyllableToggle(shadow, 'original')
      wireSpeakButtons(shadow, originalText, '.original-section')
    }
  }

  // Update translation text in place (avoids flicker).
  const resultEl = body.querySelector('.result-text')
  const syllableMode = body.querySelector('.syllable-btn[data-target="result"]')?.classList.contains('active')
  renderResultText(resultEl, partial.translation, !!syllableMode)
  resultEl.dataset.fullText = partial.translation
  body.scrollTop = body.scrollHeight

  if (isComplete) {
    body.querySelector('.incremental-loading')?.remove()
    const notesHtml = partial.notes
      ? `<div class="result-notes">${escapeHtml(partial.notes)}</div>`
      : ''
    // Show syllable toggle only if the translation contains English words.
    const hasEnglish = /[a-zA-Z]{2,}/.test(partial.translation)
    const syllableBtnHtml = hasEnglish
      ? '<button class="speak-btn syllable-btn" data-target="result">音节</button>'
      : ''
    const speakHtml = `
      <div class="speak-row">
        <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
        <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
        ${syllableBtnHtml}
      </div>
      <div class="speak-hint"></div>
    `
    body.insertAdjacentHTML('beforeend', notesHtml + speakHtml)
    wireSpeakButtons(shadow, partial.translation)
    wireSyllableToggle(shadow, 'result')
  }
}

function wireSyllableToggle(shadow, target) {
  const btn = shadow.querySelector(`.syllable-btn[data-target="${target}"]`)
  if (!btn) return
  btn.addEventListener('click', () => {
    const el = shadow.querySelector(target === 'original' ? '.original-text' : '.result-text')
    if (!el) return
    const text = el.dataset.fullText || el.textContent
    const active = btn.classList.toggle('active')
    btn.textContent = active ? '原文' : '音节'
    renderResultText(el, text, active)
  })
}

function wireSpeakButtons(shadow, text, container) {
  const root = container ? shadow.querySelector(container) : shadow
  if (!root) return
  root.querySelectorAll('.speak-btn[data-key]:not([data-wired])').forEach(btn => {
    btn.dataset.wired = '1'
    btn.addEventListener('click', () => {
      const key = btn.dataset.key
      const rate = parseFloat(btn.dataset.rate)
      if (playingKey === key) {
        stopSpeak()
        updateSpeakButtons(shadow)
      } else {
        speak(text, rate, key, () => updateSpeakButtons(shadow))
      }
    })
  })
}

function showError(shadow, message) {
  shadow.querySelector('.body').innerHTML = `<div class="error">${escapeHtml(message)}</div>`
}

// If partial results exist, finalize them and append the error below.
// Otherwise, show the error as a full-page replacement.
function handleIncrementalError(shadow, err) {
  const body = shadow.querySelector('.body')
  if (body && body.querySelector('.paragraph-item')) {
    body.querySelector('.incremental-loading')?.remove()
    body.insertAdjacentHTML('beforeend', `<div class="error">${escapeHtml(err.message)}</div>`)
  } else if (body && body.querySelector('.result-text')) {
    body.querySelector('.incremental-loading')?.remove()
    body.insertAdjacentHTML('beforeend', `<div class="error">${escapeHtml(err.message)}</div>`)
  } else {
    showError(shadow, err.message)
  }
}

function showParagraphStart(shadow, items, paneSelector = '.page-pane') {
  const pane = shadow.querySelector(paneSelector)
  pane.innerHTML = `
    <div class="paragraph-list"></div>
    <div class="translation-status" data-total="${items.length}">翻译中... 0/${items.length}</div>
  `
  const list = pane.querySelector('.paragraph-list')
  for (const item of items) {
    const pair = document.createElement('div')
    pair.className = 'paragraph-item'
    pair.hidden = true
    pair.dataset.itemId = item.id
    pair.innerHTML = `
      <div class="section-row"><span class="section-label">原文</span></div>
      <div class="paragraph-original"></div>
      <div class="section-row"><span class="section-label">译文</span></div>
      <div class="paragraph-result"></div>
    `
    pair.querySelector('.paragraph-original').textContent = item.text
    list.appendChild(pair)
  }
}

function showParagraphResult(shadow, item, result, paneSelector = '.page-pane') {
  const pane = shadow.querySelector(paneSelector)
  const pair = pane.querySelector(`.paragraph-item[data-item-id="${CSS.escape(item.id)}"]`)
  if (!pair || pair.dataset.done === '1') return

  pair.dataset.done = '1'
  pair.hidden = false
  pair.querySelector('.paragraph-result').textContent = result.translation
  if (result.notes) {
    const notes = document.createElement('div')
    notes.className = 'paragraph-notes'
    notes.textContent = result.notes
    pair.appendChild(notes)
  }

  const status = pane.querySelector('.translation-status')
  const completed = pane.querySelectorAll('.paragraph-item[data-done="1"]').length
  if (status) {
    const batchTotal = Number(status.dataset.batchTotal || status.dataset.total)
    const completedBefore = Number(status.dataset.completedBefore || 0)
    status.textContent = completed >= batchTotal
      ? `已完成 ${completed}/${status.dataset.total}`
      : `翻译中... ${completed - completedBefore}/${batchTotal}`
  }
  pane.scrollTop = pane.scrollHeight
}

function startParagraphTranslation(shadow, paragraphs, options = {}) {
  const paneSelector = options.paneSelector || '.page-pane'
  const paged = options.paged !== false
  const items = []
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const chunks = splitTextIntoChunks(paragraph.text)
    chunks.forEach((chunkText, chunkIndex) => {
      items.push({
        id: chunks.length > 1
          ? `p${paragraphIndex + 1}-${chunkIndex + 1}`
          : paragraph.id,
        text: chunkText
      })
    })
  })

  showParagraphStart(shadow, items, paneSelector)
  const pane = shadow.querySelector(paneSelector)
  const status = pane.querySelector('.translation-status')
  let offset = 0

  const runBatch = async () => {
    const batch = items.slice(offset, paged ? offset + PAGE_BATCH_SIZE : items.length)
    const completedBefore = pane.querySelectorAll('.paragraph-item[data-done="1"]').length
    status.dataset.batchTotal = String(batch.length)
    status.dataset.completedBefore = String(completedBefore)
    status.textContent = `翻译中... 0/${batch.length}`
    pane.querySelector('.continue-btn')?.remove()

    const { failed } = await doTranslateParagraphs(batch, 'auto', (item, result) => {
      showParagraphResult(shadow, item, result, paneSelector)
    })

    offset += batch.length
    if (failed.length > 0) {
      const message = failed.map(({ error }) => error?.message || String(error)).join('\n')
      handleParagraphError(shadow, paneSelector, new Error(`${failed.length} 个段落翻译失败：\n${message}`))
    }

    if (paged && offset < items.length) {
      showContinueButton(shadow, items.length - offset, runBatch)
    } else {
      status.textContent = `已完成 ${completedBefore + batch.length}/${items.length}`
    }
  }

  runBatch().catch(err => handleParagraphError(shadow, paneSelector, err))

  if (options.truncated && paneSelector === '.page-pane') {
    const hint = document.createElement('div')
    hint.className = 'truncated-hint'
    hint.textContent = '页面内容较长，仅翻译正文前 12000 字'
    pane.prepend(hint)
  }
}

function showContinueButton(shadow, remaining, onClick) {
  const pane = shadow.querySelector('.page-pane')
  pane.querySelector('.continue-btn')?.remove()
  const button = document.createElement('button')
  button.className = 'continue-btn'
  button.textContent = `继续翻译（剩余 ${remaining} 段）`
  button.addEventListener('click', () => {
    button.disabled = true
    onClick()
  })
  pane.appendChild(button)
}

function handleParagraphError(shadow, paneSelector, err) {
  shadow.querySelector(paneSelector)
    .insertAdjacentHTML('beforeend', `<div class="error">${escapeHtml(err.message)}</div>`)
}

function getSelectionParagraphs(text) {
  return splitTextIntoParagraphs(text).map((paragraph, index) => ({
    id: `p${index + 1}`,
    text: paragraph
  }))
}

function updateSpeakButtons(shadow) {
  shadow.querySelectorAll('.speak-btn[data-key]').forEach(btn => {
    const key = btn.dataset.key
    if (playingKey === key) {
      btn.classList.add('speaking')
      btn.textContent = '停止'
    } else {
      btn.classList.remove('speaking')
      const isSlow = key.endsWith('-slow')
      const isOriginal = key.startsWith('original')
      btn.textContent = isOriginal
        ? (isSlow ? '慢速原文' : '朗读原文')
        : (isSlow ? '慢速' : '朗读')
    }
  })
  const hint = shadow.querySelector('.speak-hint')
  if (hint) hint.textContent = speakHint
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = String(text)
  return div.innerHTML
}

// --- Syllable coloring for English pronunciation teaching ---
const SYLLABLE_COLORS = [
  '#ffd6d6', '#d6e4ff', '#d6ffd6', '#ffe8d6',
  '#e8d6ff', '#d6f5ff', '#fff5d6', '#ffd6e8'
]

// Render translation text, optionally splitting English words into colored
// syllable blocks. Non-English text (Chinese, punctuation) is left as-is.
function renderResultText(el, translation, syllableMode) {
  if (!syllableMode) {
    el.textContent = translation
    return
  }
  el.innerHTML = ''
  const regex = /[a-zA-Z][a-zA-Z']*/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(translation)) !== null) {
    if (match.index > lastIndex) {
      el.appendChild(document.createTextNode(translation.slice(lastIndex, match.index)))
    }
    const word = match[0]
    if (word.length <= 1) {
      el.appendChild(document.createTextNode(word))
    } else {
      const syllables = splitSyllables(word)
      const wordSpan = document.createElement('span')
      wordSpan.className = 'syllable-word'
      wordSpan.dataset.word = word
      syllables.forEach((s, i) => {
        const sylSpan = document.createElement('span')
        sylSpan.className = 'syllable'
        sylSpan.style.backgroundColor = SYLLABLE_COLORS[i % SYLLABLE_COLORS.length]
        sylSpan.textContent = s.text
        wordSpan.appendChild(sylSpan)
      })
      el.appendChild(wordSpan)
    }
    lastIndex = match.index + word.length
  }
  if (lastIndex < translation.length) {
    el.appendChild(document.createTextNode(translation.slice(lastIndex)))
  }
}

// --- Read-aloud floating control ---
function showReadAloudControl(text) {
  document.getElementById(READ_ALOUD_HOST_ID)?.remove()
  stopSpeak()

  const host = document.createElement('div')
  host.id = READ_ALOUD_HOST_ID
  host.style.cssText = 'position:fixed; top:20px; right:20px; z-index:2147483647;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `
    <style>
      .control {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #333;
      }
      .icon { font-size: 16px; }
      .stop-btn {
        background: #4a90d9;
        color: #fff;
        border: none;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .stop-btn:hover { background: #3a7dc1; }
    </style>
    <div class="control">
      <span class="icon">🔊</span>
      <span>朗读中...</span>
      <button class="stop-btn">停止</button>
    </div>
  `
  document.body.appendChild(host)

  shadow.querySelector('.stop-btn').addEventListener('click', () => {
    stopSpeak()
    host.remove()
  })

  // Remove the control automatically when speech ends
  speak(text, 1, 'read-aloud', () => {
    if (!playingKey) host.remove()
  })
}

function showVocabularyFeedback(payload) {
  const hostId = '__ai_translate_vocabulary_toast__'
  document.getElementById(hostId)?.remove()
  const host = document.createElement('div')
  host.id = hostId
  host.style.cssText = 'position:fixed; top:20px; right:20px; z-index:2147483647;'
  const shadow = host.attachShadow({ mode: 'open' })
  const entry = payload.entry
  const text = entry
    ? `已保存生词：${entry.word}\n${entry.meaning}`
    : payload.error || '生词保存失败'
  shadow.innerHTML = `
    <style>
      .toast {
        background: ${entry ? '#4caf50' : '#e53935'};
        color: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,.18);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        line-height: 1.4;
        max-width: 320px;
        white-space: pre-wrap;
        word-break: break-word;
      }
    </style>
    <div class="toast">${escapeHtml(text)}</div>
  `
  document.body.appendChild(host)
  setTimeout(() => host.remove(), entry ? 3200 : 5200)
}

// --- Selection popper (inline 翻译/朗读 buttons) ---
function hideSelectionPopper() {
  document.getElementById(POPPER_HOST_ID)?.remove()
}

function isSelectionInsideOurUI() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const node = sel.anchorNode
  if (!node) return false
  const el = node.nodeType === 1 ? node : node.parentElement
  if (!el) return false
  return !!el.closest(`#${PANEL_HOST_ID}, #${READ_ALOUD_HOST_ID}, #${POPPER_HOST_ID}`)
}

function showSelectionPopper(rect, text) {
  hideSelectionPopper()

  const host = document.createElement('div')
  host.id = POPPER_HOST_ID
  host.style.cssText = 'position:fixed; z-index:2147483647;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `
    <style>
      .popper {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        padding: 4px;
        display: flex;
        gap: 2px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .popper-btn {
        background: transparent;
        border: none;
        color: #4a90d9;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
      }
      .popper-btn:hover { background: #eef4fc; }
    </style>
    <div class="popper">
      <button class="popper-btn" data-action="translate">翻译</button>
      <button class="popper-btn" data-action="read">朗读</button>
    </div>
  `
  document.body.appendChild(host)

  // Position: prefer above the selection, fall back to below
  const popperEl = shadow.querySelector('.popper')
  const popperHeight = 36
  const popperWidth = 120
  let top = rect.top - popperHeight - 6
  if (top < 8) top = rect.bottom + 6
  let left = rect.left
  if (left + popperWidth > window.innerWidth - 12) {
    left = window.innerWidth - popperWidth - 12
  }
  if (left < 8) left = 8
  host.style.top = top + 'px'
  host.style.left = left + 'px'

  shadow.querySelector('[data-action="translate"]').addEventListener('click', () => {
    hideSelectionPopper()
    const shadow = createPanelHost('selection')
    startParagraphTranslation(shadow, getSelectionParagraphs(text), { paged: false })
  })

  shadow.querySelector('[data-action="read"]').addEventListener('click', () => {
    hideSelectionPopper()
    showReadAloudControl(text)
  })
}

// Show popper on mouseup when text is selected
document.addEventListener('mouseup', (e) => {
  if (cachedSettings.interactionMode !== 'selection') return
  // Don't interfere when the mouseup is inside our own popper/panel
  const popper = document.getElementById(POPPER_HOST_ID)
  if (popper && popper.contains(e.target)) return
  const panel = document.getElementById(PANEL_HOST_ID)
  if (panel && panel.contains(e.target)) return
  const sel = window.getSelection()
  const text = sel?.toString().trim()
  if (!text) { hideSelectionPopper(); return }
  if (isSelectionInsideOurUI()) return
  if (sel.rangeCount === 0) return
  const rect = sel.getRangeAt(0).getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return
  showSelectionPopper(rect, text)
})

document.addEventListener('mousedown', (e) => {
  const popper = document.getElementById(POPPER_HOST_ID)
  if (popper && !popper.contains(e.target)) {
    hideSelectionPopper()
  }
}, true)

// --- Message listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'vocabulary-feedback') {
    showVocabularyFeedback(message)
    return
  }

  if (message.type === 'translate-selection') {
    const text = (message.selectionText || '').trim()
    if (!text) return
    const shadow = createPanelHost('selection')
    startParagraphTranslation(shadow, getSelectionParagraphs(text), { paged: false })
    return
  }

  if (message.type === 'translate-page') {
    const { paragraphs, truncated } = extractPageParagraphs(document, {
      maxChars: PAGE_TEXT_LIMIT
    })
    if (paragraphs.length === 0) return
    const shadow = createPanelHost('corner')
    startParagraphTranslation(shadow, paragraphs, { truncated })
    return
  }

  if (message.type === 'translate-page-inline') {
    const direction = message.direction || 'auto'
    clearImmersive()
    startInlineTranslation(direction)
    return
  }

  if (message.type === 'immersive-translate') {
    const direction = message.direction || 'auto'
    clearInline()
    startImmersive(direction)
    return
  }

  if (message.type === 'read-aloud') {
    const text = (message.selectionText || '').trim()
    if (!text) return
    showReadAloudControl(text)
    return
  }
})

// Init voices on load
if ('speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

// Init settings cache + listen for changes
loadSettings()
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue?.translate) loadSettings()
})

const PANEL_HTML = `
<style>
  .panel {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    color: #333;
    width: 420px;
    max-height: 400px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #eee;
  }
  .title { font-size: 15px; font-weight: 600; }
  .panel-tabs { display: flex; justify-content: center; gap: 6px; }
  .panel-tab {
    padding: 4px 10px;
    border: 1px solid #ddd;
    border-radius: 999px;
    background: #fff;
    color: #666;
    cursor: pointer;
    font-size: 12px;
  }
  .panel-tab.active { background: #4a90d9; border-color: #4a90d9; color: #fff; }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    color: #999;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }
  .close-btn:hover { color: #333; }
  .body { padding: 14px 16px; overflow-y: auto; flex: 1; }
  .tab-pane { min-height: 40px; }
  .manual-pane { display: flex; flex-direction: column; gap: 10px; }
  .tab-pane[hidden] { display: none; }
  .manual-input {
    width: 100%;
    min-height: 88px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font: inherit;
    color: #333;
    box-sizing: border-box;
    resize: vertical;
  }
  .manual-translate-btn {
    align-self: flex-end;
    background: #4a90d9;
    border: none;
    color: #fff;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
  .translation-status { color: #888; font-size: 12px; padding: 8px 0; text-align: center; }
  .continue-btn {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 8px 12px;
    border: 1px solid #4a90d9;
    border-radius: 8px;
    background: #fff;
    color: #4a90d9;
    cursor: pointer;
    font-size: 13px;
  }
  .continue-btn:disabled { opacity: .6; cursor: not-allowed; }
  .loading { color: #888; padding: 20px 0; text-align: center; }
  .original-section {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .paragraph-item {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .paragraph-item:last-child { border-bottom: 0; }
  .paragraph-original {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .paragraph-result {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    margin-top: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .paragraph-notes {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: #666;
    background: #f9f9f9;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .section-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .section-label { font-size: 13px; color: #888; }
  .original-text {
    font-size: 15px;
    line-height: 1.6;
    color: #555;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .result-text {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .result-notes {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    background: #f9f9f9;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 10px;
  }
  .truncated-hint { font-size: 12px; color: #e6a700; margin-bottom: 8px; }
  .speak-row { display: flex; gap: 8px; margin-top: 10px; }
  .speak-btn {
    background: transparent;
    border: 1px solid #4a90d9;
    color: #4a90d9;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  .speak-btn.speaking { background: #4a90d9; color: #fff; }
  .speak-btn.syllable-btn.active { background: #4a90d9; color: #fff; }
  .speak-hint { font-size: 12px; color: #e53935; margin-top: 8px; min-height: 14px; }
  .error { color: #e53935; font-size: 13px; padding: 8px 0; line-height: 1.5; }
  .syllable-word {
    display: inline-block;
    margin: 1px 3px;
    position: relative;
    cursor: default;
    border-radius: 4px;
  }
  .syllable-word:hover { background: rgba(74, 144, 217, 0.1); }
  .syllable {
    display: inline-block;
    padding: 1px 5px;
    margin: 0 1px;
    border-radius: 3px;
    font-size: 14px;
    transition: transform 0.15s;
  }
  .syllable-word:hover .syllable { transform: translateY(-1px); }
  .syllable-word[data-word]:hover::after {
    content: attr(data-word);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
    pointer-events: none;
  }
</style>
<div class="panel">
  <div class="header">
    <span class="title">AI 翻译</span>
    <div class="panel-tabs">
      <button class="panel-tab active" data-tab="page">整页</button>
      <button class="panel-tab" data-tab="manual">手动</button>
    </div>
    <button class="close-btn">×</button>
  </div>
  <div class="body">
    <div class="tab-pane page-pane"></div>
    <div class="tab-pane manual-pane" hidden>
      <textarea class="manual-input" placeholder="输入要翻译的内容..."></textarea>
      <button class="manual-translate-btn">翻译</button>
      <div class="manual-result"></div>
    </div>
  </div>
</div>
`
