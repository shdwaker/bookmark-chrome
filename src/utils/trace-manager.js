// 访问记录管理 - IndexedDB

const DB_NAME = 'BookmarkManagerDB'
const DB_VERSION = 1
const STORE_NAME = 'traceRecords'

let db = null

// 初始化数据库
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('url', 'url', { unique: false })
        store.createIndex('domain', 'domain', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// 添加访问记录
export async function addTraceRecord(record) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add({
      ...record,
      timestamp: Date.now()
    })

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 获取所有访问记录
export async function getTraceRecords() {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// 清理过期记录
export async function cleanOldRecords(daysToKeep = 7) {
  if (!db) await initDB()

  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    const range = IDBKeyRange.upperBound(cutoffTime)
    const request = index.openCursor(range)

    let deleted = 0
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        cursor.delete()
        deleted++
        cursor.continue()
      } else {
        resolve(deleted)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// 清除所有记录
export async function clearAllRecords() {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 从URL提取域名
export function extractDomain(url) {
  if (!url) return ''
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

// 检查URL是否应该被记录
export function shouldTrackUrl(url, excludedDomains = []) {
  if (!url) return false

  // 排除chrome://和chrome-extension://等特殊URL
  if (url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:')) {
    return false
  }

  // 检查是否在排除域名列表中
  const domain = extractDomain(url)
  if (excludedDomains.includes(domain)) {
    return false
  }

  return true
}