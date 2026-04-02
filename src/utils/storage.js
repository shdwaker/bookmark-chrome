// Chrome Storage API封装

const STORAGE_KEYS = {
  FAVORITE_FOLDERS: 'favoriteFolders',
  SETTINGS: 'settings'
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
  return settings || {
    enableTrace: true,
    traceRetentionDays: 7,
    bookmarksPerPage: 20,
    defaultRootFolder: '',
    excludedDomains: []
  }
}

// 保存设置
export async function saveSettings(settings) {
  await setStorage(STORAGE_KEYS.SETTINGS, settings)
}

export { STORAGE_KEYS }