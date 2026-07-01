# 全部页签 — 集成 tab-out 布局与交互

## 背景

当前 `AllTabsModal.vue` 采用"每条 URL 记录 + 数量徽章 + 可展开明细"的布局。用户反馈样式仍有问题，参考 [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out) 的设计，将每条页面改为独立行（favicon + 标题 + 行内重复徽章 + 操作按钮），并引入卡片级批量操作。

## 目标

- 每条唯一 URL 渲染为一行：favicon、标题、`(Nx)` 重复徽章、关闭按钮。
- 域名卡片新增：**Close all N tabs**、**Close N duplicates**（仅当有重复时）。
- 单卡片内唯一 URL 超过 8 条时折叠，显示 **"+N more"** 展开芯片。
- 采用 tab-out 的暖色纸质视觉风格。
- 行级关闭按钮保留现有"去重该 URL"语义（关闭旧副本，保留最新）。

## 非目标

- 不引入 "Saved for later" 侧栏。
- 不引入彩屑动画、关闭音效。
- 不改动 `buildAllTabsView` 的分组 / 排序 / 统计逻辑与对应单测。
- 不改动书签、留痕、设置、background 等其他模块。

## 数据模型

复用 `buildAllTabsView(tabs)` 返回结构，仅做增量字段补充：

### record 增量字段

| 字段 | 来源 | 用途 |
|------|------|------|
| `faviconUrl` | `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` | 行首图标 |
| `dupeBadge` | `count > 1 ? `${count}x` : ''` | 行内徽章文本 |

`tabs[]`、`count`、`isDuplicate`、`newestTab`、`oldTabIds`、`key`、`title`、`fullUrl` 等保持不变。

### 不变项

- `getNormalizedTabUrl`、`getTabGroupName`、`getDisplayPath`
- `compareRecords`、`compareGroups`
- `queryAllTabs`、`closeTabs`、`focusTab`
- stats 结构（`totalTabs` / `totalRecords` / `duplicateRecords` / `duplicateTabs`）

## 布局结构

```
all-tabs-modal
├── header: "全部页签" + 关闭按钮
├── stats-bar: 统计信息 + [清除重复]   （保留不动）
└── domain-grid (3 列 masonry)
    └── domain-card
        ├── ::before 顶部 3px 强调条（有重复→琥珀色，无→中性灰）
        ├── header: 域名 + "N 页"
        │           [Close all N tabs] [Close N duplicates*]
        │           (* 仅当 hasDuplicates)
        └── record-list
            ├── record-row (×visible, ≤8)
            │   ├── img.favicon
            │   ├── .row-body (click → focusTab)
            │   │   ├── .row-title (2 行省略)
            │   │   └── .row-url  (1 行省略)
            │   ├── .dupe-badge (Nx)         (仅 isDuplicate)
            │   └── button.row-close         (click → dedupeRecord)
            └── "+N more" overflow chip      (uniqueRecords > 8)
                └── 展开后显示剩余 record-row
```

### 顶层批量清除

保留现有 `showBulkConfirm` + `handleBulkClear`，样式改为普通流式定位（移除 sticky）。

## 视觉风格

CSS 变量（scoped 至 `.all-tabs-modal`）：

| 变量 | 值 | 用途 |
|------|----|------|
| `--paper` | `#f8f5f0` | modal 背景 |
| `--ink` | `#1a1613` | 主文字 |
| `--warm-gray` | `#e8e2da` | 边框 / 分隔线 |
| `--muted` | `#9a918a` | 次要文字 |
| `--accent-amber` | `#c8713a` | 重复徽章 / Close duplicates |
| `--accent-sage` | `#5a7a62` | 保留强调 |
| `--status-abandoned` | `#b35a5a` | 关闭 / 危险操作 |
| `--card-bg` | `#fffdf9` | 域名卡片背景 |

卡片样式：
- `border-radius: 8px`，`1px solid var(--warm-gray)`
- `::before` 顶部 3px 条：有重复→`--accent-amber`，无→`--warm-gray`
- hover：`box-shadow: 0 4px 20px rgba(26,22,19,0.06)`，`translateY(-1px)`

行样式：
- 全宽行，`border-bottom: 1px solid rgba(154,145,138,0.1)`，最后一行无下边框
- favicon 16px，左侧
- 标题 `font-size: 13px`，`-webkit-line-clamp: 2`
- 行 hover：`background: rgba(200,113,58,0.04)`
- 关闭按钮：默认 `opacity: 0.35`，行/按钮 hover 时 `opacity: 1`，X 图标 15px

overflow chip：
- `font-size: 12px`，`color: var(--muted)`，可点击
- 展开后剩余行以 `display: contents` 形态呈现

## 交互

| Action | 触发 | 行为 |
|--------|------|------|
| `focusTab` | 点击行 body | `runChromeAction(() => focusTab(record.newestTab))` |
| `dedupeRecord` | 点击行关闭按钮 | 仅 `isDuplicate` 启用 → `closeTabs(record.oldTabIds)` → `refreshTabs()` |
| `closeAllInCard` | 卡片 "Close all N tabs" | `closeTabs(group.records.flatMap(r => r.tabs.map(t => t.id)).filter(Boolean))` → 刷新 |
| `closeDuplicatesInCard` | 卡片 "Close N duplicates" | `closeTabs(group.records.filter(r => r.isDuplicate).flatMap(r => r.oldTabIds))` → 刷新 |
| `toggleCardExpansion` | 点击 "+N more" | 切换 `expandedCards` 中 `group.name` |
| `handleBulkClear` | 顶层 "确认清除" | 保留现有逻辑 |

### reactive state 调整

- 新增 `expandedCards: ref(new Set())`
- 移除 `expandedRecords`（不再有 record 级展开）
- 保留 `loading` / `clearing` / `actionError` / `viewData` / `showBulkConfirm`

### computed 调整

- `domainColumns` 不变
- 新增 `visibleRecords(group)` — `expandedCards.has(group.name) ? group.records : group.records.slice(0, 8)`
- 新增 `overflowCount(group)` — `Math.max(0, group.records.length - 8)`

## favicon 处理

- 在 `buildAllTabsView` 的 record 上新增 `faviconUrl`，基于 `newestTab.url` 的 hostname
- `chrome://` / `chrome-extension://` 等无 hostname 的 record，`faviconUrl = ''`，模板中条件渲染
- `<img>` 绑定 `@error="$event.target.style.display = 'none'"`

## 影响范围

| 文件 | 改动 |
|------|------|
| `src/utils/tabs-manager.js` | `buildAllTabsView` record 增量 `faviconUrl` / `dupeBadge` |
| `src/utils/tabs-manager.test.js` | 新增字段断言（不改动现有用例） |
| `src/pages/main/components/AllTabsModal.vue` | template + script + style 全量重写 |

不改动：`background/index.js`、`stores/*`、`storage.js`、其他组件。

## 测试

- `npm run test` — `tabs-manager.test.js` 全绿
- 手动验证：
  - 每条 URL 一行，favicon + 标题 + `(Nx)` 徽章
  - 行关闭按钮去重该 URL（保留最新）
  - 卡片 "Close all" 关闭整卡所有页签
  - 卡片 "Close duplicates" 仅关闭旧副本
  - "+N more" 展开 / 折叠
  - 顶层 "清除重复" 批量清除仍可用
  - 暖色纸质视觉风格正确
