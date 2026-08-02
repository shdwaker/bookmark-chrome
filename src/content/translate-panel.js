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
const PAGE_TEXT_LIMIT = 5000

import { startInlineTranslation, clearInline } from './inline-translate.js'
import { startImmersive, clearImmersive } from './immersive-translate.js'
import { splitTextIntoChunks } from '../utils/translate/chunk.js'

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

  shadow.querySelector('.close-btn').addEventListener('click', () => {
    stopSpeak()
    host.remove()
  })

  return shadow
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
function showIncrementalResult(shadow, partial, isComplete, truncated) {
  const body = shadow.querySelector('.body')

  // First call: build the structure.
  if (!body.querySelector('.result-text')) {
    const truncatedHtml = truncated
      ? '<div class="truncated-hint">页面内容较长，仅翻译前 5000 字</div>'
      : ''
    body.innerHTML = `
      ${truncatedHtml}
      <div class="result-text"></div>
      <div class="loading incremental-loading">翻译中...</div>
    `
  }

  // Update translation text in place (avoids flicker).
  body.querySelector('.result-text').textContent = partial.translation
  body.scrollTop = body.scrollHeight

  if (isComplete) {
    body.querySelector('.incremental-loading')?.remove()
    const notesHtml = partial.notes
      ? `<div class="result-notes">${escapeHtml(partial.notes)}</div>`
      : ''
    const speakHtml = `
      <div class="speak-row">
        <button class="speak-btn" data-key="result-normal" data-rate="1">朗读</button>
        <button class="speak-btn" data-key="result-slow" data-rate="0.6">慢速</button>
      </div>
      <div class="speak-hint"></div>
    `
    body.insertAdjacentHTML('beforeend', notesHtml + speakHtml)
    wireSpeakButtons(shadow, partial.translation)
  }
}

function wireSpeakButtons(shadow, translation) {
  shadow.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key
      const rate = parseFloat(btn.dataset.rate)
      if (playingKey === key) {
        stopSpeak()
        updateSpeakButtons(shadow)
      } else {
        speak(translation, rate, key, () => updateSpeakButtons(shadow))
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
  if (body && body.querySelector('.result-text')) {
    body.querySelector('.incremental-loading')?.remove()
    body.insertAdjacentHTML('beforeend', `<div class="error">${escapeHtml(err.message)}</div>`)
  } else {
    showError(shadow, err.message)
  }
}

function updateSpeakButtons(shadow) {
  shadow.querySelectorAll('.speak-btn').forEach(btn => {
    const key = btn.dataset.key
    if (playingKey === key) {
      btn.classList.add('speaking')
      btn.textContent = '停止'
    } else {
      btn.classList.remove('speaking')
      btn.textContent = btn.dataset.key === 'result-slow' ? '慢速' : '朗读'
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
    showLoading(shadow)
    doTranslateIncremental(text, 'auto', (partial, isLast) => {
      showIncrementalResult(shadow, partial, isLast, false)
    })
      .catch(err => handleIncrementalError(shadow, err))
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

// --- Page text extraction ---
function getPageText() {
  const text = (document.body.innerText || '').trim()
  return {
    text: text.slice(0, PAGE_TEXT_LIMIT),
    truncated: text.length > PAGE_TEXT_LIMIT
  }
}

// --- Message listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'translate-selection') {
    const text = (message.selectionText || '').trim()
    if (!text) return
    const shadow = createPanelHost('selection')
    showLoading(shadow)
    doTranslateIncremental(text, 'auto', (partial, isLast) => {
      showIncrementalResult(shadow, partial, isLast, false)
    })
      .catch(err => handleIncrementalError(shadow, err))
    return
  }

  if (message.type === 'translate-page') {
    const { text, truncated } = getPageText()
    if (!text) return
    const shadow = createPanelHost('corner')
    showLoading(shadow)
    doTranslateIncremental(text, 'auto', (partial, isLast) => {
      showIncrementalResult(shadow, partial, isLast, truncated)
    })
      .catch(err => handleIncrementalError(shadow, err))
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  .title { font-size: 15px; font-weight: 600; }
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
  .loading { color: #888; padding: 20px 0; text-align: center; }
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
  .speak-hint { font-size: 12px; color: #e53935; margin-top: 8px; min-height: 14px; }
  .error { color: #e53935; font-size: 13px; padding: 8px 0; line-height: 1.5; }
</style>
<div class="panel">
  <div class="header">
    <span class="title">AI 翻译</span>
    <button class="close-btn">×</button>
  </div>
  <div class="body">
    <div class="loading">翻译中...</div>
  </div>
</div>
`
