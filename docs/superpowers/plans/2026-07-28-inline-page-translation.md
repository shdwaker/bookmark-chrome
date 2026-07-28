# Inline Page Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-click "内联翻译页面" menu item that translates page paragraphs inline (Chinese below English), progressively with 3-way concurrency, via a floating control bar with stop/clear/retry.

**Architecture:** Content script `inline-translate.js` orchestrates everything -- collects paragraphs, runs a concurrency pool, injects translations into DOM. Background's existing `DO_TRANSLATE` handler is reused unchanged. Pure logic (pool, paragraph filter) lives in `src/utils/translate/inline.js` for unit testing.

**Tech Stack:** Vue 3 content script (vanilla JS, no framework), Chrome Extension MV3, Vitest + jsdom for tests (jsdom installed as devDependency in Task 2).

---

## File Structure

**Create:**
- `src/utils/translate/inline.js` -- pure functions: `createPool`, `collectParagraphs`, language helpers
- `src/utils/translate/inline.test.js` -- Vitest unit tests for the above
- `src/content/inline-translate.js` -- content script: DOM injection, control bar UI, orchestration, state machine

**Modify:**
- `src/content/translate-panel.js` -- add `translate-page-inline` message handler that delegates to `inline-translate.js`
- `src/background/index.js` -- add `translate-page-inline` to context menu creation
- `manifest.json` -- add `src/content/inline-translate.js` to content_scripts js array

**Unchanged:** `src/utils/translate/translate-api.js`, `src/utils/translate/transport.js`, background `DO_TRANSLATE` handler.

---

### Task 1: Concurrency pool (pure function, TDD)

**Files:**
- Create: `src/utils/translate/inline.js`
- Test: `src/utils/translate/inline.test.js`

- [ ] **Step 1: Write the failing test for basic concurrency**

Create `src/utils/translate/inline.test.js`:

```js
import { describe, expect, it, vi } from 'vitest'
import { createPool } from './inline'

describe('createPool', () => {
  it('runs all items through worker with limited concurrency', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item * 2
    }

    const pool = createPool({ items, worker, concurrency: 3 })
    const result = await pool.promise

    expect(inFlight.max).toBeLessThanOrEqual(3)
    expect(result.completed).toHaveLength(10)
    expect(result.completed.map(c => c.result)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    expect(result.failed).toHaveLength(0)
    expect(result.cancelled).toBe(false)
  })

  it('collects worker errors in failed array without stopping the pool', async () => {
    const items = ['ok1', 'bad', 'ok2', 'bad', 'ok3']
    const worker = async (item) => {
      if (item.startsWith('bad')) throw new Error(`fail: ${item}`)
      return item.toUpperCase()
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    const result = await pool.promise

    expect(result.completed.map(c => c.result)).toEqual(['OK1', 'OK2', 'OK3'])
    expect(result.failed).toHaveLength(2)
    expect(result.failed[0].error.message).toBe('fail: bad')
  })

  it('cancel stops dispatching new items but lets in-flight finish', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 20))
      return item
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    setTimeout(() => pool.cancel(), 30)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    // at most concurrency items started before cancel took effect
    expect(started.length).toBeLessThanOrEqual(4)
  })

  it('shouldCancel callback is checked before each new item', async () => {
    const items = [1, 2, 3, 4, 5, 6]
    let cancelFlag = false
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 10))
      return item
    }

    const pool = createPool({
      items,
      worker,
      concurrency: 1,
      shouldCancel: () => cancelFlag
    })
    setTimeout(() => { cancelFlag = true }, 35)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    expect(started.length).toBeLessThan(6)
  })

  it('handles empty items array', async () => {
    const pool = createPool({ items: [], worker: async (x) => x, concurrency: 3 })
    const result = await pool.promise
    expect(result.completed).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('uses concurrency smaller than items length when items are few', async () => {
    const items = [1, 2]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item
    }
    const pool = createPool({ items, worker, concurrency: 5 })
    await pool.promise
    expect(inFlight.max).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- inline.test.js`
