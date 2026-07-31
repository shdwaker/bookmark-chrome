# Immersive Translate Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "沉浸式翻译" feature with smart paragraph detection, bilingual cloning display, IndexedDB caching, and dynamic content monitoring, coexisting with existing inline translation.

**Architecture:** Pure utility modules (paragraph detector, cache, site rules, language detect) are tested in isolation with Vitest+jsdom. A content script orchestrator (`immersive-translate.js`) owns DOM mutation, control bar UI, state machine, and MutationObserver. Translation calls reuse the existing `DO_TRANSLATE` background handler. Mutual exclusion with inline translation is handled in `translate-panel.js`.

**Tech Stack:** Vue 3 + Vite + @crxjs/vite-plugin, Vitest with jsdom, Chrome Extension MV3, IndexedDB, MutationObserver, Shadow DOM.

---

## File Structure

**New files (pure utilities, unit-tested):**
- `src/utils/translate/immersive/language-detect.js` -- `hasLatinLetters`, `hasCJK`
- `src/utils/translate/immersive/site-rules.js` -- `SITE_RULES` array, `getSiteRule(url)`
- `src/utils/translate/immersive/paragraph-detector.js` -- `collectPieces(root, options)`, `INLINE_TAGS`, `BLOCK_TAGS`, `SKIP_TAGS`
- `src/utils/translate/immersive/cache.js` -- `createCache(backend?)` factory
- `src/utils/translate/immersive/immersive.test.js` -- all unit tests

**New files (DOM/content script, no unit tests):**
- `src/utils/translate/immersive/dom-injector.js` -- `cloneBlockElement`, `injectTranslation`, `setMode`, `clearAll`, `markFailed`
- `src/content/immersive-translate.js` -- orchestrator: state, control bar, pool, observer, `startImmersive`, `clearImmersive`

**Modified files:**
- `src/content/inline-translate.js` -- export `clearInline` wrapping existing `handleClear`
- `src/content/translate-panel.js` -- import `startImmersive`/`clearImmersive`; add `immersive-translate` message handler; mutual exclusion
- `src/background/index.js` -- add `immersive-translate` context menu item

---

### Task 1: Language detection helpers

**Files:**
- Create: `src/utils/translate/immersive/language-detect.js`
- Test: `src/utils/translate/immersive/immersive.test.js`

- [ ] **Step 1: Create the test file with language detection tests**

Create `src/utils/translate/immersive/immersive.test.js`:

```js
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { hasLatinLetters, hasCJK } from './language-detect'

describe('hasLatinLetters', () => {
  it('returns true for English text', () => {
    expect(hasLatinLetters('Hello World')).toBe(true)
  })

  it('returns false for pure CJK text', () => {
    expect(hasCJK('你好世界')).toBe(true)
    expect(hasLatinLetters('你好世界')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasLatinLetters('')).toBe(false)
    expect(hasCJK('')).toBe(false)
  })

  it('returns true for mixed text', () => {
    expect(hasLatinLetters('Hello 你好')).toBe(true)
    expect(hasCJK('Hello 你好')).toBe(true)
  })

  it('handles null/undefined input', () => {
    expect(hasLatinLetters(null)).toBe(false)
    expect(hasCJK(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: FAIL -- module `./language-detect` not found

- [ ] **Step 3: Create the language-detect module**

Create `src/utils/translate/immersive/language-detect.js`:

```js
// Language detection helpers for immersive translation.
// Simple letter-class checks -- not full language detection, but sufficient
// for skip logic (avoid translating text already in the target language).

export function hasLatinLetters(text) {
  return /[A-Za-z]/.test(text || '')
}

export function hasCJK(text) {
  // CJK Unified Ideographs + Hiragana/Katakana + Hangul
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || '')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/immersive/language-detect.js src/utils/translate/immersive/immersive.test.js
git commit -m "Add language detection helpers for immersive translation"
```

---

### Task 2: Site rules

**Files:**
- Create: `src/utils/translate/immersive/site-rules.js`
- Modify: `src/utils/translate/immersive/immersive.test.js`

- [ ] **Step 1: Add site rules tests to the test file**

Append to `src/utils/translate/immersive/immersive.test.js` (before the final newline, after the language-detect describe block):

```js
import { getSiteRule, SITE_RULES } from './site-rules'

