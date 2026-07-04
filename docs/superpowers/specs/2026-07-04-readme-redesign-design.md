# README Redesign — Design Spec

**Date:** 2026-07-04
**Topic:** Regenerate the extension README with bilingual (English + Chinese) versions, English as default.

## Goal

Replace the current single Chinese `README.md` with a bilingual pair: an authoritative English `README.md` (GitHub default display) and a mirroring Chinese `README.zh-CN.md`. Both stay content-aligned section-by-section; only the language differs.

## Decisions

### File structure

- `README.md` — English (default, shown on repo homepage)
- `README.zh-CN.md` — Chinese
- Each file has a language switcher at the top:
  - English file: `English | [简体中文](README.zh-CN.md)`
  - Chinese file: `[English](README.md) | 简体中文`

### Section order (both files, identical)

Order is "quick-start first" so users can run the extension before reading details.

1. **Title + one-line tagline**
   - Product name: "Bookmark Manager" (en) / "书签管理器" (zh)
   - Tagline: a Chrome extension combining bookmark management, tags, visit tracing, and an all-tabs overview, replacing the default new-tab page.

2. **Language switcher** (top, single line)

3. **Screenshot placeholder** — `<!-- screenshot: drop a gif/png here -->` (left empty for now)

4. **Features** (bullet list)
   - Real-time Chrome bookmark sync
   - Collapsible folder tree navigation
   - Custom tag system with tag filtering
   - Bookmark search (title / URL / tags)
   - Configurable pagination
   - Favorite folders for quick access
   - Visit tracing (per-site and per-URL traces, stored in IndexedDB)
   - All-tabs overview (view / export all currently open tabs) — **new**
   - New-tab-page integration (overrides Chrome's default new tab)

5. **Installation** (two methods, side by side)
   - **Method 1 (recommended): load the prebuilt `dist/`**
     1. Clone the repo
     2. Open `chrome://extensions`
     3. Enable Developer mode
     4. Click "Load unpacked", select the `dist/` directory
   - **Method 2: build from source**
     1. Clone + `npm install` + `npm run build`
     2. Load the generated `dist/` as above
   - Clone URL uses the real remote: `https://github.com/shdwaker/bookmark-chrome.git`

6. **Usage** (basic operations)
   - Open a new tab → bookmark manager appears
   - Browse via folder tree, search, add tags
   - View visit traces
   - Open the all-tabs overview
   - Enter the settings page

7. **Configuration options** (from settings store)
   - Visit tracing on/off
   - Trace retention days: 1 / 3 / 7 / 14 / 30
   - Bookmarks per page: 10 / 20 / 50 / 100
   - Default root folder
   - Excluded domains list

8. **Chrome permissions** (per-permission purpose)
   - `bookmarks` — read/write Chrome bookmarks
   - `storage` — persist settings and favorites
   - `tabs` — listen to tab updates for visit tracing
   - `alarms` — periodic cleanup of expired trace records
   - `history` — declared in manifest, not yet used in code (reserved; candidate for future cleanup)

9. **Tech stack**
   - Vue 3 + Composition API
   - Vite + @crxjs/vite-plugin
   - Pinia
   - Manifest V3
   - IndexedDB (visit-trace storage)
   - Vitest (testing)

10. **Project structure** (updated to match the actual tree: trace logic lives in `src/utils/`, include the `AllTabsModal` component)

11. **Development** — `npm run dev` / `build` / `preview` / `test`

12. **Testing** — `npm test` (Vitest); tests live in `src/utils/*.test.js`

13. **Contributing** — Issues and PRs welcome

14. **License** — MIT, link to `LICENSE`

## Content alignment rules

- Both files share the same section order and the same information; only the language differs.
- Code blocks, URLs, config values, file paths, and CLI commands are identical across both files.
- English is the authoritative version; Chinese is a faithful translation.
- The screenshot placeholder and all `<!-- comments -->` are identical across both files.

## Fixes applied vs. the old README

- Added the all-tabs overview feature (missing previously, despite being the most actively developed area).
- Corrected the project structure: the old README listed `src/stores/traces.js`, which does not exist; trace logic lives in `src/utils/trace-manager.js`.
- Added "load prebuilt `dist/`" as the recommended install path (now that `dist/` is tracked in git).
- Replaced the placeholder clone URL `your-username` with the real `shdwaker`.
- Added a Chrome permissions section explaining each requested permission.
- Added a testing section.

## Out of scope

- Producing actual screenshots/gifs (placeholder only; user will drop assets later).
- Trimming the unused `history` permission from `manifest.json` (flagged for the user; separate change).
- Rewriting any source code.
- Any i18n of the extension UI itself (only the README is being translated).

## Risks / follow-ups

- `dist/` is now tracked, so the README's "build from source" path is secondary; future rebuilds will produce hash-named files and require re-committing `dist/`. Already noted to the user separately.
- The `history` permission is unused; the README will say so honestly rather than inventing a purpose.
