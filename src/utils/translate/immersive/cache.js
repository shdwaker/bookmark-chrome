// Translation cache using IndexedDB with injectable backend.
// In production, uses real IndexedDB. In tests, an in-memory Map backend
// is injected via the `backend` option.
//
// Cache key format: `${direction}::${text}`
// Cache value: { translation: string, timestamp: number }

const DB_NAME = 'immersive-translate-cache'
const DB_VERSION = 1
const STORE_NAME = 'translations'

// Default IndexedDB backend.
function createIndexedDBBackend() {
  let db = null

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = (event) => {
        const database = event.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  function tx(mode) {
    if (!db) throw new Error('Cache not initialized')
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
  }

  function reqAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    async init() {
      db = await openDB()
    },
    async get(key) {
      return reqAsPromise(tx('readonly').get(key))
    },
    async set(key, value) {
      await reqAsPromise(tx('readwrite').put(value, key))
    },
    async delete(key) {
      await reqAsPromise(tx('readwrite').delete(key))
    },
    async clear() {
      await reqAsPromise(tx('readwrite').clear())
    },
    async getMany(keys) {
      const result = new Map()
      for (const key of keys) {
        const value = await reqAsPromise(tx('readonly').get(key))
        if (value !== undefined) result.set(key, value)
      }
      return result
    },
    async setMany(entries) {
      for (const [key, value] of entries) {
        await reqAsPromise(tx('readwrite').put(value, key))
      }
    }
  }
}

function makeKey(text, direction) {
  return `${direction}::${text}`
}

export function createCache(options = {}) {
  const backend = options.backend || createIndexedDBBackend()

  return {
    async init() {
      if (backend.init) await backend.init()
    },

    async query(texts, direction) {
      const keys = texts.map(t => makeKey(t, direction))
      const stored = await backend.getMany(keys)
      const hit = new Map()
      const miss = []
      for (let i = 0; i < texts.length; i++) {
        const entry = stored.get(keys[i])
        if (entry !== undefined) {
          hit.set(texts[i], entry.translation)
        } else {
          miss.push(texts[i])
        }
      }
      return { hit, miss }
    },

    async write(entries) {
      if (entries.length === 0) return
      const pairs = entries.map(e => [
        makeKey(e.text, e.direction),
        { translation: e.translation, timestamp: Date.now() }
      ])
      await backend.setMany(pairs)
    },

    async clear() {
      await backend.clear()
    }
  }
}
