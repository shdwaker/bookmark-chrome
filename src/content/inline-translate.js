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
