<template>
  <div class="folder-item-wrapper">
    <div
      :class="['folder-item', { selected: selectedId === folder.id }]"
      @click="handleClick"
    >
      <!-- 展开/折叠箭头 -->
      <span
        v-if="hasChildren"
        class="expand-toggle"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :style="{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
      <span v-else class="expand-placeholder"></span>

      <!-- 文件夹图标 -->
      <svg class="folder-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>

      <!-- 文件夹名称 -->
      <span class="folder-name">{{ folder.title || '未命名' }}</span>

      <!-- 操作按钮 -->
      <div class="folder-actions" @click.stop>
        <button
          :class="['folder-action-btn', 'favorite-btn', { active: isFavorite }]"
          @click="$emit('toggle-favorite', folder.id)"
          :title="isFavorite ? '取消收藏' : '收藏'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
        <button
          class="folder-action-btn"
          @click="$emit('edit', folder)"
          title="编辑"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="folder-action-btn"
          @click="$emit('delete', folder)"
          title="删除"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 子文件夹 -->
    <div v-if="hasChildren && isExpanded" class="folder-children">
      <FolderItem
        v-for="child in childFolders"
        :key="child.id"
        :folder="child"
        :selected-id="selectedId"
        :favorite-ids="favoriteIds"
        :expanded-ids="expandedIds"
        @select="$emit('select', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @toggle-expand="$emit('toggle-expand', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  folder: {
    type: Object,
    required: true
  },
  selectedId: {
    type: String,
    default: ''
  },
  favoriteIds: {
    type: Array,
    default: () => []
  },
  expandedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'edit', 'delete', 'toggle-favorite', 'toggle-expand'])

// 是否有子文件夹
const hasChildren = computed(() => {
  return props.folder.children && props.folder.children.some(c => !c.url)
})

// 子文件夹列表
const childFolders = computed(() => {
  if (!props.folder.children) return []
  return props.folder.children.filter(c => !c.url)
})

// 是否已收藏
const isFavorite = computed(() => {
  return props.favoriteIds.includes(props.folder.id)
})

// 是否已展开
const isExpanded = computed(() => {
  return props.expandedIds.includes(props.folder.id)
})

// 点击文件夹 - 如果有子文件夹则展开/收起，同时选中
function handleClick() {
  // 选中该文件夹
  emit('select', props.folder.id)
  // 如果有子文件夹，切换展开状态
  if (hasChildren.value) {
    emit('toggle-expand', props.folder.id)
  }
}
</script>

<style scoped>
.folder-item-wrapper {
  margin-bottom: 2px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-item:hover {
  background: #f0f0f5;
}

.folder-item.selected {
  background: #e8ecff;
  color: #667eea;
}

.expand-toggle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  color: #666;
  flex-shrink: 0;
}

.expand-placeholder {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  flex-shrink: 0;
}

.folder-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-actions {
  display: none;
  gap: 4px;
}

.folder-item:hover .folder-actions {
  display: flex;
}

.folder-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-action-btn:hover {
  background: #e0e0e0;
}

.folder-action-btn.favorite-btn.active {
  color: #ffc107;
}

.folder-children {
  margin-left: 16px;
  border-left: 1px solid #e0e0e0;
  padding-left: 4px;
}
</style>