Expected: FAIL with "Cannot find module './inline'" or `createPool` is not a function.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/translate/inline.js`:

```js
// Pure helpers for inline page translation: concurrency pool and paragraph
// collection. Tested in isolation; DOM operations live in the content script.

export function createPool({ items, worker, concurrency = 3, shouldCancel }) {
  let index = 0
  let cancelled = false
  const results = { completed: [], failed: [] }

  const runNext = async () => {
    while (index < items.length) {
      if (cancelled || (shouldCancel && shouldCancel())) {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- inline.test.js`
Expected: PASS, all 6 tests in `createPool` describe block green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/inline.js src/utils/translate/inline.test.js
git commit -m "Add createPool concurrency primitive with tests"
```

---

### Task 2: Paragraph collection filter (pure function, TDD)

**Files:**
- Modify: `src/utils/translate/inline.js`
- Test: `src/utils/translate/inline.test.js`


- [ ] **Step 1: Install jsdom and verify default test environment**

The project's existing tests are pure-function (no DOM). `collectParagraphs` needs a DOM. Vitest's default environment is `node` (no `document`). Install jsdom:

```bash
npm install -D jsdom
```

Verify: `npm ls jsdom` should show `jsdom` under devDependencies.

- [ ] **Step 2: Add language helper tests**

Create `src/utils/translate/inline.test.js` with this content (note the environment pragma at the top -- it makes only this file use jsdom):

```js
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { hasLatinLetters, hasCJK } from './inline'

describe('language helpers', () => {
  it('hasLatinLetters detects ASCII letters', () => {
    expect(hasLatinLetters('hello')).toBe(true)
    expect(hasLatinLetters('你好 world')).toBe(true)
    expect(hasLatinLetters('你好世界')).toBe(false)
    expect(hasLatinLetters('123')).toBe(false)
    expect(hasLatinLetters('')).toBe(false)
  })

  it('hasCJK detects Chinese/Japanese/Korean characters', () => {
    expect(hasCJK('你好')).toBe(true)
    expect(hasCJK('hello 你')).toBe(true)
    expect(hasCJK('hello world')).toBe(false)
    expect(hasCJK('')).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- inline.test.js`
Expected: FAIL with `hasLatinLetters`, `hasCJK` not exported from `./inline`.

- [ ] **Step 4: Implement language helpers**

Create `src/utils/translate/inline.js`:

```js
// Pure helpers for inline page translation: concurrency pool and paragraph
// collection. Tested in isolation; DOM operations live in the content script.

export function hasLatinLetters(text) {
  return /[A-Za-z]/.test(text || '')
}

export function hasCJK(text) {
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || '')
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- inline.test.js`
Expected: PASS, both `language helpers` tests green.

- [ ] **Step 6: Add collectParagraphs tests**

Append to `src/utils/translate/inline.test.js` (keep the pragma at the top, add imports and tests below):

```js
import { collectParagraphs } from './inline'

function domFrom(html) {
  document.body.innerHTML = html
  return document
}

describe('collectParagraphs', () => {
  it('collects p, h1-h6, li, blockquote, td elements', () => {
    domFrom(`
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <p>A short paragraph here.</p>
      <ul><li>First item listed</li><li>Second item listed</li></ul>
      <blockquote>A quoted passage.</blockquote>
      <table><tr><td>Cell content here</td></tr></table>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    const texts = paragraphs.map(p => p.text)
    expect(texts).toContain('A short paragraph here.')
    expect(texts).toContain('First item listed')
    expect(texts).toContain('A quoted passage.')
    expect(texts).toContain('Cell content here')
    expect(texts).toContain('Title')
    expect(texts).toContain('Subtitle')
  })

  it('skips elements with text shorter than 8 characters', () => {
    domFrom(`<p>short</p><p>This is long enough.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('This is long enough.')
  })

  it('skips elements nested inside another matched block (li > p)', () => {
    domFrom(`<li><p>Inner paragraph text here.</p></li>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].el.tagName).toBe('LI')
  })

  it('skips elements inside excluded host IDs', () => {
    domFrom(`
      <div id="__ai_translate_panel_host__"><p>Inside panel host.</p></div>
      <p>Outside paragraph text.</p>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('Outside paragraph text.')
  })

  it('skips elements already marked as translated', () => {
    domFrom(`
      <p data-mt-translated="1">Already done translated.</p>
      <p>Fresh paragraph text here.</p>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('Fresh paragraph text here.')
  })

  it('respects the limit parameter', () => {
    const html = Array.from({ length: 15 }, (_, i) =>
      `<p>Paragraph number ${i} has enough text.</p>`
    ).join('')
    domFrom(html)
    const paragraphs = collectParagraphs(document.body, 5, { direction: 'auto' })
    expect(paragraphs).toHaveLength(5)
  })

  it('skips Chinese-only paragraphs when direction is en-zh', () => {
    domFrom(`<p>这是一段中文内容。</p><p>This is English content here.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'en-zh' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('This is English content here.')
  })

  it('skips Latin-only paragraphs when direction is zh-en', () => {
    domFrom(`<p>This is English content here.</p><p>这是一段中文内容。</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'zh-en' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('这是一段中文内容。')
  })

  it('assigns unique sequential ids', () => {
    domFrom(`<p>First paragraph text.</p><p>Second paragraph text.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs[0].id).toBe('p1')
    expect(paragraphs[1].id).toBe('p2')
    expect(paragraphs[0].status).toBe('pending')
  })

  it('returns empty array when no matches', () => {
    domFrom(`<div>no block elements</div>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toEqual([])
  })
})
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npm test -- inline.test.js`
Expected: FAIL with `collectParagraphs` not exported.

- [ ] **Step 8: Implement collectParagraphs**

Append to `src/utils/translate/inline.js`:

```js
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td'
const DEFAULT_EXCLUDED_ROOTS = [
  '#__ai_translate_panel_host__',
  '#__ai_translate_read_aloud_host__',
  '#__ai_translate_popper_host__',
  '#__mt_control_bar_host__'
]
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
    if (el.closest(BLOCK_SELECTOR) !== el) continue

    if (isInsideExcludedRoot(el, excludedRoots)) continue
    if (el.hasAttribute('data-mt-translated') || el.hasAttribute('data-mt-failed')) continue
    if (!isVisible(el)) continue

    const text = (el.innerText || el.textContent || '').trim()
    if (text.length < MIN_TEXT_LENGTH) continue
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
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test -- inline.test.js`
Expected: PASS, all `language helpers` and `collectParagraphs` tests green.

- [ ] **Step 10: Commit**

```bash
git add src/utils/translate/inline.js src/utils/translate/inline.test.js package.json package-lock.json
git commit -m "Add collectParagraphs filter and language helpers with tests"
```

---

### Task 3: DOM injection helpers

**Files:**
- Create: `src/content/inline-translate.js`

These are DOM operations (not unit-tested per spec -- visual verification in Task 9).

- [ ] **Step 1: Create inline-translate.js with injection helpers**

Create `src/content/inline-translate.js`:

```js
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
  // Remove the injected host (translation or failure marker) and clear attrs,
  // so the paragraph can be re-translated.
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
```

- [ ] **Step 2: Verify file builds without syntax errors**

Run: `node --check src/content/inline-translate.js 2>&1 || echo "Note: ES module import syntax may not parse with node --check; rely on vite build in Task 8."`

If node complains about `import`, that's expected (node --check doesn't resolve ES module imports without --input-type=module). The vite build in Task 8 will catch real syntax errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/inline-translate.js
git commit -m "Add inline translation DOM injection helpers"
```

---

### Task 4: Floating control bar UI

**Files:**
- Modify: `src/content/inline-translate.js`

- [ ] **Step 1: Add control bar creation and update functions**

Append to `src/content/inline-translate.js`:

```js
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
  <button class="btn btn-danger stop-btn" style="display:none;">停止</button>
  <button class="btn clear-btn">清除</button>
</div>
`

export function createControlBar({ onStop, onClear, onRetry }) {
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

  return { host, shadow }
}

export function updateControlBar(shadow, state) {
  const { active, cancelled, completedCount, failedCount, totalCount, overLimit } = state
  const statusEl = shadow.querySelector('.status')
  const countEl = shadow.querySelector('.count')
  const hintEl = shadow.querySelector('.hint')
  const stopBtn = shadow.querySelector('.stop-btn')
  const retryBtn = shadow.querySelector('.retry-btn')

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
```

- [ ] **Step 2: Commit**

```bash
git add src/content/inline-translate.js
git commit -m "Add floating control bar UI for inline translation"
```

---

### Task 5: Orchestration (startInlineTranslation)

**Files:**
- Modify: `src/content/inline-translate.js`

Wires pool + collect + inject + control bar together. Owns the module-level state object.

- [ ] **Step 1: Add state object and startInlineTranslation**

Append to `src/content/inline-translate.js`:

```js
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
  controlBar: null  // { host, shadow }
}

function getDirection() {
  // Direction comes from the message that triggered us; default auto.
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
    onRetry: handleRetryFailed
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
  state.controlBar = null
}

async function retrySingleParagraph(paragraph) {
  // User clicked a single failed paragraph's retry marker.
  clearParagraphMarker(paragraph)
  try {
    const result = await translateParagraph(paragraph.text)
    injectTranslation(paragraph, result)
    state.failedCount--
    state.completedCount++
  } catch (err) {
    markFailed(paragraph, err, retrySingleParagraph)
    // failedCount unchanged
  }
  refreshControlBar()
}

async function handleRetryFailed() {
  if (state.active) return
  const failedParagraphs = state.paragraphs.filter(p => p.status === 'failed')
  if (failedParagraphs.length === 0) return

  // Clear their markers and reset failed count.
  for (const p of failedParagraphs) {
    clearParagraphMarker(p)
  }
  state.failedCount = 0
  state.cancelled = false
  state.active = true
  refreshControlBar()

  await runPool(failedParagraphs)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/inline-translate.js
git commit -m "Add inline translation orchestration with state machine"
```

---

### Task 6: Message listener in translate-panel.js

**Files:**
- Modify: `src/content/translate-panel.js`

Route the new `translate-page-inline` message to `startInlineTranslation`.

- [ ] **Step 1: Add import and message handler**

In `src/content/translate-panel.js`, find the existing message listener (around line 416):

```js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'translate-selection') {
    ...
  }

  if (message.type === 'translate-page') {
    ...
  }

  if (message.type === 'read-aloud') {
    ...
  }
})
```

Add a new `translate-page-inline` branch. First, add the import at the top of the file (after the existing module-level constants, before any function definitions, around line 13):

```js
import { startInlineTranslation } from './inline-translate.js'
```

Then add a new branch inside the message listener (after the `translate-page` branch, before `read-aloud`):

```js
  if (message.type === 'translate-page-inline') {
    const direction = message.direction || 'auto'
    startInlineTranslation(direction)
    return
  }
