# Inline Page Translation Design

## Goal

Replace the popup-based "translate entire page" experience with an inline, paragraph-by-paragraph translation that injects Chinese (or target language) translations directly below each source paragraph on the page, progressively as each paragraph is translated.

## Background

The existing `translate-panel.js` content script supports three right-click context menu actions:
- `translate-page` -- extracts `document.body.innerText` (first 5000 chars), shows translation in a floating popup
- `translate-selection` -- translates selected text in a floating popup
- `read-aloud` -- reads selected text aloud

The `translate-page` popup approach has limitations: it truncates long pages, hides translations behind a small panel, and loses the paragraph structure of the original page. Users want to see translations in context, inline with the original.

This spec adds a new right-click menu item **"内联翻译页面"** that performs inline paragraph-by-paragraph translation. The existing "翻译整个页面" popup behavior is preserved unchanged.

## Requirements

### Functional
1. New right-click context menu item "内联翻译页面" (translate-page-inline), separate from existing "翻译整个页面"
2. Translate paragraphs in batches of 3 concurrent requests
3. Inject each paragraph's translation directly below the source paragraph in the page DOM
4. Progressive display: each translation appears as soon as its API call completes
5. Floating control bar (top-right) shows progress (X/Y), with Stop and Clear buttons
6. Failed paragraphs are marked with a red indicator; clicking retries that paragraph
7. After completion, control bar shows retry-failed button if any failures occurred
8. Default limit of 100 paragraphs per page
9. Respect the user's configured translation direction (auto / zh-en / en-zh) and default provider

### Non-functional
- No new permissions required
- No changes to `DO_TRANSLATE` handler or `translate-api.js`
- No persistence across page reloads (translations disappear on refresh)
- Single inline-translation session per tab (re-triggering while active is a no-op that focuses the control bar)

## Architecture

### Approach: content script orchestrator, background only translates

The content script collects paragraphs, manages the concurrency pool, and injects results into the DOM. The background worker's existing `DO_TRANSLATE` handler is reused unchanged -- each paragraph is one `DO_TRANSLATE` message.

**Why this approach** (vs alternatives considered):
- **Pure content script**: all logic in `translate-panel.js` would bloat it past 1000 lines
- **Background orchestrator**: would double the message round-trips per paragraph (command + result) and decouple orchestration from DOM state
- **Hybrid (chosen)**: clean separation, background stays simple, content script has direct DOM access for inject/clear/mark-failed

### Files

**New:**
- `src/content/inline-translate.js` -- orchestration logic (paragraph collection, concurrency pool, DOM injection, control bar). Separate from `translate-panel.js` to avoid bloating it.
- `src/utils/translate/inline.test.js` -- Vitest unit tests for pure functions (pool scheduling, paragraph filtering).

**Modified:**
- `src/content/translate-panel.js` -- add message handler for `translate-page-inline` that delegates to `inline-translate.js`. Existing handlers unchanged.
- `src/background/index.js` -- add `translate-page-inline` to the context menu creation. `DO_TRANSLATE` handler unchanged.
- `manifest.json` -- add `inline-translate.js` as a second content_script entry (two independent bundles, not merged).
- `vite.config.js` -- register the new content script entry in the build.

### Data flow

```
User right-clicks -> "内联翻译页面"
  -> background sends { type: 'translate-page-inline' } to content script
  -> translate-panel.js delegates to inline-translate.js startInlineTranslation(direction)
  -> inline-translate.js:
       1. collectParagraphs(document.body, limit=100) -> paragraph[]
       2. createControlBar() -> floating UI
       3. createPool({ items, worker, concurrency=3, shouldCancel })
       4. pool.worker: chrome.runtime.sendMessage({ type:'DO_TRANSLATE', text, direction })
                      -> on success: injectTranslation(p, result)
                      -> on error:   markFailed(p, err)
       5. User clicks Stop  -> pool.cancel()
       6. User clicks Clear -> removeAllInjected() + removeControlBar()
       7. User clicks Retry-failed -> new pool with failed paragraphs only
```

## Component Design

### 1. Paragraph collection

**Function:** `collectParagraphs(root, limit, options) -> Paragraph[]`

