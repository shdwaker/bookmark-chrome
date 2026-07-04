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
