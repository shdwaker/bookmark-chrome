# MarkTrace

一个 Chrome 扩展，在新标签页中集书签管理、浏览历史、AI 翻译、朗读、全部页签总览与 OneTab 页签整理于一体，替换 Chrome 默认新标签页，打造高效的浏览工作区。

[English](README.md) | 简体中文

<!-- screenshot: 在此处放置 gif/png 截图 -->

## 功能特性

### 书签管理
- **Chrome 书签实时同步** - 通过 Chrome 书签 API 读写书签
- **可折叠文件夹树** - 大型书签树也能轻松折叠导航
- **自定义标签系统** - 为任意书签添加标签，按标签筛选
- **书签搜索** - 按标题、URL 或标签搜索
- **可配置分页** - 每页显示 10 / 20 / 50 / 100 条
- **文件夹收藏** - 收藏常用文件夹，快速访问

### 浏览历史
- **按站点 / 按 URL 记录** - 在 IndexedDB 中记录访问历史
- **可配置保留天数** - 保留 1 / 3 / 7 / 14 / 30 天
- **排除域名** - 指定域名的访问永不记录

### 全部页签总览 & OneTab
- **全部页签面板**（默认视图）- 按域名分组查看、去重、导出当前所有打开的页签
- **OneTab 整理** - 一键将符合条件（开启超过可配置天数，默认 7 天）的页签整理为可恢复列表并关闭，释放内存
  - 全部页签头部提供全局按钮，每个域名卡片也提供单独按钮
  - 独立的 OneTab 页面用于浏览、恢复、删除已保存记录

### AI 翻译
- **三种翻译模式**，通过右键菜单或选中文本弹出按钮触发：
  - **弹框翻译** - 在浮动 Shadow DOM 面板中翻译选中文本或整页内容
  - **内联翻译** - 逐段翻译页面内容，在每个块元素下方插入译文；超过 100 段时显示"继续翻译"按钮
  - **沉浸式翻译** - 基于克隆的双语显示，支持三种切换模式：双语（原文+译文）、仅译文、仅原文；支持暂停/继续、动态内容监听（MutationObserver 适配 SPA）、IndexedDB 翻译缓存
- **增量渲染** - 长文本按句号边界拆分为约 500 字符的片段，逐段翻译并即时渲染；每段翻译完成即显示，无需等待全部完成
- **数学公式保护** - 跳过 KaTeX、MathJax、MathML 容器；检测 Unicode 数学符号（𝐳、z₁、x²、∑、∫、√）、LaTeX 命令和函数符号（softmax、sqrt），公式不被翻译
- **多服务商支持** - 阿里千问、火山豆包、智谱 GLM、月之暗面 Kimi；支持 OpenAI 和 Anthropic Messages 两种 API 格式
- **自定义服务商配置** - 可覆盖 baseURL、模型、目标语言
- **朗读（TTS）** - 朗读原文或译文，支持 0.6× 慢速模式，便于语言学习

### 新标签页集成
- 替换 Chrome 默认新标签页
- 带农历日期的时钟显示

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

- **打开新标签页** - 默认显示全部页签总览，按域名分组展示当前所有打开的页签。
- **书签** - 在顶部导航切换到书签视图，左侧文件夹树浏览，点击文件夹查看其中书签。
- **搜索** - 搜索框匹配标题、URL、标签。
- **标签** - 通过书签编辑弹窗添加或修改标签，在工具栏按标签筛选。
- **收藏文件夹** - 收藏常用文件夹以便快速访问。
- **浏览历史** - 打开浏览历史弹窗查看按站点和按 URL 的访问历史。
- **OneTab** - 在全部页签面板中点击 OneTab 按钮（全局或单卡片）将符合条件的页签整理为可恢复列表；打开 OneTab 页面浏览、恢复或删除已保存记录。
- **AI 翻译** - 在任意页面右键点击"AI翻译"，子菜单包括：翻译整个页面、内联翻译页面、沉浸式翻译、翻译选中文字、朗读；也可选中文本触发浮动按钮。点击顶部导航的 AI 翻译按钮可打开翻译弹窗。
- **翻译模式** - 弹框（浮动面板）、内联（逐段注入）、沉浸式（克隆双语+模式切换），三种模式均支持长文本增量渲染。
- **朗读** - 在翻译面板使用扬声器按钮朗读文本，可切换 0.6× 慢速模式辅助语言学习。
- **设置** - 点击齿轮图标进入设置页。

