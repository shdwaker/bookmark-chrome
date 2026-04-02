<template>
  <div class="bookmark-list">
    <div class="bookmark-list-header">
      <h3>{{ currentFolder?.title || '书签' }}</h3>
      <button class="add-bookmark-btn" @click="$emit('add-bookmark')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加书签
      </button>
    </div>

    <!-- 分页控制 -->
    <div v-if="totalPages > 1" class="pagination-bar">
      <div class="pagination-info">
        共 {{ filteredBookmarks.length }} 个书签，当前第 {{ currentPage }}/{{ totalPages }} 页
      </div>
      <div class="pagination-controls">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >
          首页
        </button>
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        <div class="page-numbers">
          <button
            v-for="page in displayedPages"
            :key="page"
            :class="['page-number', { active: currentPage === page }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >
          末页
        </button>
      </div>
    </div>

    <!-- 标签过滤栏 -->
    <div class="tag-filter-bar" v-if="allTags.length > 0">
      <span class="tag-filter-label">标签筛选：</span>
      <div class="tag-filter-list">
        <button
          :class="['tag-filter-item', { active: !selectedTag }]"
          @click="selectedTag = ''"
        >
          全部
        </button>
        <button
          v-for="tag in allTags"
          :key="tag"
          :class="['tag-filter-item', { active: selectedTag === tag }]"
          @click="selectedTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div class="bookmark-list-content">
      <div v-if="paginatedBookmarks.length > 0" class="bookmark-grid">
        <div
          v-for="bookmark in paginatedBookmarks"
          :key="bookmark.id"
          class="bookmark-card"
          @click="openBookmark(bookmark.url)"
        >
          <div class="bookmark-card-header">
            <img
              class="bookmark-favicon"
              :src="getFaviconUrl(bookmark.url)"
              :alt="bookmark.title"
              @error="handleFaviconError"
            >
            <div class="bookmark-info">
              <div class="bookmark-title">{{ bookmark.title || '未命名' }}</div>
              <div class="bookmark-url">{{ bookmark.url }}</div>
            </div>
          </div>

          <!-- 标签显示 -->
          <div class="bookmark-tags" v-if="bookmarkTagsMap[bookmark.id]?.length > 0">
            <span
              v-for="tag in bookmarkTagsMap[bookmark.id]"
              :key="tag"
              class="bookmark-tag"
              @click.stop="filterByTag(tag)"
            >
              {{ tag }}
            </span>
          </div>

          <div class="bookmark-actions">
            <button class="bookmark-action-btn tag" @click.stop="openTagEditor(bookmark)">
              标签
            </button>
            <button class="bookmark-action-btn edit" @click.stop="$emit('edit-bookmark', bookmark)">
              编辑
            </button>
            <button class="bookmark-action-btn delete" @click.stop="$emit('delete-bookmark', bookmark)">
              删除
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <p>{{ selectedTag ? '该标签下暂无书签' : '暂无书签' }}</p>
      </div>
    </div>

    <!-- 标签编辑弹窗 -->
    <TagEditModal
      v-if="showTagEditor"
      :bookmark="editingBookmark"
      :existing-tags="allTags"
      :current-tags="editingBookmark ? (bookmarkTagsMap[editingBookmark.id] || []) : []"
      @save="handleSaveTags"
      @close="showTagEditor = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { getFaviconUrl } from '@/utils/bookmark-api'
import { getAllTags, getBookmarksTags, saveBookmarkTags, addTag } from '@/utils/tag-manager'
import TagEditModal from './TagEditModal.vue'

const props = defineProps({
  bookmarks: {
    type: Array,
    default: () => []
  },
  currentFolder: {
    type: Object,
    default: null
  }
})

defineEmits(['add-bookmark', 'edit-bookmark', 'delete-bookmark'])

const settingsStore = useSettingsStore()