```

- [ ] **Step 2: Verify the file still parses**

Run: `node --check src/content/translate-panel.js 2>&1 | head -5`
Expected: either no output (parses OK) or an error about `import` (expected for node without module type -- ignore). Real syntax errors would show as `SyntaxError`.

- [ ] **Step 3: Commit**

```bash
git add src/content/translate-panel.js
git commit -m "Route translate-page-inline message to inline-translate module"
```

---

### Task 7: Background context menu entry

**Files:**
- Modify: `src/background/index.js`

- [ ] **Step 1: Add translate-page-inline to context menu creation**

In `src/background/index.js`, find the `createContextMenus()` function (around line 81). It currently creates `ai-translate`, `translate-page`, `translate-selection`, `read-aloud`.

Add a new `translate-page-inline` item after `translate-page`:

```js
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    if (!cachedContextMenuEnabled) return
    chrome.contextMenus.create({
      id: 'ai-translate',
      title: 'AI翻译',
      contexts: ['page', 'selection']
    })
    chrome.contextMenus.create({
      id: 'translate-page',
      parentId: 'ai-translate',
      title: '翻译整个页面',
      contexts: ['page']
    })
    chrome.contextMenus.create({
      id: 'translate-page-inline',
      parentId: 'ai-translate',
      title: '内联翻译页面',
      contexts: ['page']
    })
    chrome.contextMenus.create({
      id: 'translate-selection',
      parentId: 'ai-translate',
      title: '翻译选中的文本',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'read-aloud',
      parentId: 'ai-translate',
      title: '朗读',
      contexts: ['selection']
    })
  })
}
```

- [ ] **Step 2: Add the new menu ID to the click handler**

In the `chrome.contextMenus.onClicked.addListener` handler (around line 69), update the type guard:

```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return
  const type = info.menuItemId
  if (type !== 'translate-page'
      && type !== 'translate-page-inline'
      && type !== 'translate-selection'
      && type !== 'read-aloud') return
  chrome.tabs.sendMessage(tab.id, {
    type,
    selectionText: info.selectionText || ''
  }).catch(() => {
    // 内容脚本可能未加载（如 chrome:// 页面），忽略错误
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/background/index.js
git commit -m "Add '内联翻译页面' context menu item"
```

---

### Task 8: Manifest content_scripts entry

**Files:**
- Modify: `manifest.json`

The `@crxjs/vite-plugin` reads `manifest.json` and bundles content scripts automatically. We add `inline-translate.js` as a second entry in the existing content_scripts block.

- [ ] **Step 1: Update manifest content_scripts js array**

In `manifest.json`, find the `content_scripts` block:

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["src/content/translate-panel.js"],
    "run_at": "document_idle"
  }
]
```

Change it to include both files:

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": [
      "src/content/translate-panel.js",
      "src/content/inline-translate.js"
    ],
    "run_at": "document_idle"
  }
]
```

- [ ] **Step 2: Build and verify both scripts are bundled**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds. Check `dist/manifest.json` to verify both content scripts are listed in the built manifest:

Run: `grep -A5 'content_scripts' dist/manifest.json`
Expected: output shows both `translate-panel` and `inline-translate` (or their hashed asset names) in the `js` array.

- [ ] **Step 3: Run full test suite to verify no regressions**

Run: `npm test 2>&1 | tail -10`
Expected: PASS, all test files green (existing 67 tests + new inline tests).

- [ ] **Step 4: Commit**

```bash
git add manifest.json dist/
git commit -m "Register inline-translate.js as content script in manifest"
```

---

### Task 9: Manual integration verification

This task verifies the feature end-to-end in Chrome. No code changes -- just a checklist.

- [ ] **Step 1: Reload the extension**

1. Open `chrome://extensions`
2. Find MarkTrace, click the reload icon
3. Confirm no errors shown on the extension card