## 配置选项

在设置页（齿轮图标）可配置：

- **访问记录追踪** - 启用 / 禁用访问记录
- **记录保留天数** - 保留 1 / 3 / 7 / 14 / 30 天
- **每页书签数** - 10 / 20 / 50 / 100
- **默认根文件夹** - 启动时显示的文件夹
- **排除域名** - 这些域名的访问永不记录
- **OneTab** - 页签整理的年龄阈值（天数），默认 7
- **AI 翻译** - 服务商、API Key、模型、baseURL 覆盖、目标语言
- **时钟显示** - 开关与格式选项

## Chrome 权限说明

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读写 Chrome 书签 |
| `storage`   | 持久化设置、收藏文件夹、OneTab 记录 |
| `tabs`      | 列出打开的页签、OneTab 关闭页签、监听访问追踪 |
| `alarms`    | 定时清理过期访问记录 |
| `contextMenus` | 右键"AI翻译"子菜单（翻译页面、内联、沉浸式、选中文字、朗读） |
| `history`   | 已在 manifest 声明，代码尚未使用（预留） |

`host_permissions` 为翻译服务商端点（千问、豆包、GLM、Kimi）声明，以便扩展能直接调用翻译 API。

## 技术栈

- [Vue 3](https://vuejs.org/) + Composition API
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Pinia](https://pinia.vuejs.org/) 状态管理
- Chrome 扩展 **Manifest V3**
- **IndexedDB** 存储访问记录与 OneTab 数据
- **Web Speech API** 文本朗读
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
│   ├── content/
│   │   ├── translate-panel.js     # 弹框/整页翻译面板 + 消息路由
│   │   ├── inline-translate.js    # 内联逐段翻译
│   │   └── immersive-translate.js # 沉浸式双语翻译编排器
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
│   │   │       ├── OneTabPage.vue
│   │   │       ├── TranslateModal.vue
│   │   │       ├── ConfirmModal.vue
│   │   │       └── TopNav.vue
│   │   └── settings/              # 设置页
│   │       ├── App.vue
│   │       ├── main.js
│   │       └── styles.css
│   ├── stores/
│   │   ├── bookmarks.js           # Pinia：书签状态
│   │   ├── settings.js            # Pinia：设置状态
│   │   └── translate.js           # Pinia：翻译状态（增量渲染）
│   └── utils/
│       ├── bookmark-api.js        # Chrome 书签 API 封装
│       ├── storage.js              # 设置存储工具
│       ├── tag-manager.js         # 标签 CRUD
│       ├── trace-manager.js       # IndexedDB 访问追踪 + 共享 DB
│       ├── tabs-manager.js        # 页签工具（全部页签、域名分组）
│       ├── onetab-manager.js      # OneTab 筛选、视图构建、CRUD
│       ├── lunar.js               # 农历日期转换（时钟显示）
│       └── translate/
│           ├── providers.js       # 翻译服务商注册表
│           ├── prompt.js          # 翻译提示词模板
│           ├── transport.js       # 服务商无关的传输层
│           ├── translate-api.js   # 翻译 API 调用 + JSON 提取
│           ├── chunk.js           # 文本分块（增量渲染）
│           ├── inline.js          # 内联翻译工具（并发池、段落收集）
│           └── immersive/         # 沉浸式翻译工具集
│               ├── paragraph-detector.js  # DOM 树遍历段落检测
│               ├── cache.js               # IndexedDB 翻译缓存
│               ├── dom-injector.js        # 克隆/注入/模式切换/清理
│               ├── language-detect.js     # 拉丁/中日韩/数学检测
│               └── site-rules.js          # 站点专属容器选择器
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

使用 [Vitest](https://vitest.dev/) 编写，位于 `src/utils/**/*.test.js`：

```bash
npm test
```

## 贡献

欢迎在 [shdwaker/bookmark-chrome](https://github.com/shdwaker/bookmark-chrome) 提交 Issue 和 Pull Request。

## 许可证

[MIT](LICENSE)
