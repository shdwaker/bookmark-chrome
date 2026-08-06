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

      <div class="speak-row">
        <button
          class="speak-btn"
          :class="{ speaking: playingKey === 'input-normal' }"
          :disabled="!inputText.trim()"
          @click="toggleSpeak(inputText, 1, 'input-normal')"
        >
          {{ playingKey === 'input-normal' ? '停止' : '朗读原文' }}
        </button>
        <button
          class="speak-btn"
          :class="{ speaking: playingKey === 'input-slow' }"
          :disabled="!inputText.trim()"
          @click="toggleSpeak(inputText, 0.6, 'input-slow')"
        >
          {{ playingKey === 'input-slow' ? '停止' : '慢速原文' }}
        </button>
        <button
          v-if="hasInputEnglish"
          class="speak-btn"
          :class="{ active: inputSyllableMode }"
          @click="inputSyllableMode = !inputSyllableMode"
        >
          {{ inputSyllableMode ? '原文' : '音节' }}
        </button>
      </div>

      <div v-if="inputSyllableMode && hasInputEnglish" class="syllable-preview">
        <template v-for="(seg, i) in inputSyllableSegments" :key="i">
          <span v-if="seg.isWord" class="syllable-word" :data-word="seg.word">
            <span
              v-for="(syl, j) in seg.syllables"
              :key="j"
              class="syllable"
              :style="{ backgroundColor: SYLLABLE_COLORS[j % SYLLABLE_COLORS.length] }"
            >{{ syl.text }}</span>
          </span>
          <template v-else>{{ seg.text }}</template>
        </template>
      </div>

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
          <div class="speak-group">
            <button
              class="speak-btn"
              :class="{ speaking: playingKey === 'result-normal' }"
              @click="toggleSpeak(store.result.translation, 1, 'result-normal')"
            >
              {{ playingKey === 'result-normal' ? '停止' : '朗读' }}
            </button>
            <button
              class="speak-btn"
              :class="{ speaking: playingKey === 'result-slow' }"
              @click="toggleSpeak(store.result.translation, 0.6, 'result-slow')"
            >
              {{ playingKey === 'result-slow' ? '停止' : '慢速' }}
            </button>
            <button
              v-if="hasEnglish"
              class="speak-btn"
              :class="{ active: syllableMode }"
              @click="syllableMode = !syllableMode"
            >
              {{ syllableMode ? '原文' : '音节' }}
            </button>
          </div>
        </div>
        <div v-if="syllableMode" class="result-translation">
          <template v-for="(seg, i) in syllableSegments" :key="i">
            <span v-if="seg.isWord" class="syllable-word" :data-word="seg.word">
              <span
                v-for="(syl, j) in seg.syllables"
                :key="j"
                class="syllable"
                :style="{ backgroundColor: SYLLABLE_COLORS[j % SYLLABLE_COLORS.length] }"
              >{{ syl.text }}</span>
            </span>
            <template v-else>{{ seg.text }}</template>
          </template>
        </div>
        <div v-else class="result-translation">{{ store.result.translation }}</div>
        <div v-if="store.loading" class="translating-hint">翻译中...</div>
        <div v-if="!store.loading && store.result.notes" class="result-notes">{{ store.result.notes }}</div>
        <div v-if="speakHint" class="speak-hint">{{ speakHint }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTranslateStore } from '@/stores/translate'
import { getSettings } from '@/utils/storage'
import { PROVIDERS } from '@/utils/translate/providers'
import { splitSyllables } from '@/utils/translate/syllable-splitter'

defineEmits(['close'])
const store = useTranslateStore()

const inputText = ref('')
const provider = ref('qwen')
const direction = ref('auto')
const configuredProviders = ref([])
const playingKey = ref('')
const speakHint = ref('')
const voiceSettings = ref({ voiceChinese: '', voiceEnglish: '' })
const syllableMode = ref(false)
const inputSyllableMode = ref(false)
let voices = []

const SYLLABLE_COLORS = [
  '#ffd6d6', '#d6e4ff', '#d6ffd6', '#ffe8d6',
  '#e8d6ff', '#d6f5ff', '#fff5d6', '#ffd6e8'
]

