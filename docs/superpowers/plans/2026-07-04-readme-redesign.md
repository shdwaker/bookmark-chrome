# README Bilingual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single Chinese `README.md` with an authoritative English `README.md` (default) plus a mirroring Chinese `README.zh-CN.md`, both content-aligned section-by-section, with a top-of-file language switcher.

**Architecture:** Two standalone markdown files. English is the source of truth; Chinese is a faithful translation. No code changes, no build steps. Each file is written in one shot, then verified and committed.

**Tech Stack:** Markdown only.

**Spec:** `docs/superpowers/specs/2026-07-04-readme-redesign-design.md`

---

## File Structure

- **Modify:** `README.md` — currently Chinese; will be **overwritten** with the English version.
- **Create:** `README.zh-CN.md` — new file, Chinese version.
- No source code changes. No new dependencies.

Both files share an identical section order so they can be diffed side-by-side:

1. Title + one-line tagline
2. Language switcher (`English | 简体中文`)
3. Screenshot placeholder (`<!-- screenshot: ... -->`)
4. Features (bullet list, includes all-tabs overview)
5. Installation (Method 1: load prebuilt `dist/`; Method 2: build from source)
6. Usage
7. Configuration
8. Chrome permissions (table)
9. Tech stack
10. Project structure (updated tree)
11. Development (`npm run` scripts)
12. Testing (Vitest)
13. Contributing
14. License (MIT)

---

## Task 1: Overwrite `README.md` with the English version

**Files:**
- Modify: `README.md` (full overwrite)

- [ ] **Step 1: Read the current `README.md` to confirm it is the old Chinese version**

Run: `Read README.md`
Expected: a Chinese file starting with `# 书签管理器 - Chrome Extension`. This confirms we are replacing the right file.

- [ ] **Step 2: Overwrite `README.md` with the English content**

Use the `Write` tool on `README.md` with the following exact content:

````markdown
# Bookmark Manager

A Chrome extension that combines bookmark management, tags, visit tracing, and an all-tabs overview into the new-tab page. Replaces Chrome's default new tab with a powerful bookmark workspace.

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
````

- [ ] **Step 3: Verify the file was written correctly**

Run: `Read README.md` (limit to first 5 lines).
Expected: file starts with `# Bookmark Manager` and contains the line `English | [简体中文](README.zh-CN.md)`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Rewrite README in English as default language"
```

Expected: a single commit modifying `README.md`.

---

## Task 2: Create `README.zh-CN.md` with the Chinese version

**Files:**
- Create: `README.zh-CN.md`

- [ ] **Step 1: Create `README.zh-CN.md` with the Chinese content**

Use the `Write` tool on `README.zh-CN.md` with the following exact content:

````markdown
# 书签管理器

一个 Chrome 扩展，在新标签页中集书签管理、标签、访问记录追踪与所有标签页总览于一体，替换 Chrome 默认新标签页，打造强大的书签工作区。

[English](README.md) | 简体中文

<!-- screenshot: 在此处放置 gif/png 截图 -->

## 功能特性

- **Chrome 书签实时同步** — 通过 Chrome 书签 API 读写书签
- **可折叠文件夹树** — 大型书签树也能轻松折叠导航
- **自定义标签系统** — 为任意书签添加标签，按标签筛选
- **书签搜索** — 按标题、URL 或标签搜索
- **可配置分页** — 每页显示 10 / 20 / 50 / 100 条
- **文件夹收藏** — 收藏常用文件夹，快速访问
- **访问记录追踪** — 在 IndexedDB 中记录按站点和按 URL 的访问
- **所有标签页总览** — 查看并导出当前打开的所有标签页
- **新标签页集成** — 替换 Chrome 默认新标签页

## 安装

### 方式一（推荐）：直接加载已构建的 `dist/`

仓库已附带构建好的 `dist/` 目录，无需安装 Node.js 或从源码构建即可使用。

1. 克隆仓库：
   ```bash
   git clone https://github.com/shdwaker/bookmark-chrome.git
   ```
2. 在 Chrome 中打开 `chrome://extensions`。
3. 开启右上角的**开发者模式**。
4. 点击**加载已解压的扩展程序**。
5. 选择克隆仓库中的 `dist/` 目录。

### 方式二：从源码构建

1. 克隆并安装依赖：
   ```bash
   git clone https://github.com/shdwaker/bookmark-chrome.git
   cd bookmark-chrome
   npm install
   ```
2. 构建：
   ```bash
   npm run build
   ```
3. 按方式一的步骤 2-5 加载生成的 `dist/` 目录。

## 使用说明

- **打开新标签页** — 书签管理器替代 Chrome 默认新标签页显示。
- **浏览** 左侧文件夹树，点击文件夹查看其中书签。
- **搜索** 使用搜索框（匹配标题、URL、标签）。
- **标签** — 通过书签编辑弹窗添加或修改标签，在工具栏按标签筛选。
- **收藏文件夹** — 收藏常用文件夹以便快速访问。
- **访问记录** — 打开访问记录弹窗查看按站点和按 URL 的访问历史。
- **所有标签页总览** — 打开所有标签页面板查看并导出当前打开的全部标签页。
- **设置** — 点击齿轮图标进入设置页。

## 配置选项

在设置页（齿轮图标）可配置：

- **访问记录追踪** — 启用 / 禁用访问记录
- **记录保留天数** — 保留 1 / 3 / 7 / 14 / 30 天
- **每页书签数** — 10 / 20 / 50 / 100
- **默认根文件夹** — 启动时显示的文件夹
- **排除域名** — 这些域名的访问永不记录

