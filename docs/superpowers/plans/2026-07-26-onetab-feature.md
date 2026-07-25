# OneTab Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a OneTab feature that consolidates eligible browser tabs into a restorable list page (releasing memory), with global + per-card OneTab buttons and a dedicated OneTab view.

**Architecture:** Independent `onetab-manager.js` (IndexedDB CRUD + pure helpers) + independent `OneTabPage.vue` (layout mirrors AllTabsModal). Reuses `getTabGroupName`/`getFaviconUrl` from `tabs-manager.js` for categorization. Settings stored in `chrome.storage.local` via existing settings store.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, Vitest, Chrome Extensions MV3, IndexedDB.

**Spec:** `docs/superpowers/specs/2026-07-25-onetab-feature-design.md`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/utils/storage.js` | Default settings + normalize | Add `onetab.tabAgeDays` default + merge |
| `src/utils/storage.test.js` | Settings unit tests | Add onetab merge tests |
| `src/utils/onetab-manager.js` | OneTab IDB CRUD + pure helpers | Create new |
| `src/utils/onetab-manager.test.js` | Pure function tests | Create new |
| `src/utils/tabs-manager.js` | Tab grouping/view model | Export `getFaviconUrl` |
| `src/utils/trace-manager.js` | Trace IDB + DB init | Bump DB_VERSION to 2, add `onetabRecords` store, export `getDB()` |
| `src/pages/main/components/OneTabPage.vue` | OneTab page UI | Create new |
| `src/pages/main/components/TopNav.vue` | Top nav buttons | Add OneTab button + `open-onetab` emit |
| `src/pages/main/App.vue` | View routing | Add `onetab` view branch + handler |
| `src/pages/main/components/AllTabsModal.vue` | All-tabs UI | Add global + per-card OneTab buttons |
| `src/pages/settings/App.vue` | Settings UI | Add OneTab section |

---

### Task 1: Add onetab settings (TDD)

**Files:**
- Modify: `src/utils/storage.js`
- Test: `src/utils/storage.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/storage.test.js`:

```js
describe('DEFAULT_SETTINGS.onetab', () => {
  it('defaults tabAgeDays to 7', () => {
    expect(DEFAULT_SETTINGS.onetab.tabAgeDays).toBe(7)
  })
})