- [ ] **Step 2: Verify context menu appears**

1. Open any English article page (e.g. a Wikipedia article or blog post)
2. Right-click on the page background
3. Hover "AI翻译" -> confirm "内联翻译页面" appears alongside "翻译整个页面"
4. Confirm "翻译选中的文本" and "朗读" still appear

- [ ] **Step 3: Verify inline translation on a simple page**

1. Open a page with several `<p>` paragraphs in English
2. Right-click -> AI翻译 -> 内联翻译页面
3. Verify:
   - Floating control bar appears top-right showing "译文中… 0/N"
   - Translations appear progressively below each paragraph (light blue background, left blue border)
   - Counter increments as translations complete
   - When done, control bar shows "完成 N/N"
4. Click "清除" -> all injected translations disappear, control bar removed

- [ ] **Step 4: Verify stop mid-translation**

1. Open a page with 20+ paragraphs
2. Trigger inline translation
3. While "译文中…" is showing, click "停止"
4. Verify:
   - No new translations appear after a brief delay (in-flight ones may finish)
   - Control bar shows "已停止 X/N"
   - Already-injected translations remain visible
5. Click "清除" -> everything removed

- [ ] **Step 5: Verify failure and retry**

1. Temporarily break the API: open settings, change the default provider's API key to "invalid-key"
2. Trigger inline translation on a page
3. Verify:
   - Each paragraph gets a red "翻译失败：...（点击重试）" marker below it
   - Control bar shows "完成 0/N" with "N 段失败" hint
   - "重试失败" button appears