## Chrome 权限说明

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读写 Chrome 书签 |
| `storage`   | 持久化设置与收藏文件夹 |
| `tabs`      | 监听标签页更新以记录访问 |
| `alarms`    | 定时清理过期访问记录 |
| `history`   | 已在 manifest 声明，代码尚未使用（预留） |

## 技术栈

- [Vue 3](https://vuejs.org/) + Composition API
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Pinia](https://pinia.vuejs.org/) 状态管理
- Chrome 扩展 **Manifest V3**
- **IndexedDB** 存储访问记录
- [Vitest](https://vitest.dev/) 测试

## 项目结构

```
bookmark-chrome/
├── dist/                          # 构建产物（已跟踪，可直接加载）
├── public/
│   └── icons/                     # 扩展图标
├── src/
│   ├── background/
│   │   └── index.js               # Service Worker（访问追踪、定时任务）
│   ├── pages/
│   │   ├── main/                   # 新标签页
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
│   │   └── settings/              # 设置页
│   │       ├── App.vue
│   │       ├── main.js
│   │       └── styles.css
│   ├── stores/
│   │   ├── bookmarks.js           # Pinia：书签状态
│   │   └── settings.js            # Pinia：设置状态
│   └── utils/
│       ├── bookmark-api.js        # Chrome 书签 API 封装
│       ├── storage.js              # 设置存储工具
│       ├── tag-manager.js         # 标签 CRUD
│       ├── trace-manager.js       # IndexedDB 访问追踪
│       └── tabs-manager.js        # 标签页工具（所有标签页）
├── manifest.json
├── vite.config.js
├── package.json
├── LICENSE
└── README.md
```

## 开发

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # 生产构建到 dist/
npm run preview   # 预览生产构建
npm test          # 运行 Vitest 测试
```

## 测试

使用 [Vitest](https://vitest.dev/) 编写，位于 `src/utils/*.test.js`：

```bash
npm test
```

## 贡献

欢迎在 [shdwaker/bookmark-chrome](https://github.com/shdwaker/bookmark-chrome) 提交 Issue 和 Pull Request。

## 许可证

[MIT](LICENSE)
````

- [ ] **Step 2: Verify the file was created**

Run: `Read README.zh-CN.md` (limit to first 5 lines).
Expected: file starts with `# 书签管理器` and contains the line `[English](README.md) | 简体中文`.

- [ ] **Step 3: Verify both language switchers point at each other**

Run: `Grep` for `README.zh-CN.md` in `README.md` and for `README.md` in `README.zh-CN.md`.
Expected:
- `README.md` contains `English | [简体中文](README.zh-CN.md)`
- `README.zh-CN.md` contains `[English](README.md) | 简体中文`

- [ ] **Step 4: Verify section alignment between the two files**

Run: `Grep` with pattern `^## ` separately in `README.md` and `README.zh-CN.md` (count mode).
Expected: both files have the **same count** of `## ` headings (expected: 12 each — Features, Installation, Usage, Configuration, Chrome permissions, Tech stack, Project structure, Development, Testing, Contributing, License, plus the `### Method` / `### 方式` subheadings are `### ` not `## `).

If counts differ, fix the file that is missing a section before committing.

- [ ] **Step 5: Commit**

```bash
git add README.zh-CN.md
git commit -m "Add Chinese README translation (README.zh-CN.md)"
```

Expected: a single commit adding `README.zh-CN.md`.

---

## Task 3: Final verification and push

**Files:** none modified (verification only)

- [ ] **Step 1: Confirm working tree has only the two README changes**

Run: `git log --oneline -3` and `git status`.
Expected: the latest two commits are `Rewrite README in English as default language` and `Add Chinese README translation (README.zh-CN.md)`; working tree clean.

- [ ] **Step 2: Verify the clone URL in both files is correct**

Run: `Grep` for `github.com/shdwaker/bookmark-chrome` in `README.md` and `README.zh-CN.md`.
Expected: at least one match in each file (the clone command and the Contributing link).

- [ ] **Step 3: Push to origin**

Run: `git push origin main`
Expected: pushes 2 new commits to `origin/main`. (Uses the previously configured global `http.proxy`.)

- [ ] **Step 4: Confirm remote is in sync**

Run: `git rev-list --left-right --count origin/main...HEAD`
Expected: `0	0` (zero ahead, zero behind).

---

## Self-Review

**1. Spec coverage** — every section in the spec maps to a task:
- File structure (README.md + README.zh-CN.md, language switcher) → Task 1 Step 2 + Task 2 Step 1 (top-of-file switcher lines)
- Section 1 (Title + tagline) → both files, first two lines
- Section 2 (Language switcher) → both files, line 4
- Section 3 (Screenshot placeholder) → both files
- Section 4 (Features incl. all-tabs) → both files
- Section 5 (Installation, two methods) → both files
- Section 6 (Usage) → both files
- Section 7 (Configuration) → both files
- Section 8 (Chrome permissions table) → both files
- Section 9 (Tech stack) → both files
- Section 10 (Project structure, updated) → both files
- Section 11 (Development) → both files
- Section 12 (Testing) → both files
- Section 13 (Contributing) → both files
- Section 14 (License) → both files
- Fixes (all-tabs added, project structure corrected, dist install method, real clone URL, permissions section, testing section) → all reflected
- Out-of-scope respected: no screenshots produced, no manifest change, no UI i18n

**2. Placeholder scan** — no TBD/TODO/"add error handling"/"similar to Task N". The only `<!-- screenshot -->` comment is intentional per the spec. All file paths are concrete. All commands have expected outputs.

**3. Type consistency** — N/A (markdown only, no types/signatures). File names `README.md` and `README.zh-CN.md` are used consistently across all tasks.

No issues found. Plan is complete.