describe('normalizeSettings onetab merge', () => {
  it('preserves saved tabAgeDays', () => {
    const result = normalizeSettings({ onetab: { tabAgeDays: 30 } })
    expect(result.onetab.tabAgeDays).toBe(30)
  })
  it('fills default when onetab block missing', () => {
    const result = normalizeSettings({})
    expect(result.onetab.tabAgeDays).toBe(7)
  })
  it('falls back to default when tabAgeDays is not a positive number', () => {
    const result = normalizeSettings({ onetab: { tabAgeDays: 'bad' } })
    expect(result.onetab.tabAgeDays).toBe(7)
    const result2 = normalizeSettings({ onetab: { tabAgeDays: 0 } })
    expect(result2.onetab.tabAgeDays).toBe(7)
    const result3 = normalizeSettings({ onetab: { tabAgeDays: -5 } })
    expect(result3.onetab.tabAgeDays).toBe(7)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/storage.test.js`
Expected: FAIL - `DEFAULT_SETTINGS.onetab` is undefined.

- [ ] **Step 3: Add onetab to DEFAULT_SETTINGS**

In `src/utils/storage.js`, add `onetab` block to `DEFAULT_SETTINGS` (after `clock`):

```js
  clock: {
    showWeekday: true,
    showLunar: false,
    showSeconds: false,
    showMilliseconds: false
  },
  onetab: {
    tabAgeDays: 7
  }
}
```

- [ ] **Step 4: Add onetab merge to normalizeSettings**

In `src/utils/storage.js` `normalizeSettings()`, add before `return result`:

```js
  const savedTabAgeDays = Number(settings?.onetab?.tabAgeDays)
  result.onetab = {
    tabAgeDays: Number.isFinite(savedTabAgeDays) && savedTabAgeDays > 0 ? savedTabAgeDays : defaults.onetab.tabAgeDays
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/utils/storage.test.js`
Expected: PASS - all onetab tests green.

- [ ] **Step 6: Commit**

```bash
git add src/utils/storage.js src/utils/storage.test.js
git commit -m "Add onetab.tabAgeDays setting with validation"
```

---

### Task 2: Create onetab-manager.js pure helpers (TDD)

**Files:**
- Create: `src/utils/onetab-manager.js`
- Test: `src/utils/onetab-manager.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/onetab-manager.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { filterEligibleTabs, buildOnetabView } from './onetab-manager'

describe('filterEligibleTabs', () => {
  const DAY = 86400000
  const now = 1_700_000_000_000

  it('keeps tabs older than threshold and drops newer ones', () => {
    const tabs = [
      { id: 1, url: 'https://old.com', lastAccessed: now - 10 * DAY, active: false },
      { id: 2, url: 'https://new.com', lastAccessed: now - 1 * DAY, active: false }
    ]
    const eligible = filterEligibleTabs(tabs, 7, now)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].id).toBe(1)
  })

  it('excludes the active tab', () => {
    const tabs = [
      { id: 1, url: 'https://old.com', lastAccessed: now - 10 * DAY, active: true }
    ]
    expect(filterEligibleTabs(tabs, 7, now)).toHaveLength(0)
  })

  it('excludes special protocols', () => {
    const old = now - 10 * DAY
    const tabs = [
      { id: 1, url: 'chrome://settings', lastAccessed: old, active: false },
      { id: 2, url: 'chrome-extension://abc/page.html', lastAccessed: old, active: false },
      { id: 3, url: 'about:blank', lastAccessed: old, active: false },
      { id: 4, url: 'https://example.com', lastAccessed: old, active: false }
    ]
    const eligible = filterEligibleTabs(tabs, 7, now)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].url).toBe('https://example.com')
  })

  it('returns empty for threshold 0 or negative', () => {
    const tabs = [
      { id: 1, url: 'https://a.com', lastAccessed: now - 10 * DAY, active: false }
    ]
    expect(filterEligibleTabs(tabs, 0, now)).toHaveLength(0)
  })
})

