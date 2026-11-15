<template>
  <div class="vocabulary-page">
    <div class="vocabulary-header">
      <div>
        <h2>英文生词知识库</h2>
        <p>通过右键“AI翻译 → 保存生词”添加；记录使用 Chrome Sync 同步。</p>
      </div>
      <div class="header-actions">
        <input v-model="keyword" class="search-input" placeholder="搜索单词、释义或例句" />
        <button class="refresh-btn" @click="loadVocabulary">刷新</button>
      </div>
    </div>

    <div v-if="loading" class="empty-state">正在加载生词...</div>
    <div v-if="speechHint" class="speech-hint">{{ speechHint }}</div>
    <div v-else-if="filteredVocabulary.length === 0" class="empty-state">
      暂无生词。在网页中选中一个英文单词后，右键保存即可生成知识卡。
    </div>

    <div v-else class="vocabulary-grid">
      <article v-for="entry in filteredVocabulary" :key="entry.storageKey" class="vocabulary-card">
        <div class="card-header">
          <h3>{{ entry.word }}</h3>
          <div class="word-actions">
            <button
              class="speak-btn"
              :class="{ speaking: speakingKey === `word:${entry.storageKey}` }"
              :title="speakingKey === `word:${entry.storageKey}` ? '停止朗读' : '朗读生词'"
              @click="toggleSpeak(entry.word, `word:${entry.storageKey}`)"
            >
              {{ speakingKey === `word:${entry.storageKey}` ? '停止' : '朗读' }}
            </button>
            <button class="delete-btn" title="删除生词" @click="handleDelete(entry)">删除</button>
          </div>
        </div>
        <p class="meaning">{{ entry.meaning }}</p>

        <div v-if="entry.examples?.length" class="section">
          <h4>例句</h4>
          <div v-for="(example, index) in entry.examples" :key="index" class="example">
            <div class="example-row">
              <p class="example-text">{{ example.text }}</p>
              <button
                class="speak-btn example-speak-btn"
                :class="{ speaking: speakingKey === `example:${entry.storageKey}:${index}` }"
                :title="speakingKey === `example:${entry.storageKey}:${index}` ? '停止朗读' : '朗读例句'"
                @click="toggleSpeak(example.text, `example:${entry.storageKey}:${index}`)"
              >
                {{ speakingKey === `example:${entry.storageKey}:${index}` ? '停止' : '朗读' }}
              </button>
            </div>
            <p class="example-translation">{{ example.translation }}</p>
          </div>
        </div>

        <div v-if="entry.similarWords?.length" class="section">
          <h4>近义 / 相似词</h4>
          <div class="similar-list">
            <span v-for="similar in entry.similarWords" :key="similar.word" class="similar-chip">
              <strong>{{ similar.word }}</strong> {{ similar.meaning }}
            </span>
          </div>
        </div>

        <div class="card-footer">
          <span>{{ formatDate(entry.createdAt) }} 保存</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getVocabulary, deleteVocabularyEntry } from '@/utils/translate/vocabulary'
import { getSettings } from '@/utils/storage'

const vocabulary = ref([])
const loading = ref(true)
const keyword = ref('')
const speakingKey = ref('')
const speechHint = ref('')
const voiceEnglish = ref('')
let voices = []

const filteredVocabulary = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return vocabulary.value
  return vocabulary.value.filter(entry => [
    entry.word,
    entry.meaning,
    entry.context,
    ...(entry.examples || []).map(example => `${example.text} ${example.translation}`),
    ...(entry.similarWords || []).map(similar => `${similar.word} ${similar.meaning}`)
  ].join(' ').toLowerCase().includes(query))
})

async function loadVocabulary() {
  loading.value = true
  try {
    vocabulary.value = await getVocabulary()
  } finally {
    loading.value = false
  }
}

async function handleDelete(entry) {
  await deleteVocabularyEntry(entry.storageKey)
  vocabulary.value = vocabulary.value.filter(item => item.storageKey !== entry.storageKey)
}

function formatDate(value) {
  return new Date(value).toLocaleString()
}

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