**Selector:** `'p, h1, h2, h3, h4, h5, h6, li, blockquote, td'`

**Filter pipeline (per candidate element):**
1. **Visibility**: `getComputedStyle(el).display !== 'none'` and `el.offsetParent !== null`
2. **Text length**: `el.innerText.trim().length >= 8` (skip "Yes", "More" etc.)
3. **Language skip** (only when direction is explicit):
   - `direction === 'en-zh'` and text has no Latin letters -> skip (already Chinese)
   - `direction === 'zh-en'` and text has no CJK -> skip (already English)
   - `direction === 'auto'` -> no skip
4. **Nested dedup**: if `el.closest(BLOCK_SELECTOR) !== el`, the element is wrapped by another matched block (e.g. `<li><p>...</p></li>`) -> skip the inner one
5. **Self-exclusion**: skip elements inside `#PANEL_HOST_ID`, `#READ_ALOUD_HOST_ID`, `#POPPER_HOST_ID`, `#MT_CONTROL_BAR_HOST_ID`
6. **Already translated**: skip elements with `data-mt-translated` or `data-mt-failed` attribute (allows re-running on different page regions)

**Output:** `[{ id: string, el: Element, text: string, status: 'pending' }]`, truncated to `limit`.

**`id`**: monotonic counter (`p1`, `p2`, ...) within one session. Not persisted.

**Decisions:**
- No same-text dedup. Short duplicates are filtered by length; long duplicates are rare. Adds state complexity for minimal savings. Revisit if it becomes a problem.
- v1 translates a DOM snapshot at trigger time. SPA dynamic content loaded after trigger is not translated.

### 2. Concurrency pool

**Function:** `createPool({ items, worker, concurrency, shouldCancel }) -> { promise, cancel() }`

**`worker` signature:** `(item, index) => Promise<result>`

**Semantics:**
- Spawns `min(concurrency, items.length)` parallel workers
- Each worker pulls next item by incrementing a shared index
- `worker` errors go to `failed` array, do not stop the pool
- `cancel()` sets a flag; workers finish the current item then exit (does not abort in-flight API calls -- avoids wasting already-billed tokens)
- `shouldCancel()` callback checked before each new item; equivalent to `cancel()` but driven by caller state
- `promise` resolves to `{ completed, failed, cancelled }` after all workers exit

**Inline injection:** the caller's `worker` calls `injectTranslation(p, result)` immediately on success, not after the pool completes. This gives progressive display.

**Concurrency value:** hardcoded `3`. Not a setting in v1.

### 3. DOM injection

**`injectTranslation(p, result)`:**
- Idempotent: if `p.el` has `data-mt-translated`, return
- Creates `<div class="mt-translation">` with `textContent = result.translation` (XSS-safe, no innerHTML)
- Inserts via `p.el.after(host)`
- Sets `p.el.setAttribute('data-mt-translated', '1')` and `p.status = 'translated'`
- Inline styles (no external stylesheet, highest priority):

```css
display: block;
margin: 8px 0 12px 0;
padding: 8px 12px;
background: #f0f7ff;
border-left: 3px solid #4a90d9;
color: #333;
font-size: 0.95em;
line-height: 1.6;
border-radius: 0 4px 4px 0;
white-space: pre-wrap;
word-break: break-word;
```

**Why inline styles over Shadow DOM:**
- 100 shadow roots per page degrades performance
- Inline styles have highest priority; page CSS cannot easily override
- Visual consistency is fully controlled

**`markFailed(p, err)`:**
- Creates `<div class="mt-failed">` with `textContent = '翻译失败：${err.message}（点击重试）'`
- Red background, left red border
- Click handler calls `retryParagraph(p)`
- Sets `data-mt-failed` attribute on source element

**`removeAllInjected()`:**
- Removes all `.mt-translation` and `.mt-failed` elements
- Removes `data-mt-translated` and `data-mt-failed` attributes from source elements
- Allows re-translation

### 4. Floating control bar

**Host:** `<div id="mt-control-bar-host">` with `position: fixed; top: 20px; right: 20px; z-index: 2147483647`, Shadow DOM isolated.

**States:**