describe('getSiteRule', () => {
  it('returns rule for twitter.com', () => {
    const rule = getSiteRule('https://twitter.com/user/status/123')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('twitter.com')
  })

  it('returns rule for x.com', () => {
    const rule = getSiteRule('https://x.com/user/status/123')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('x.com')
  })

  it('returns rule for reddit.com', () => {
    const rule = getSiteRule('https://www.reddit.com/r/programming/')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('reddit.com')
  })

  it('returns rule for news.ycombinator.com', () => {
    const rule = getSiteRule('https://news.ycombinator.com/item?id=123')
    expect(rule).toBeTruthy()
  })

  it('returns rule for github.com', () => {
    const rule = getSiteRule('https://github.com/user/repo')
    expect(rule).toBeTruthy()
  })

  it('returns rule for en.wikipedia.org', () => {
    const rule = getSiteRule('https://en.wikipedia.org/wiki/Test')
    expect(rule).toBeTruthy()
  })

  it('returns null for unmatched site', () => {
    expect(getSiteRule('https://example.com/page')).toBeNull()
    expect(getSiteRule('https://blog.example.org/post')).toBeNull()
  })

  it('all rules have required fields', () => {
    for (const rule of SITE_RULES) {
      expect(Array.isArray(rule.hosts)).toBe(true)
      expect(rule.hosts.length).toBeGreaterThan(0)
      expect(Array.isArray(rule.containerSelectors)).toBe(true)
      expect(Array.isArray(rule.noTranslateSelectors)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: FAIL -- module `./site-rules` not found

- [ ] **Step 3: Create the site-rules module**

Create `src/utils/translate/immersive/site-rules.js`:

```js
// Site-specific translation rules for better results on popular sites.
// Each rule narrows the paragraph detector's traversal scope to container
// selectors and marks certain elements as "do not translate".

export const SITE_RULES = [
  {
    hosts: ['twitter.com', 'x.com'],
    containerSelectors: ['article', '[data-testid="tweetText"]'],
    noTranslateSelectors: ['[data-testid="User-Name"]', 'time']
  },
  {
    hosts: ['reddit.com', 'old.reddit.com'],
    containerSelectors: ['.Post', '.Comment', '[data-testid="post-container"]'],
    noTranslateSelectors: ['.vote-buttons', '.Post__flatListItemButton']
  },
  {
    hosts: ['news.ycombinator.com'],
    containerSelectors: ['.athing', '.commtext'],
    noTranslateSelectors: ['.votearrow', '.score']
  },
  {
    hosts: ['github.com'],
    containerSelectors: ['.markdown-body', '.comment-body', '.blob-code'],
    noTranslateSelectors: ['.blob-num', '.js-clipboard']
  },
  {
    hosts: ['wikipedia.org'],
    containerSelectors: ['#mw-content-text'],
    noTranslateSelectors: ['.mw-editsection', '.reference', '.citation']
  }
]

// Match a URL against SITE_RULES by hostname substring.
// Returns the first matching rule, or null.
export function getSiteRule(url) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  for (const rule of SITE_RULES) {
    if (rule.hosts.some(h => hostname.includes(h))) {
      return rule
    }
  }
  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: PASS, 13 tests (5 language + 8 site-rules)

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/immersive/site-rules.js src/utils/translate/immersive/immersive.test.js
git commit -m "Add site-specific rules for immersive translation"
```

---

### Task 3: Paragraph detector

**Files:**
- Create: `src/utils/translate/immersive/paragraph-detector.js`
- Modify: `src/utils/translate/immersive/immersive.test.js`

This is the core algorithm -- DOM tree traversal with inline/block classification.

- [ ] **Step 1: Add paragraph detector tests to the test file**

Append to `src/utils/translate/immersive/immersive.test.js`:

```js
import { collectPieces, INLINE_TAGS, BLOCK_TAGS, SKIP_TAGS } from './paragraph-detector'

describe('collectPieces', () => {
  function domFrom(html) {
    document.body.innerHTML = html
    return document.body
  }

  it('collects text from a simple paragraph', () => {
    const root = domFrom('<p>Hello world this is a test paragraph</p>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello world this is a test paragraph')
    expect(pieces[0].blockEl.tagName).toBe('P')
    expect(pieces[0].textNodes.length).toBe(1)
  })

  it('separates pieces at block boundaries', () => {
    const root = domFrom('<div><p>First paragraph here</p><p>Second paragraph here</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text).toBe('First paragraph here')
    expect(pieces[1].text).toBe('Second paragraph here')
  })

  it('groups inline elements into same piece', () => {
    const root = domFrom('<p>Hello <strong>bold</strong> and <em>italic</em> text</p>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello bold and italic text')
    expect(pieces[0].textNodes.length).toBe(5)
  })

  it('skips SCRIPT, STYLE, and TEXTAREA content', () => {
    const root = domFrom('<div><p>Visible text</p><script>var x = 1</script><style>.x{color:red}</style></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Visible text')
  })

  it('skips elements with class notranslate', () => {
    const root = domFrom('<div><p>Translate this</p><p class="notranslate">Skip this</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('skips elements with translate="no" attribute', () => {
    const root = domFrom('<div><p>Translate this</p><p translate="no">Skip this</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('skips isContentEditable elements', () => {
    const root = domFrom('<div><p>Translate this</p><div contenteditable="true">Edit me</div></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('splits pieces exceeding 1000 characters', () => {
    const longText = 'A'.repeat(1200)
    const root = domFrom(`<p>${longText}</p>`)
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text.length).toBe(1000)
    expect(pieces[1].text.length).toBe(200)
    // Both pieces share the same blockEl
    expect(pieces[0].blockEl).toBe(pieces[1].blockEl)
  })

  it('skips empty/whitespace-only text nodes', () => {
    const root = domFrom('<div>   \n\n  <p>Real text</p>  \n  </div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Real text')
  })

  it('skips CJK-only text when direction is en-zh', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'en-zh' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello world')
  })

  it('skips Latin-only text when direction is zh-en', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'zh-en' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('这是中文')
  })

  it('does not skip based on language when direction is auto', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
  })

  it('respects the limit option', () => {
    let html = ''
    for (let i = 0; i < 10; i++) {
      html += `<p>Paragraph number ${i} here</p>`
    }
    const root = domFrom(html)
    const pieces = collectPieces(root, { direction: 'auto', limit: 3 })
    expect(pieces.length).toBe(3)
  })

  it('assigns monotonic ids', () => {
    const root = domFrom('<div><p>First</p><p>Second</p><p>Third</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('all pieces start with status pending', () => {
    const root = domFrom('<div><p>First</p><p>Second</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.every(p => p.status === 'pending')).toBe(true)
  })

  it('uses containerSelectors from site rule', () => {
    const root = domFrom(`
      <div class="sidebar">Sidebar text here</div>
      <article><p>Article body text here</p></article>
    `)
    const rule = {
      hosts: ['example.com'],
      containerSelectors: ['article'],
      noTranslateSelectors: []
    }
    const pieces = collectPieces(root, { direction: 'auto', rule })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Article body text here')
  })

  it('respects noTranslateSelectors from site rule', () => {
    const root = domFrom(`
      <div class="content">
        <p>Translate this</p>
        <div class="meta">Skip this metadata</div>
      </div>
    `)
    const rule = {
      hosts: ['example.com'],
      containerSelectors: ['.content'],
      noTranslateSelectors: ['.meta']
    }
    const pieces = collectPieces(root, { direction: 'auto', rule })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('collects text from div without p tags', () => {
    const root = domFrom('<div>Direct text in a div without any p tags</div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Direct text in a div without any p tags')
    expect(pieces[0].blockEl.tagName).toBe('DIV')
  })

  it('handles nested block elements', () => {
    const root = domFrom(`
      <div>
        <p>Outer text</p>
        <blockquote>
          <p>Quoted text</p>
        </blockquote>
      </div>
    `)
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text).toBe('Outer text')
    expect(pieces[1].text).toBe('Quoted text')
  })
})

describe('paragraph-detector constants', () => {
  it('INLINE_TAGS includes common inline elements', () => {
    expect(INLINE_TAGS.has('A')).toBe(true)
    expect(INLINE_TAGS.has('SPAN')).toBe(true)
    expect(INLINE_TAGS.has('STRONG')).toBe(true)
    expect(INLINE_TAGS.has('EM')).toBe(true)
  })

  it('BLOCK_TAGS includes common block elements', () => {
    expect(BLOCK_TAGS.has('DIV')).toBe(true)
    expect(BLOCK_TAGS.has('P')).toBe(true)
    expect(BLOCK_TAGS.has('H1')).toBe(true)
    expect(BLOCK_TAGS.has('LI')).toBe(true)
  })

  it('SKIP_TAGS includes script, style, textarea', () => {
    expect(SKIP_TAGS.has('SCRIPT')).toBe(true)
    expect(SKIP_TAGS.has('STYLE')).toBe(true)
    expect(SKIP_TAGS.has('TEXTAREA')).toBe(true)
    expect(SKIP_TAGS.has('SVG')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: FAIL -- module `./paragraph-detector` not found

- [ ] **Step 3: Create the paragraph-detector module**

Create `src/utils/translate/immersive/paragraph-detector.js`:

```js
// Smart paragraph detection via DOM tree traversal.
// Walks the DOM recursively, classifying elements as inline/block/skip,
// grouping consecutive inline text nodes into "pieces" (paragraphs).
// Block elements force piece breaks. Pieces exceeding 1000 chars are split.
//
// Reimplemented from scratch -- algorithm inspired by immersive-translate's
// getPiecesToTranslate, but written independently in modern ES module syntax.

import { hasLatinLetters, hasCJK } from './language-detect.js'

export const INLINE_TAGS = new Set([
  'A', 'B', 'I', 'SPAN', 'STRONG', 'EM', 'SUB', 'SUP', 'SMALL',
  'MARK', 'ABBR', 'CITE', 'Q', 'CODE', 'U', 'S', 'DEL', 'INS',
  'BDO', 'BDI', 'TIME', 'DATA', 'RB', 'RT', 'RTC', 'RP'
])

export const BLOCK_TAGS = new Set([
  'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE',
  'TD', 'TH', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE',
  'FIGURE', 'FIGCAPTION', 'PRE', 'TABLE', 'TR', 'TBODY', 'THEAD', 'TFOOT',
  'UL', 'OL', 'DL', 'DD', 'DT', 'ADDRESS', 'FIELDSET', 'LEGEND',
  'DETAILS', 'SUMMARY', 'FORM'
])

export const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEXTAREA', 'SVG', 'NOSCRIPT', 'IFRAME',
  'BR', 'KBD', 'WBR', 'SELECT', 'DATALIST', 'OPTION', 'OPTGROUP',
  'OBJECT', 'EMBED', 'CANVAS', 'AUDIO', 'VIDEO', 'TRACK', 'MAP', 'AREA'
])

const MAX_PIECE_CHARS = 1000
const EXCLUDED_ROOTS = new Set([
  '#__ai_translate_panel_host__',
  '#__ai_translate_read_aloud_host__',
  '#__ai_translate_popper_host__',
  '#__mt_control_bar_host__',
  '#__immersive_control_bar_host__'
])

// Find the nearest block ancestor of a text node.
function findBlockAncestor(node) {
  let el = node.parentElement
  while (el) {
    if (BLOCK_TAGS.has(el.tagName) || el === document.body) {
      return el
    }
    el = el.parentElement
  }
  return document.body
}

// Check if an element should be skipped (notranslate, translate=no, contenteditable, excluded root).
function shouldSkipElement(el) {
  if (SKIP_TAGS.has(el.tagName)) return true
  if (el.classList?.contains('notranslate')) return true
  if (el.getAttribute?.('translate') === 'no') return true
  if (el.isContentEditable) return true
  if (el.id && EXCLUDED_ROOTS.has(el.id)) return true
  if (el.dataset?.immersiveOriginal !== undefined) return true
  if (el.dataset?.immersiveTranslated !== undefined) return true
  return false
}

// Check if text should be skipped based on direction + language.
function shouldSkipByLanguage(text, direction) {
  if (direction === 'en-zh' && !hasLatinLetters(text)) return true
  if (direction === 'zh-en' && !hasCJK(text)) return true
  return false
}

// Mark noTranslateSelectors matches with .notranslate.
function applyNoTranslateSelectors(root, selectors) {
  for (const selector of selectors) {
    try {
      root.querySelectorAll(selector).forEach(el => {
        el.classList.add('notranslate')
      })
    } catch {
      // Invalid selector -- skip
    }
  }
}

// Get roots to traverse: either site rule containers or the root itself.
function getTraversalRoots(root, rule) {
  if (rule?.containerSelectors?.length) {
    const roots = []
    for (const selector of rule.containerSelectors) {
      try {
        root.querySelectorAll(selector).forEach(el => roots.push(el))
      } catch {
        // Invalid selector -- skip
      }
    }
    return roots.length > 0 ? roots : [root]
  }
  return [root]
}

export function collectPieces(root, options = {}) {
  const { direction = 'auto', limit = 500, rule = null } = options

  // Apply site rule: mark no-translate elements.
  if (rule?.noTranslateSelectors?.length) {
    applyNoTranslateSelectors(root, rule.noTranslateSelectors)
  }

  const traversalRoots = getTraversalRoots(root, rule)
  const pieces = []
  let idCounter = 0

  for (const trRoot of traversalRoots) {
    walkAndCollect(trRoot, direction, pieces, () => {
      idCounter++
      return `p${idCounter}`
    })
  }

  // Truncate to limit.
  const result = pieces.slice(0, limit)
  return result
}

// Recursive DOM walker. Maintains an "open piece" that accumulates
// consecutive inline text nodes. Block elements close and reopen pieces.
function walkAndCollect(node, direction, pieces, nextId) {
  let openPiece = null

  const ensureOpen = (blockEl) => {
    if (openPiece && openPiece.text.length >= MAX_PIECE_CHARS) {
      closePiece(openPiece, pieces)
      openPiece = null
    }
    if (!openPiece) {
      openPiece = {
        id: nextId(),
        blockEl: blockEl || document.body,
        textNodes: [],
        text: '',
        status: 'pending'
      }
    }
    return openPiece
  }

  const processNode = (node, currentBlockEl) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      const trimmed = text.trim()
      if (trimmed.length === 0) return

      if (shouldSkipByLanguage(trimmed, direction)) return

      const blockEl = currentBlockEl || findBlockAncestor(node)
      const piece = ensureOpen(blockEl)
      piece.textNodes.push(node)
      piece.text += (piece.text ? ' ' : '') + trimmed
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node

    // Skip excluded elements entirely.
    if (shouldSkipElement(el)) {
      if (openPiece) {
        closePiece(openPiece, pieces)
        openPiece = null
      }
      return
    }

    // Determine if this element is a block boundary.
    const isBlock = BLOCK_TAGS.has(el.tagName)
    const newBlockEl = isBlock ? el : currentBlockEl

    if (isBlock && openPiece) {
      closePiece(openPiece, pieces)
      openPiece = null
    }

    // Recurse into children.
    for (const child of el.childNodes) {
      processNode(child, newBlockEl)
    }

    if (isBlock && openPiece) {
      closePiece(openPiece, pieces)
      openPiece = null
    }
  }

  processNode(node, null)

  if (openPiece) {
    closePiece(openPiece, pieces)
  }
}

function closePiece(piece, pieces) {
  if (piece.textNodes.length > 0 && piece.text.trim().length > 0) {
    pieces.push(piece)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -15`
Expected: PASS, all tests green (5 language + 8 site-rules + ~20 paragraph-detector + 3 constants)

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/immersive/paragraph-detector.js src/utils/translate/immersive/immersive.test.js
git commit -m "Add smart paragraph detector with DOM tree traversal"
```

---

### Task 4: Translation cache (IndexedDB)

**Files:**
- Create: `src/utils/translate/immersive/cache.js`
- Modify: `src/utils/translate/immersive/immersive.test.js`

- [ ] **Step 1: Add cache tests to the test file**

Append to `src/utils/translate/immersive/immersive.test.js`:

```js
import { createCache } from './cache'

// In-memory backend for testing (avoids real IndexedDB in jsdom).
function createMemoryBackend() {
  const store = new Map()
  return {
    async get(key) { return store.has(key) ? store.get(key) : undefined },
    async set(key, value) { store.set(key, value) },
    async delete(key) { store.delete(key) },
    async clear() { store.clear() },
    async getMany(keys) {
      const result = new Map()
      for (const key of keys) {
        if (store.has(key)) result.set(key, store.get(key))
      }
      return result
    },
    async setMany(entries) {
      for (const [key, value] of entries) store.set(key, value)
    }
  }
}

describe('createCache', () => {
  it('query returns empty miss for new cache', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    const { hit, miss } = await cache.query(['hello', 'world'], 'en-zh')
    expect(hit.size).toBe(0)
    expect(miss).toEqual(['hello', 'world'])
  })

  it('write then query returns hit', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    await cache.write([
      { text: 'hello', direction: 'en-zh', translation: '你好' },
      { text: 'world', direction: 'en-zh', translation: '世界' }
    ])
    const { hit, miss } = await cache.query(['hello', 'world', 'new'], 'en-zh')
    expect(hit.get('hello')).toBe('你好')
    expect(hit.get('world')).toBe('世界')
    expect(miss).toEqual(['new'])
  })

  it('query separates hit and miss correctly', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    await cache.write([
      { text: 'cached', direction: 'auto', translation: '已缓存' }
    ])
    const { hit, miss } = await cache.query(['cached', 'uncached1', 'uncached2'], 'auto')
    expect(hit.size).toBe(1)
    expect(hit.get('cached')).toBe('已缓存')
    expect(miss).toEqual(['uncached1', 'uncached2'])
  })

  it('different directions use different cache entries', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    await cache.write([
      { text: 'hello', direction: 'en-zh', translation: '你好' }
    ])
    const { hit, miss } = await cache.query(['hello'], 'zh-en')
    expect(hit.size).toBe(0)
    expect(miss).toEqual(['hello'])
  })

  it('clear empties the cache', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    await cache.write([
      { text: 'hello', direction: 'auto', translation: '你好' }
    ])
    await cache.clear()
    const { hit, miss } = await cache.query(['hello'], 'auto')
    expect(hit.size).toBe(0)
    expect(miss).toEqual(['hello'])
  })

  it('handles empty query input', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    const { hit, miss } = await cache.query([], 'auto')
    expect(hit.size).toBe(0)
    expect(miss).toEqual([])
  })

  it('handles empty write input', async () => {
    const cache = createCache({ backend: createMemoryBackend() })
    await cache.init()
    await cache.write([])
    const { hit, miss } = await cache.query(['test'], 'auto')
    expect(hit.size).toBe(0)
    expect(miss).toEqual(['test'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -10`
Expected: FAIL -- module `./cache` not found

- [ ] **Step 3: Create the cache module**

Create `src/utils/translate/immersive/cache.js`:

```js
// Translation cache using IndexedDB with injectable backend.
// In production, uses real IndexedDB. In tests, an in-memory Map backend
// is injected via the `backend` option.
//
// Cache key format: `${direction}::${text}`
// Cache value: { translation: string, timestamp: number }

const DB_NAME = 'immersive-translate-cache'
const DB_VERSION = 1
const STORE_NAME = 'translations'

// Default IndexedDB backend.
function createIndexedDBBackend() {
  let db = null

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = (event) => {
        const database = event.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  function tx(mode) {
    if (!db) throw new Error('Cache not initialized')
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
  }

  function reqAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    async init() {
      db = await openDB()
    },
    async get(key) {
      return reqAsPromise(tx('readonly').get(key))
    },
    async set(key, value) {
      await reqAsPromise(tx('readwrite').put(value, key))
    },
    async delete(key) {
      await reqAsPromise(tx('readwrite').delete(key))
    },
    async clear() {
      await reqAsPromise(tx('readwrite').clear())
    },
    async getMany(keys) {
      const result = new Map()
      for (const key of keys) {
        const value = await reqAsPromise(tx('readonly').get(key))
        if (value !== undefined) result.set(key, value)
      }
      return result
    },
    async setMany(entries) {
      for (const [key, value] of entries) {
        await reqAsPromise(tx('readwrite').put(value, key))
      }
    }
  }
}

function makeKey(text, direction) {
  return `${direction}::${text}`
}

export function createCache(options = {}) {
  const backend = options.backend || createIndexedDBBackend()

  return {
    async init() {
      if (backend.init) await backend.init()
    },

    async query(texts, direction) {
      const keys = texts.map(t => makeKey(t, direction))
      const stored = await backend.getMany(keys)
      const hit = new Map()
      const miss = []
      for (let i = 0; i < texts.length; i++) {
        const entry = stored.get(keys[i])
        if (entry !== undefined) {
          hit.set(texts[i], entry.translation)
        } else {
          miss.push(texts[i])
        }
      }
      return { hit, miss }
    },

    async write(entries) {
      if (entries.length === 0) return
      const pairs = entries.map(e => [
        makeKey(e.text, e.direction),
        { translation: e.translation, timestamp: Date.now() }
      ])
      await backend.setMany(pairs)
    },

    async clear() {
      await backend.clear()
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/translate/immersive/immersive.test.js 2>&1 | tail -15`
Expected: PASS, all tests green

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/immersive/cache.js src/utils/translate/immersive/immersive.test.js
git commit -m "Add IndexedDB translation cache with injectable backend"
```

---

### Task 5: DOM injector

**Files:**
- Create: `src/utils/translate/immersive/dom-injector.js`

No unit tests -- DOM operations are verified visually in Task 11. This module provides the cloning, injection, mode switching, and cleanup functions used by the orchestrator.

- [ ] **Step 1: Create the dom-injector module**

Create `src/utils/translate/immersive/dom-injector.js`:

```js
// DOM injection for immersive translation: cloning block elements,
// replacing text nodes with translated spans, mode switching, and cleanup.
//
// Cloning strategy: each unique blockEl is cloned once and inserted as
// previousSibling. The original blockEl's text nodes are replaced with
// <span data-immersive-translated> elements containing the translation.
// Mode switching toggles display on clones and originals.

const TRANSLATED_ATTR = 'data-immersive-translated'
const ORIGINAL_ATTR = 'data-immersive-original'
const TRANSLATED_TAG = 'span'

// Clone a block element and insert it as previousSibling.
// Returns { clone, blockEl } for tracking.
export function cloneBlockElement(blockEl) {
  const clone = blockEl.cloneNode(true)
  clone.setAttribute(ORIGINAL_ATTR, '1')
  clone.style.display = 'none'
  blockEl.parentNode.insertBefore(clone, blockEl)
  return { clone, blockEl }
}

// Inject a translation into a piece's text nodes.
// translation can be a single string (applied to first text node) or
// an array of strings (one per text node).
// Returns array of { originalNode, translatedSpan, blockEl } for cleanup.
export function injectTranslation(piece, translation) {
  const spans = []
  const translations = Array.isArray(translation)
    ? translation
    : [translation]

  for (let i = 0; i < piece.textNodes.length; i++) {
    const textNode = piece.textNodes[i]
    const translatedText = translations[i] || translations[0] || ''
    const span = document.createElement(TRANSLATED_TAG)
    span.setAttribute(TRANSLATED_ATTR, '1')
    span.textContent = translatedText
    textNode.parentNode.replaceChild(span, textNode)
    spans.push({
      originalNode: textNode,
      translatedSpan: span,
      blockEl: piece.blockEl
    })
  }

  piece.status = 'translated'
  return spans
}

// Mark a piece as failed with a retry indicator.
export function markFailed(piece, err, onRetry) {
  const span = document.createElement(TRANSLATED_TAG)
  span.setAttribute(TRANSLATED_ATTR, '1')
  span.setAttribute('data-immersive-failed', '1')
  span.style.cssText = 'color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;'
  span.textContent = `翻译失败：${err.message}（点击重试）`
  span.addEventListener('click', () => onRetry(piece))

  // Replace the first text node with the failed indicator.
  if (piece.textNodes.length > 0) {
    const firstNode = piece.textNodes[0]
    firstNode.parentNode.replaceChild(span, firstNode)
  }

  piece.status = 'failed'
  return [{
    originalNode: piece.textNodes[0],
    translatedSpan: span,
    blockEl: piece.blockEl
  }]
}

// Switch display mode for all tracked clones and blockEls.
// mode: 'dual' | 'translated' | 'original'
// clones: Map of blockEl -> cloneNode
// translatedSpans: array of { originalNode, translatedSpan, blockEl }
export function setMode(mode, clones, translatedSpans) {
  const blockEls = new Set()
  for (const { blockEl } of translatedSpans) {
    blockEls.add(blockEl)
  }

  for (const [blockEl, clone] of clones) {
    if (!blockEls.has(blockEl)) continue
    switch (mode) {
      case 'dual':
        clone.style.display = ''
        clone.style.opacity = '0.6'
        blockEl.style.display = ''
        break
      case 'translated':
        clone.style.display = 'none'
        blockEl.style.display = ''
        break
      case 'original':
        clone.style.display = ''
        clone.style.opacity = ''
        blockEl.style.display = 'none'
        break
    }
  }
}

// Restore all text nodes and remove clones.
// translatedSpans: array of { originalNode, translatedSpan, blockEl }
// clones: Map of blockEl -> cloneNode
export function clearAll(translatedSpans, clones) {
  // Restore original text nodes (reverse order to handle nested spans).
  for (let i = translatedSpans.length - 1; i >= 0; i--) {
    const { originalNode, translatedSpan } = translatedSpans[i]
    if (translatedSpan.parentNode) {
      translatedSpan.parentNode.replaceChild(originalNode, translatedSpan)
    }
  }

  // Remove all clones.
  for (const clone of clones.values()) {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone)
    }
  }
}
```

- [ ] **Step 2: Verify the file parses**

Run: `node --check src/utils/translate/immersive/dom-injector.js 2>&1 | head -5`
Expected: no output (parses OK) or only `import` warnings (ignore).

- [ ] **Step 3: Run full test suite to verify no regressions**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all existing tests green (no new tests in this task).

- [ ] **Step 4: Commit**

```bash
git add src/utils/translate/immersive/dom-injector.js
git commit -m "Add DOM injector for immersive translation cloning and injection"
```

---

### Task 6: Orchestrator (content script)

**Files:**
- Create: `src/content/immersive-translate.js`

No unit tests -- orchestrator coordinates DOM, control bar UI, pool, and observer. Verified visually in Task 11.

- [ ] **Step 1: Create the orchestrator module**

Create `src/content/immersive-translate.js`:

```js
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
  clones: new Map(),         // blockEl -> cloneNode
  translatedSpans: [],       // { originalNode, translatedSpan, blockEl }
  completedCount: 0,
  failedCount: 0,
  totalCount: 0,
  pool: null,
  observer: null,
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
  } else if (failedCount > 0) {
    statusEl.textContent = '完成'
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

  // Highlight active mode button.
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
      // Apply current mode to newly injected.
      setMode(state.mode, state.clones, spans)
      // Write to cache.
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

  let debounceTimer = null
  const observer = new MutationObserver(() => {
    if (debounceTimer) return
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      handleMutations()
    }, OBSERVER_DEBOUNCE_MS)
  })

  observer.observe(document.body, { childList: true, subtree: true })
  state.observer = observer
}

