<template>
  <div class="top-nav">
    <div class="top-nav-left">
      <button
        v-for="folder in rootFolders"
        :key="folder.id"
        :class="['nav-folder-btn', { active: selectedRootId === folder.id }]"
        @click="$emit('select-root-folder', folder.id)"
      >
        {{ folder.title || '未命名' }}
      </button>

      <!-- 收藏的文件夹 -->
      <template v-if="favoriteFolders.length > 0">
        <span class="favorite-divider"></span>
        <button
          v-for="folder in favoriteFolders"
          :key="'fav-' + folder.id"
          class="nav-favorite-btn"
          @click="$emit('select-root-folder', folder.id)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {{ folder.title || '未命名' }}
        </button>
      </template>
    </div>

    <!-- 搜索框 -->
    <div class="search-container" ref="searchContainer">
      <div class="search-box" :class="{ focused: isSearchFocused }">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="搜索书签..."
          @input="handleSearch"
          @focus="handleFocus"
          @keydown.escape="closeSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="showResults && searchResults.length > 0" class="search-results">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="openBookmark(result)"
        >
          <img
            class="result-favicon"
            :src="getFaviconUrl(result.url)"
            @error="handleFaviconError"
          />
          <div class="result-info">
            <div class="result-title" v-html="highlightMatch(result.title, searchQuery)"></div>
            <div class="result-url" v-html="highlightMatch(result.url, searchQuery)"></div>
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-if="showResults && searchQuery && searchResults.length === 0" class="search-results">
        <div class="no-results">未找到匹配的书签</div>
      </div>
    </div>

    <div class="top-nav-right">
      <button class="nav-action-btn" @click="$emit('open-trace', 'site')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        网站留痕
      </button>
      <button class="nav-action-btn" @click="$emit('open-trace', 'url')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        网址留痕
      </button>
      <button class="nav-action-btn" @click="$emit('open-all-tabs')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="14" rx="2"/>
          <line x1="7" y1="20" x2="17" y2="20"/>
          <line x1="12" y1="18" x2="12" y2="20"/>
        </svg>
        全部页签
      </button>
      <button class="nav-action-btn" @click="$emit('open-settings')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        设置
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmarks'
import { getFaviconUrl } from '@/utils/bookmark-api'
import { getBookmarksTags } from '@/utils/tag-manager'

const props = defineProps({
  rootFolders: {
    type: Array,
    default: () => []
  },
  favoriteFolders: {
    type: Array,
    default: () => []
  },
  selectedRootId: {
    type: String,
    default: ''
  }
})

defineEmits(['select-root-folder', 'open-trace', 'open-settings', 'open-all-tabs'])

const bookmarkStore = useBookmarkStore()

const searchQuery = ref('')
const showResults = ref(false)
const isSearchFocused = ref(false)
const searchResults = ref([])
const searchContainer = ref(null)
const searchInput = ref(null)

// 获取所有书签
function getAllBookmarks(nodes, results = []) {
  for (const node of nodes) {
    if (node.url) {
      results.push({
        id: node.id,
        title: node.title,
        url: node.url
      })
    }
    if (node.children) {
      getAllBookmarks(node.children, results)
    }
  }
  return results
}

// 搜索处理
async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  const allBookmarks = getAllBookmarks(bookmarkStore.bookmarkTree)

  // 获取所有书签的标签
  const bookmarkIds = allBookmarks.map(b => b.id)
  const tagsMap = await getBookmarksTags(bookmarkIds)

  searchResults.value = allBookmarks.filter(bookmark => {
    const titleMatch = (bookmark.title || '').toLowerCase().includes(query)
    const urlMatch = (bookmark.url || '').toLowerCase().includes(query)
    // 标签匹配
    const tags = tagsMap[bookmark.id] || []
    const tagMatch = tags.some(tag => tag.toLowerCase().includes(query))
    return titleMatch || urlMatch || tagMatch
  }).slice(0, 10) // 限制结果数量
}

// 高亮匹配文本
function highlightMatch(text, query) {
  if (!text || !query) return text || ''
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 转义正则特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 打开书签
function openBookmark(bookmark) {
  chrome.tabs.create({ url: bookmark.url })
  closeSearch()
}

// 清除搜索
function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
  searchInput.value?.focus()
}

// 关闭搜索
function closeSearch() {
  showResults.value = false
  searchQuery.value = ''
  searchResults.value = []
}

// 获得焦点
function handleFocus() {
  isSearchFocused.value = true
  showResults.value = true
}

// 处理favicon加载失败
function handleFaviconError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
}

// 点击外部关闭搜索结果
function handleClickOutside(event) {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    showResults.value = false
    isSearchFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 6px 12px;
  transition: all 0.2s;
}

.search-box.focused {
  background: rgba(255, 255, 255, 0.25);
}

.search-icon {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 14px;
  min-width: 0;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-clear {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  color: white;
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.result-favicon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 12px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-title :deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

.result-url {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-url :deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 1px;
  border-radius: 2px;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>