4. Click one paragraph's failure marker -> it retries (still fails with bad key, but the retry click works)
5. Fix the API key in settings
6. Click "重试失败" in the control bar -> all failed paragraphs re-translate and succeed
7. Click "清除"

- [ ] **Step 6: Verify 100-paragraph limit**

1. Open a very long page (e.g. a long Wikipedia article with 150+ paragraphs)
2. Trigger inline translation
3. Verify control bar shows "译文中… X/100" and a hint "仅翻译前 100 段"
4. Only the first 100 paragraphs get translations

- [ ] **Step 7: Verify existing features still work (regression)**

1. Right-click -> AI翻译 -> 翻译整个页面 -> confirm the floating popup still appears with the full-page translation (unchanged behavior)
2. Select text on the page -> confirm the inline 翻译/朗读 popper appears
3. Right-click -> AI翻译 -> 翻译选中的文本 -> confirm popup appears
4. Open the extension's new-tab page -> click "AI翻译" in top nav -> confirm the in-extension translate modal still works

- [ ] **Step 8: Verify idempotent trigger**

1. Trigger inline translation on a page
2. While it's running, right-click -> AI翻译 -> 内联翻译页面 again
3. Verify the control bar flashes (highlight) but no second session starts
4. The original translation continues normally

- [ ] **Step 9: Final commit (if any fixes were needed during verification)**

