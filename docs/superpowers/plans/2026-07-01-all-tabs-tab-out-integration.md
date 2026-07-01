# All Tabs tab-out Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `AllTabsModal.vue` to adopt tab-out's per-tab row layout (favicon + title + inline dupe badge + close button), card-level batch actions, "+N more" overflow chips, and warm paper visual style — while reusing the existing `buildAllTabsView` data model.

**Architecture:** Incremental field additions to `tabs-manager.js` records (`faviconUrl`, `dupeBadge`), then a full rewrite of `AllTabsModal.vue` (template + script + style). The grouping/sorting/stats logic and its unit tests stay untouched.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, Vitest, Chrome Extensions Manifest V3 (chrome.tabs API).

**Spec:** `docs/superpowers/specs/2026-07-01-all-tabs-tab-out-integration-design.md`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|-------|
| `src/utils/tabs-manager.js` | Tab grouping/view model | Add `getFaviconUrl` helper; add `faviconUrl` + `dupeBadge` fields to records in `buildAllTabsView` |
| `src/utils/tabs-manager.test.js` | Unit tests for tabs-manager | Add test cases asserting new record fields |
| `src/pages/main/components/AllTabsModal.vue` | All-tabs modal UI | Full rewrite: per-tab row layout, card-level actions, overflow chips, warm paper styles |

No other files are touched. No changes to `background/index.js`, `stores/*`, `storage.js`, or other components.

---

### Task 1: Add faviconUrl and dupeBadge to buildAllTabsView records

**Files:**
- Modify: `src/utils/tabs-manager.js`
- Test: `src/utils/tabs-manager.test.js`

- [ ] **Step 1: Write the failing tests**

Add these two test cases inside the `describe('buildAllTabsView', ...)` block in `src/utils/tabs-manager.test.js`, after the existing `'handles tabs with missing URLs without crashing'` test:

