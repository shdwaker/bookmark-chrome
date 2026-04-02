// 书签状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as bookmarkApi from '@/utils/bookmark-api'
import { getFavoriteFolders, setFavoriteFolders, toggleFavoriteFolder } from '@/utils/storage'

export const useBookmarkStore = defineStore('bookmarks', () => {
  // 状态
  const bookmarkTree = ref([])
  const currentRootFolderId = ref(null)  // 顶部导航选中的根文件夹
  const currentFolderId = ref(null)       // 左侧树选中的文件夹
  const favoriteFolderIds = ref([])

  // 计算属性：根文件夹列表
  const rootFolders = computed(() => {
    if (!bookmarkTree.value.length) return []
    const root = bookmarkTree.value[0]
    return (root.children || []).filter(node => !node.url)
  })

  // 计算属性：收藏的文件夹列表
  const favoriteFolders = computed(() => {
    const allFolders = getAllFoldersFlat(bookmarkTree.value)
    return allFolders.filter(f => favoriteFolderIds.value.includes(f.id))
  })

  // 计算属性：当前根文件夹（顶部导航选中的）
  const currentRootFolder = computed(() => {
    if (!currentRootFolderId.value) return null
    return findFolderById(bookmarkTree.value, currentRootFolderId.value)
  })

  // 计算属性：当前选中文件夹（左侧树选中的）
  const currentFolder = computed(() => {
    if (!currentFolderId.value) return null
    return findFolderById(bookmarkTree.value, currentFolderId.value)
  })

  // 计算属性：当前根文件夹的完整子文件夹树（用于左侧树形展示）
  const currentFolderTree = computed(() => {
    if (!currentRootFolder.value) return []
    return (currentRootFolder.value.children || []).filter(node => !node.url)
  })

  // 计算属性：当前选中文件夹的书签
  const currentBookmarks = computed(() => {
    if (!currentFolder.value) return []
    return (currentFolder.value.children || []).filter(node => node.url)
  })

  // 计算属性：所有文件夹（用于选择器）
  const allFolders = computed(() => {
    return getAllFoldersFlat(bookmarkTree.value)
  })

  // 初始化
  async function init() {
    await loadBookmarks()
    await loadFavorites()
  }

  // 加载书签树
  async function loadBookmarks() {
    const tree = await bookmarkApi.getBookmarksTree()
    bookmarkTree.value = tree
  }

  // 加载收藏
  async function loadFavorites() {
    const favorites = await getFavoriteFolders()
    favoriteFolderIds.value = favorites
  }

  // 设置根文件夹（顶部导航选择）
  function setRootFolder(folderId) {
    currentRootFolderId.value = folderId
    // 同时将当前选中文件夹设为根文件夹
    currentFolderId.value = folderId
  }

  // 设置当前选中文件夹（左侧树选择）
  function setCurrentFolder(folderId) {
    currentFolderId.value = folderId
  }

  // 添加书签
  async function addBookmark(bookmark) {
    const newBookmark = await bookmarkApi.createBookmark(bookmark)
    await loadBookmarks()
    return newBookmark
  }

  // 更新书签
  async function updateBookmark(bookmarkId, changes) {
    const updated = await bookmarkApi.updateBookmark(bookmarkId, changes)
    await loadBookmarks()
    return updated
  }

  // 删除书签
  async function deleteBookmark(bookmarkId) {
    await bookmarkApi.removeBookmark(bookmarkId)
    await loadBookmarks()
  }

  // 添加文件夹
  async function addFolder(folder) {
    const newFolder = await bookmarkApi.createFolder(folder.parentId, folder.title)
    await loadBookmarks()
    return newFolder
  }

  // 更新文件夹
  async function updateFolder(folderId, changes) {
    const updated = await bookmarkApi.updateBookmark(folderId, changes)
    await loadBookmarks()
    return updated
  }

  // 删除文件夹
  async function deleteFolder(folderId) {
    await bookmarkApi.removeTree(folderId)
    // 如果删除的是当前选中的文件夹，重置
    if (currentFolderId.value === folderId) {
      currentFolderId.value = currentRootFolderId.value
    }
    await loadBookmarks()
  }

  // 切换收藏
  async function toggleFavorite(folderId) {
    const favorites = await toggleFavoriteFolder(folderId)
    favoriteFolderIds.value = favorites
  }

  // 检查是否收藏
  function isFavorite(folderId) {
    return favoriteFolderIds.value.includes(folderId)
  }

  // 辅助函数：递归查找文件夹
  function findFolderById(nodes, folderId) {
    for (const node of nodes) {
      if (node.id === folderId) return node
      if (node.children) {
        const found = findFolderById(node.children, folderId)
        if (found) return found
      }
    }
    return null
  }

  // 辅助函数：获取所有文件夹（扁平列表）
  function getAllFoldersFlat(nodes, result = [], level = 0) {
    for (const node of nodes) {
      if (!node.url) { // 是文件夹
        result.push({
          id: node.id,
          title: node.title,
          parentId: node.parentId,
          level
        })
        if (node.children) {
          getAllFoldersFlat(node.children, result, level + 1)
        }
      }
    }
    return result
  }

  return {
    // 状态
    bookmarkTree,
    currentRootFolderId,
    currentFolderId,
    favoriteFolderIds,
    // 计算属性
    rootFolders,
    favoriteFolders,
    currentRootFolder,
    currentFolder,
    currentFolderTree,
    currentBookmarks,
    allFolders,
    // 方法
    init,
    loadBookmarks,
    loadFavorites,
    setRootFolder,
    setCurrentFolder,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    addFolder,
    updateFolder,
    deleteFolder,
    toggleFavorite,
    isFavorite
  }
})