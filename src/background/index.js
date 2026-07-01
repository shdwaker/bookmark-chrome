// Background Service Worker - 监听页面访问

import { getSettings } from '../utils/storage.js'
import { initDB, addTraceRecord, cleanOldRecords, extractDomain, shouldTrackUrl } from '../utils/trace-manager.js'

// 初始化
initDB().then(() => {
  console.log('IndexedDB initialized')
}).catch(err => {
  console.error('Failed to initialize IndexedDB:', err)
})

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在页面加载完成时记录
  if (changeInfo.status !== 'complete') return

  const settings = await getSettings()

  // 检查是否启用追踪
  if (!settings.enableTrace) return

  const url = tab.url
  const title = tab.title

  // 检查是否应该记录此URL
  if (!shouldTrackUrl(url, settings.excludedDomains)) return

  const domain = extractDomain(url)
  if (!domain) return

  // 添加记录
  try {
    await addTraceRecord({
      url,
      title,
      domain,
      tabId
    })
    console.log('Recorded visit:', url)
  } catch (err) {
    console.error('Failed to record visit:', err)
  }
})

// 监听标签页移除（清理记录）
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // 可以在这里做一些清理工作
})

// 定时清理过期记录 - 每小时执行一次
chrome.alarms.create('cleanOldRecords', { periodInMinutes: 60 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanOldRecords') {
    const settings = await getSettings()
    const deleted = await cleanOldRecords(settings.traceRetentionDays)
    if (deleted > 0) {
      console.log(`Cleaned ${deleted} old records`)
    }
  }
})

// 监听插件图标点击 - 打开新标签页
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/main/index.html') })
})

// 扩展安装或更新时的处理
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('Extension installed')

    // 设置默认配置
    await chrome.storage.local.set({
      settings: {
        enableTrace: true,
        traceRetentionDays: 7,
        bookmarksPerPage: 20,
        defaultRootFolder: '',
        excludedDomains: []
      },
      favoriteFolders: []
    })
  } else if (details.reason === 'update') {
    // 更新
    console.log('Extension updated to version', chrome.runtime.getManifest().version)
    const settings = await getSettings()
    await chrome.storage.local.set({ settings })
  }
})