```js
  it('adds faviconUrl and dupeBadge to records', () => {
    const view = buildAllTabsView([
      tab({ id: 1, index: 0, title: 'Old issue', url: 'https://github.com/repo/issues?page=1' }),
      tab({ id: 2, index: 1, title: 'New issue', url: 'https://github.com/repo/issues?page=2' }),
      tab({ id: 3, index: 2, title: 'Pulls', url: 'https://github.com/repo/pulls' })
    ], { extensionOrigin })

    const dupeRecord = view.groups[0].records[0]
    expect(dupeRecord.faviconUrl).toBe('https://www.google.com/s2/favicons?domain=github.com&sz=16')
    expect(dupeRecord.dupeBadge).toBe('2x')

    const singleRecord = view.groups[0].records[1]
    expect(singleRecord.faviconUrl).toBe('https://www.google.com/s2/favicons?domain=github.com&sz=16')
    expect(singleRecord.dupeBadge).toBe('')
  })

  it('returns empty faviconUrl for urls without a parseable hostname', () => {
    const view = buildAllTabsView([
      tab({ id: 1, index: 0, title: 'Chrome', url: 'chrome://extensions' })
    ], { extensionOrigin })

    expect(view.groups[0].records[0].faviconUrl).toBe('')
    expect(view.groups[0].records[0].dupeBadge).toBe('')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `faviconUrl` and `dupeBadge` are `undefined` on records.

- [ ] **Step 3: Add the getFaviconUrl helper**

Add this function to `src/utils/tabs-manager.js`, immediately after the existing `getDisplayPath` function (after line 40):

```js
function getFaviconUrl(url) {
  if (!url) return ''
  try {
    const hostname = new URL(url).hostname
    return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` : ''
  } catch {
    return ''
  }
}
```

- [ ] **Step 4: Add faviconUrl and dupeBadge to the record return object**

In `src/utils/tabs-manager.js`, inside `buildAllTabsView`, find the record return block (around line 105) that currently reads:

```js
      return {
        ...record,
        title: newestTab.title || record.title,
        fullUrl: newestTab.url || record.fullUrl,
        count: detailTabs.length,
        isDuplicate: detailTabs.length > 1,
        newestTab,
        newestOrder: newestTab.order,
        oldTabIds: detailTabs.slice(1).map(item => item.id).filter(Boolean),
        tabs: detailTabs
      }
```

Replace it with:

```js
      return {
        ...record,
        title: newestTab.title || record.title,
        fullUrl: newestTab.url || record.fullUrl,
        faviconUrl: getFaviconUrl(newestTab.url),
        dupeBadge: detailTabs.length > 1 ? `${detailTabs.length}x` : '',
        count: detailTabs.length,
        isDuplicate: detailTabs.length > 1,
        newestTab,
        newestOrder: newestTab.order,
        oldTabIds: detailTabs.slice(1).map(item => item.id).filter(Boolean),
        tabs: detailTabs
      }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all tests including the two new ones pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/tabs-manager.js src/utils/tabs-manager.test.js
git commit -m "Add faviconUrl and dupeBadge fields to all-tabs records"
```

---

### Task 2: Rewrite AllTabsModal.vue

This is a full file rewrite. The template, script, and style are interdependent (template references script functions/state; style classes match template), so they are replaced together in one step to avoid a broken intermediate state.

**Files:**
- Modify: `src/pages/main/components/AllTabsModal.vue`

- [ ] **Step 1: Read the current file to satisfy the Edit tool's read requirement**

Read `src/pages/main/components/AllTabsModal.vue` in full (it is ~536 lines). This was already done during planning but the Write tool requires a prior Read in the implementing session.

- [ ] **Step 2: Replace the entire file with the new implementation**

Overwrite `src/pages/main/components/AllTabsModal.vue` with:

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content all-tabs-modal">
      <div class="modal-header">
        <h3>全部页签</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div v-if="loading" class="empty-state">
        <p>正在加载页签...</p>
      </div>

      <div v-else-if="viewData?.stats?.totalTabs === 0" class="empty-state">
        <p>当前没有可显示的页签</p>
      </div>

      <div v-else class="content-wrapper">
        <div class="all-tabs-header">
          <div class="stats-info">
            <span class="stat-item">
              全部页签: <strong>{{ viewData.stats.totalTabs }}</strong>
            </span>
            <span class="stat-item">
              不同页面: <strong>{{ viewData.stats.totalRecords }}</strong>
            </span>
            <span class="stat-item" v-if="viewData.stats.duplicateRecords > 0">
              重复页签: <strong class="duplicate-count">{{ viewData.stats.duplicateRecords }}</strong>
            </span>
          </div>
          <button
            class="btn btn-primary clear-duplicates-btn"
            :disabled="viewData.stats.duplicateRecords === 0 || clearing"
            @click="showBulkConfirm = true"
          >
            清除重复
          </button>
        </div>

        <div v-if="actionError" class="action-error">
          {{ actionError }}
        </div>

        <div v-if="viewData.stats.duplicateRecords === 0" class="no-duplicates-hint">
          暂无重复页签
        </div>

        <div class="domain-grid">
          <div v-for="(column, columnIndex) in domainColumns" :key="columnIndex" class="domain-column">
            <div
              v-for="group in column"
              :key="group.name"
              class="domain-card"
              :class="{ 'has-dupes': group.hasDuplicates }"
            >
              <div class="domain-card-header">
                <div class="domain-card-title">
                  <span class="domain-name">{{ group.name }}</span>
                  <span class="domain-count">{{ group.tabCount }} 页</span>
                </div>
                <div class="domain-card-actions">
                  <button
                    class="card-action-btn close-all-btn"
                    :disabled="clearing"
                    @click="closeAllInCard(group)"
                  >
                    关闭全部 ({{ group.tabCount }})
                  </button>
                  <button
                    v-if="group.hasDuplicates"
                    class="card-action-btn close-dupes-btn"
                    :disabled="clearing"
                    @click="closeDuplicatesInCard(group)"
                  >
                    清除重复 ({{ duplicateCountInCard(group) }})
                  </button>
                </div>
              </div>

              <div class="record-list">
                <div
                  v-for="record in visibleRecords(group)"
                  :key="record.key"
                  class="record-row"
                  :class="{ 'is-duplicate': record.isDuplicate }"
                >
                  <img
                    v-if="record.faviconUrl"
                    class="row-favicon"
                    :src="record.faviconUrl"
                    alt=""
                    @error="$event.target.style.display = 'none'"
                  >
                  <div class="row-body" @click="handleFocusTab(record.newestTab)">
                    <div class="row-title">{{ record.title }}</div>
                    <div class="row-url">{{ record.fullUrl || record.displayUrl }}</div>
                  </div>
                  <span v-if="record.dupeBadge" class="dupe-badge">{{ record.dupeBadge }}</span>
                  <button
                    class="row-close-btn"
                    :disabled="clearing"
                    :title="record.isDuplicate ? '清除重复页签' : '关闭该页签'"
                    @click.stop="closeRecord(record)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div
                  v-if="overflowCount(group) > 0"
                  class="overflow-chip"
                  @click="toggleCardExpansion(group)"
                >
                  <template v-if="isCardExpanded(group)">收起</template>
                  <template v-else>+{{ overflowCount(group) }} 更多</template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showBulkConfirm" class="bulk-confirm-bar">
        <span class="confirm-message">
          确定清除所有 {{ viewData.stats.duplicateTabs }} 个重复页签？
        </span>
        <button class="btn btn-secondary" @click="showBulkConfirm = false">取消</button>
        <button class="btn btn-danger" :disabled="clearing" @click="handleBulkClear">
          {{ clearing ? '清除中' : '确认清除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { queryAllTabs, buildAllTabsView, focusTab, closeTabs } from '@/utils/tabs-manager'

defineEmits(['close'])

const VISIBLE_LIMIT = 8

const loading = ref(true)
const clearing = ref(false)
const actionError = ref('')
const viewData = ref(null)
const expandedCards = ref(new Set())
const showBulkConfirm = ref(false)

const domainColumns = computed(() => {
  const groups = viewData.value?.groups || []
  const columnCount = 3
  const rowsPerColumn = Math.ceil(groups.length / columnCount)

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const start = columnIndex * rowsPerColumn
    return groups.slice(start, start + rowsPerColumn)
  })
})

function visibleRecords(group) {
  if (isCardExpanded(group)) return group.records
  return group.records.slice(0, VISIBLE_LIMIT)
}

function overflowCount(group) {
  return Math.max(0, group.records.length - VISIBLE_LIMIT)
}

function isCardExpanded(group) {
  return expandedCards.value.has(group.name)
}

function toggleCardExpansion(group) {
  const next = new Set(expandedCards.value)
  if (next.has(group.name)) {
    next.delete(group.name)
  } else {
    next.add(group.name)
  }
  expandedCards.value = next
}

function duplicateCountInCard(group) {
  return group.records
    .filter(r => r.isDuplicate)
    .reduce((sum, r) => sum + r.oldTabIds.length, 0)
}

async function runChromeAction(fn) {
  actionError.value = ''
  try {
    await fn()
    return true
  } catch (err) {
    console.warn('Chrome action failed:', err)
    actionError.value = err?.message || '操作失败，请重新加载插件后再试'
    return false
  }
}

async function refreshTabs() {
  loading.value = true
  try {
    const tabs = await queryAllTabs()
    viewData.value = buildAllTabsView(tabs)
    const validNames = new Set(viewData.value.groups.map(g => g.name))
    expandedCards.value = new Set(
      [...expandedCards.value].filter(name => validNames.has(name))
    )
  } finally {
    loading.value = false
  }
}

function handleFocusTab(tab) {
  runChromeAction(() => focusTab(tab))
}

async function closeRecord(record) {
  if (clearing.value) return
  const ids = record.isDuplicate
    ? record.oldTabIds
    : [record.newestTab?.id].filter(Boolean)
  if (!ids.length) {
    actionError.value = '没有可关闭的页签'
    await refreshTabs()
    return
  }

  clearing.value = true
  try {
    const success = await runChromeAction(() => closeTabs(ids))
    if (success) {
      await refreshTabs()
    }
  } finally {
    clearing.value = false
  }
}

async function closeAllInCard(group) {
  if (clearing.value) return
  const ids = group.records
    .flatMap(r => r.tabs.map(t => t.id))
    .filter(Boolean)
  if (!ids.length) {
    actionError.value = '没有可关闭的页签'
    await refreshTabs()
    return
  }

  clearing.value = true
  try {
    const success = await runChromeAction(() => closeTabs(ids))
    if (success) {
      await refreshTabs()
    }
  } finally {
    clearing.value = false
  }
}

async function closeDuplicatesInCard(group) {
  if (clearing.value) return
  const ids = group.records
    .filter(r => r.isDuplicate)
    .flatMap(r => r.oldTabIds)
  if (!ids.length) {
    actionError.value = '没有可清除的重复页签'
    await refreshTabs()
    return
  }

  clearing.value = true
  try {
    const success = await runChromeAction(() => closeTabs(ids))
    if (success) {
      await refreshTabs()
    }
  } finally {
    clearing.value = false
  }
}

async function handleBulkClear() {
  if (clearing.value) return
  const allOldTabIds = viewData.value.groups.flatMap(group =>
    group.records.filter(r => r.isDuplicate).flatMap(r => r.oldTabIds)
  )
  if (!allOldTabIds.length) {
    actionError.value = '没有可清除的旧页签'
    await refreshTabs()
    return
  }

  clearing.value = true
  try {
    const success = await runChromeAction(() => closeTabs(allOldTabIds))
    if (success) {
      showBulkConfirm.value = false
      await refreshTabs()
    }
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  refreshTabs()
})
</script>

<style scoped>
.all-tabs-modal {
  --paper: #f8f5f0;
  --ink: #1a1613;
  --warm-gray: #e8e2da;
  --muted: #9a918a;
  --accent-amber: #c8713a;
  --accent-sage: #5a7a62;
  --status-abandoned: #b35a5a;
  --card-bg: #fffdf9;
  --shadow: rgba(26, 22, 19, 0.06);

  width: 90%;
  max-width: 1000px;
  height: min(85vh, calc(100vh - 48px));
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--paper);
}

.all-tabs-modal :deep(.modal-header) {
  flex: 0 0 auto;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* ---- Top stats bar ---- */
.all-tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--warm-gray);
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

.stats-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--muted);
}

