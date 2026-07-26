# MarkTrace

A Chrome extension that combines bookmark management, browsing history, AI translation, TTS, an all-tabs overview, and OneTab-style tab consolidation into the new-tab page. Replaces Chrome's default new tab with a powerful browsing workspace.

English | [简体中文](README.zh-CN.md)

<!-- screenshot: drop a gif/png here -->

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

### AI translation
- **Inline translation panel** - translate selected text or the current page directly on any webpage via a content-script panel
- **Multiple providers** - Alibaba Qwen, Volcengine Doubao, Zhipu GLM, Moonshot Kimi
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
- **AI translation** - click the AI-translation button in the top nav to open the translate modal, or use the inline panel on any webpage; configure provider, API key, and target language in settings.
- **TTS** - use the speaker buttons in the translate panel to read text aloud; toggle slow-speed (0.6×) for language learning.
- **Settings** - click the gear icon to open the settings page.

## Configuration

Open the settings page (gear icon) to configure:

- **Visit tracing** - enable / disable visit recording
- **Trace retention** - keep records for 1 / 3 / 7 / 14 / 30 days
- **Bookmarks per page** - 10 / 20 / 50 / 100
- **Default root folder** - the folder shown on startup
- **Excluded domains** - domains whose visits are never recorded
- **OneTab** - tab age threshold (days) for OneTab eligibility, default 7
- **AI translation** - provider, API key, model, baseURL override, target language
- **Clock display** - toggle and format options

## Chrome permissions

| Permission | Purpose |
|------------|---------|
| `bookmarks` | Read and write Chrome bookmarks |
| `storage`   | Persist settings, favorite folders, and OneTab records |
| `tabs`      | List open tabs, close tabs for OneTab, listen for visit tracing |
| `alarms`    | Periodic cleanup of expired trace records |
| `history`   | Declared in the manifest, not yet used in code (reserved) |

`host_permissions` are declared for the translation provider endpoints (Qwen, Doubao, GLM, Kimi) so the translate API can be called from the extension.

## Tech stack

- [Vue 3](https://vuejs.org/) + Composition API
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Pinia](https://pinia.vuejs.org/) for state management
- Chrome Extension **Manifest V3**
- **IndexedDB** for visit-trace and OneTab storage
- **Web Speech API** for text-to-speech
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
│   │   └── translate-panel.js     # Inline translation panel injected into pages
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
│   │   │       ├── ConfirmModal.vue
│   │   │       └── TopNav.vue
│   │   └── settings/              # Settings page
│   │       ├── App.vue
│   │       ├── main.js
│   │       └── styles.css
│   ├── stores/
│   │   ├── bookmarks.js           # Pinia: bookmark state
│   │   ├── settings.js            # Pinia: settings state
│   │   └── translate.js           # Pinia: translation state
│   └── utils/
│       ├── bookmark-api.js        # Chrome bookmarks API wrapper
│       ├── storage.js              # Settings storage helpers
│       ├── tag-manager.js         # Tag CRUD
│       ├── trace-manager.js       # IndexedDB visit tracing + shared DB
│       ├── tabs-manager.js        # Tab utilities (all-tabs, domain grouping)
│       ├── onetab-manager.js      # OneTab filtering, view builder, CRUD
│       ├── lunar.js               # Lunar-date conversion for clock display
│       └── translate/
│           ├── providers.js       # Translation provider registry
│           ├── prompt.js          # Translation prompt templates
│           ├── transport.js       # Provider-agnostic transport layer
│           └── translate-api.js   # Translation API calls
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
