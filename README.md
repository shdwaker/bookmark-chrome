# MarkTrace

A Chrome extension that combines bookmark management, browsing history, weather forecasts, AI translation, TTS, an all-tabs overview, and OneTab-style tab consolidation into the new-tab page. Replaces Chrome's default new tab with a powerful browsing workspace.

English | [简体中文](README.zh-CN.md)

<!-- screenshot: drop a gif/png here -->

## v1.1.0 Release Notes

- Added a 15-day weather report with trend and list views
- Added current-location lookup, manual city switching, favorite cities, and city search
- Added hourly temperature, precipitation, wind, and UV data for the selected date; past hours are hidden
- Clicking a date in the 15-day report opens that date's hourly weather
- Replaced bitmap/emoji weather icons with crisp SVG icons and adopted a compact large-modal layout

## Features

### Bookmark management
- **Real-time Chrome bookmark sync** - read/write bookmarks via the Chrome bookmarks API
- **Collapsible folder tree** - navigate large bookmark trees with foldable folders
- **Custom tag system** - add tags to any bookmark, filter by tag
- **Bookmark search** - search by title, URL, or tag
- **Configurable pagination** - show 10 / 20 / 50 / 100 bookmarks per page
- **Favorite folders** - pin frequently-used folders for quick access

### Browsing history
- **Per-site & per-URL tracing** - records visits in IndexedDB
- **Configurable retention** - keep 1 / 3 / 7 / 14 / 30 days
- **Excluded domains** - never record visits to specified domains

### All-tabs overview & OneTab
- **All-tabs panel** (default view) - view, deduplicate, and export every currently open tab, grouped by domain
- **OneTab consolidation** - one click sweeps eligible tabs (older than a configurable threshold, default 7 days) into a restorable list and closes them to free memory
  - Global button in the all-tabs header, plus per-domain card buttons
  - Dedicated OneTab page for browsing, restoring, and deleting saved records

### Weather forecast
- **15-day trend report** - click “天气” in the top navigation to view 15-day max/min temperature trends, conditions, precipitation, and wind
- **Current location** - query weather from the browser Geolocation API
- **City switching** - expand the location panel in the report header to switch favorite cities, search for a place, or remove a saved city
- **Hourly data by date** - click a date to view hourly temperature, precipitation, wind, and UV data; only current and future hours are shown for today
- **Crisp vector icons** - an SVG weather-icon component represents clear, rain, snow, fog, thunder, and other conditions

### AI translation
- **Three translation modes**; the right-click menu is always available, while the selection popper follows the interaction mode:
  - **Popup translation** - floating Shadow DOM panel with separate "Page" and "Manual" tabs so both translations remain available
  - **Inline translation** - translate the page paragraph-by-paragraph, inserting translations below each block element; includes a "继续翻译" (continue) button for pages with 100+ paragraphs
  - **Immersive translation** - clone-based bilingual display with three toggle modes: dual (original + translation), translated only, or original only; supports pause/resume, dynamic content monitoring (MutationObserver for SPAs), and an IndexedDB translation cache
- **Article detection** - Mozilla Readability identifies the main article so popup and immersive translation skip navigation, sidebars, ads, footers, and page titles
- **Batched paragraph rendering** - full-page popups translate at most five paragraphs in parallel, display each original/translation pair as soon as it completes, and wait for a "Continue" action before translating more
- **English vocabulary library** - right-click "AI翻译 → 保存生词" to generate the meaning, examples, and similar words with AI; entries sync across devices with Chrome Sync and support read-aloud for words and English examples
- **Math formula protection** - skips KaTeX, MathJax, and MathML containers; detects Unicode math symbols (𝐳, z₁, x², ∑, ∫, √), LaTeX commands, and function notation (softmax, sqrt) so formulas are never translated
- **Multiple providers** - Alibaba Qwen, Volcengine Doubao, Zhipu GLM, Moonshot Kimi; supports both OpenAI and Anthropic Messages API formats
- **Custom provider config** - override baseURL, model, and target language
- **Text-to-Speech** - listen to the original or translated text with a slow-speed (0.6×) option

