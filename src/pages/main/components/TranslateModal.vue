<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content translate-modal">
      <button class="modal-close" @click="$emit('close')">×</button>
      <h3 class="modal-title">AI 翻译</h3>

      <div class="translate-controls">
        <select v-model="provider" @change="store.setProvider(provider)">
          <option v-for="name in configuredProviders" :key="name" :value="name">
            {{ providerLabel(name) }}
          </option>
        </select>
        <select v-model="direction" @change="store.setDirection(direction)">
          <option value="auto">自动检测</option>
          <option value="zh-en">中->英</option>
          <option value="en-zh">英->中</option>
        </select>
      </div>

      <textarea
        v-model="inputText"
        placeholder="输入要翻译的文本..."
        rows="4"
        @keydown.ctrl.enter="handleTranslate"
      ></textarea>

      <button
        class="btn btn-primary"
        :disabled="store.loading || !inputText.trim()"
        @click="handleTranslate"
      >
        {{ store.loading ? '翻译中...' : '翻译' }}
      </button>

      <div v-if="store.error" class="translate-error">{{ store.error }}</div>

      <div v-if="store.result" class="translate-result">
        <div class="result-row">
          <div class="result-label">译文</div>
          <button class="speak-btn" @click="speak(store.result.translation)">朗读</button>
        </div>
        <div class="result-translation">{{ store.result.translation }}</div>
        <div v-if="store.result.notes" class="result-notes">{{ store.result.notes }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTranslateStore } from '@/stores/translate'
import { getSettings } from '@/utils/storage'
import { PROVIDERS } from '@/utils/translate/providers'

defineEmits(['close'])
const store = useTranslateStore()

const inputText = ref('')
const provider = ref('qwen')
const direction = ref('auto')
const configuredProviders = ref([])

onMounted(async () => {
  const settings = await getSettings()
  provider.value = store.provider || settings.translate.defaultProvider
  direction.value = store.direction
  const withKeys = Object.keys(settings.translate.providers).filter(
    name => settings.translate.providers[name].apiKey
  )
  configuredProviders.value = withKeys.length > 0 ? withKeys : Object.keys(PROVIDERS)
})

function providerLabel(name) {
  return PROVIDERS[name]?.label || name
}

async function handleTranslate() {
  store.setProvider(provider.value)
  store.setDirection(direction.value)
  await store.translate(inputText.value)
}

function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = direction.value === 'zh-en' ? 'en-US' : 'zh-CN'
  window.speechSynthesis.speak(utter)
}
</script>

<style scoped>
.translate-modal { max-width: 520px; padding: 24px; position: relative; }
.modal-close { position: absolute; top: 12px; right: 16px; background: transparent; border: none; font-size: 24px; cursor: pointer; color: #999; }
.modal-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.translate-controls { display: flex; gap: 8px; margin-bottom: 12px; }
.translate-controls select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical; margin-bottom: 12px; box-sizing: border-box; }
.btn-primary { background: #4a90d9; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.translate-error { color: #e53935; font-size: 13px; margin-top: 12px; }
.translate-result { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
.result-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.result-label { font-size: 13px; color: #888; }
.speak-btn { background: transparent; border: 1px solid #4a90d9; color: #4a90d9; padding: 3px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.result-translation { font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 12px; }
.result-notes { font-size: 13px; color: #666; line-height: 1.5; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; }
</style>
