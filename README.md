# 书签管理器 - Chrome Extension

一个功能强大的 Chrome 书签管理插件，支持书签同步、标签管理、访问记录追踪等功能。

## 功能特性

- **书签同步与管理** - 与 Chrome 浏览器书签实时同步
- **文件夹树形展示** - 可折叠的文件夹树结构导航
- **书签标签系统** - 为书签添加自定义标签，支持标签过滤
- **书签搜索** - 搜索书签标题、URL 和标签
- **分页显示** - 可配置每页显示数量
- **文件夹收藏** - 收藏常用文件夹，快速访问
- **访问记录追踪** - 记录浏览历史，支持网站留痕和网址留痕
- **新标签页集成** - 打开新标签页时显示书签管理器

## 技术栈

- Vue 3 + Composition API
- Vite + CRXJS (Chrome Extension 打包)
- Pinia (状态管理)
- Chrome Extension Manifest V3
- IndexedDB (访问记录存储)

## 安装

### 从源码安装

1. 克隆仓库
```bash
git clone https://github.com/your-username/bookmark-chrome.git
cd bookmark-chrome
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 在 Chrome 中加载扩展
   - 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
bookmark-chrome/
├── public/
│   └── icons/                    # 插件图标
├── src/
│   ├── background/
│   │   └── index.js              # Service Worker
│   ├── pages/
│   │   ├── main/                 # 主页面
│   │   │   ├── App.vue
│   │   │   ├── main.js
│   │   │   ├── styles.css
│   │   │   └── components/
│   │   └── settings/             # 设置页面
│   │       ├── App.vue
│   │       └── main.js
│   ├── stores/                   # 状态管理
│   │   ├── bookmarks.js
│   │   ├── traces.js
│   │   └── settings.js
│   └── utils/
│       ├── bookmark-api.js       # Chrome书签API封装
│       ├── storage.js            # 存储工具
│       ├── tag-manager.js        # 标签管理
│       └── trace-manager.js      # 访问记录管理
├── manifest.json                 # Chrome扩展配置
├── vite.config.js
├── package.json
├── LICENSE
└── README.md
```

## 配置选项

在设置页面可配置：

- **访问记录追踪** - 启用/禁用浏览记录追踪
- **记录保留天数** - 1/3/7/14/30 天
- **每页显示书签数量** - 10/20/50/100 个
- **默认选中文件夹** - 打开时默认显示的根文件夹
- **排除域名** - 不记录特定域名的访问

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request。