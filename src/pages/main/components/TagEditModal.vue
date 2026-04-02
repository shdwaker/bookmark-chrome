<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content tag-modal">
      <div class="modal-header">
        <h3>编辑标签</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="bookmark-preview">
        <img
          class="preview-favicon"
          :src="getFaviconUrl(bookmark?.url)"
          @error="handleFaviconError"
        />
        <div class="preview-info">
          <div class="preview-title">{{ bookmark?.title || '未命名' }}</div>
          <div class="preview-url">{{ bookmark?.url }}</div>
        </div>
      </div>

      <div class="tag-section">
        <label>已选标签</label>
        <div class="selected-tags" v-if="selectedTags.length > 0">
          <span
            v-for="tag in selectedTags"
            :key="tag"
            class="tag-chip"
          >
            {{ tag }}
            <button class="tag-remove" @click="removeTag(tag)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
        </div>
        <div v-else class="empty-tags">暂未添加标签</div>
      </div>

      <div class="tag-section">
        <label>选择标签</label>
        <div class="existing-tags">
          <button
            v-for="tag in availableTags"
            :key="tag"
            :class="['tag-option', { selected: selectedTags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="tag-section">
        <label>添加新标签</label>
        <div class="add-tag-input">
          <input
            v-model="newTag"
            type="text"
            placeholder="输入新标签名称"
            @keyup.enter="addNewTag"
          />
          <button class="add-tag-btn" @click="addNewTag" :disabled="!newTag.trim()">
            添加
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button type="button" class="btn btn-primary" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getFaviconUrl } from '@/utils/bookmark-api'

const props = defineProps({
  bookmark: {
    type: Object,
    required: true
  },
  existingTags: {
    type: Array,
    default: () => []
  },
  currentTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const selectedTags = ref([])
const newTag = ref('')

// 可选标签（排除已选的）
const availableTags = computed(() => {
  return props.existingTags.filter(t => !selectedTags.value.includes(t))
})

// 初始化选中标签
watch(() => props.currentTags, (tags) => {
  selectedTags.value = [...(tags || [])]
}, { immediate: true })

// 切换标签
function toggleTag(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 移除标签
function removeTag(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 添加新标签
function addNewTag() {
  const tag = newTag.value.trim()
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    newTag.value = ''
  }
}

// 保存
function handleSave() {
  emit('save', {
    bookmarkId: props.bookmark.id,
    tags: [...selectedTags.value]
  })
}

// 处理favicon加载失败
function handleFaviconError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
}
</script>

<style scoped>
.tag-modal {
  max-width: 480px;
}

.bookmark-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-favicon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-url {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-section {
  margin-bottom: 20px;
}

.tag-section label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border-radius: 16px;
  font-size: 13px;
}

.tag-remove {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.tag-remove:hover {
  opacity: 1;
}

.empty-tags {
  color: #999;
  font-size: 13px;
}

.existing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-option {
  padding: 6px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option:hover {
  border-color: #667eea;
  color: #667eea;
}

.tag-option.selected {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.add-tag-input {
  display: flex;
  gap: 10px;
}

.add-tag-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.add-tag-input input:focus {
  outline: none;
  border-color: #667eea;
}

.add-tag-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-tag-btn:hover:not(:disabled) {
  background: #5a6fd6;
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>