| State | Text | Buttons |
|-------|------|---------|
| Translating | `译文中… X/Y` | 停止, 清除 |
| Stopped | `已停止 X/Y` | 重试失败 (if any), 清除 |
| Completed (no failures) | `完成 X/Y` | 清除 |
| Completed (with failures) | `完成 X/Y（N 段失败）` | 重试失败, 清除 |
| Over limit | `译文中… X/100（页面共 N 段，仅翻译前 100 段）` | 停止, 清除 |

**Button behaviors:**
- **停止**: `state.cancelled = true; pool.cancel()`. In-flight requests complete, then pool resolves. Control bar switches to "Stopped" state.
- **清除**: `removeAllInjected(); removeControlBar(); reset state`. Returns to idle.
- **重试失败**: collects `paragraphs.filter(p => p.status === 'failed')`, removes their `.mt-failed` markers, starts a new pool with the same concurrency.

### 5. State machine

Module-level state object in `inline-translate.js`:

```js
const state = {
  active: false,
  cancelled: false,
  pool: null,
  paragraphs: [],
  completedCount: 0,
  failedCount: 0,
  totalCount: 0,
  controlBar: null
}
```

**Transitions:**
1. `idle` -> trigger -> `startInlineTranslation(direction)` -> collect paragraphs, create control bar, start pool -> `active = true`
2. `active` + worker completes -> increment counter, `updateControlBar()`
3. `active` + Stop clicked -> `cancelled = true`, `pool.cancel()`, wait for in-flight -> `active = false`
4. `active = false` + Retry-failed clicked -> rebuild pool from failed paragraphs -> `active = true`
5. `active = false` + Clear clicked -> `removeAllInjected()`, remove control bar -> `idle`

**Idempotent trigger:** if `state.active === true` when user clicks the menu again, focus the control bar and flash it. Do not start a second session.

## Edge Cases

1. **Empty page / no matching paragraphs** -- `collectParagraphs` returns `[]` -> `alert('未找到可翻译的段落')`, no control bar created.
2. **Over 100 paragraphs** -- truncate to 100, control bar shows the "仅翻译前 100 段" hint.
3. **API key not configured** -- first `DO_TRANSLATE` returns error -> every paragraph fails -> control bar shows "完成 0/100（100 段失败）" -> user configures in settings -> clicks Retry-failed.
4. **Network down** -- `DO_TRANSLATE` returns network error -> batch fails fast -> same path as #3.
5. **Service worker restart mid-translation** -- MV3 worker may be killed. Next `DO_TRANSLATE` wakes it; it re-reads settings and calls `translate()`. Transparent to content script.
6. **Page navigation / SPA route change** -- content script persists, but DOM replaced. Injected translations lost. Control bar's Clear button still works (`removeAllInjected` finds nothing, silently succeeds). v1 accepts this.
7. **iframes** -- content script not injected into iframes (manifest `all_frames` not set). iframe content not translated. v1 accepts.
8. **Self-UI** -- paragraph collector excludes all `#PANEL_HOST_ID`, `#READ_ALOUD_HOST_ID`, `#POPPER_HOST_ID`, `#MT_CONTROL_BAR_HOST_ID` subtrees.

## Testing Strategy

**Tested with Vitest (pure functions):**
- `collectParagraphs` filtering: visibility, length, nested dedup, self-exclusion (using jsdom)
- `createPool`: concurrency completes all items; cancel stops new dispatches; worker errors go to failed without breaking others; `shouldCancel` callback respected
- Helper functions (e.g. language detection helper, paragraph ID generation)

**Not tested (low ROI):**
- `injectTranslation` / `markFailed` DOM operations (visual verification sufficient)
- Control bar rendering
- `chrome.runtime.sendMessage` integration

## Out of Scope (v1)

- Persistence of translations across page reloads
- Settings for concurrency limit or paragraph cap
- iframe translation
- SPA dynamic content auto-translation
- Smart language detection for skip logic (only simple Latin/CJK letter check)
- Per-paragraph read-aloud buttons (would clutter; users can select text and use existing selection popper)

## Regression Protection

- Existing "翻译整个页面" popup behavior untouched
- Existing "翻译选中的文本" and selection popper untouched
- `DO_TRANSLATE` handler in background untouched
- New menu item added without changing existing menu IDs or order
