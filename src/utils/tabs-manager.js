export function getNormalizedTabUrl(url) {
  if (!url) return 'about:blank'

  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname || '/'}`
  } catch {
    return url.split('?')[0].split('#')[0]
  }
}

function getDefaultExtensionOrigin() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return ''
  return chrome.runtime.getURL('').replace(/\/$/, '')
}

export function getTabGroupName(url, extensionOrigin = getDefaultExtensionOrigin()) {
  if (!url) return '其他页面'

  if (extensionOrigin && url.startsWith(extensionOrigin)) return '插件页面'

  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'chrome:') return 'chrome://'
    if (parsed.protocol === 'chrome-extension:') return '插件页面'
    return parsed.hostname || '其他页面'
  } catch {
    return '其他页面'
  }
}

function getDisplayPath(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname || '/'
    return path === '/' ? parsed.origin : path
  } catch {
    return url || '无地址'
  }
}

function getFaviconUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    const hostname = parsed.hostname
    return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` : ''
  } catch {
    return ''
  }
}

function compareRecords(a, b) {
  if (a.isDuplicate !== b.isDuplicate) return a.isDuplicate ? -1 : 1
  if (a.newestOrder !== b.newestOrder) return b.newestOrder - a.newestOrder
  return a.title.localeCompare(b.title, 'zh-CN')
}

function compareGroups(a, b) {
  if (a.isExtensionGroup !== b.isExtensionGroup) return a.isExtensionGroup ? -1 : 1
  if (a.hasDuplicates !== b.hasDuplicates) return a.hasDuplicates ? -1 : 1
  if (a.latestOrder !== b.latestOrder) return b.latestOrder - a.latestOrder
  if (a.tabCount !== b.tabCount) return b.tabCount - a.tabCount
  return a.name.localeCompare(b.name, 'zh-CN')
}

export function buildAllTabsView(tabs, options = {}) {
  const extensionOrigin = options.extensionOrigin || getDefaultExtensionOrigin()
  const groupMap = new Map()

  tabs.forEach((rawTab, order) => {
    const normalizedUrl = getNormalizedTabUrl(rawTab.url)
    const groupName = getTabGroupName(rawTab.url, extensionOrigin)
    const isExtensionGroup = groupName === '插件页面'

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        name: groupName,
        isExtensionGroup,
        tabCount: 0,
        latestOrder: -1,
        recordMap: new Map()
      })
    }

    const group = groupMap.get(groupName)
    group.tabCount += 1
    group.latestOrder = Math.max(group.latestOrder, order)

    if (!group.recordMap.has(normalizedUrl)) {
      group.recordMap.set(normalizedUrl, {
        key: normalizedUrl,
        title: rawTab.title || rawTab.url || '未命名页面',
        displayUrl: getDisplayPath(rawTab.url),
        fullUrl: rawTab.url || '',
        tabs: []
      })
    }

    group.recordMap.get(normalizedUrl).tabs.push({
      ...rawTab,
      order,
      isNewest: false
    })
  })

  const groups = Array.from(groupMap.values()).map(group => {
    const records = Array.from(group.recordMap.values()).map(record => {
      const sortedTabs = [...record.tabs].sort((a, b) => b.order - a.order)
      const newestTab = sortedTabs[0]
      const detailTabs = sortedTabs.map((item, index) => ({
        ...item,
        isNewest: index === 0
      }))

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
    }).sort(compareRecords)

    return {
      name: group.name,
      isExtensionGroup: group.isExtensionGroup,
      tabCount: group.tabCount,
      latestOrder: group.latestOrder,
      hasDuplicates: records.some(record => record.isDuplicate),
      duplicateCount: records.filter(record => record.isDuplicate).length,
      records
    }
  }).sort(compareGroups)

  const duplicateRecords = groups.flatMap(group => group.records).filter(record => record.isDuplicate)

  return {
    stats: {
      totalTabs: tabs.length,
      totalRecords: groups.reduce((sum, group) => sum + group.records.length, 0),
      duplicateRecords: duplicateRecords.length,
      duplicateTabs: duplicateRecords.reduce((sum, record) => sum + record.oldTabIds.length, 0)
    },
    groups
  }
}

export async function queryAllTabs() {
  return chrome.tabs.query({})
}

export async function closeTabs(tabIds) {
  const ids = Array.from(tabIds || [])
    .map(id => Number(id))
    .filter(Number.isInteger)
  if (!ids.length) return
  await chrome.tabs.remove(ids)
}

export async function focusTab(tab) {
  if (!tab?.id) return
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true })
  }
  await chrome.tabs.update(tab.id, { active: true })
}