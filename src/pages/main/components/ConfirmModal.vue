<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content confirm-modal">
      <div class="confirm-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message" v-html="message"></p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-danger" @click="$emit('confirm')">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: ''
  }
})

defineEmits(['close', 'confirm'])
</script>

<style scoped>
.confirm-modal {
  max-width: 400px;
  text-align: center;
  padding: 32px 24px;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.confirm-message {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-danger {
  background: #e53935;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}
</style>