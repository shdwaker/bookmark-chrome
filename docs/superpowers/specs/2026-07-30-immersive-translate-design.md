# Immersive Translate Integration Design

## Goal

Add a "沉浸式翻译" (immersive translation) feature that translates web pages with bilingual display, reusing the algorithms from the archived open-source immersive-translate project (MPL-2.0) but reimplemented from scratch in modern ES modules. The existing inline paragraph translation feature is preserved unchanged for comparison.

## Background

The existing inline translation (`src/content/inline-translate.js`) appends translation `<div>` elements below each paragraph. It uses CSS selectors (`p, h1-h6, li, blockquote, td`) for paragraph detection and a 3-way concurrency pool.

The user discovered immersive-translate (https://github.com/immersive-translate/immersive-translate), which matches their needs better. However, the current immersive-translate repo is closed-source (only release builds). The last open-source version is archived at `immersive-translate/old-immersive-translate` (MPL-2.0, archived Jan 2023).

This spec designs a reimplementation of immersive-translate's core algorithms (not a copy of its code) integrated into the existing MarkTrace extension, coexisting with the inline translation feature.

## Requirements

### Functional

1. New right-click context menu item "沉浸式翻译" (immersive-translate), separate from existing "内联翻译页面"
2. Smart paragraph detection via DOM tree traversal (inline/block classification), not CSS selectors
3. Bilingual display: clone block elements, translate in-place, toggle between three modes:
   - 双语 (dual): original + translated both visible
   - 仅译文 (translated): only translated visible
   - 仅原文 (original): only original visible
4. Translation cache via IndexedDB (persist across sessions, skip repeat API calls)
5. Dynamic content monitoring via MutationObserver (auto-translate SPA-loaded content)
6. Language detection: skip paragraphs already in target language (en-zh skips CJK-only text, zh-en skips Latin-only text)
7. Site-specific rules for Twitter/X, Reddit, Hacker News, GitHub, Wikipedia
8. Floating control bar (top-right) showing progress, mode toggle, clear, retry-failed
9. Default limit of 500 pieces per page
10. Respect user's configured translation direction (auto / zh-en / en-zh) and default provider
11. Coexist with existing inline translation (mutually exclusive -- triggering one clears the other)

### Non-functional

- No new permissions required (IndexedDB is available without permission)
- No changes to `DO_TRANSLATE` handler or `translate-api.js`
- Translation cache persists across page reloads (injected translations do not)
- Single immersive-translation session per tab (re-triggering while active flashes control bar)
- Reimplemented from scratch -- no code copied from immersive-translate, no MPL-2.0 license obligations

## Architecture

### Approach: Reimplement core algorithms, reuse translation backend

The content script orchestrates everything: paragraph detection, cloning, concurrency pool, caching, DOM injection, and dynamic content monitoring. The background worker's existing `DO_TRANSLATE` handler is reused unchanged -- each piece is one `DO_TRANSLATE` message, with 3 concurrent requests managed by a pool (reusing `createPool` from `inline.js`).

**Why this approach** (vs alternatives considered):
- **Fork old immersive-translate**: MPL-2.0 license requires sharing modifications to forked files; old code uses Gulp + vanilla JS, incompatible with our Vite + ES module setup
- **NPM package**: only contains a DeepL client, no page translation logic
- **Reimplement (chosen)**: no license constraints, code style consistency, can integrate cleanly with existing `DO_TRANSLATE` backend

### Files

**New:**
- `src/content/immersive-translate.js` -- orchestrator (state machine, control bar, concurrency pool, observer, coordination)
- `src/utils/translate/immersive/paragraph-detector.js` -- `collectPieces(root, options)` DOM traversal
- `src/utils/translate/immersive/dom-injector.js` -- cloning, translation injection, mode switching, cleanup
- `src/utils/translate/immersive/cache.js` -- `createCache()` IndexedDB wrapper with injectable backend
- `src/utils/translate/immersive/site-rules.js` -- `getSiteRule(url)` and `SITE_RULES` array
- `src/utils/translate/immersive/language-detect.js` -- `hasLatinLetters(text)`, `hasCJK(text)`
- `src/utils/translate/immersive/immersive.test.js` -- Vitest unit tests for pure functions

**Modified:**
- `src/content/translate-panel.js` -- import `startImmersive` and `clearImmersive`; add `immersive-translate` message handler; trigger mutual exclusion
- `src/background/index.js` -- add `immersive-translate` context menu item
- `manifest.json` -- no change needed (immersive-translate.js is imported by translate-panel.js, bundled automatically by @crxjs/vite-plugin)

### Data flow

```
User right-clicks -> "沉浸式翻译"
  -> background sends { type: 'immersive-translate' } to content script
  -> translate-panel.js:
       1. clearInline()  (mutual exclusion)
       2. startImmersive(direction)
  -> immersive-translate.js startImmersive(direction):
       1. initCache() -> open IndexedDB
       2. rule = getSiteRule(location.href)
       3. collectPieces(root, { rule, direction, limit=500 }) -> Piece[]
       4. createControlBar() -> floating UI
       5. cloneBlockElements(pieces) -> clone each unique blockEl
       6. cache.query(texts, direction) -> split into hit / miss
       7. hit pieces: injectTranslation immediately
       8. miss pieces: createPool({ items, concurrency=3, worker })
            worker: DO_TRANSLATE -> injectTranslation -> cache.write
       9. pool complete -> startObserver() -> MutationObserver on document.body
  -> User clicks mode button -> setMode(mode) -> flip display
  -> User clicks clear -> clearImmersive() -> disconnect observer, restore DOM
```

## Component Design

### 1. Paragraph detector (`paragraph-detector.js`)

**Function:** `collectPieces(root, options) -> Piece[]`

**Options:** `{ rule: SiteRule | null, direction: string, limit: number = 500 }`

**Piece structure:**
```js
{
  id: string,           // 'p1', 'p2', ...
  blockEl: Element,     // nearest block ancestor (for cloning)
  textNodes: Text[],    // text nodes in this piece
  text: string,         // concatenated plain text (for translation)
  status: 'pending' | 'translated' | 'failed'
}
```

**Traversal algorithm:**
1. If `rule` has `containerSelectors`, traverse each matched element; else traverse `root`
2. Mark `noTranslateSelectors` matches with `.notranslate`
3. Recursively walk child nodes, maintaining an "open piece":
   - **Text node**: if `textContent.trim()` non-empty, add to open piece. If accumulated text > 1000 chars, close piece and open new one (same `blockEl`)
   - **Inline element** (`A, B, I, SPAN, STRONG, EM, SUB, SUP, SMALL, MARK, ABBR, CITE, Q, CODE`): recurse into children, do not break piece
   - **Block element** (`DIV, P, H1-H6, LI, BLOCKQUOTE, TD, SECTION, ARTICLE, HEADER, FOOTER, MAIN, ASIDE, FIGURE, PRE, TABLE, TR, UL, OL, DL, DD, DT`): close current piece, recurse into subtree, open new piece
   - **Skip element** (`SCRIPT, STYLE, TEXTAREA, SVG, NOSCRIPT, IFRAME, BR, KBD, WBR`, `.notranslate`, `translate="no"`, `isContentEditable`): close current piece, skip subtree
4. `blockEl` for each text node = nearest non-inline ancestor (walk up from text node's parent until a block element is found)
5. Apply language detection: skip pieces where text has no target-language letters
6. Truncate to `limit`

**Filter pipeline (per text node):**
1. `textContent.trim()` non-empty
2. Not inside a skip element
3. Language check (if direction is explicit)
4. Not already marked `data-immersive-translated` or `data-immersive-original`

**`id`:** monotonic counter (`p1`, `p2`, ...) within one session.

### 2. DOM injector (`dom-injector.js`)

**Cloning (per unique blockEl, deduplicated):**
```js
function cloneBlockElement(blockEl) -> cloneNode
```
- `cloneNode(true)`, set `data-immersive-original="1"`
- Insert as `blockEl.parentNode.insertBefore(clone, blockEl)`
- Initial `display: none` (dual mode shows it later)
- Store in `state.clones.get(blockEl)`

**Translation injection:**
```js
function injectTranslation(piece, translation) -> void
```
- For each `textNode` in `piece.textNodes`, create `<span data-immersive-translated="1">译文</span>`
- `textNode.replaceWith(span)`
- Save mapping `{ originalNode: textNode, translatedSpan: span, blockEl: piece.blockEl }` to `state.translatedSpans`
- If `translation` contains multiple segments (one per text node), split accordingly; else put entire translation in first span

**Mode switching:**
```js
function setMode(mode) -> void  // 'dual' | 'translated' | 'original'
```
- `dual`: all clones visible (`display: ''`), all original blockEls visible
- `translated`: all clones `display: none`, all original blockEls visible
- `original`: all clones visible, all original blockEls `display: none`
- New pieces (from observer) inherit current mode on injection

**Cleanup:**
```js
function clearAll() -> void
```
- For each entry in `state.translatedSpans`: `span.replaceWith(originalNode)`
- Remove all clone nodes
- Remove `data-immersive-*` attributes

### 3. Cache (`cache.js`)

**Factory:** `createCache(backend?) -> Cache`

**Default backend:** IndexedDB
**Test backend:** in-memory `Map` (injectable)

**API:**
```js
{
  init(),                             // open/upgrade DB
  query(texts, direction) -> {
    hit: Map<string, string>,         // text -> translation
    miss: string[]                    // texts not in cache
  },
  write(entries) -> void,             // [{ text, direction, translation }]
  clear() -> void
}
```

**Storage:**
- Database: `immersive-translate-cache`
- Object store: `translations`
- Key: `${direction}::${text}`
- Value: `{ translation: string, timestamp: number }`

**Cleanup (v1):** No automatic LRU. User can clear via control bar button. Relies on IndexedDB quota management.

### 4. Site rules (`site-rules.js`)

**Data:**
```js
const SITE_RULES = [
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
```

**Function:** `getSiteRule(url) -> SiteRule | null`
- Match `location.hostname` against `hosts` (substring match)

### 5. Language detection (`language-detect.js`)

```js
hasLatinLetters(text) -> boolean   // /[a-zA-Z]/.test(text)
hasCJK(text) -> boolean            // /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text)
```

**Skip logic (applied in paragraph detector):**
- `direction === 'en-zh'` and `!hasLatinLetters(text)` -> skip (already Chinese)
- `direction === 'zh-en'` and `!hasCJK(text)` -> skip (already English)
- `direction === 'auto'` -> no skip

### 6. Dynamic content monitor (in `immersive-translate.js`)

**Start:** After initial translation completes, `observer.observe(document.body, { childList: true, subtree: true })`

**Debounce:** 500ms

**Callback:**
1. `collectAddedNodes(mutations)` -- gather added nodes, filtering out:
   - `[data-immersive-translated]` (our injected spans)
   - `[data-immersive-original]` (our clones)
   - `#immersive-control-bar-host` (our control bar)
   - Descendants of already-translated blockEls
2. `collectPiecesFromNodes(newNodes, options)` -- reuse paragraph detector
3. If new pieces > 0:
   - `cache.query` -> split hit/miss
   - Translate miss pieces via `createPool` (concurrency=3) -> `injectTranslation`
   - Apply current `state.mode` to new pieces
   - Update control bar counts
4. **Cap:** max 50 new pieces per callback; remainder waits for next callback

**Stop:** `observer.disconnect()` (called in `clearImmersive`)

### 7. Concurrency pool (in `immersive-translate.js`)

**Approach:** Reuse `createPool` from `src/utils/translate/inline.js` (already tested, 6 unit tests).

**Pool configuration:**
- `concurrency: 3` -- 3 parallel `DO_TRANSLATE` requests
- `worker: async (piece) => { result = await translatePiece(piece); injectTranslation(piece, result); cache.write([entry]) }`
- `shouldCancel: () => state.cancelled`
- On worker error: `markFailed(piece, err)`, do not stop pool

**Translation call:**
```js
async function translatePiece(piece) {
  const response = await chrome.runtime.sendMessage({
    type: 'DO_TRANSLATE',
    text: piece.text,
    direction: state.direction
  })
  if (response?.error) throw new Error(response.error)
  return response.result
}
```

**Cache integration:** Before pool starts, `cache.query` splits pieces into hit/miss. Hit pieces are injected immediately (no pool entry). Miss pieces go into the pool. After each successful translation, `cache.write` stores the result.

### 8. Control bar (in `immersive-translate.js`)

**Host:** `<div id="immersive-control-bar-host">` with Shadow DOM.

**Layout:**
```
[status text] [X/Y count] [原文][译文][双语] [重试失败?] [清除]
```

**States:**

| State | Text | Buttons |
|-------|------|---------|
| Translating | `沉浸式中… X/Y` | 原文/译文/双语, 清除 |
| Completed (no failures) | `完成 X/Y` | 原文/译文/双语, 清除 |
| Completed (with failures) | `完成 X/Y（N段失败）` | 原文/译文/双语, 重试失败, 清除 |

**Mode buttons:** three toggle buttons, current mode highlighted. Click -> `setMode(mode)`.

**Clear button:** `clearImmersive()` -- disconnect observer, restore DOM, remove control bar. Cache is preserved.

**Retry-failed button:** collect `pieces.filter(p => p.status === 'failed')`, clear their markers, new batch pool with `retryGen` increment (same pattern as inline translation).

### 9. State machine (in `immersive-translate.js`)

```js
const state = {
  active: false,
  mode: 'dual',
  direction: '',
  pieces: [],
  clones: new Map(),         // blockEl -> cloneNode
  translatedSpans: [],       // { originalNode, translatedSpan, blockEl }
  completedCount: 0,
  failedCount: 0,
  totalCount: 0,
  observer: null,
  cache: null,
  controlBar: null,
  retryGen: 0
}
```

**Transitions:**
1. `idle` -> trigger -> `startImmersive(direction)` -> init cache, collect pieces, clone, create control bar, start pool -> `active = true`
2. `active` + worker completes -> inject translation, update counts, `updateControlBar()`
3. `active` + initial pool done -> `startObserver()`, control bar shows "完成" (or failures)
4. `active` + observer fires -> translate new pieces, update counts
5. `active` + mode button -> `setMode(mode)` (no state change, just display)
6. `active` + Clear -> `clearImmersive()` -> restore DOM, disconnect observer, remove control bar -> `idle`
7. `idle` + Retry-failed -> rebuild pool from failed pieces -> `active = true`

**Idempotent trigger:** if `state.active === true` when triggered again, flash control bar, do not start second session.

### 10. Mutual exclusion (in `translate-panel.js`)

translate-panel.js imports both modules' start and clear functions:
```js
import { startInlineTranslation, clearInline } from './inline-translate.js'
import { startImmersive, clearImmersive } from './immersive-translate.js'
```

Message handler:
```js
if (message.type === 'immersive-translate') {
  clearInline()
  startImmersive(direction)
}
if (message.type === 'translate-page-inline') {
  clearImmersive()
  startInlineTranslation(direction)
}
```

**`clearInline` export:** added to `inline-translate.js` -- wraps existing `handleClear` logic, exposed for external use.

**`clearImmersive` export:** wraps cleanup logic (disconnect observer, restore DOM, remove control bar, reset state -- preserves cache).

## Edge Cases

1. **Empty page / no matching pieces** -- `collectPieces` returns `[]` -> `alert('未找到可翻译的段落')`, no control bar created.
2. **Over 500 pieces** -- truncate to 500, control bar shows count normally (no special hint needed since total reflects 500).
3. **API key not configured** -- first piece fails -> pool continues, remaining pieces also fail -> control bar shows "完成 X/Y（N段失败）" -> user configures -> clicks Retry-failed.
4. **Cache hit for all pieces** -- translation appears instantly, no API calls, control bar briefly shows "完成 X/X".
5. **Service worker restart mid-translation** -- MV3 worker may be killed. Next `DO_TRANSLATE` wakes it. Transparent to content script.
6. **SPA route change** -- observer detects new content, translates automatically. If entire DOM replaced (hard navigation), content script reloads, state resets.
7. **iframes** -- content script not injected into iframes. iframe content not translated. Accepted for v1.
8. **Self-UI exclusion** -- paragraph detector excludes `#immersive-control-bar-host`, `#mt-control-bar-host`, `#__ai_translate_panel_host__`, `#__ai_translate_read_aloud_host__`, `#__ai_translate_popper_host__`.
9. **Mixed inline/block in same blockEl** -- one clone per blockEl, multiple pieces may share it. Mode switching affects the entire blockEl uniformly.
10. **Translation text longer than original** -- span expands inline, no layout breakage. Block-level layout unaffected since we only replace text nodes, not block elements.

## Testing Strategy

**Tested with Vitest (pure functions):**
- `paragraph-detector.js`: inline/block classification, 1000-char split, skip elements, language filtering, nested dedup, site rule integration (using jsdom)
- `cache.js`: query hit/miss split, write, clear (with in-memory Map backend)
- `language-detect.js`: `hasLatinLetters`, `hasCJK`
- `site-rules.js`: `getSiteRule` matching logic
- Concurrency: `createPool` already tested in `inline.test.js` (6 tests) -- reused as-is, no new tests needed

**Not tested (low ROI):**
- `dom-injector.js` DOM operations (visual verification sufficient)
- Control bar rendering
- `chrome.runtime.sendMessage` integration
- MutationObserver behavior (visual verification on SPA sites)

## Out of Scope (v1)

- Custom site rules UI (settings page)
- Translation style options (underline/highlight/weakening)
- Custom dictionary
- Per-element translation toggle
- Translation export/import
- Cache LRU eviction (relies on IndexedDB quota)
- iframe translation
- Translation history

## Regression Protection

- Existing "翻译整个页面" popup behavior untouched
- Existing "内联翻译页面" feature untouched (new `clearInline` export is additive, does not change existing behavior)
- Existing "翻译选中的文本" and selection popper untouched
- `DO_TRANSLATE` handler in background untouched
- New menu item added without changing existing menu IDs or order
- `translate-panel.js` existing message handlers unchanged (new import and new branch added)