describe('buildOnetabView', () => {
  it('groups records by domain and sorts groups by latest savedAt', () => {
    const records = [
      { id: 1, url: 'https://a.com/1', title: 'A1', domain: 'a.com', savedAt: 200 },
      { id: 2, url: 'https://a.com/2', title: 'A2', domain: 'a.com', savedAt: 100 },
      { id: 3, url: 'https://b.com/1', title: 'B1', domain: 'b.com', savedAt: 300 }
    ]
    const view = buildOnetabView(records)
    expect(view.stats.totalRecords).toBe(3)
    expect(view.stats.totalDomains).toBe(2)
    expect(view.groups).toHaveLength(2)
    expect(view.groups[0].name).toBe('b.com')
    expect(view.groups[1].name).toBe('a.com')
    expect(view.groups[1].records[0].id).toBe(1)
    expect(view.groups[1].records[1].id).toBe(2)
  })

  it('returns empty stats and groups for no records', () => {
    const view = buildOnetabView([])
    expect(view.stats.totalRecords).toBe(0)
    expect(view.stats.totalDomains).toBe(0)
    expect(view.groups).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/onetab-manager.test.js`
Expected: FAIL - module `./onetab-manager` not found.

- [ ] **Step 3: Create onetab-manager.js with pure helpers**

Create `src/utils/onetab-manager.js` (no imports yet - the `getDB`, `getTabGroupName`, `getFaviconUrl` imports are added in Task 4 when CRUD functions need them):

```js
// OneTab 管理 - 纯函数 + IndexedDB CRUD

const DAY_MS = 86400000

// 纯函数：筛选符合 OneTab 条件的页签（全局按钮用）
export function filterEligibleTabs(tabs, tabAgeDays, now = Date.now()) {
  if (!Number.isFinite(tabAgeDays) || tabAgeDays <= 0) return []
  const cutoff = now - tabAgeDays * DAY_MS
  return tabs.filter(tab => {
    if (!tab || tab.active) return false
    if (!tab.url) return false
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:')) return false
    if (!tab.lastAccessed || tab.lastAccessed > cutoff) return false
    return true
  })
}

// 纯函数：按域名分组构建 OneTab 视图
export function buildOnetabView(records) {
  const groupMap = new Map()
  for (const record of records || []) {
    const name = record.domain || '其他页面'
    if (!groupMap.has(name)) {
      groupMap.set(name, { name, records: [], latestSavedAt: -1 })
    }
    const group = groupMap.get(name)
    group.records.push(record)
    if (record.savedAt > group.latestSavedAt) group.latestSavedAt = record.savedAt
  }

  const groups = Array.from(groupMap.values()).map(g => ({
    name: g.name,
    recordCount: g.records.length,
    latestSavedAt: g.latestSavedAt,
    records: g.records.sort((a, b) => b.savedAt - a.savedAt)
  })).sort((a, b) => {
    if (a.latestSavedAt !== b.latestSavedAt) return b.latestSavedAt - a.latestSavedAt
    if (a.recordCount !== b.recordCount) return b.recordCount - a.recordCount
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  return {
    stats: {
      totalRecords: (records || []).length,
      totalDomains: groups.length
    },
    groups
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/onetab-manager.test.js`
Expected: PASS - all filterEligibleTabs and buildOnetabView tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/onetab-manager.js src/utils/onetab-manager.test.js
git commit -m "Add onetab-manager pure helpers (filterEligibleTabs, buildOnetabView)"
```

---

### Task 3: Bump DB version and export getDB

**Files:**
- Modify: `src/utils/trace-manager.js`

- [ ] **Step 1: Bump DB_VERSION and add onetabRecords store**

In `src/utils/trace-manager.js`:

Change `const DB_VERSION = 1` to `const DB_VERSION = 2`.

Add `const ONETAB_STORE = 'onetabRecords'` near the top (after `const STORE_NAME = 'traceRecords'`).

In the `onupgradeneeded` handler, after the existing `if (!database.objectStoreNames.contains(STORE_NAME))` block, add:

```js
      if (!database.objectStoreNames.contains(ONETAB_STORE)) {
        const onetabStore = database.createObjectStore(ONETAB_STORE, { keyPath: 'id', autoIncrement: true })
        onetabStore.createIndex('domain', 'domain', { unique: false })
        onetabStore.createIndex('savedAt', 'savedAt', { unique: false })
      }
```

- [ ] **Step 2: Export getDB for onetab-manager to reuse**

At the end of `src/utils/trace-manager.js` (after `initDB`), add:

```js
export async function getDB() {
  if (!db) await initDB()
  return db
}
```

- [ ] **Step 3: Verify no syntax errors**

Run: `node -e "import('./src/utils/trace-manager.js').then(() => console.log('ok')).catch(e => { console.error(e); process.exit(1) })"`
Expected: prints `ok` (or a chrome-related error is fine, as long as no syntax error).

- [ ] **Step 4: Commit**

```bash
git add src/utils/trace-manager.js
git commit -m "Bump DB to v2, add onetabRecords store, export getDB"
```

---

### Task 4: Add CRUD to onetab-manager + export getFaviconUrl

**Files:**
- Modify: `src/utils/onetab-manager.js`
- Modify: `src/utils/tabs-manager.js`

- [ ] **Step 1: Export getFaviconUrl from tabs-manager**

In `src/utils/tabs-manager.js`, change line 42 from:

```js
function getFaviconUrl(url) {
```

to:

```js
export function getFaviconUrl(url) {
```

- [ ] **Step 2: Add imports and CRUD to onetab-manager.js**

At the top of `src/utils/onetab-manager.js`, add the imports:

```js
import { getDB } from './trace-manager'
import { getTabGroupName, getFaviconUrl } from './tabs-manager'
```

Append the CRUD functions at the end of `src/utils/onetab-manager.js`:

```js
const ONETAB_STORE = 'onetabRecords'

// 批量写入 OneTab 记录
export async function addOnetabRecords(tabs) {
  const db = await getDB()
  const records = tabs.map(t => ({
    url: t.url,
    title: t.title || t.url || '未命名页面',
    faviconUrl: getFaviconUrl(t.url),
    domain: getTabGroupName(t.url),
    savedAt: Date.now()
  }))
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ONETAB_STORE], 'readwrite')
    const store = tx.objectStore(ONETAB_STORE)
    records.forEach(r => store.add(r))
    tx.oncomplete = () => resolve(records.length)
    tx.onerror = () => reject(tx.error)
  })
}

// 获取全部 OneTab 记录（按 savedAt 降序）
export async function getOnetabRecords() {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ONETAB_STORE], 'readonly')
    const store = tx.objectStore(ONETAB_STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      const records = request.result || []
      records.sort((a, b) => b.savedAt - a.savedAt)
      resolve(records)
    }
    request.onerror = () => reject(request.error)
  })
}

// 单条删除
export async function removeOnetabRecord(id) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ONETAB_STORE], 'readwrite')
    const store = tx.objectStore(ONETAB_STORE)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 批量删除
export async function removeOnetabRecords(ids) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ONETAB_STORE], 'readwrite')
    const store = tx.objectStore(ONETAB_STORE)
    ids.forEach(id => store.delete(id))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 清空全部
export async function clearAllOnetabRecords() {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ONETAB_STORE], 'readwrite')
    const store = tx.objectStore(ONETAB_STORE)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
```

- [ ] **Step 3: Run existing tests to confirm pure functions still pass**

Run: `npx vitest run src/utils/onetab-manager.test.js`
Expected: PASS - pure function tests still green (CRUD isn't tested here; IDB needs Chrome runtime).

- [ ] **Step 4: Commit**

```bash
git add src/utils/onetab-manager.js src/utils/tabs-manager.js
git commit -m "Add onetab CRUD functions, export getFaviconUrl"
```

---

### Task 5: Create OneTabPage.vue

**Files:**
- Create: `src/pages/main/components/OneTabPage.vue`

- [ ] **Step 1: Create the component**

Create `src/pages/main/components/OneTabPage.vue`:

```vue
<template>
  <div class="onetab-panel">
    <div class="onetab-panel-header">
      <div class="header-left">
        <h3>OneTab</h3>
        <div v-if="viewData" class="stats-info">
          <span class="stat-item">
            已保存: <strong>{{ viewData.stats.totalRecords }}</strong>
          </span>
          <span class="stat-item">
            域名: <strong>{{ viewData.stats.totalDomains }}</strong>
          </span>
        </div>
      </div>
      <div class="header-right">
        <button
          v-if="viewData && viewData.stats.totalRecords > 0"
          class="btn btn-primary"
          :disabled="restoring"
          @click="handleRestoreAll"
        >
          恢复全部
        </button>
        <button
          v-if="viewData && viewData.stats.totalRecords > 0"
          class="btn btn-danger"
          :disabled="restoring"
          @click="showClearConfirm = true"
        >
          清空
        </button>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <p>正在加载...</p>
    </div>

    <div v-else-if="!viewData || viewData.stats.totalRecords === 0" class="empty-state">
      <p>暂无 OneTab 记录</p>
      <p class="empty-hint">在"全部页签"页面点击 OneTab 按钮可整理页签到此处</p>
    </div>

    <div v-else class="content-wrapper">
      <div v-if="actionError" class="action-error">{{ actionError }}</div>

      <div class="domain-grid">
        <div v-for="(column, columnIndex) in domainColumns" :key="columnIndex" class="domain-column">
          <div v-for="group in column" :key="group.name" class="domain-card">
            <div class="domain-card-header">
              <div class="domain-card-title">
                <span class="domain-name">{{ group.name }}</span>
                <span class="domain-count">{{ group.recordCount }} 个</span>
              </div>
              <div class="domain-card-actions">
                <button
                  class="card-action-btn"
                  :disabled="restoring"
                  @click="handleRestoreCard(group)"
                >
                  恢复全部
                </button>
              </div>
            </div>

            <div class="record-list">
              <div
                v-for="record in group.records"
                :key="record.id"
                class="record-row"
              >
                <img
                  v-if="record.faviconUrl"
                  class="row-favicon"
                  :src="record.faviconUrl"
                  alt=""
                  @error="$event.target.style.display='none'"
                >
                <div class="row-body" @click="handleRestore(record)">
                  <div class="row-title">{{ record.title }}</div>
                  <div class="row-url">{{ record.url }}</div>
                </div>
                <button
                  class="row-delete-btn"
                  :disabled="restoring"
                  title="删除该记录"
                  @click.stop="handleDelete(record)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showClearConfirm" class="bulk-confirm-bar">
      <span class="confirm-message">确定清空全部 OneTab 记录？</span>
      <button class="btn btn-secondary" @click="showClearConfirm = false">取消</button>
      <button class="btn btn-danger" :disabled="restoring" @click="handleClearAll">确认清空</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import {
  getOnetabRecords,
  removeOnetabRecord,
  removeOnetabRecords,
  clearAllOnetabRecords,
  buildOnetabView
} from '@/utils/onetab-manager'

const loading = ref(true)
const restoring = ref(false)
const actionError = ref('')
const records = ref([])
const showClearConfirm = ref(false)

const viewData = computed(() => buildOnetabView(records.value))

const domainColumns = computed(() => {
  const groups = viewData.value?.groups || []
  const columnCount = 3
  const rowsPerColumn = Math.ceil(groups.length / columnCount)
  return Array.from({ length: columnCount }, (_, i) => {
    const start = i * rowsPerColumn
    return groups.slice(start, start + rowsPerColumn)
  })
})

async function runChromeAction(fn) {
  actionError.value = ''
  try {
    await fn()
    return true
  } catch (err) {
    actionError.value = err?.message || '操作失败'
    return false
  }
}

async function refresh() {
  loading.value = true
  try {
    records.value = await getOnetabRecords()
  } catch (err) {
    actionError.value = err?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleRestore(record) {
  if (restoring.value) return
  restoring.value = true
  try {
    const success = await runChromeAction(() => chrome.tabs.create({ url: record.url, active: false }))
    if (success) {
      await removeOnetabRecord(record.id)
      await refresh()
    }
  } finally {
    restoring.value = false
  }
}

async function handleRestoreCard(group) {
  if (restoring.value) return
  restoring.value = true
  try {
    const failed = []
    const okIds = []
    for (const r of group.records) {
      try {
        await chrome.tabs.create({ url: r.url, active: false })
        okIds.push(r.id)
      } catch {
        failed.push(r)
      }
    }
    if (okIds.length) await removeOnetabRecords(okIds)
    if (failed.length) actionError.value = `${failed.length} 个记录恢复失败`
    await refresh()
  } finally {
    restoring.value = false
  }
}

async function handleRestoreAll() {
  if (restoring.value) return
  restoring.value = true
  try {
    const failed = []
    const okIds = []
    for (const r of records.value) {
      try {
        await chrome.tabs.create({ url: r.url, active: false })
        okIds.push(r.id)
      } catch {
        failed.push(r)
      }
    }
    if (failed.length === 0) {
      await clearAllOnetabRecords()
    } else {
      if (okIds.length) await removeOnetabRecords(okIds)
      actionError.value = `${failed.length} 个记录恢复失败`
    }
    await refresh()
  } finally {
    restoring.value = false
  }
}

async function handleDelete(record) {
  if (restoring.value) return
  try {
    await removeOnetabRecord(record.id)
    await refresh()
  } catch (err) {
    actionError.value = err?.message || '删除失败'
  }
}

async function handleClearAll() {
  if (restoring.value) return
  restoring.value = true
  try {
    await clearAllOnetabRecords()
    showClearConfirm.value = false
    await refresh()
  } catch (err) {
    actionError.value = err?.message || '清空失败'
  } finally {
    restoring.value = false
  }
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.onetab-panel {
  --paper: #f5f5f5;
  --ink: #333;
  --warm-gray: #e0e0e0;
  --muted: #888;
  --accent: #667eea;
  --accent-light: #e8ecff;
  --danger: #e53935;
  --danger-light: #ffebee;
  --card-bg: white;
  --shadow: rgba(0, 0, 0, 0.08);

  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--paper);
}

.onetab-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid var(--warm-gray);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stats-info {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--muted);
}

.stat-item strong {
  color: var(--ink);
  font-weight: 600;
}

.btn {
  padding: 5px 12px;
  font-size: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-secondary {
  background: #f0f0f0;
  color: var(--ink);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 14px;
  gap: 8px;
}

.empty-hint {
  font-size: 12px;
  color: var(--muted);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.action-error {
  padding: 10px 12px;
  margin: 12px 20px 0;
  border-radius: 8px;
  background: var(--danger-light);
  border: 1px solid rgba(229, 57, 53, 0.2);
  color: var(--danger);
  font-size: 13px;
  flex-shrink: 0;
}

.domain-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  padding: 16px 20px;
  overscroll-behavior: contain;
}

.domain-column {
  display: flex;
  flex: 1 1 280px;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

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
  background: var(--accent);
}

.domain-card:hover {
  box-shadow: 0 4px 16px var(--shadow);
  transform: translateY(-2px);
}

.domain-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f5f5f5;
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

.record-list {
  padding: 6px 10px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.4;
  transition: background 0.15s ease;
}

.record-row:last-child {
  border-bottom: none;
}

.record-row:hover {
  background: var(--accent-light);
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

.row-delete-btn {
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

.record-row:hover .row-delete-btn {
  opacity: 1;
}

.row-delete-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--danger-light);
  color: var(--danger);
}

.row-delete-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bulk-confirm-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin: 0 20px 12px;
  padding-top: 12px;
  border-top: 1px solid var(--warm-gray);
  flex-shrink: 0;
}

.confirm-message {
  flex: 1;
  font-size: 14px;
  color: var(--muted);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/main/components/OneTabPage.vue
git commit -m "Add OneTabPage.vue component"
```

---

### Task 6: Wire OneTab button in TopNav + App.vue

**Files:**
- Modify: `src/pages/main/components/TopNav.vue`
- Modify: `src/pages/main/App.vue`

- [ ] **Step 1: Add OneTab button to TopNav.vue**

In `src/pages/main/components/TopNav.vue`, find the "全部页签" button (the one with `@click="$emit('open-all-tabs')"`). Immediately after its closing `</button>`, add:

```html
      <button
        :class="['nav-action-btn', { active: activeView === 'onetab' }]"
        @click="$emit('open-onetab')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
        OneTab
      </button>
```

- [ ] **Step 2: Add open-onetab to TopNav emits**

In the `defineEmits` line of `TopNav.vue`, add `'open-onetab'`:

```js
defineEmits(['select-root-folder', 'open-trace', 'open-settings', 'open-all-tabs', 'open-onetab', 'open-translate'])
```

- [ ] **Step 3: Import OneTabPage in App.vue**

In `src/pages/main/App.vue`, add the import after the AllTabsModal import:

```js
import AllTabsPanel from './components/AllTabsModal.vue'
import OneTabPage from './components/OneTabPage.vue'
```

- [ ] **Step 4: Add OneTab view branch in App.vue template**

In `src/pages/main/App.vue` template, after the AllTabsPanel line, add:

```html
      <AllTabsPanel v-if="activeView === 'all-tabs'" />
      <OneTabPage v-else-if="activeView === 'onetab'" />
      <template v-else>
```

(Replace the existing `<AllTabsPanel v-if="activeView === 'all-tabs'" />` line and the `<template v-else>` line with the three lines above.)

- [ ] **Step 5: Add open-onetab handler in App.vue**

In `src/pages/main/App.vue`, add the handler after `handleOpenAllTabs`:

```js
function handleOpenOnetab() {
  activeView.value = activeView.value === 'onetab' ? 'bookmarks' : 'onetab'
}
```

- [ ] **Step 6: Wire the emit in App.vue template**

In the `<TopNav ... />` tag, add `@open-onetab="handleOpenOnetab"`:

```html
    <TopNav
      :root-folders="rootFolders"
      :favorite-folders="favoriteFolders"
      :selected-root-id="currentRootFolderId"
      :active-view="activeView"
      @select-root-folder="handleSelectRootFolder"
      @open-trace="handleOpenTrace"
      @open-settings="handleOpenSettings"
      @open-all-tabs="handleOpenAllTabs"
      @open-onetab="handleOpenOnetab"
      @open-translate="handleOpenTranslate"
    />
```

- [ ] **Step 7: Build and verify no errors**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/main/components/TopNav.vue src/pages/main/App.vue
git commit -m "Wire OneTab button in TopNav and App view routing"
```

---

### Task 7: Add OneTab buttons to AllTabsModal

**Files:**
- Modify: `src/pages/main/components/AllTabsModal.vue`

- [ ] **Step 1: Add imports for onetab-manager and settings**

In `src/pages/main/components/AllTabsModal.vue` `<script setup>`, after the existing imports, add:

```js
import { addOnetabRecords } from '@/utils/onetab-manager'
import { filterEligibleTabs } from '@/utils/onetab-manager'
import { getSettings } from '@/utils/storage'
```

- [ ] **Step 2: Add global OneTab button in header**

In the template, find the `header-right` div that contains the "清除重复" button. Before that button, add:

```html
        <button
          v-if="viewData"
          class="btn btn-primary onetab-all-btn"
          :disabled="clearing"
          @click="handleOnetabAll"
        >
          OneTab
        </button>
```

- [ ] **Step 3: Add per-card OneTab button**

In the template, find the `domain-card-actions` div (containing "关闭全部" and "清除重复" buttons). Before the "关闭全部" button, add:

```html
                  <button
                    class="card-action-btn onetab-card-btn"
                    :disabled="clearing"
                    @click="onetabCard(group)"
                  >
                    OneTab 全部 ({{ group.tabCount }})
                  </button>
```

- [ ] **Step 4: Add handleOnetabAll function**

In `<script setup>`, after the `handleBulkClear` function, add:

```js
async function handleOnetabAll() {
  if (clearing.value) return
  const settings = await getSettings()
  const tabAgeDays = settings.onetab?.tabAgeDays ?? 7
  const allTabs = await queryAllTabs()
  const eligible = filterEligibleTabs(allTabs, tabAgeDays)
  if (eligible.length === 0) {
    actionError.value = `没有超过 ${tabAgeDays} 天未访问的页签`
    return
  }
  clearing.value = true
  try {
    const saved = await runChromeAction(() => addOnetabRecords(eligible))
    if (!saved) return
    const ids = eligible.map(t => t.id).filter(Boolean)
    await runChromeAction(() => closeTabs(ids))
    await refreshTabs()
  } finally {
    clearing.value = false
  }
}
```

- [ ] **Step 5: Add onetabCard function**

After `handleOnetabAll`, add:

```js
async function onetabCard(group) {
  if (clearing.value) return
  const tabs = group.records.flatMap(r => r.tabs).filter(t => t?.id)
  if (tabs.length === 0) {
    actionError.value = '没有可整理的页签'
    return
  }
  clearing.value = true
  try {
    const saved = await runChromeAction(() => addOnetabRecords(tabs))
    if (!saved) return
    const ids = tabs.map(t => t.id)
    await runChromeAction(() => closeTabs(ids))
    await refreshTabs()
  } finally {
    clearing.value = false
  }
}
```

- [ ] **Step 6: Build and verify no errors**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/pages/main/components/AllTabsModal.vue
git commit -m "Add global and per-card OneTab buttons in AllTabsModal"
```

---

### Task 8: Add OneTab settings section

**Files:**
- Modify: `src/pages/settings/App.vue`

- [ ] **Step 1: Add OneTab section to template**

In `src/pages/settings/App.vue`, find the `<!-- 书签显示 -->` section. Before it, add:

```html
      <!-- OneTab -->
      <div class="settings-section" id="onetab">
        <h2>OneTab</h2>
        <div class="setting-item">
          <div class="setting-label">
            <span>页签整合阈值（天）</span>
            <span class="setting-desc">全局 OneTab 按钮会将超过此天数未访问的页签整合到 OneTab 列表（默认 7 天）</span>
          </div>
          <input
            type="number"
            min="1"
            max="365"
            v-model.number="settings.onetab.tabAgeDays"
            @change="saveSettings"
          >
        </div>
      </div>

```

- [ ] **Step 2: Add OneTab to settings nav**

In the `sections` array, add the onetab entry after `trace` and before `display`:

```js
const sections = [
  { id: 'trace', label: '访问记录追踪' },
  { id: 'onetab', label: 'OneTab' },
  { id: 'display', label: '书签显示' },
  { id: 'domains', label: '排除域名' },
  { id: 'translate', label: 'AI 翻译' },
  { id: 'clock', label: '时钟显示' },
  { id: 'data', label: '数据管理' },
  { id: 'reset', label: '重置' }
]
```

- [ ] **Step 3: Add number input styling**

In `src/pages/settings/styles.css`, add at the end:

```css
.setting-item input[type="number"] {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  width: 80px;
}

.setting-item input[type="number"]:focus {
  outline: none;
  border-color: #667eea;
}
```

- [ ] **Step 4: Build and verify no errors**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/App.vue src/pages/settings/styles.css
git commit -m "Add OneTab settings section with tabAgeDays input"
```

---

### Task 9: Build, manual test, and final commit

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: all existing tests + new onetab tests pass.

- [ ] **Step 2: Build the extension**

Run: `npm run build 2>&1 | tail -10`
Expected: build succeeds, no warnings.

- [ ] **Step 3: Manual test checklist**

Reload the extension in `chrome://extensions/`, then verify each item:

- [ ] Open new tab -> defaults to All Tabs view (set in earlier work)
- [ ] All Tabs header shows "OneTab" button before "清除重复"
- [ ] Each domain card shows "OneTab 全部 (N)" button before "关闭全部"
- [ ] TopNav shows "OneTab" button after "全部页签"
- [ ] Click "OneTab" in TopNav -> switches to OneTab page (empty state shows "暂无 OneTab 记录")
- [ ] In All Tabs, click global "OneTab" button -> tabs older than 7 days close and appear in OneTab page
- [ ] Current active tab is NOT closed by global OneTab
- [ ] Special pages (chrome://, about:blank) are NOT closed by global OneTab
- [ ] In All Tabs, click a card's "OneTab 全部" -> all tabs in that card close and appear in OneTab page
- [ ] OneTab page shows records grouped by domain, sorted by savedAt desc
- [ ] Click a record row -> tab opens in background, record disappears from list
- [ ] Click card's "恢复全部" -> all records in card open, card disappears
- [ ] Click header's "恢复全部" -> all records open, list empties
- [ ] Click record's delete button -> record disappears, no tab opens
- [ ] Click "清空" -> confirm dialog -> confirm -> list empties
- [ ] Settings page shows "OneTab" section with number input defaulting to 7
- [ ] Change tabAgeDays to 1, save -> global OneTab now uses 1-day threshold
- [ ] Reload extension -> OneTab records persist

- [ ] **Step 4: Final commit (if any fixups needed)**

If manual testing revealed issues that were fixed, commit those fixes. Otherwise no commit needed.

---

## Self-Review Notes

- **Spec coverage**: All spec sections covered - data model (Task 3-4), settings (Task 1, 8), UI integration (Task 5-7), behavior (Task 7 + 5), error handling (in Task 5/7 code), testing (Task 1-2 unit + Task 9 manual).
- **Type consistency**: `addOnetabRecords`, `getOnetabRecords`, `removeOnetabRecord`, `removeOnetabRecords`, `clearAllOnetabRecords` - names match between onetab-manager.js and consumers. `filterEligibleTabs`, `buildOnetabView` - match between definition and tests.
- **No placeholders**: every code step has complete code.
