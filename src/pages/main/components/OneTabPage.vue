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
    const success = await runChromeAction(() => chrome.tabs.create({ url: record.url, active: true }))
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
