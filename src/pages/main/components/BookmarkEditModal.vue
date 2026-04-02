<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ bookmark ? '编辑书签' : '添加书签' }}</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>名称</label>
          <input v-model="form.title" type="text" placeholder="请输入书签名称" required>
        </div>
        <div class="form-group">
          <label>网址</label>
          <input v-model="form.url" type="url" placeholder="请输入网址" required>
        </div>
        <div class="form-group">
          <label>保存到文件夹</label>
          <select v-model="form.parentId" required>
            <option value="" disabled>请选择文件夹</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
              {{ '　'.repeat(folder.level) }}{{ folder.title || '未命名' }}
            </option>
          </select>
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
  bookmark: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const bookmarkStore = useBookmarkStore()

const form = ref({
  id: '',
  title: '',
  url: '',
  parentId: ''
})

const folders = computed(() => bookmarkStore.allFolders)

// 初始化表单
watch(() => props.bookmark, (newBookmark) => {
  if (newBookmark) {
    form.value = {
      id: newBookmark.id || '',
      title: newBookmark.title || '',
      url: newBookmark.url || '',
      parentId: newBookmark.parentId || bookmarkStore.currentFolderId || ''
    }
  } else {
    form.value = {
      id: '',
      title: '',
      url: '',
      parentId: bookmarkStore.currentFolderId || ''
    }
  }
}, { immediate: true })

// 保存
function handleSave() {
  // 确保有parentId
  const parentId = form.value.parentId || bookmarkStore.currentFolderId
  if (!parentId) {
    alert('请选择保存的文件夹')
    return
  }

  // 只在编辑模式（有id）时传递id
  const data = {
    title: form.value.title,
    url: form.value.url,
    parentId: parentId
  }

  if (form.value.id) {
    data.id = form.value.id
  }

  emit('save', data)
}
</script>