function handleMutations() {
  if (state.cancelled) return

  // Collect added nodes from observer.
  // We re-run collectPieces on body, filtering out already-translated pieces.
  const rule = getSiteRule(location.href)
  const allPieces = collectPieces(document.body, {
    direction: getDirection(),
    limit: PARAGRAPH_LIMIT,
    rule
  })

  // Filter out pieces whose blockEl is already translated.
  const newPieces = allPieces.filter(p => p.status === 'pending').slice(0, OBSERVER_MAX_NEW_PIECES)

  // Further filter: skip pieces whose blockEl already has a clone.
  const trulyNew = newPieces.filter(p => !state.clones.has(p.blockEl))
  if (trulyNew.length === 0) return

  // Clone new block elements.
  cloneBlockElements(trulyNew)

  // Cache check.
  translateNewPieces(trulyNew)
}

async function translateNewPieces(pieces) {
  const texts = pieces.map(p => p.text)
  const { hit, miss } = await state.cache.query(texts, getDirection())

  // Inject cache hits immediately.
  for (const piece of pieces) {
    if (hit.has(piece.text)) {
      const spans = injectTranslation(piece, hit.get(piece.text))
      state.translatedSpans.push(...spans)
      state.completedCount++
      setMode(state.mode, state.clones, spans)
    }
  }
  updateControlBar()

  // Translate misses.
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
  // User clicked a single failed piece's retry indicator.
  const gen = state.retryGen
  if (state.cancelled || !state.controlBar) return
  // Remove the failed marker span and restore original text node.
  for (let i = state.translatedSpans.length - 1; i >= 0; i--) {
    if (state.translatedSpans[i].blockEl === piece.blockEl) {
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

  state.retryGen++
  state.cancelled = false
  state.failedCount = 0
  state.active = true
  updateControlBar()

  await runPool(failedPieces)
}

// --- Public API ---

export async function startImmersive(direction) {
  // Idempotent: if already active, flash the control bar and return.
  if (state.active) {
    if (state.controlBar) flashControlBar()
    return
  }

  // Reset state for a fresh session.
  state.cancelled = false
  state.completedCount = 0
  state.failedCount = 0
  state.mode = 'dual'
  state.direction = direction || 'auto'
  state.clones = new Map()
  state.translatedSpans = []

  // Init cache.
  state.cache = createCache()
  await state.cache.init()

  // Collect pieces.
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

  // Create control bar.
  createControlBar()

  // Clone block elements.
  cloneBlockElements(pieces)

  // Cache check: split into hit / miss.
  const texts = pieces.map(p => p.text)
  const { hit, miss } = await state.cache.query(texts, getDirection())

  // Inject cache hits immediately.
  for (const piece of pieces) {
    if (hit.has(piece.text)) {
      const spans = injectTranslation(piece, hit.get(piece.text))
      state.translatedSpans.push(...spans)
      state.completedCount++
      setMode(state.mode, state.clones, spans)
    }
  }
  updateControlBar()

  // Translate misses via pool.
  const missPieces = pieces.filter(p => miss.includes(p.text))
  if (missPieces.length > 0) {
    await runPool(missPieces)
  }

  // Start observer for dynamic content.
  if (!state.cancelled) {
    startObserver()
  }
}

export function clearImmersive() {
  handleClear()
}
```

- [ ] **Step 2: Verify the file parses**

Run: `node --check src/content/immersive-translate.js 2>&1 | head -5`
Expected: no output or only `import` warnings (ignore).

- [ ] **Step 3: Run full test suite to verify no regressions**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all existing tests green.

- [ ] **Step 4: Commit**

```bash
git add src/content/immersive-translate.js
git commit -m "Add immersive translation orchestrator with state machine and observer"
```

---

### Task 7: Export clearInline from inline-translate.js

**Files:**
- Modify: `src/content/inline-translate.js`

Add a `clearInline` export wrapping the existing `handleClear` function, so `translate-panel.js` can call it for mutual exclusion.

- [ ] **Step 1: Add the clearInline export**

In `src/content/inline-translate.js`, find the `handleClear` function (around line 320). It currently looks like:

```js
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
```

Add an export wrapper immediately after it:

```js
// Exported for mutual exclusion: translate-panel.js calls this before
// starting immersive translation to clear any active inline session.
export function clearInline() {
  handleClear()
}
```

- [ ] **Step 2: Verify the file parses**

Run: `node --check src/content/inline-translate.js 2>&1 | head -5`
Expected: no output or only `import` warnings (ignore).

- [ ] **Step 3: Run full test suite to verify no regressions**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all 85 existing tests green.

- [ ] **Step 4: Commit**

```bash
git add src/content/inline-translate.js
git commit -m "Export clearInline for mutual exclusion with immersive translation"
```

---

### Task 8: Message routing and mutual exclusion

**Files:**
- Modify: `src/content/translate-panel.js`

Route the new `immersive-translate` message to `startImmersive`, and implement mutual exclusion: triggering immersive clears inline, and vice versa.

- [ ] **Step 1: Add imports**

In `src/content/translate-panel.js`, find the existing import (around line 15):

```js
import { startInlineTranslation } from './inline-translate.js'
```

Replace it with:

```js
import { startInlineTranslation, clearInline } from './inline-translate.js'
import { startImmersive, clearImmersive } from './immersive-translate.js'
```

- [ ] **Step 2: Update the translate-page-inline handler for mutual exclusion**

Find the `translate-page-inline` message handler (around line 442):

```js
  if (message.type === 'translate-page-inline') {
    const direction = message.direction || 'auto'
    startInlineTranslation(direction)
    return
  }
```

Replace it with:

```js
  if (message.type === 'translate-page-inline') {
    const direction = message.direction || 'auto'
    clearImmersive()
    startInlineTranslation(direction)
    return
  }
```

- [ ] **Step 3: Add the immersive-translate message handler**

Immediately after the `translate-page-inline` handler (before the `read-aloud` handler), add:

```js
  if (message.type === 'immersive-translate') {
    const direction = message.direction || 'auto'
    clearInline()
    startImmersive(direction)
    return
  }
```

- [ ] **Step 4: Verify the file parses**

Run: `node --check src/content/translate-panel.js 2>&1 | head -5`
Expected: no output or only `import` warnings (ignore).

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all existing tests green.

- [ ] **Step 6: Commit**

```bash
git add src/content/translate-panel.js
git commit -m "Route immersive-translate message with mutual exclusion"
```

---

### Task 9: Background context menu entry

**Files:**
- Modify: `src/background/index.js`

Add a "沉浸式翻译" context menu item under the existing "AI翻译" parent.

- [ ] **Step 1: Add immersive-translate to the onClicked type guard**

In `src/background/index.js`, find the `chrome.contextMenus.onClicked.addListener` handler (around line 69). It currently has:

```js
  if (type !== 'translate-page' && type !== 'translate-page-inline' && type !== 'translate-selection' && type !== 'read-aloud') return
```

Replace with:

```js
  if (type !== 'translate-page' && type !== 'translate-page-inline' && type !== 'immersive-translate' && type !== 'translate-selection' && type !== 'read-aloud') return
```

- [ ] **Step 2: Add the menu item in createContextMenus**

Find the `createContextMenus` function (around line 81). After the `translate-page-inline` entry (around line 100), add a new `immersive-translate` entry:

```js
    chrome.contextMenus.create({
      id: 'immersive-translate',
      parentId: 'ai-translate',
      title: '沉浸式翻译',
      contexts: ['page']
    })
```

Insert it after the `translate-page-inline` block and before the `translate-selection` block.

- [ ] **Step 3: Verify the file parses**

Run: `node --check src/background/index.js 2>&1 | head -5`
Expected: no output (parses OK).

- [ ] **Step 4: Run full test suite to verify no regressions**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all existing tests green.

- [ ] **Step 5: Commit**

```bash
git add src/background/index.js
git commit -m "Add '沉浸式翻译' context menu item"
```

---

### Task 10: Build verification

**Files:**
- No file changes -- verify the build bundles everything correctly.

- [ ] **Step 1: Run the build**

Run: `npm run build 2>&1 | tail -25`
Expected: build succeeds, no errors.

- [ ] **Step 2: Verify immersive-translate is bundled in dist**

Run: `ls dist/assets/ | grep -E 'immersive|inline-translate|translate-panel'`
Expected: output includes files for `immersive-translate`, `inline-translate`, and `translate-panel`.

- [ ] **Step 3: Verify dist/manifest.json has both content scripts**

Run: `grep -A8 'content_scripts' dist/manifest.json`
Expected: output shows both `translate-panel` and `inline-translate` loader scripts in the `js` array.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run 2>&1 | tail -10`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit dist changes (if any)**

```bash
git add dist/
git diff --cached --stat || echo "No dist changes to commit"
git commit -m "Rebuild dist with immersive translation" || echo "No changes to commit"
```

---

### Task 11: Manual integration verification

This task verifies the feature end-to-end in Chrome. No code changes -- just a checklist.

- [ ] **Step 1: Reload the extension**

1. Open `chrome://extensions`
2. Find MarkTrace, click the reload icon
3. Confirm no errors shown on the extension card

- [ ] **Step 2: Verify context menu**

1. Open any English article page
2. Right-click -> hover "AI翻译"
3. Confirm "沉浸式翻译" appears alongside "内联翻译页面" and "翻译整个页面"

- [ ] **Step 3: Verify immersive translation on a simple page**

1. Open a page with several English `<p>` paragraphs
2. Right-click -> AI翻译 -> 沉浸式翻译
3. Verify:
   - Floating control bar appears top-right showing "沉浸式中… 0/N"
   - Translations appear progressively, replacing original text in-place
   - Original text is cloned (hidden by default in dual mode, shown with reduced opacity)
   - Counter increments as translations complete
   - When done, control bar shows "完成 N/N"
4. Click "原文" button -> only original text visible
5. Click "译文" button -> only translated text visible
6. Click "双语" button -> both original and translated visible
7. Click "清除" -> all translations removed, original text restored, control bar gone

- [ ] **Step 4: Verify caching**

1. Translate a page (Step 3)
2. Click "清除"
3. Trigger immersive translation again on the same page
4. Verify: translations appear instantly (cache hit), no API calls, control bar shows "完成" quickly

- [ ] **Step 5: Verify dynamic content (SPA)**

1. Open Twitter/X, Reddit, or Hacker News
2. Trigger immersive translation
3. Scroll down to load new content
4. Verify: new content is automatically translated within ~1 second
5. Control bar count increases as new content is translated

- [ ] **Step 6: Verify stop and clear**

1. Open a page with 20+ paragraphs
2. Trigger immersive translation
3. While "沉浸式中…" is showing, click "清除"
4. Verify: all translations removed, original text restored, control bar gone

- [ ] **Step 7: Verify mutual exclusion**

1. Trigger immersive translation
2. While it's running, right-click -> AI翻译 -> 内联翻译页面
3. Verify: immersive translation is cleared, inline translation starts
4. Clear inline, then trigger immersive again
5. Verify: immersive starts fresh

- [ ] **Step 8: Verify existing features still work**

1. "翻译整个页面" (popup) still works
2. "内联翻译页面" still works (translations appear below paragraphs)
3. "翻译选中的文本" still works
4. "朗读" still works

---