.stat-item strong {
  color: var(--ink);
  font-weight: 600;
}

.duplicate-count {
  color: var(--accent-amber) !important;
}

.clear-duplicates-btn {
  padding: 8px 16px;
  font-size: 13px;
}

.clear-duplicates-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Error / hint states ---- */
.action-error {
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: rgba(179, 90, 90, 0.08);
  border: 1px solid rgba(179, 90, 90, 0.15);
  color: var(--status-abandoned);
  font-size: 13px;
  flex-shrink: 0;
}

.no-duplicates-hint {
  text-align: center;
  padding: 24px;
  color: var(--muted);
  font-size: 14px;
  font-style: italic;
  flex-shrink: 0;
}

/* ---- Domain grid (3-column masonry) ---- */
.domain-grid {
  display: flex;
  gap: 16px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  padding-right: 4px;
  overscroll-behavior: contain;
}

@media (max-width: 900px) {
  .domain-grid { gap: 14px; }
}

@media (max-width: 600px) {
  .domain-grid { gap: 12px; }
}

.domain-column {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

/* ---- Domain card ---- */
.domain-card {
  background: var(--card-bg);
  border: 1px solid var(--warm-gray);
  border-radius: 8px;
  overflow: hidden;
  min-width: 0;
  position: relative;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.domain-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--warm-gray);
}

