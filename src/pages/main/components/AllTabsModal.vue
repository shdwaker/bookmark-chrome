<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content all-tabs-modal" ref="modalRef">
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
            :disabled="viewData.stats.duplicateRecords === 0"
            @click="showBulkConfirm = true"
          >
            清除重复
          </button>
        </div>

        <div v-if="viewData.stats.duplicateRecords === 0" class="no-duplicates-hint">
          暂无重复页签
        </div>

        <div class="domain-grid">
          <div v-for="group in viewData.groups" :key="group.name" class="domain-card">
            <div class="domain-card-header">
              <span class="domain-name">{{ group.name }}</span>
              <span class="domain-count">{{ group.tabCount }} 页</span>
            </div>
            <div class="record-list">
              <div
                v-for="record in group.records"
                :key="record.key"
                class="record-item"
                :class="{ duplicate: record.isDuplicate }"
                :ref="el => setRecordRef(record.key, el)"
                @mouseenter="(e) => showPopover(record, e)"
                @mouseleave="hidePopover(record)"
              >
                <div class="record-body" @click="handleFocusTab(record.newestTab)">
                  <div class="record-title">{{ record.title }}</div>
                  <div class="record-url">{{ record.displayUrl }}</div>
                </div>
                <div class="record-actions">
                  <button
                    class="count-badge"
                    :class="{ duplicate: record.isDuplicate }"
                    @click.stop="toggleDetails(record)"
                  >
                    {{ record.count }}
                  </button>
                  <button
                    v-if="record.isDuplicate"
                    class="clear-single-btn"
                    @click.stop="handleClearSingle(record)"
                  >
                    清除
                  </button>
                </div>

                <div v-if="expandedRecords.has(record.key)" class="record-details">
                  <div
                    v-for="tab in record.tabs"
                    :key="tab.id"
                    class="detail-tab-item"
                    :class="{ newest: tab.isNewest }"
                  >
                    <span class="detail-tab-status">
                      {{ tab.isNewest ? '保留' : '将清除' }}
                    </span>
                    <span class="detail-tab-url">{{ tab.url || '无地址' }}</span>
                  </div>
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
        <button class="btn btn-danger" @click="handleBulkClear">确认清除</button>
      </div>

      <div
        v-if="popoverRecord"
        class="url-popover"
        :style="{ top: popoverStyle.top + 'px', left: popoverStyle.left + 'px' }"
        @mouseenter="popoverStay = true"
        @mouseleave="handlePopoverLeave"
      >
        <div class="popover-url">{{ popoverRecord.fullUrl }}</div>
        <button class="copy-btn" @click="handleCopyUrl(popoverRecord.fullUrl)">
          {{ copyStatus === 'success' ? '已复制' : copyStatus === 'failed' ? '复制失败' : '复制' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { queryAllTabs, buildAllTabsView, focusTab, closeTabs } from '@/utils/tabs-manager'

defineEmits(['close'])

const loading = ref(true)
const viewData = ref(null)
const expandedRecords = ref(new Set())
const showBulkConfirm = ref(false)
const popoverRecord = ref(null)
const popoverStay = ref(false)
const copyStatus = ref('idle')
const popoverTimer = ref(null)
const modalRef = ref(null)
const recordRefs = reactive(new Map())
const popoverStyle = reactive({ top: 0, left: 0 })

function setRecordRef(key, el) {
  if (el) {
    recordRefs.set(key, el)
  } else {
    recordRefs.delete(key)
  }
}

async function runChromeAction(fn) {
  try {
    await fn()
  } catch (err) {
    console.warn('Chrome action failed:', err)
  }
}

async function refreshTabs() {
  loading.value = true
  try {
    const tabs = await queryAllTabs()
    viewData.value = buildAllTabsView(tabs)
  } finally {
    loading.value = false
  }
}

function handleFocusTab(tab) {
  runChromeAction(() => focusTab(tab))
}

function toggleDetails(record) {
  const newSet = new Set(expandedRecords.value)
  if (newSet.has(record.key)) {
    newSet.delete(record.key)
  } else {
    newSet.add(record.key)
  }
  expandedRecords.value = newSet
}

async function handleClearSingle(record) {
  await runChromeAction(() => closeTabs(record.oldTabIds))
  await refreshTabs()
}

async function handleBulkClear() {
  const allOldTabIds = viewData.value.groups.flatMap(group =>
    group.records.filter(r => r.isDuplicate).flatMap(r => r.oldTabIds)
  )
  await runChromeAction(() => closeTabs(allOldTabIds))
  showBulkConfirm.value = false
  await refreshTabs()
}

function showPopover(record, event) {
  if (popoverTimer.value) {
    clearTimeout(popoverTimer.value)
    popoverTimer.value = null
  }
  popoverRecord.value = record
  copyStatus.value = 'idle'

  const recordEl = recordRefs.get(record.key)
  if (recordEl && modalRef.value) {
    const modalRect = modalRef.value.getBoundingClientRect()
    const recordRect = recordEl.getBoundingClientRect()
    popoverStyle.top = recordRect.bottom - modalRect.top + 8
    popoverStyle.left = recordRect.left - modalRect.left
  }
}

function hidePopover(record) {
  if (popoverTimer.value) {
    clearTimeout(popoverTimer.value)
  }
  popoverTimer.value = setTimeout(() => {
    if (!popoverStay.value) {
      popoverRecord.value = null
    }
  }, 100)
}

function handlePopoverLeave() {
  popoverStay.value = false
  popoverRecord.value = null
}

async function handleCopyUrl(url) {
  try {
    await navigator.clipboard.writeText(url)
    copyStatus.value = 'success'
  } catch {
    copyStatus.value = 'failed'
  }
  setTimeout(() => {
    if (copyStatus.value !== 'idle') {
      copyStatus.value = 'idle'
    }
  }, 1500)
}

onMounted(() => {
  refreshTabs()
})

onUnmounted(() => {
  if (popoverTimer.value) {
    clearTimeout(popoverTimer.value)
  }
})
</script>

<style scoped>
.all-tabs-modal {
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.all-tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
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
  color: #666;
}

.stat-item strong {
  color: #333;
  font-weight: 600;
}

.duplicate-count {
  color: #e53935 !important;
}

.clear-duplicates-btn {
  padding: 8px 16px;
  font-size: 13px;
}

.clear-duplicates-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-duplicates-hint {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

.domain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 900px) {
  .domain-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .domain-grid {
    grid-template-columns: 1fr;
  }
}

.domain-card {
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
}

.domain-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.domain-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.domain-count {
  font-size: 12px;
  color: #888;
}

.record-list {
  padding: 8px;
}

.record-item {
  background: white;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.record-item:last-child {
  margin-bottom: 0;
}

.record-item.duplicate {
  border-color: #ffe0b2;
  background: #fff8e1;
}

.record-body {
  cursor: pointer;
  margin-bottom: 8px;
}

.record-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-url {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.count-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #e9ecef;
  color: #666;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.count-badge.duplicate {
  background: #ff9800;
  color: white;
}

.count-badge:hover {
  opacity: 0.8;
}

.clear-single-btn {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  background: #ffebee;
  color: #e53935;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-single-btn:hover {
  background: #ffcdd2;
}

.record-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
}

.detail-tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 12px;
  color: #666;
}

.detail-tab-item.newest {
  color: #43a047;
}

.detail-tab-status {
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.detail-tab-url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bulk-confirm-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.confirm-message {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.btn-danger {
  background: #e53935;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}

.url-popover {
  position: absolute;
  z-index: 1001;
  background: #333;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.popover-url {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-btn {
  padding: 4px 10px;
  border-radius: 4px;
  background: #667eea;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #5a6fd6;
}
</style>