function computeSyllableSegments(text) {
  const segments = []
  const regex = /[a-zA-Z][a-zA-Z']*/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ isWord: false, text: text.slice(lastIndex, match.index) })
    }
    const word = match[0]
    if (word.length <= 1) {
      segments.push({ isWord: false, text: word })
    } else {
      segments.push({ isWord: true, word, syllables: splitSyllables(word) })
    }
    lastIndex = match.index + word.length
  }
  if (lastIndex < text.length) {
    segments.push({ isWord: false, text: text.slice(lastIndex) })
  }
  return segments
}

const hasEnglish = computed(() =>
  store.result && /[a-zA-Z]{2,}/.test(store.result.translation)
)

const syllableSegments = computed(() =>
  store.result ? computeSyllableSegments(store.result.translation) : []
)

const hasInputEnglish = computed(() =>
  /[a-zA-Z]{2,}/.test(inputText.value)
)

const inputSyllableSegments = computed(() =>
  inputText.value ? computeSyllableSegments(inputText.value) : []
)

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

onMounted(async () => {
  const settings = await getSettings()
  provider.value = store.provider || settings.translate.defaultProvider
  direction.value = store.direction
  voiceSettings.value = {
    voiceChinese: settings.translate.voiceChinese || '',
    voiceEnglish: settings.translate.voiceEnglish || ''
  }
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
  syllableMode.value = false
  await store.translate(inputText.value)
}

function pickVoice(lang) {
  // 0. use user-configured voice if set
  const isChinese = lang.startsWith('zh')
  const configuredURI = isChinese ? voiceSettings.value.voiceChinese : voiceSettings.value.voiceEnglish
  if (configuredURI) {
    const v = voices.find(v => v.voiceURI === configuredURI)
    if (v) return v
  }
  // 1. exact match (zh-CN == zh-CN)
  let v = voices.find(v => v.lang === lang)
  if (v) return v
  // 2. prefix match (zh-CN starts with zh -> match zh-TW)
  const prefix = lang.split('-')[0]
  v = voices.find(v => v.lang.startsWith(prefix))
  if (v) return v
  return null
}

function toggleSpeak(text, rate, key) {
  if (playingKey.value === key) {
    stopSpeak()
    return
  }
  speak(text, rate, key)
}

function speak(text, rate = 1, key = '') {
  if (!('speechSynthesis' in window)) {
    speakHint.value = '当前浏览器不支持语音合成'
    return
  }
  // refresh voices list (Chrome loads async)
  loadVoices()

  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  // detect language from the actual text, not direction
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utter.lang = isChinese ? 'zh-CN' : 'en-US'

  const voice = pickVoice(utter.lang)
  if (voice) utter.voice = voice
  utter.rate = rate
  utter.pitch = 1
  utter.volume = 1

  utter.onstart = () => {
    playingKey.value = key
    speakHint.value = ''
  }
  utter.onend = () => {
    playingKey.value = ''
    speakHint.value = ''
  }
  utter.onerror = (e) => {
    playingKey.value = ''
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
  playingKey.value = ''
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
.speak-btn:disabled { border-color: #ccc; color: #ccc; cursor: not-allowed; }
.speak-btn.speaking { background: #4a90d9; color: white; }
.speak-btn.active { background: #4a90d9; color: white; }
.speak-row { display: flex; gap: 8px; margin-bottom: 12px; }
.speak-group { display: flex; gap: 6px; }
.speak-hint { font-size: 12px; color: #e53935; margin-top: 6px; }
.result-translation { font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 12px; white-space: pre-wrap; word-break: break-word; }
.syllable-preview { font-size: 15px; line-height: 1.8; color: #333; margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-radius: 6px; white-space: pre-wrap; word-break: break-word; }
.syllable-word {
  display: inline-block;
  margin: 1px 3px;
  position: relative;
  cursor: default;
  border-radius: 4px;
}
.syllable-word:hover { background: rgba(74, 144, 217, 0.1); }
.syllable {
  display: inline-block;
  padding: 1px 5px;
  margin: 0 1px;
  border-radius: 3px;
  font-size: 14px;
  transition: transform 0.15s;
}
.syllable-word:hover .syllable { transform: translateY(-1px); }
.syllable-word[data-word]:hover::after {
  content: attr(data-word);
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}
.translating-hint { color: #888; font-size: 13px; padding: 4px 0 8px; }
.result-notes { font-size: 13px; color: #666; line-height: 1.5; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; }
</style>