.domain-card.has-dupes::before {
  background: var(--accent-amber);
}

.domain-card:hover {
  box-shadow: 0 4px 20px var(--shadow);
  transform: translateY(-1px);
}

.domain-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(232, 226, 218, 0.3);
  border-bottom: 1px solid var(--warm-gray);
  gap: 8px;
  flex-wrap: wrap;
}

.domain-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.domain-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.domain-count {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

.domain-card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.card-action-btn {
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--warm-gray);
  background: var(--card-bg);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.card-action-btn:hover:not(:disabled) {
  border-color: var(--ink);
  color: var(--ink);
}

.card-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-dupes-btn {
  border-color: rgba(200, 113, 58, 0.3);
  color: var(--accent-amber);
  background: rgba(200, 113, 58, 0.04);
}

.close-dupes-btn:hover:not(:disabled) {
  background: rgba(200, 113, 58, 0.1);
  border-color: var(--accent-amber);
}

/* ---- Record list ---- */
.record-list {
  padding: 6px 10px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
}

/* ---- Record row (one per unique URL) ---- */
.record-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(154, 145, 138, 0.1);
  line-height: 1.4;
  transition: background 0.15s ease;
}

.record-row:last-child {
  border-bottom: none;
}

.record-row:hover {
  background: rgba(200, 113, 58, 0.04);
}

.row-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 2px;
}