### New-tab integration
- Replaces Chrome's default new-tab page
- Lunar-date aware clock display

## Installation

### Method 1 (recommended): load the prebuilt `dist/`

The repository ships a built `dist/` directory, so you can run the extension without installing Node.js or building from source.

1. Clone the repository:
   ```bash
   git clone https://github.com/shdwaker/bookmark-chrome.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked**.
5. Select the `dist/` directory inside the cloned repo.

### Method 2: build from source

1. Clone and install:
   ```bash
   git clone https://github.com/shdwaker/bookmark-chrome.git
   cd bookmark-chrome
   npm install
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Load the generated `dist/` directory as in Method 1, steps 2-5.

## Usage

- **Open a new tab** - the all-tabs overview appears by default, showing every open tab grouped by domain.
- **Bookmarks** - switch to the bookmark view from the top nav; browse the folder tree on the left and click a folder to list its bookmarks.
- **Search** - the search bar matches title, URL, and tags.
- **Tags** - add or edit tags on a bookmark via its edit modal; filter by tag from the toolbar.
- **Favorite folders** - star a folder for quick access.
- **Browsing history** - open the history modal to see per-site and per-URL visits.
- **OneTab** - in the all-tabs panel, click the OneTab button (global or per-card) to sweep eligible tabs into a restorable list; open the OneTab page to browse, restore, or delete saved records.
- **AI translation** - right-click any page for "AI翻译" with submenu (translate page, inline translate, immersive translate, translate selection, save vocabulary, read aloud); or select text to trigger the floating popper. Click the AI-translation button in the top nav to open the translate modal.
- **Translation modes** - popup (floating panel), inline (paragraph-by-paragraph injection), immersive (clone-based bilingual with mode toggle). All three support incremental rendering for long text.
- **TTS** - read text in the translate panel and read vocabulary words and English examples in the vocabulary library; the translate panel supports slow-speed (0.6×) mode.
- **Weather** - click "其它 → 天气" in the top nav; it uses the current location by default. Switch cities from the report header and click a date for hourly data.
- **Vocabulary library** - click "其它 → 生词本" in the top nav to search, read aloud, or delete saved words.
- **Settings** - click the gear icon to open the settings page.

## Configuration

Open the settings page (gear icon) to configure:

- **Visit tracing** - enable / disable visit recording
- **Trace retention** - keep records for 1 / 3 / 7 / 14 / 30 days
- **Bookmarks per page** - 10 / 20 / 50 / 100
- **Default root folder** - the folder shown on startup
- **Excluded domains** - domains whose visits are never recorded
- **OneTab** - tab age threshold (days) for OneTab eligibility, default 7
- **Favorite cities** - add, switch, or remove cities in the weather modal; selections are persisted
- **AI translation** - provider, API key, model, baseURL override, target language
- **Clock display** - toggle and format options

## Chrome permissions

| Permission | Purpose |
|------------|---------|
| `bookmarks` | Read and write Chrome bookmarks |
| `storage`   | Persist settings, favorite folders, and OneTab records |
| `tabs`      | List open tabs, close tabs for OneTab, listen for visit tracing |
| `alarms`    | Periodic cleanup of expired trace records |
| `contextMenus` | Right-click "AI翻译" submenu (translate page, inline, immersive, selection, read aloud) |
| `history`   | Declared in the manifest, not yet used in code (reserved) |

`host_permissions` are declared for translation provider endpoints (Qwen, Doubao, GLM, Kimi) and weather endpoints (Open-Meteo and Photon Geocoding) so the APIs can be called from the extension.

## Tech stack

