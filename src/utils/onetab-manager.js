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