.row-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.row-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-url {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- Duplicate badge ---- */
.dupe-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-amber);
  background: rgba(200, 113, 58, 0.08);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ---- Row close button ---- */
.row-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.35;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.record-row:hover .row-close-btn {
  opacity: 1;
}

.row-close-btn:hover:not(:disabled) {
  opacity: 1;
  background: rgba(179, 90, 90, 0.08);
  color: var(--status-abandoned);
}

.row-close-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ---- Overflow chip ("+N more" / "收起") ---- */
.overflow-chip {
  font-size: 12px;
  color: var(--muted);
  padding: 6px 4px;
  cursor: pointer;
  text-align: center;
  transition: color 0.15s;
}

.overflow-chip:hover {
  color: var(--ink);
}

/* ---- Bulk confirm bar ---- */
.bulk-confirm-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--warm-gray);
  flex-shrink: 0;
}

.confirm-message {
  flex: 1;
  font-size: 14px;
  color: var(--muted);
}

.btn-danger {
  background: var(--status-abandoned);
  color: white;
}

.btn-danger:hover {
  background: #9a4848;
}
</style>
```

- [ ] **Step 3: Run the build to verify compilation**

Run: `npm run build`
Expected: Build completes without errors. If it fails, check for import path or template syntax issues.

- [ ] **Step 4: Run the tests to verify tabs-manager still passes**

Run: `npm run test`
Expected: All tests pass (including the two added in Task 1).

- [ ] **Step 5: Commit**

```bash
git add src/pages/main/components/AllTabsModal.vue
git commit -m "Rewrite all-tabs modal with tab-out row layout and styles"
```

---

### Task 3: Manual verification

**Files:** None (verification only)

- [ ] **Step 1: Load the extension in Chrome**

1. Run `npm run build` (if not already built).
2. Open `chrome://extensions/`.
3. Enable Developer mode (top-right toggle).
4. Click "Load unpacked" and select the `dist/` directory.
5. If already loaded, click the reload icon on the extension card.

- [ ] **Step 2: Open the all-tabs modal**

1. Open several browser tabs across different domains (e.g., 3 GitHub tabs, 2 YouTube tabs, 2 duplicate Google Docs tabs with the same URL but different query params).
2. Open a new tab (the extension's new-tab page).
3. Click the "全部页签" entry in the top navigation.

- [ ] **Step 3: Verify layout**

Confirm each of these:
- Each unique URL is a single row with favicon (left), title (2-line clamp), and URL.
- Duplicate URLs show an inline `(Nx)` amber badge next to the title.
- Domain cards have a 3px top accent bar — amber when the card has duplicates, gray otherwise.
- Each domain card header shows the domain name, tab count, "关闭全部 (N)" button, and (if dupes exist) "清除重复 (N)" button.
- Warm paper color scheme: cream background, warm-gray borders, muted text.

- [ ] **Step 4: Verify row close button**

1. Click the X on a **duplicate** row → the old tabs close, the newest stays, the row's `(Nx)` badge disappears.
2. Click the X on a **non-duplicate** row → that single tab closes, the row disappears from the card.
3. If the card becomes empty after closing, it should disappear or show an empty state.

- [ ] **Step 5: Verify card-level actions**

1. Click "关闭全部 (N)" on a card → all tabs in that card close, the card disappears.
2. On a card with duplicates, click "清除重复 (N)" → only old duplicate tabs close, newest copies remain.

- [ ] **Step 6: Verify overflow chip**

1. Open a domain with more than 8 unique URLs (e.g., 10 different GitHub pages).
2. Confirm the card shows 8 rows + a "+2 更多" chip.
3. Click "+2 更多" → the remaining 2 rows appear inline, chip text changes to "收起".
4. Click "收起" → back to 8 rows.

- [ ] **Step 7: Verify top-level bulk clear**

1. With duplicates present, click "清除重复" (top-right).
2. Confirm the confirm bar appears with the correct count.
3. Click "确认清除" → all duplicate tabs across all cards close.
4. Confirm "取消" dismisses the bar without action.

- [ ] **Step 8: Commit any fixes (if needed)**

If manual testing revealed bugs, fix them and commit:
```bash
git add -A
git commit -m "Fix all-tabs modal issues found during testing"
```

If no fixes needed, this task is complete with no commit.
