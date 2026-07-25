# MarkTrace

A Chrome extension that combines bookmark management, visit tracing, AI translation, TTS, and an all-tabs overview into the new-tab page. Replaces Chrome's default new tab with a powerful browsing workspace.

English | [简体中文](README.zh-CN.md)

<!-- screenshot: drop a gif/png here -->

## Features

- **Real-time Chrome bookmark sync** — read/write bookmarks via the Chrome bookmarks API
- **Collapsible folder tree** — navigate large bookmark trees with foldable folders
- **Custom tag system** — add tags to any bookmark, filter by tag
- **Bookmark search** — search by title, URL, or tag
- **Configurable pagination** — show 10 / 20 / 50 / 100 bookmarks per page
- **Favorite folders** — pin frequently-used folders for quick access
- **Visit tracing** — record per-site and per-URL visits in IndexedDB
- **All-tabs overview** — view and export all currently open tabs
- **New-tab integration** — replaces Chrome's default new-tab page

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

- **Open a new tab** — the bookmark manager appears in place of Chrome's default new-tab page.
- **Browse** the folder tree on the left; click a folder to list its bookmarks.
- **Search** using the search bar (matches title, URL, and tags).
- **Tags** — add or edit tags on a bookmark via its edit modal; filter by tag from the toolbar.
- **Favorite folders** — star a folder for quick access.
- **Visit tracing** — open the trace modal to see per-site and per-URL visit history.
- **All-tabs overview** — open the all-tabs panel to see and export every currently open tab.
- **Settings** — click the gear icon to open the settings page.

## Configuration

Open the settings page (gear icon) to configure:

- **Visit tracing** — enable / disable visit recording
- **Trace retention** — keep records for 1 / 3 / 7 / 14 / 30 days
- **Bookmarks per page** — 10 / 20 / 50 / 100
- **Default root folder** — the folder shown on startup
- **Excluded domains** — domains whose visits are never recorded

## Chrome permissions

| Permission | Purpose |
|------------|---------|
| `bookmarks` | Read and write Chrome bookmarks |
| `storage`   | Persist settings and favorite folders |
| `tabs`      | Listen to tab updates for visit tracing |
| `alarms`    | Periodic cleanup of expired trace records |
| `history`   | Declared in the manifest, not yet used in code (reserved) |

## Tech stack

- [Vue 3](https://vuejs.org/) + Composition API
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Pinia](https://pinia.vuejs.org/) for state management
- Chrome Extension **Manifest V3**
- **IndexedDB** for visit-trace storage
- [Vitest](https://vitest.dev/) for testing

## Project structure

```
bookmark-chrome/
├── dist/                          # Built extension (tracked — load this directly)
├── public/
│   └── icons/                     # Extension icons
├── src/
│   ├── background/
│   │   └── index.js               # Service worker (visit tracing, alarms)
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
│   │   │       ├── ConfirmModal.vue
│   │   │       └── TopNav.vue
│   │   └── settings/              # Settings page
│   │       ├── App.vue
│   │       ├── main.js
│   │       └── styles.css
│   ├── stores/
│   │   ├── bookmarks.js           # Pinia: bookmark state
│   │   └── settings.js            # Pinia: settings state
│   └── utils/
│       ├── bookmark-api.js        # Chrome bookmarks API wrapper
│       ├── storage.js              # Settings storage helpers
│       ├── tag-manager.js         # Tag CRUD
│       ├── trace-manager.js       # IndexedDB visit tracing
│       └── tabs-manager.js        # Tab utilities (all-tabs)
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

Tests are written with [Vitest](https://vitest.dev/) and live in `src/utils/*.test.js`:

```bash
npm test
```

## Contributing

Issues and pull requests are welcome at [shdwaker/bookmark-chrome](https://github.com/shdwaker/bookmark-chrome).

## License

[MIT](LICENSE)
