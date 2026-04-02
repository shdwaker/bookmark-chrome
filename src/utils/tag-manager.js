// 标签管理工具

const TAGS_STORAGE_KEY = 'bookmarkTags'

// 获取所有标签
export async function getAllTags() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TAGS_STORAGE_KEY, (result) => {
      resolve(result[TAGS_STORAGE_KEY] || [])
    })
  })
}

// 保存所有标签
export async function saveAllTags(tags) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [TAGS_STORAGE_KEY]: tags }, resolve)
  })
}

// 添加标签
export async function addTag(tag) {
  const tags = await getAllTags()
  if (!tags.includes(tag)) {
    tags.push(tag)
    await saveAllTags(tags)
  }
  return tags
}

// 删除标签
export async function removeTag(tag) {
  const tags = await getAllTags()
  const index = tags.indexOf(tag)
  if (index > -1) {
    tags.splice(index, 1)
    await saveAllTags(tags)
  }
  return tags
}

// 获取书签的标签
export async function getBookmarkTags(bookmarkId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(`tags_${bookmarkId}`, (result) => {
      resolve(result[`tags_${bookmarkId}`] || [])
    })
  })
}

// 保存书签的标签
export async function saveBookmarkTags(bookmarkId, tags) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [`tags_${bookmarkId}`]: tags }, resolve)
  })
}

// 获取多个书签的标签
export async function getBookmarksTags(bookmarkIds) {
  return new Promise((resolve) => {
    const keys = bookmarkIds.map(id => `tags_${id}`)
    chrome.storage.local.get(keys, (result) => {
      const tagsMap = {}
      bookmarkIds.forEach(id => {
        tagsMap[id] = result[`tags_${id}`] || []
      })
      resolve(tagsMap)
    })
  })
}

// 根据标签搜索书签
export async function searchByTag(tag) {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const bookmarkIds = []
      for (const key in items) {
        if (key.startsWith('tags_')) {
          const tags = items[key]
          if (tags && tags.includes(tag)) {
            bookmarkIds.push(key.replace('tags_', ''))
          }
        }
      }
      resolve(bookmarkIds)
    })
  })
}

// 初始化默认标签
export async function initDefaultTags() {
  const tags = await getAllTags()
  if (tags.length === 0) {
    await saveAllTags(['工作', '学习', '娱乐', '购物', '工具', '资讯'])
  }
}