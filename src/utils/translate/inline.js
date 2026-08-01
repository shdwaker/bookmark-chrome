// Pure helpers for inline page translation: concurrency pool and paragraph
// collection. Tested in isolation; DOM operations live in the content script.

export function createPool({ items, worker, concurrency = 3, shouldCancel }) {
  let index = 0
  let cancelled = false
  const results = { completed: [], failed: [] }

  const runNext = async () => {
    while (index < items.length) {
      if (cancelled) {
        return
      }
      if (shouldCancel && shouldCancel()) {
        cancelled = true
        return
      }
      const myIndex = index++
      const item = items[myIndex]
      try {
        const result = await worker(item, myIndex)
        if (cancelled) return
        results.completed.push({ item, result })
      } catch (err) {
        if (cancelled) return
        results.failed.push({ item, error: err })
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  const workers = Array.from({ length: workerCount }, runNext)
  const promise = Promise.all(workers).then(() => ({
    ...results,
    cancelled
  }))

  return {
    promise,
    cancel() { cancelled = true }
  }
}

export function hasLatinLetters(text) {
  return /[A-Za-z]/.test(text || '')
}

export function hasCJK(text) {
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || '')
}

const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td'
const DEFAULT_EXCLUDED_ROOTS = [
  '#__ai_translate_panel_host__',
  '#__ai_translate_read_aloud_host__',
  '#__ai_translate_popper_host__',
  '#__mt_control_bar_host__',
  '#__immersive_control_bar_host__'
]
const MATH_SELECTOR = 'math, mjx-container, .katex, .MathJax, .mathjax, .math'
const MIN_TEXT_LENGTH = 8

function isVisible(el) {
  const style = el.ownerDocument.defaultView.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  if (style.opacity === '0') return false
  return true
}

function isInsideExcludedRoot(el, excludedRoots) {
  for (const selector of excludedRoots) {
    if (el.closest(selector)) return true
  }
  return false
}

function shouldSkipByLanguage(text, direction) {
  if (direction === 'en-zh' && !hasLatinLetters(text)) return true
  if (direction === 'zh-en' && !hasCJK(text)) return true
  return false
}

export function collectParagraphs(root, limit = 100, options = {}) {
  const direction = options.direction || 'auto'
  const excludedRoots = options.excludedRoots || DEFAULT_EXCLUDED_ROOTS
  const candidates = root.querySelectorAll(BLOCK_SELECTOR)
  const result = []
  let counter = 0

  for (const el of candidates) {
    if (result.length >= limit) break

    // Nested dedup: if this element is wrapped by another matched block, skip.
    if (el.parentElement && el.parentElement.closest(BLOCK_SELECTOR)) continue

    if (isInsideExcludedRoot(el, excludedRoots)) continue
    if (el.closest(MATH_SELECTOR)) continue
    if (el.hasAttribute('data-mt-translated') || el.hasAttribute('data-mt-failed')) continue
    if (!isVisible(el)) continue

    const text = (el.innerText || el.textContent || '').trim()
    const isHeading = /^H[1-6]$/.test(el.tagName)
    if (!isHeading && text.length < MIN_TEXT_LENGTH) continue
    if (shouldSkipByLanguage(text, direction)) continue

    counter++
    result.push({
      id: `p${counter}`,
      el,
      text,
      status: 'pending'
    })
  }

  return result
}
