<template>
  <div class="all-tabs-panel">
      <div class="all-tabs-panel-header">
        <div class="header-left">
          <h3>全部页签</h3>
          <div v-if="viewData" class="stats-info">
            <span class="stat-item">
              全部: <strong>{{ viewData.stats.totalTabs }}</strong>
            </span>
            <span class="stat-item">
              不同: <strong>{{ viewData.stats.totalRecords }}</strong>
            </span>
            <span class="stat-item">
              重复: <strong :class="{ 'duplicate-count': viewData.stats.duplicateRecords > 0 }">{{ viewData.stats.duplicateRecords }}</strong>
            </span>
          </div>
        </div>
        <div class="header-right">
          <button
            v-if="viewData"
            class="btn btn-primary clear-duplicates-btn"
            :disabled="viewData.stats.duplicateRecords === 0 || clearing"
            @click="showBulkConfirm = true"
          >
            清除重复
          </button>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        <p>正在加载页签...</p>
      </div>

      <div v-else-if="viewData?.stats?.totalTabs === 0" class="empty-state">
        <p>当前没有可显示的页签</p>
      </div>

      <div v-else class="content-wrapper">
        <div v-if="actionError" class="action-error">
          {{ actionError }}
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
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { queryAllTabs, buildAllTabsView, focusTab, closeTabs } from '@/utils/tabs-manager'

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
.all-tabs-panel {
  --paper: #f5f5f5;
  --ink: #333;
  --warm-gray: #e0e0e0;
  --muted: #888;
  --accent: #667eea;
  --accent-light: #e8ecff;
  --accent-hover: #5a6fd6;
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

.all-tabs-panel-header {
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

.duplicate-count {
  color: var(--danger) !important;
}

.clear-duplicates-btn {
  padding: 5px 12px;
  font-size: 12px;
}

.clear-duplicates-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* ---- Error state ---- */
.action-error {
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: var(--danger-light);
  border: 1px solid rgba(229, 57, 53, 0.2);
  color: var(--danger);
  font-size: 13px;
  flex-shrink: 0;
}

/* ---- Domain grid (responsive masonry via flex-wrap) ---- */
.domain-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  padding-right: 4px;
  overscroll-behavior: contain;
}

.domain-column {
  display: flex;
  flex: 1 1 280px;
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
  background: var(--accent);
}

.domain-card.has-dupes::before {
  background: var(--danger);
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
  border-color: rgba(229, 57, 53, 0.3);
  color: var(--danger);
  background: var(--danger-light);
}

.close-dupes-btn:hover:not(:disabled) {
  background: rgba(229, 57, 53, 0.15);
  border-color: var(--danger);
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

/* ---- Duplicate badge ---- */
.dupe-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-light);
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
  background: var(--danger-light);
  color: var(--danger);
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
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}
</style>
