<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ folder ? '编辑文件夹' : '新建文件夹' }}</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>文件夹名称</label>
          <input v-model="form.title" type="text" placeholder="请输入文件夹名称" required>
        </div>
        <div class="form-group" v-if="!folder">
          <label>上级文件夹</label>
          <div class="folder-tree-select">
            <div
              v-for="f in folderTree"
              :key="f.id"
              :class="['tree-item', { selected: form.parentId === f.id }]"
              :style="{ paddingLeft: (f.level * 16 + 12) + 'px' }"
              @click="form.parentId = f.id"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ f.title || '未命名' }}</span>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useBookmarkStore } from '@/stores/bookmarks'

const props = defineProps({
  folder: {
    type: Object,
    default: null
  },
  parentId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save'])

const bookmarkStore = useBookmarkStore()

const form = ref({
  id: '',
  title: '',
  parentId: ''
})

// 获取当前根文件夹下的所有子文件夹（扁平化）
const folderTree = computed(() => {
  const rootId = bookmarkStore.currentRootFolderId
  if (!rootId) return []

  // 递归获取所有子文件夹
  const result = []
  function flattenFolders(nodes, level = 0) {
    for (const node of nodes) {
      if (!node.url) { // 是文件夹
        result.push({
          id: node.id,
          title: node.title,
          level
        })
        if (node.children) {
          flattenFolders(node.children, level + 1)
        }
      }
    }
  }

  // 从当前根文件夹开始
  const rootNode = findFolderById(bookmarkStore.bookmarkTree, rootId)
  if (rootNode && rootNode.children) {
    // 先添加根文件夹本身
    result.push({
      id: rootNode.id,
      title: rootNode.title,
      level: 0
    })
    // 再添加子文件夹
    flattenFolders(rootNode.children, 1)
  }

  return result
})

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

// 初始化表单
watch(() => props.folder, (newFolder) => {
  if (newFolder) {
    form.value = {
      id: newFolder.id || '',
      title: newFolder.title || '',
      parentId: newFolder.parentId || ''
    }
  } else {
    form.value = {
      id: '',
      title: '',
      parentId: props.parentId || bookmarkStore.currentFolderId || ''
    }
  }
}, { immediate: true })

// 保存
function handleSave() {
  const data = {
    title: form.value.title,
    parentId: form.value.parentId
  }

  if (form.value.id) {
    data.id = form.value.id
  }

  emit('save', data)
}
</script>

<style scoped>
.folder-tree-select {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.tree-item:last-child {
  border-bottom: none;
}

.tree-item:hover {
  background: #f5f5f5;
}

.tree-item.selected {
  background: #e8ecff;
  color: #667eea;
}

.tree-item svg {
  flex-shrink: 0;
}

.tree-item span {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>