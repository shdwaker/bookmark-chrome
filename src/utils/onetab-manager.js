// OneTab 管理 - 纯函数 + IndexedDB CRUD

import { getDB } from './trace-manager'
import { getTabGroupName, getFaviconUrl } from './tabs-manager'

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
