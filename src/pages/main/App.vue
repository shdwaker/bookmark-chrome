<template>
  <div class="app-container">
    <TopNav
      :root-folders="rootFolders"
      :favorite-folders="favoriteFolders"
      :selected-root-id="currentRootFolderId"
      @select-root-folder="handleSelectRootFolder"
      @open-trace="handleOpenTrace"
      @open-settings="handleOpenSettings"
      @open-all-tabs="handleOpenAllTabs"
    />
    <div class="main-content">
      <FolderTree
        :folders="currentFolderTree"
        :selected-folder-id="currentFolderId"
        @select-folder="handleSelectFolder"
        @add-folder="handleAddFolder"
        @edit-folder="handleEditFolder"
        @delete-folder="handleDeleteFolder"
        @toggle-favorite="handleToggleFavorite"
        :favorite-ids="favoriteFolderIds"
      />
      <BookmarkList
        :bookmarks="currentBookmarks"
        :current-folder="currentFolder"
        @add-bookmark="handleAddBookmark"
        @edit-bookmark="handleEditBookmark"
        @delete-bookmark="handleDeleteBookmark"
      />
    </div>

    <!-- 编辑弹窗 -->
    <BookmarkEditModal
      v-if="showBookmarkEdit"
      :bookmark="editingBookmark"
      :folders="allFolders"
      @save="handleSaveBookmark"
      @close="showBookmarkEdit = false"
    />
    <FolderEditModal
      v-if="showFolderEdit"
      :folder="editingFolder"
      :parent-id="currentFolderId"
      @save="handleSaveFolder"
      @close="showFolderEdit = false"
    />
    <TraceModal
      v-if="showTrace"
      :mode="traceMode"
      @close="showTrace = false"
    />

    <div v-if="showAllTabs" class="modal-overlay" @click.self="showAllTabs = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>全部页签</h3>
          <button class="modal-close" @click="showAllTabs = false">×</button>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <ConfirmModal
      v-if="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirmDelete"
      @close="showConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useSettingsStore } from '@/stores/settings'
import TopNav from './components/TopNav.vue'
import FolderTree from './components/FolderTree.vue'
import BookmarkList from './components/BookmarkList.vue'
import BookmarkEditModal from './components/BookmarkEditModal.vue'
import FolderEditModal from './components/FolderEditModal.vue'
import TraceModal from './components/TraceModal.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const bookmarkStore = useBookmarkStore()
const settingsStore = useSettingsStore()

// 弹窗状态
const showBookmarkEdit = ref(false)
const showFolderEdit = ref(false)
const showTrace = ref(false)
const traceMode = ref('url')
const editingBookmark = ref(null)
const editingFolder = ref(null)
const showAllTabs = ref(false)

// 确认弹窗状态
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingDelete = ref(null) // { type: 'bookmark' | 'folder', id: string, folder: object? }

// 计算属性
const rootFolders = computed(() => bookmarkStore.rootFolders)
const favoriteFolders = computed(() => bookmarkStore.favoriteFolders)
const favoriteFolderIds = computed(() => bookmarkStore.favoriteFolderIds)
const currentRootFolderId = computed(() => bookmarkStore.currentRootFolderId)
const currentFolderId = computed(() => bookmarkStore.currentFolderId)
const currentFolder = computed(() => bookmarkStore.currentFolder)
const currentFolderTree = computed(() => bookmarkStore.currentFolderTree)
const currentBookmarks = computed(() => bookmarkStore.currentBookmarks)
const allFolders = computed(() => bookmarkStore.allFolders)

// 初始化
onMounted(async () => {
  await bookmarkStore.init()
  await settingsStore.init()

  // 设置默认选中的根文件夹
  const defaultFolderId = settingsStore.settings.defaultRootFolder
  if (defaultFolderId) {
    bookmarkStore.setRootFolder(defaultFolderId)
  } else if (rootFolders.value.length > 0) {
    // 默认选择第一个根文件夹
    const firstRoot = rootFolders.value[0]
    bookmarkStore.setRootFolder(firstRoot.id)
  }
})

