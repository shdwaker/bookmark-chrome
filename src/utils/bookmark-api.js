// Chrome书签API封装

// 获取所有书签树
export async function getBookmarksTree() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree(resolve)
  })
}

// 获取指定文件夹的子节点
export async function getChildren(folderId) {
  return new Promise((resolve) => {
    chrome.bookmarks.getChildren(folderId, resolve)
  })
}

// 获取指定节点
export async function getBookmark(bookmarkId) {
  return new Promise((resolve) => {
    chrome.bookmarks.get(bookmarkId, (results) => {
      resolve(results[0])
    })
  })
}

// 创建书签
export async function createBookmark(bookmark) {
  return new Promise((resolve) => {
    // 只传递 Chrome API 接受的属性
    const { parentId, index, title, url } = bookmark
    chrome.bookmarks.create({ parentId, index, title, url }, resolve)
  })
}

// 更新书签
export async function updateBookmark(bookmarkId, changes) {
  return new Promise((resolve) => {
    // 只传递 Chrome API 接受的属性
    const { title, url } = changes
    chrome.bookmarks.update(bookmarkId, { title, url }, resolve)
  })
}

// 删除书签
export async function removeBookmark(bookmarkId) {
  return new Promise((resolve) => {
    chrome.bookmarks.remove(bookmarkId, resolve)
  })
}

// 创建文件夹
export async function createFolder(parentId, title) {
  return new Promise((resolve) => {
    chrome.bookmarks.create({
      parentId,
      title,
      url: undefined
    }, resolve)
  })
}

// 删除文件夹（递归）
export async function removeTree(folderId) {
  return new Promise((resolve) => {
    chrome.bookmarks.removeTree(folderId, resolve)
  })
}

// 搜索书签
export async function searchBookmarks(query) {
  return new Promise((resolve) => {
    chrome.bookmarks.search(query, resolve)
  })
}

// 移动书签/文件夹
export async function moveBookmark(bookmarkId, destination) {
  return new Promise((resolve) => {
    chrome.bookmarks.move(bookmarkId, destination, resolve)
  })
}

// 获取网站favicon URL
export function getFaviconUrl(url) {
  if (!url) return ''
  try {
    const urlObj = new URL(url)
    // 使用网站自身的 favicon.ico，更可靠
    return `${urlObj.origin}/favicon.ico`
  } catch {
    return ''
  }
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

// 将书签树转换为扁平列表
export function flattenBookmarkTree(nodes, result = []) {
  for (const node of nodes) {
    result.push(node)
    if (node.children) {
      flattenBookmarkTree(node.children, result)
    }
  }
  return result
}

// 获取所有文件夹
export function getAllFolders(nodes, result = []) {
  for (const node of nodes) {
    if (!node.url) { // 是文件夹
      result.push({
        id: node.id,
        title: node.title,
        parentId: node.parentId
      })
      if (node.children) {
        getAllFolders(node.children, result)
      }
    }
  }
  return result
}