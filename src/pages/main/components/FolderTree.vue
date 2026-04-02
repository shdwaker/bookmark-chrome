<template>
  <div class="folder-tree">
    <div class="folder-tree-header">
      <h3>文件夹</h3>
      <button class="add-folder-btn" @click="$emit('add-folder')" title="新建文件夹">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
    <div class="folder-tree-content">
      <FolderItem
        v-for="folder in folders"
        :key="folder.id"
        :folder="folder"
        :selected-id="selectedFolderId"
        :favorite-ids="favoriteIds"
        :expanded-ids="expandedIds"
        @select="$emit('select-folder', $event)"
        @edit="$emit('edit-folder', $event)"
        @delete="$emit('delete-folder', $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @toggle-expand="handleToggleExpand"
      />
      <div v-if="folders.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>暂无子文件夹</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import FolderItem from './FolderItem.vue'

defineProps({
  folders: {
    type: Array,
    default: () => []
  },
  selectedFolderId: {
    type: String,
    default: ''
  },
  favoriteIds: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select-folder', 'add-folder', 'edit-folder', 'delete-folder', 'toggle-favorite'])

// 展开的文件夹ID列表
const expandedIds = ref([])

// 切换文件夹展开状态
function handleToggleExpand(folderId) {
  const index = expandedIds.value.indexOf(folderId)
  if (index > -1) {
    // 已展开，则折叠
    expandedIds.value.splice(index, 1)
  } else {
    // 未展开，则展开
    expandedIds.value.push(folderId)
  }
}
</script>