// 处理根文件夹选择（顶部导航）
function handleSelectRootFolder(folderId) {
  bookmarkStore.setRootFolder(folderId)
}

// 处理子文件夹选择（左侧树）- 只改变当前选中文件夹，不刷新整个树
function handleSelectFolder(folderId) {
  bookmarkStore.setCurrentFolder(folderId)
}

// 处理添加书签
function handleAddBookmark() {
  editingBookmark.value = null
  showBookmarkEdit.value = true
}

// 处理编辑书签
function handleEditBookmark(bookmark) {
  editingBookmark.value = { ...bookmark }
  showBookmarkEdit.value = true
}

// 处理保存书签
async function handleSaveBookmark(bookmarkData) {
  if (bookmarkData.id) {
    await bookmarkStore.updateBookmark(bookmarkData.id, bookmarkData)
  } else {
    await bookmarkStore.addBookmark(bookmarkData)
  }
  showBookmarkEdit.value = false
}

// 处理删除书签
function handleDeleteBookmark(bookmark) {
  pendingDelete.value = { type: 'bookmark', id: bookmark.id }
  confirmTitle.value = '删除书签'
  confirmMessage.value = `确定要删除书签 "<strong>${bookmark.title || '未命名'}</strong>" 吗？`
  showConfirm.value = true
}

// 处理添加文件夹
function handleAddFolder(parentId) {
  editingFolder.value = null
  showFolderEdit.value = true
}

// 处理编辑文件夹
function handleEditFolder(folder) {
  editingFolder.value = { ...folder }
  showFolderEdit.value = true
}

// 处理保存文件夹
async function handleSaveFolder(folderData) {
  if (folderData.id) {
    await bookmarkStore.updateFolder(folderData.id, folderData)
  } else {
    await bookmarkStore.addFolder(folderData)
  }
  showFolderEdit.value = false
}

// 处理删除文件夹
function handleDeleteFolder(folder) {
  // 检查文件夹是否有内容
  const hasChildren = folder.children && folder.children.length > 0
  const childFolders = folder.children ? folder.children.filter(c => !c.url).length : 0
  const childBookmarks = folder.children ? folder.children.filter(c => c.url).length : 0

  pendingDelete.value = { type: 'folder', id: folder.id }

  if (hasChildren) {
    confirmTitle.value = '删除文件夹'
    confirmMessage.value = `文件夹 "<strong>${folder.title || '未命名'}</strong>" 包含 <strong>${childFolders}</strong> 个子文件夹和 <strong>${childBookmarks}</strong> 个书签，删除后无法恢复。确定要删除吗？`
  } else {
    confirmTitle.value = '删除文件夹'
    confirmMessage.value = `确定要删除空文件夹 "<strong>${folder.title || '未命名'}</strong>" 吗？`
  }

  showConfirm.value = true
}

// 确认删除
async function handleConfirmDelete() {
  if (!pendingDelete.value) return

  if (pendingDelete.value.type === 'bookmark') {
    await bookmarkStore.deleteBookmark(pendingDelete.value.id)
  } else if (pendingDelete.value.type === 'folder') {
    await bookmarkStore.deleteFolder(pendingDelete.value.id)
  }

  showConfirm.value = false
  pendingDelete.value = null
}

// 处理收藏/取消收藏
async function handleToggleFavorite(folderId) {
  await bookmarkStore.toggleFavorite(folderId)
}

// 处理打开留痕
function handleOpenTrace(mode) {
  traceMode.value = mode
  showTrace.value = true
}

// 处理打开设置
function handleOpenSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/settings/index.html') })
}

// 处理打开全部页签
function handleOpenAllTabs() {
  showAllTabs.value = true
}
</script>

<style src="./styles.css"></style>