- [Vue 3](https://vuejs.org/) + Composition API
- [@mozilla/readability](https://github.com/mozilla/readability) for article extraction
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Pinia](https://pinia.vuejs.org/) for state management
- Chrome Extension **Manifest V3**
- **IndexedDB** for visit-trace and OneTab storage
- **Chrome Storage Sync** for the English vocabulary library
- **Web Speech API** for text-to-speech
- [Open-Meteo](https://open-meteo.com/) weather data
- [Vitest](https://vitest.dev/) for testing

## Project structure

```
bookmark-chrome/
├── dist/                          # Built extension (tracked - load this directly)
├── public/
│   └── icons/                     # Extension icons
├── src/
│   ├── background/
│   │   └── index.js               # Service worker (visit tracing, alarms)
│   ├── content/
│   │   ├── translate-panel.js     # Popup/page translation panel + message router
│   │   ├── inline-translate.js    # Inline paragraph-by-paragraph translation
│   │   └── immersive-translate.js # Immersive bilingual translation orchestrator
│   ├── pages/
│   │   ├── main/                   # New-tab page
│   │   │   ├── App.vue
│   │   │   ├── main.js
│   │   │   ├── styles.css
│   │   │   └── components/
│   │   │       ├── BookmarkList.vue
│   │   │       ├── BookmarkEditModal.vue
│   │   │       ├── FolderTree.vue
│   │   │       ├── FolderItem.vue
│   │   │       ├── FolderEditModal.vue
│   │   │       ├── TagEditModal.vue
│   │   │       ├── TraceModal.vue
│   │   │       ├── AllTabsModal.vue
│   │   │       ├── OneTabPage.vue
│   │   │       ├── TranslateModal.vue
│   │   │       ├── WeatherModal.vue
│   │   │       ├── WeatherIcon.vue
│   │   │       ├── ConfirmModal.vue
│   │   │       └── TopNav.vue
│   │   └── settings/              # Settings page
│   │       ├── App.vue
│   │       ├── main.js
│   │       └── styles.css
│   ├── stores/
│   │   ├── bookmarks.js           # Pinia: bookmark state
│   │   ├── settings.js            # Pinia: settings state
│   │   └── translate.js           # Pinia: translation state (incremental)
│   └── utils/
│       ├── bookmark-api.js        # Chrome bookmarks API wrapper
│       ├── storage.js              # Settings storage helpers
│       ├── tag-manager.js         # Tag CRUD
│       ├── trace-manager.js       # IndexedDB visit tracing + shared DB
│       ├── tabs-manager.js        # Tab utilities (all-tabs, domain grouping)
│       ├── onetab-manager.js      # OneTab filtering, view builder, CRUD
│       ├── lunar.js               # Lunar-date conversion for clock display
│       ├── weather-api.js         # Open-Meteo weather lookup, city search, and data normalization
│       └── translate/
│           ├── providers.js       # Translation provider registry
│           ├── prompt.js          # Translation prompt templates
│           ├── transport.js       # Provider-agnostic transport layer
│           ├── translate-api.js   # Translation API calls + JSON extraction
│           ├── chunk.js           # Text chunking for incremental rendering
│           ├── page-content.js     # Readability-based article and paragraph extraction
│           ├── vocabulary.js        # Chrome Sync-backed vocabulary library
│           ├── inline.js          # Inline translation helpers (pool, collector)
│           └── immersive/         # Immersive translation utilities
│               ├── article-root.js        # Article container detection
│               ├── paragraph-detector.js  # DOM tree walker for piece detection
│               ├── cache.js               # IndexedDB translation cache
│               ├── dom-injector.js        # Clone/inject/mode-switch/cleanup
│               ├── language-detect.js     # Latin/CJK/math detection
│               └── site-rules.js          # Per-site container selectors
├── manifest.json
├── vite.config.js
├── package.json
├── LICENSE
└── README.md
```

## Development

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview the production build
npm test          # Run Vitest tests
```

## Testing

Tests are written with [Vitest](https://vitest.dev/) and live in `src/utils/**/*.test.js`:

```bash
npm test
```

## Contributing

Issues and pull requests are welcome at [shdwaker/bookmark-chrome](https://github.com/shdwaker/bookmark-chrome).

## License

[MIT](LICENSE)