const allTags = ref([])
const selectedTag = ref('')
const bookmarkTagsMap = ref({})
const showTagEditor = ref(false)
const editingBookmark = ref(null)
const currentPage = ref(1)

// 每页显示数量（从设置中获取）
const pageSize = computed(() => settingsStore.settings.bookmarksPerPage || 20)

// 加载所有标签
async function loadAllTags() {
  allTags.value = await getAllTags()
}

// 加载书签的标签
async function loadBookmarkTags() {
  if (props.bookmarks.length === 0) {
    bookmarkTagsMap.value = {}
    return
  }
  const ids = props.bookmarks.map(b => b.id)
  bookmarkTagsMap.value = await getBookmarksTags(ids)
}

// 过滤后的书签
const filteredBookmarks = computed(() => {
  if (!selectedTag.value) {
    return props.bookmarks
  }
  return props.bookmarks.filter(b => {
    const tags = bookmarkTagsMap.value[b.id] || []
    return tags.includes(selectedTag.value)
  })
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredBookmarks.value.length / pageSize.value) || 1
})

// 当前页的书签
const paginatedBookmarks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBookmarks.value.slice(start, end)
})

// 显示的页码列表
const displayedPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  // 显示最多5个页码
  let startPage = Math.max(1, current - 2)
  let endPage = Math.min(total, current + 2)

  // 调整以确保显示5个页码（如果可能）
  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(total, startPage + 4)
    } else if (endPage === total) {
      startPage = Math.max(1, endPage - 4)
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

// 跳转到指定页
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 打开书签
function openBookmark(url) {
  if (url) {
    chrome.tabs.create({ url })
  }
}

// 处理favicon加载失败
function handleFaviconError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
}

// 打开标签编辑器
function openTagEditor(bookmark) {
  editingBookmark.value = bookmark
  showTagEditor.value = true
}

// 按标签过滤
function filterByTag(tag) {
  selectedTag.value = tag
  currentPage.value = 1 // 重置到第一页
}

// 保存标签
async function handleSaveTags(data) {
  await saveBookmarkTags(data.bookmarkId, data.tags)

  // 更新本地状态
  bookmarkTagsMap.value[data.bookmarkId] = data.tags

  // 添加新标签到全局标签列表
  for (const tag of data.tags) {
    if (!allTags.value.includes(tag)) {
      await addTag(tag)
    }
  }

  // 重新加载所有标签
  await loadAllTags()
  showTagEditor.value = false
}

// 监听书签变化，重置页码
watch(() => props.bookmarks, () => {
  currentPage.value = 1
  loadBookmarkTags()
}, { immediate: true })

// 监听过滤标签变化，重置页码
watch(selectedTag, () => {
  currentPage.value = 1
})

onMounted(() => {
  loadAllTags()
})
</script>

<style scoped>
.tag-filter-bar {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
  flex-wrap: wrap;
}

.tag-filter-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.tag-filter-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-filter-item {
  padding: 6px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-filter-item:hover {
  border-color: #667eea;
  color: #667eea;
}

.tag-filter-item.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.bookmark-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  cursor: pointer;
}

.bookmark-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.bookmark-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.bookmark-favicon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  background: #f0f0f0;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-url {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.bookmark-tag {
  display: inline-block;
  padding: 3px 10px;
  background: #e8ecff;
  color: #667eea;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-tag:hover {
  background: #667eea;
  color: white;
}

.bookmark-actions {
  display: none;
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.bookmark-card:hover .bookmark-actions {
  display: flex;
  justify-content: flex-end;
}

.bookmark-action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.bookmark-action-btn.tag {
  background: #e8ecff;
  color: #667eea;
}

.bookmark-action-btn.edit {
  background: #e3f2fd;
  color: #1976d2;
}

.bookmark-action-btn.delete {
  background: #ffebee;
  color: #e53935;
}

.bookmark-action-btn:hover {
  opacity: 0.8;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.pagination-info {
  font-size: 13px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

.page-number.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}
</style>