If any bugs were found and fixed during verification, commit them. Otherwise, no commit needed -- the feature is complete.

```bash
git status
# If changes exist:
git add -A
git commit -m "Fix issues found during inline translation verification"
```

---

## Self-Review Checklist (for plan author)

After writing all tasks, verify:

- [ ] **Spec coverage:** Every requirement in the spec maps to a task
  - New menu item -> Task 7
  - 3-concurrent paragraph translation -> Task 1 (pool) + Task 5 (orchestration)
  - Inline injection below each paragraph -> Task 3
  - Progressive display -> Task 5 (worker injects immediately)
  - Floating control bar with stop/clear -> Task 4 + Task 5
  - Failed paragraph marking + retry -> Task 3 (markFailed) + Task 5 (retrySingleParagraph, handleRetryFailed)
  - 100-paragraph limit -> Task 2 (collectParagraphs limit) + Task 5 (state)
  - Direction/provider respect -> Task 5 (translateParagraph uses DO_TRANSLATE which reads settings)
- [ ] **No placeholders:** No TBD, TODO, "add error handling", "similar to Task N"
- [ ] **Type consistency:** `Paragraph` shape `{ id, el, text, status, injectedHost? }` consistent across Tasks 2, 3, 5
- [ ] **Function names:** `createPool`, `collectParagraphs`, `injectTranslation`, `markFailed`, `clearParagraphMarker`, `removeAllInjected`, `createControlBar`, `updateControlBar`, `removeControlBar`, `flashControlBar`, `startInlineTranslation` -- all defined in one task and used consistently in later tasks
