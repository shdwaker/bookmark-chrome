// Chrome Storage API封装

const STORAGE_KEYS = {
  FAVORITE_FOLDERS: 'favoriteFolders',
  SETTINGS: 'settings'
}

export const DEFAULT_SETTINGS = {
  enableTrace: true,
  traceRetentionDays: 7,
  bookmarksPerPage: 20,
  defaultRootFolder: '',
  excludedDomains: [],
  translate: {
    defaultProvider: 'qwen',
    interactionMode: 'selection',
    voiceChinese: '',
    voiceEnglish: '',
    providers: {
      qwen:   { apiKey: '', model: 'qwen-max', baseURL: '', apiFormat: 'openai' },
      doubao: { apiKey: '', model: 'doubao-1.5-pro-32k-250115', baseURL: '', apiFormat: 'openai' },
      glm:    { apiKey: '', model: 'glm-4', baseURL: '', apiFormat: 'openai' },
      kimi:   { apiKey: '', model: 'moonshot-v1-8k', baseURL: '', apiFormat: 'openai' }
    }
  },
  clock: {
    showWeekday: true,
    showLunar: false,
    showSeconds: false,
    showMilliseconds: false
  }
}

export function normalizeSettings(settings) {
  const defaults = { ...DEFAULT_SETTINGS }
  const result = { ...defaults, ...(settings || {}) }
  // deep-merge each provider config so new fields (e.g. endpoint) are preserved
  const defaultProviders = defaults.translate.providers
  const savedProviders = settings?.translate?.providers || {}
  const mergedProviders = {}
  for (const name of Object.keys(defaultProviders)) {
    mergedProviders[name] = {
      ...defaultProviders[name],
      ...(savedProviders[name] || {})
    }
  }
  result.translate = {
    ...defaults.translate,
    ...(settings?.translate || {}),
    providers: mergedProviders
  }
  result.clock = { ...defaults.clock, ...(settings?.clock || {}) }
  result.excludedDomains = Array.isArray(settings?.excludedDomains) ? settings.excludedDomains : []
  return result
}

// 获取存储数据
export async function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key])
    })
  })
}

// 设置存储数据
export async function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve)
  })
}

// 删除存储数据
export async function removeStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve)
  })
}

// 获取收藏的文件夹ID列表
export async function getFavoriteFolders() {
  const favorites = await getStorage(STORAGE_KEYS.FAVORITE_FOLDERS)
  return favorites || []
}

// 设置收藏的文件夹
export async function setFavoriteFolders(folders) {
  await setStorage(STORAGE_KEYS.FAVORITE_FOLDERS, folders)
}

// 切换文件夹收藏状态
export async function toggleFavoriteFolder(folderId) {
  const favorites = await getFavoriteFolders()
  const index = favorites.indexOf(folderId)
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(folderId)
  }
  await setFavoriteFolders(favorites)
  return favorites
}

// 获取设置
export async function getSettings() {
  const settings = await getStorage(STORAGE_KEYS.SETTINGS)
  return normalizeSettings(settings)
}

// 保存设置
export async function saveSettings(settings) {
  await setStorage(STORAGE_KEYS.SETTINGS, settings)
}

export { STORAGE_KEYS }