// Background Service Worker - 监听页面访问

import { getSettings } from '../utils/storage.js'
import { translate, translateWordEntry } from '../utils/translate/translate-api.js'
import { saveVocabularyEntry } from '../utils/translate/vocabulary.js'
import { initDB, addTraceRecord, cleanOldRecords, extractDomain, shouldTrackUrl } from '../utils/trace-manager.js'

// 初始化
initDB().then(() => {
  console.log('IndexedDB initialized')
}).catch(err => {
  console.error('Failed to initialize IndexedDB:', err)
})

// 消息处理：
// - TRANSLATE_FETCH: 扩展页面/内容脚本受 CORS 限制，由 background 中转 fetch
// - DO_TRANSLATE: 内容脚本请求翻译，background 直接调用 translate-api
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'TRANSLATE_FETCH') {
    fetch(message.url, message.options)
      .then(async (response) => {
        const bodyText = await response.text()
        sendResponse({ status: response.status, ok: response.ok, bodyText })
      })
      .catch((err) => {
        sendResponse({ error: err.message })
      })
    return true
  }

  if (message?.type === 'DO_TRANSLATE') {
    handleDoTranslate(message.text, message.direction)
      .then((result) => sendResponse({ result }))
      .catch((err) => sendResponse({ error: err.message }))
    return true
  }
})

async function injectContentScripts(tabId) {
  const contentScripts = chrome.runtime.getManifest().content_scripts || []
  const files = contentScripts.flatMap(script => script.js || [])
  if (files.length === 0) return
  await chrome.scripting.executeScript({
    target: { tabId },
    files
  })
}

async function sendMessageToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message)
  } catch {
    await injectContentScripts(tabId)
    return await chrome.tabs.sendMessage(tabId, message)
  }
}

function extractEnglishWord(selectionText) {
  const text = String(selectionText || '').trim()
  if (!text) return ''
  const singleWord = text.match(/^[A-Za-z][A-Za-z'-]*$/)
  if (singleWord) return singleWord[0]
  return (text.match(/[A-Za-z][A-Za-z'-]*/) || [''])[0].slice(0, 64)
}

async function saveSelectedWord(selectionText, tabId) {
  const word = extractEnglishWord(selectionText)
  if (!word) {
    sendVocabularyFeedback(tabId, { error: '请选中一个英文单词' })
    return
  }
  try {
    const providerOptions = await getProviderOptions()
    const entry = await translateWordEntry({ word, context: selectionText, ...providerOptions })
    await saveVocabularyEntry(entry)
    sendVocabularyFeedback(tabId, { entry })
  } catch (err) {
    sendVocabularyFeedback(tabId, { error: err.message })
  }
}

function sendVocabularyFeedback(tabId, payload) {
  sendMessageToTab(tabId, { type: 'vocabulary-feedback', ...payload })
    .catch(() => { /* Pages such as chrome:// cannot receive feedback. */ })
}

async function handleDoTranslate(text, direction) {
  const providerOptions = await getProviderOptions()
  return await translate({
    text,
    direction: direction || 'auto',
    ...providerOptions
  })
}

async function getProviderOptions() {
  const settings = await getSettings()
  const tSettings = settings.translate
  const useProvider = tSettings.defaultProvider
  const cfg = tSettings.providers[useProvider]
  if (!cfg || !cfg.apiKey) {
    throw new Error(`请先在设置中配置 ${useProvider} 的 API key`)
  }
  return {
    provider: useProvider,
    apiKey: cfg.apiKey,
    model: cfg.model,
    baseURL: cfg.baseURL,
    apiFormat: cfg.apiFormat
  }
}

// 右键菜单始终可用；interactionMode 只控制选中文本按钮。

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return
  const type = info.menuItemId
  if (type === 'save-word') {
    saveSelectedWord(info.selectionText || '', tab.id)
    return
  }
  if (type !== 'translate-page' && type !== 'translate-page-inline' && type !== 'immersive-translate' && type !== 'translate-selection' && type !== 'read-aloud') return
  sendMessageToTab(tab.id, {
    type,
    selectionText: info.selectionText || ''
  }).catch(err => console.warn('[MarkTrace] unable to send translate message', err))
})

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ai-translate',
      title: 'AI翻译',
      contexts: ['page', 'selection']
    })
    chrome.contextMenus.create({
      id: 'translate-page',
      parentId: 'ai-translate',
      title: '翻译整个页面',
      contexts: ['page']
    })
    chrome.contextMenus.create({
      id: 'translate-page-inline',
      parentId: 'ai-translate',
      title: '内联翻译页面',
      contexts: ['page']
    })
    chrome.contextMenus.create({
      id: 'immersive-translate',
      parentId: 'ai-translate',
      title: '沉浸式翻译',
      contexts: ['page']
    })
    chrome.contextMenus.create({
      id: 'translate-selection',
      parentId: 'ai-translate',
      title: '翻译选中的文本',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'save-word',
      parentId: 'ai-translate',
      title: '保存生词',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'read-aloud',
      parentId: 'ai-translate',
      title: '朗读',
      contexts: ['selection']
    })
  })
}

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

// Service worker 启动时确保右键菜单存在（MV3 worker 可能被杀死后重启）
createContextMenus()

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
