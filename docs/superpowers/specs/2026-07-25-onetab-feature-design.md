# OneTab 功能 - 一键整合页签释放内存

## 背景

当浏览器页签开太多时，内存占用过高导致卡顿。参考 [OneTab 扩展](https://www.one-tab.com/) 的实现，在 MarkTrace 中增加 OneTab 功能：一键将符合条件的页签整合为列表页面并关闭原页签以释放内存，用户可随时恢复单个或全部页签。

## 目标

- **全局 OneTab 按钮**：放在 AllTabsModal 头部"清除重复"按钮前。点击后按天数阈值筛选页签（默认 7 天未访问），保存到 OneTab 列表并关闭原页签。
- **卡片级 OneTab 按钮**：每个域名分类卡片增加 OneTab 按钮，将该卡片内全部页签（不应用天数阈值）整合到 OneTab 列表并关闭。
- **OneTab 页面**：TopNav 在"全部页签"后新增 OneTab 入口，点击切换到 OneTab 页面。页面布局与 AllTabs 一致（域名分类卡片），交互为恢复/删除。
- **恢复**：支持恢复单个页签（点击行或"恢复"按钮）和恢复全部（头部"恢复全部"或卡片"恢复全部"）。恢复后从列表移除对应记录。
- **可配置阈值**：设置页新增 OneTab section，可配置天数（1-365，默认 7）。
- **内存释放**：通过关闭页签释放内存，记录持久化到 IndexedDB。

## 非目标

- 不做导入导出（v1 范围外）。
- 不做批量分享（v1 范围外）。
- 不做 undo 机制（恢复即可找回）。
- 不做会话分组（按域名分类已足够）。
- 不做自动过期（OneTab 数据持久保留直到手动处理）。
- 不改动 AllTabsModal 现有的去重/关闭逻辑、tabs-manager 的分组排序、书签/留痕/翻译等模块。
- 不改动 trace-manager 已有的 `traceRecords` store。

## 架构

采用方案 A：独立的 `onetab-manager.js` + 独立的 `OneTabPage.vue`，与 AllTabs 完全解耦。

```
src/
├── utils/
│   ├── onetab-manager.js     # 新增：IndexedDB CRUD
│   ├── tabs-manager.js        # 修改：导出 getFaviconUrl（getTabGroupName 已导出）
│   └── storage.js             # 修改：DEFAULT_SETTINGS 增 onetab 字段
├── pages/
│   ├── main/
│   │   ├── App.vue            # 修改：新增 onetab view 分支与 emit 处理
│   │   └── components/
│   │       ├── TopNav.vue     # 修改：新增 OneTab 按钮 + open-onetab emit
│   │       ├── AllTabsModal.vue  # 修改：头部 + 卡片级 OneTab 按钮
│   │       └── OneTabPage.vue # 新增：OneTab 页面
│   └── settings/
│       ├── App.vue            # 修改：新增 OneTab section
│       └── styles.css         # 修改：number input 样式（若需）
└── utils/storage.test.js      # 修改：补 normalizeSettings onetab 合并测试
```

## 数据模型

### 存储层：onetab-manager.js

复用 `BookmarkManagerDB`，版本升至 2，新增 `onetabRecords` store。`trace-manager.js` 的 `initDB` 需同步升级 onupgradeneeded 以创建新 store。

**记录结构**：
```js
{
  id,          // autoIncrement，主键
  url,         // 完整 URL（string）
  title,       // 页签标题（string）
  faviconUrl,  // favicon URL（string，可能为空）
  domain,      // 由 getTabGroupName 计算，用于分类展示（string）
  savedAt      // Date.now()，用于排序（number）
}
```

**索引**：`domain`（非唯一）、`savedAt`（非唯一）。

**API**：
| 函数 | 入参 | 返回 | 用途 |
|------|------|------|------|
| `addOnetabRecords(tabs)` | Tab[] | Promise\<number\> | 批量写入，返回条数 |
| `getOnetabRecords()` | 无 | Promise\<Record[]\> | 全部记录，按 savedAt 降序 |
| `removeOnetabRecord(id)` | number | Promise\<void\> | 单条删除 |
| `removeOnetabRecords(ids)` | number[] | Promise\<void\> | 批量删除（恢复卡片全部） |
| `clearAllOnetabRecords()` | 无 | Promise\<void\> | 全部清空 |

`addOnetabRecords` 入参的 Tab 对象映射逻辑：
```js
tabs.map(t => ({
  url: t.url,
  title: t.title || t.url || '未命名页面',
  faviconUrl: getFaviconUrl(t.url),  // 复用 tabs-manager 内部函数
  domain: getTabGroupName(t.url),
  savedAt: Date.now()
}))
```

### 视图层：buildOnetabView(records)

`OneTabPage.vue` 内部 computed，仿 `buildAllTabsView` 但简化（不处理重复页签）：
- 按 `domain` 分组
- 每组按 `savedAt` 降序排列记录
- 组间排序：最新 savedAt 优先，其次记录数，最后 domain 名字典序
- 返回 `{ stats: { totalRecords, totalDomains }, groups: [{ name, recordCount, records }] }`

## 设置项

### DEFAULT_SETTINGS 增量（storage.js）

```js
onetab: {
  tabAgeDays: 7
}
```

### normalizeSettings 增量

```js
result.onetab = { ...defaults.onetab, ...(settings?.onetab || {}) }
```

### 设置页 UI（settings/App.vue）

在"访问记录追踪"与"书签显示"之间新增 section：
- section id: `onetab`，label: `OneTab`
- 设置项：页签整合阈值（天），number input，min=1 max=365，`v-model.number="settings.onetab.tabAgeDays"`

## UI 集成

### TopNav.vue

在"全部页签"按钮后新增：
```html
<button :class="['nav-action-btn', { active: activeView === 'onetab' }]"
        @click="$emit('open-onetab')">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
  OneTab
</button>
```
新增 emit: `open-onetab`。

### App.vue

- 新增 import `OneTabPage`
- 新增 emit handler `handleOpenOnetab`：toggle `activeView` 于 `'onetab'` 和 `'bookmarks'` 之间
- 模板新增分支：`<OneTabPage v-if="activeView === 'onetab'" />`

### AllTabsModal.vue 头部

在"清除重复"按钮前插入：
```html
<button class="btn btn-primary onetab-all-btn"
        :disabled="clearing"
        @click="handleOnetabAll">
  OneTab
</button>
```

### AllTabsModal.vue 卡片级

每个 domain-card 的 actions 区，在"关闭全部"前加：
```html
<button class="card-action-btn onetab-card-btn"
        :disabled="clearing"
        @click="onetabCard(group)">
  OneTab 全部 ({{ group.tabCount }})
</button>
```

### OneTabPage.vue 布局

```
onetab-page
├── header: "OneTab" + stats(已保存 N 个 / M 个域名) + [恢复全部] [清空]
└── domain-grid (3 列 masonry，同 AllTabs)
    └── domain-card
        ├── ::before 顶部 3px 强调条
        ├── header: 域名 + "N 个" + [恢复全部]
        └── record-list
            └── record-row
                ├── img.favicon
                ├── .row-body (click -> 恢复并打开)
                │   ├── .row-title
                │   └── .row-url
                └── [删除] 按钮
```

**视觉一致性**：复用 AllTabsModal 的 CSS 变量（`--paper`、`--ink`、`--accent`、`--warm-gray`、`--muted`、`--danger` 等）和卡片/行样式。CSS 约 100 行重复，但不引入共享样式文件以避免增加复杂度。

**空状态**：`totalRecords === 0` 时显示"暂无 OneTab 记录"提示。

## 行为流程

### 全局 OneTab（handleOnetabAll）

1. 读 `settings.onetab.tabAgeDays`（默认 7）
2. `chrome.tabs.query({})` 获取全部页签
3. 过滤 eligible：
   - `tab.lastAccessed < Date.now() - tabAgeDays * 86400000`
   - 排除 `tab.active === true`（不关用户正在看的）
   - 排除 `chrome://`、`chrome-extension://`、`about:` 协议
4. **先存后关**：`await addOnetabRecords(eligible)` 成功后再 `closeTabs(ids)`
5. 存失败：不关页签，`actionError` 提示
6. 关失败：记录已存，`console.warn` 并提示用户手动关闭
7. eligible 为空：`actionError` 提示"没有超过 N 天的页签"
8. 刷新 AllTabs 视图

### 卡片级 OneTab（onetabCard）

1. 收集 `group.records.flatMap(r => r.tabs)` 的全部 tab
2. **不应用天数阈值**（卡片内全部）
3. 先存后关，错误处理同全局
4. 刷新

### 恢复单个（restoreRecord）

1. `chrome.tabs.create({ url: record.url, active: false })`（后台打开）
2. 成功后 `removeOnetabRecord(record.id)`
3. 失败（如非法 URL）：`actionError` 提示，不删除记录
4. 刷新 OneTab 页面

### 恢复全部 / 恢复卡片全部

1. 批量 `chrome.tabs.create`（逐个，MV3 无批量 API）
2. 全部成功后 `clearAllOnetabRecords()` 或 `removeOnetabRecords(ids)`
3. 部分失败：保留失败记录，`actionError` 列出失败数
4. 刷新

### 删除单个 / 清空全部

- 删除单个：`removeOnetabRecord(id)`，不打开页签
- 清空全部：`clearAllOnetabRecords()`，需二次确认（复用 `ConfirmModal`）

### 排除规则汇总

| 场景 | 排除 |
|------|------|
| 全局 OneTab | 当前激活页签 + 特殊协议页 + 未超阈值的页签 |
| 卡片 OneTab | 无排除（卡片内全部） |
| 恢复 | 无排除 |

## 错误处理

- 所有 chrome.* 调用包在 `runChromeAction` 风格的 try/catch 中（仿 AllTabsModal 现有模式）
- `actionError` ref 用于显示行内错误提示，不阻塞后续操作
- IndexedDB 操作失败时回滚语义：存失败不关页签，关失败不删记录
- 恢复时 `chrome.tabs.create` 失败保留记录，用户可重试

## 测试

### storage.test.js 增量

- `normalizeSettings` 正确合并 `onetab.tabAgeDays`
- `onetab` 字段缺失时回退默认值 `{ tabAgeDays: 7 }`
- `tabAgeDays` 非数字时回退默认值

### 手动测试清单

- 全局 OneTab：阈值 7 天，页签含混合新旧页签，确认只关旧页签并保存
- 全局 OneTab：当前激活页签不被关
- 全局 OneTab：无符合页签时显示提示
- 卡片 OneTab：卡片内全部页签被关并保存
- 恢复单个：页签在后台打开，记录消失
- 恢复全部：所有页签打开，列表清空
- 删除单个：记录消失，页签不打开
- 清空全部：二次确认后清空
- 设置页：修改 tabAgeDays 立即生效（下次全局 OneTab 使用新值）
- 重启浏览器/重载扩展后 OneTab 记录仍在

## 不影响现有功能的保证

- AllTabsModal 现有去重/关闭逻辑不动，仅在 actions 区新增按钮
- `buildAllTabsView` 不动，仅从 tabs-manager 导出 `getFaviconUrl`（`getTabGroupName` 已导出，`getFaviconUrl` 当前为内部函数）
- `trace-manager.js` 的 `initDB` 升级 DB 版本时只新增 store，不动 `traceRecords` 结构
- settings 新增 section 独立于现有 sections
- TopNav/App 的改动仅为增量按钮和 view 分支
