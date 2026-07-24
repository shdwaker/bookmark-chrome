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
          <button class="speak-btn" :class="{ speaking: isSpeaking }" @click="toggleSpeak(store.result.translation)">
            {{ isSpeaking ? '停止' : '朗读' }}
          </button>
        </div>
        <div class="result-translation">{{ store.result.translation }}</div>
        <div v-if="store.result.notes" class="result-notes">{{ store.result.notes }}</div>
        <div v-if="speakHint" class="speak-hint">{{ speakHint }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTranslateStore } from '@/stores/translate'
import { getSettings } from '@/utils/storage'
import { PROVIDERS } from '@/utils/translate/providers'

defineEmits(['close'])
const store = useTranslateStore()

const inputText = ref('')
const provider = ref('qwen')
const direction = ref('auto')
const configuredProviders = ref([])
const isSpeaking = ref(false)
const speakHint = ref('')
let voices = []

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

onMounted(async () => {
  const settings = await getSettings()
  provider.value = store.provider || settings.translate.defaultProvider
  direction.value = store.direction
  const withKeys = Object.keys(settings.translate.providers).filter(
    name => settings.translate.providers[name].apiKey
  )
  configuredProviders.value = withKeys.length > 0 ? withKeys : Object.keys(PROVIDERS)

  loadVoices()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
})

onUnmounted(() => {
  stopSpeak()
})

function providerLabel(name) {
  return PROVIDERS[name]?.label || name
}

async function handleTranslate() {
  store.setProvider(provider.value)
  store.setDirection(direction.value)
  stopSpeak()
  await store.translate(inputText.value)
}

function pickVoice(lang) {
  // 1. exact match (zh-CN == zh-CN)
  let v = voices.find(v => v.lang === lang)
  if (v) return v
  // 2. prefix match (zh-CN starts with zh -> match zh-TW)
  const prefix = lang.split('-')[0]
  v = voices.find(v => v.lang.startsWith(prefix))
  if (v) return v
  return null
}

function toggleSpeak(text) {
  if (isSpeaking.value) {
    stopSpeak()
    return
  }
  speak(text)
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    speakHint.value = '当前浏览器不支持语音合成'
    return
  }
  // refresh voices list (Chrome loads async)
  loadVoices()

  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  // detect language from the actual translation text, not direction
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utter.lang = isChinese ? 'zh-CN' : 'en-US'

  const voice = pickVoice(utter.lang)
  if (voice) utter.voice = voice
  utter.rate = 1
  utter.pitch = 1
  utter.volume = 1

  utter.onstart = () => {
    isSpeaking.value = true
    speakHint.value = ''
  }
  utter.onend = () => {
    isSpeaking.value = false
    speakHint.value = ''
  }
  utter.onerror = (e) => {
    isSpeaking.value = false
    const err = e?.error || '未知错误'
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      speakHint.value = '浏览器拒绝了语音播放，请检查系统音频/语音权限'
    } else if (err === 'no-speech' || err === 'synthesis-failed') {
      speakHint.value = `朗读失败：系统可能未安装 ${utter.lang} 语音包（错误：${err}）`
    } else {
      speakHint.value = `朗读失败：${err}`
    }
    console.error('[translate] speech error', err, e)
  }

  // Chrome bug: speak() right after cancel() sometimes silently fails; defer to next tick
  setTimeout(() => synth.speak(utter), 50)
}

function stopSpeak() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
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
.speak-btn.speaking { background: #4a90d9; color: white; }
.speak-hint { font-size: 12px; color: #e53935; margin-top: 6px; }
.result-translation { font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 12px; }
.result-notes { font-size: 13px; color: #666; line-height: 1.5; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; }
</style>