function pickVoice(lang) {
  const configuredURI = lang.startsWith('zh') ? '' : voiceEnglish.value
  if (configuredURI) {
    const configured = voices.find(voice => voice.voiceURI === configuredURI)
    if (configured) return configured
  }
  return voices.find(voice => voice.lang === lang)
    || voices.find(voice => voice.lang.startsWith(lang.split('-')[0]))
    || null
}

function stopSpeak() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  speakingKey.value = ''
}

function toggleSpeak(text, key) {
  if (speakingKey.value === key) {
    stopSpeak()
    return
  }
  speak(text, key)
}

function speak(text, key) {
  if (!('speechSynthesis' in window)) {
    speechHint.value = '当前浏览器不支持语音合成'
    return
  }
  loadVoices()
  const synth = window.speechSynthesis
  synth.cancel()
  speakingKey.value = key
  speechHint.value = ''

  const utterance = new SpeechSynthesisUtterance(text)
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utterance.lang = isChinese ? 'zh-CN' : 'en-US'
  utterance.rate = 1
  utterance.pitch = 1
  utterance.volume = 1
  const voice = pickVoice(utterance.lang)
  if (voice) utterance.voice = voice
  utterance.onstart = () => {
    speakingKey.value = key
    speechHint.value = ''
  }
  utterance.onend = () => {
    if (speakingKey.value === key) speakingKey.value = ''
  }
  utterance.onerror = (event) => {
    if (speakingKey.value !== key) return
    speakingKey.value = ''
    speechHint.value = `朗读失败：${event.error || '未知错误'}`
  }
  setTimeout(() => synth.speak(utterance), 50)
}

async function loadVoicePreferences() {
  const settings = await getSettings()
  voiceEnglish.value = settings.translate.voiceEnglish || ''
}

onMounted(async () => {
  await Promise.all([loadVocabulary(), loadVoicePreferences()])
  loadVoices()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
  }
})

onUnmounted(() => {
  stopSpeak()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }
})
</script>

<style scoped>
.vocabulary-page { padding: 20px 28px; }
.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.vocabulary-header h2 { margin: 0 0 4px; font-size: 22px; color: #222; }
.vocabulary-header p { margin: 0; font-size: 13px; color: #777; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.search-input {
  width: 260px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}
.refresh-btn {
  padding: 8px 14px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #fff;
  color: #4a90d9;
  cursor: pointer;
}
.empty-state {
  padding: 40px;
  border: 1px dashed #ddd;
  border-radius: 12px;
  text-align: center;
  color: #777;
  background: #fafafa;
}
.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-items: start;
}
.vocabulary-card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,.05);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.word-actions { display: flex; align-items: center; gap: 8px; }
.speak-btn {
  padding: 4px 9px;
  border: 1px solid #4a90d9;
  border-radius: 6px;
  background: #fff;
  color: #4a90d9;
  cursor: pointer;
  font-size: 12px;
}
.speak-btn:hover { background: #eef4fc; }
.speak-btn.speaking { background: #4a90d9; color: #fff; }
.card-header h3 { margin: 0; font-size: 19px; color: #333; }
.delete-btn {
  border: none;
  background: transparent;
  color: #e53935;
  cursor: pointer;
  font-size: 12px;
}
.meaning { margin: 0 0 14px; line-height: 1.6; color: #444; }
.section { margin-bottom: 14px; }
.section h4 { margin: 0 0 8px; font-size: 13px; color: #888; }
.example { margin-bottom: 8px; }
.example-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.example-text { margin: 0; font-size: 14px; line-height: 1.5; color: #555; }
.example-speak-btn { flex-shrink: 0; margin-top: 2px; }
.speech-hint { margin: 0; font-size: 12px; color: #e53935; }
.example-translation { margin: 2px 0 0; font-size: 14px; line-height: 1.5; color: #333; }
.similar-list { display: flex; flex-wrap: wrap; gap: 6px; }
.similar-chip {
  padding: 5px 9px;
  background: #eef4fc;
  color: #456;
  border-radius: 999px;
  font-size: 12px;
}
.card-footer { margin-top: 12px; font-size: 12px; color: #999; }
</style>
