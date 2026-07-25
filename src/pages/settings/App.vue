<template>
  <div class="settings-container">
    <div class="settings-layout">
      <div class="settings-nav-wrapper">
        <nav class="settings-nav">
          <a v-for="s in sections" :key="s.id" :class="{ active: activeSection === s.id }"
             @click="scrollToSection(s.id)">{{ s.label }}</a>
        </nav>
        <div class="nav-divider"></div>
        <button class="back-btn" @click="goBack">返回 MarkTrace</button>
      </div>
      <div class="settings-content">
        <!-- 访问记录追踪 -->
        <div class="settings-section" id="trace">
          <h2>访问记录追踪</h2>
        <div class="setting-item">
          <div class="setting-label">
            <span>启用访问记录追踪</span>
            <span class="setting-desc">记录您访问的网页地址，用于生成网站留痕和网址留痕</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.enableTrace" @change="saveSettings">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>记录保留天数</span>
            <span class="setting-desc">超过此天数的访问记录将被自动清理</span>
          </div>
          <select v-model.number="settings.traceRetentionDays" @change="saveSettings">
            <option :value="1">1天</option>
            <option :value="3">3天</option>
            <option :value="7">7天</option>
            <option :value="14">14天</option>
            <option :value="30">30天</option>
          </select>
        </div>
      </div>

      <!-- 书签显示 -->
      <div class="settings-section" id="display">
        <h2>书签显示</h2>
        <div class="setting-item">
          <div class="setting-label">
            <span>每页显示书签数量</span>
            <span class="setting-desc">书签列表每页显示的书签数量</span>
          </div>
          <select v-model.number="settings.bookmarksPerPage" @change="saveSettings">
            <option :value="10">10个</option>
            <option :value="20">20个</option>
            <option :value="50">50个</option>
            <option :value="100">100个</option>
          </select>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>默认选中的根文件夹</span>
            <span class="setting-desc">打开插件时默认显示的书签文件夹</span>
          </div>
          <select v-model="settings.defaultRootFolder" @change="saveSettings">
            <option value="">自动选择</option>
            <option v-for="folder in rootFolders" :key="folder.id" :value="folder.id">
              {{ folder.title || '未命名' }}
            </option>
          </select>
        </div>
      </div>

      <!-- 排除域名 -->
      <div class="settings-section" id="domains">
        <h2>排除域名</h2>
        <p class="section-desc">以下域名的访问将不会被记录</p>
        <div class="domain-list">
          <div v-for="domain in settings.excludedDomains" :key="domain" class="domain-item">
            <span>{{ domain }}</span>
            <button class="remove-btn" @click="removeDomain(domain)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div v-if="settings.excludedDomains.length === 0" class="empty-hint">
            暂无排除的域名
          </div>
        </div>
        <div class="add-domain">
          <input
            v-model="newDomain"
            type="text"
            placeholder="输入域名，如 example.com"
            @keyup.enter="addDomain"
          >
          <button class="add-btn" @click="addDomain">添加</button>
        </div>
      </div>

      <!-- AI 翻译 -->
      <div class="settings-section" id="translate">
        <h2>AI 翻译</h2>
        <p class="section-desc">配置大模型 API key，支持阿里千问、火山豆包、智谱 GLM、Kimi</p>
        <div v-for="name in translateProviderNames" :key="name" class="setting-item translate-provider-row">
          <div class="provider-info">
            <div class="provider-name">{{ translateProviderLabel(name) }}</div>
            <div v-if="translateProviderHint(name)" class="setting-desc">{{ translateProviderHint(name) }}</div>
          </div>
          <div class="translate-inputs">
            <input
              v-model="settings.translate.providers[name].apiKey"
              type="text"
              placeholder="API key"
              @change="saveSettings"
            >
            <input
              v-model="settings.translate.providers[name].model"
              type="text"
              :placeholder="translateModelPlaceholder(name)"
              @change="saveSettings"
            >
            <button class="add-btn test-btn" @click="testConnection(name)">测试</button>
          </div>
          <div class="translate-endpoint">
            <select v-model="settings.translate.providers[name].apiFormat" @change="saveSettings" class="format-select">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <input
              v-model="settings.translate.providers[name].baseURL"
              type="text"
              :placeholder="formatPlaceholder(name)"
              @change="saveSettings"
            >
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>默认模型</span>
            <span class="setting-desc">打开翻译弹窗时默认使用的模型</span>
          </div>
          <select v-model="settings.translate.defaultProvider" @change="saveSettings">
            <option v-for="name in translateProviderNames" :key="name" :value="name">
              {{ translateProviderLabel(name) }}
            </option>
          </select>
        </div>

        <h3 class="subsection-title">交互方式</h3>
        <div class="setting-item">
          <div class="setting-label">
            <span>触发方式</span>
            <span class="setting-desc">选中网页文本后的交互方式（二选一）</span>
          </div>
          <select v-model="settings.translate.interactionMode" @change="saveSettings">
            <option value="selection">选中文本时显示按钮</option>
            <option value="contextmenu">右键菜单</option>
          </select>
        </div>

        <h3 class="subsection-title">语音设置</h3>
        <div class="setting-item">
          <div class="setting-label">
            <span>中文朗读语音</span>
            <span class="setting-desc">朗读中文时使用的语音，留空则自动选择</span>
          </div>
          <div class="voice-row">
            <select v-model="settings.translate.voiceChinese" @change="saveSettings">
              <option value="">默认（自动选择）</option>
              <option v-for="v in chineseVoices" :key="v.voiceURI" :value="v.voiceURI">
                {{ voiceLabel(v) }}
              </option>
            </select>
            <button class="add-btn test-btn" @click="testVoice('zh')">测试</button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>英文朗读语音</span>
            <span class="setting-desc">朗读英文时使用的语音，留空则自动选择</span>
          </div>
          <div class="voice-row">
            <select v-model="settings.translate.voiceEnglish" @change="saveSettings">
              <option value="">默认（自动选择）</option>
              <option v-for="v in englishVoices" :key="v.voiceURI" :value="v.voiceURI">
                {{ voiceLabel(v) }}
              </option>
            </select>
            <button class="add-btn test-btn" @click="testVoice('en')">测试</button>
          </div>
        </div>
      </div>

      <!-- 时钟显示 -->
      <div class="settings-section" id="clock">
        <h2>时钟显示</h2>
        <p class="section-desc">配置页签标题栏时钟的显示组件</p>
        <div class="setting-item">
          <div class="setting-label">
            <span>显示星期</span>
            <span class="setting-desc">在时间后显示星期几</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.clock.showWeekday" @change="saveSettings">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>显示农历</span>
            <span class="setting-desc">显示农历日期，如 农历:六月初十</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.clock.showLunar" @change="saveSettings">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>显示秒</span>
            <span class="setting-desc">显示秒数，每秒更新</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.clock.showSeconds" @change="saveSettings">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>显示毫秒</span>
            <span class="setting-desc">显示毫秒数，更新频率为 10ms</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.clock.showMilliseconds" @change="saveSettings">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="settings-section" id="data">
        <h2>数据管理</h2>
        <div class="setting-item">
          <div class="setting-label">
            <span>清除访问记录</span>
            <span class="setting-desc">清除所有访问记录数据</span>
          </div>
          <button class="danger-btn" @click="clearAllTraces">清除数据</button>
        </div>
      </div>

      <!-- 重置 -->
      <div class="settings-section" id="reset">
        <h2>重置</h2>
        <div class="setting-item">
          <div class="setting-label">
            <span>恢复默认设置</span>
            <span class="setting-desc">将所有设置恢复到默认值</span>
          </div>
          <button class="secondary-btn" @click="resetAllSettings">重置</button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useBookmarkStore } from '@/stores/bookmarks'
import { clearAllRecords } from '@/utils/trace-manager'
import { PROVIDERS } from '@/utils/translate/providers'
import { translate as translateApi } from '@/utils/translate/translate-api'

const settingsStore = useSettingsStore()
const bookmarkStore = useBookmarkStore()

const settings = computed(() => settingsStore.settings)
const rootFolders = computed(() => bookmarkStore.rootFolders)

const newDomain = ref('')
const voices = ref([])

const chineseVoices = computed(() => voices.value.filter(v => v.lang && v.lang.toLowerCase().startsWith('zh')))
const englishVoices = computed(() => voices.value.filter(v => v.lang && v.lang.toLowerCase().startsWith('en')))

function voiceLabel(v) {
  return `${v.name} (${v.lang})`
}

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices.value = window.speechSynthesis.getVoices()
}

onMounted(async () => {
  await settingsStore.init()
  await bookmarkStore.init()
  loadVoices()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
  // Scroll spy
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) activeSection.value = e.target.id })
  }, { rootMargin: '-10% 0px -80% 0px' })
  document.querySelectorAll('.settings-section').forEach(s => observer.observe(s))
})

const sections = [
  { id: 'trace', label: '访问记录追踪' },
  { id: 'display', label: '书签显示' },
  { id: 'domains', label: '排除域名' },
  { id: 'translate', label: 'AI 翻译' },
  { id: 'clock', label: '时钟显示' },
  { id: 'data', label: '数据管理' },
  { id: 'reset', label: '重置' }
]
const activeSection = ref('trace')

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 保存设置
async function saveSettings() {
  await settingsStore.updateSettings(settings.value)
}

// 测试语音
function testVoice(lang) {
  if (!('speechSynthesis' in window)) {
    alert('当前浏览器不支持语音合成')
    return
  }
  const text = lang === 'zh' ? '你好' : 'hello'
  const voiceURI = lang === 'zh'
    ? settings.value.translate.voiceChinese
    : settings.value.translate.voiceEnglish
  const synth = window.speechSynthesis
  synth.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  if (voiceURI) {
    const v = voices.value.find(v => v.voiceURI === voiceURI)
    if (v) utter.voice = v
  }
  utter.rate = 1
  synth.speak(utter)
}

// 添加排除域名
async function addDomain() {
  const domain = newDomain.value.trim()
  if (domain && !settings.value.excludedDomains.includes(domain)) {
    await settingsStore.addExcludedDomain(domain)
    newDomain.value = ''
  }
}

// 移除排除域名
async function removeDomain(domain) {
  await settingsStore.removeExcludedDomain(domain)
}

const translateProviderNames = Object.keys(PROVIDERS)

function translateProviderLabel(name) {
  return PROVIDERS[name]?.label || name
}

function translateProviderHint(name) {
  if (name === 'doubao') return 'Coding plan 用户：格式选 Anthropic，Base URL 填 https://ark.cn-beijing.volces.com/api/plan，model 填 glm-5.2 等'
  return ''
}

function translateModelPlaceholder(name) {
  return PROVIDERS[name]?.defaultModel || '模型名'
}

function formatPlaceholder(name) {
  const fmt = settings.value.translate.providers[name].apiFormat
  if (fmt === 'anthropic') {
    return 'https://ark.cn-beijing.volces.com/api/plan'
  }
  return PROVIDERS[name]?.baseURL || 'Base URL'
}

async function testConnection(name) {
  const cfg = settings.value.translate.providers[name]
  if (!cfg.apiKey) { alert('请先填 API key'); return }
  console.log('[translate] testing', name, 'model=', cfg.model, 'apiFormat=', cfg.apiFormat, 'baseURL=', cfg.baseURL || '(default)', 'keyLength=', cfg.apiKey.length)
  try {
    await translateApi({
      text: 'hi',
      direction: 'auto',
      provider: name,
      apiKey: cfg.apiKey,
      model: cfg.model,
      baseURL: cfg.baseURL,
      apiFormat: cfg.apiFormat
    })
    alert(`${translateProviderLabel(name)} 连接成功`)
  } catch (err) {
    console.error('[translate] test failed for', name, err)
    alert(`${translateProviderLabel(name)} 连接失败：${err.message}`)
  }
}

// 清除所有访问记录
async function clearAllTraces() {
  if (confirm('确定要清除所有访问记录吗？此操作不可恢复。')) {
    await clearAllRecords()
    alert('访问记录已清除')
  }
}

// 重置设置
async function resetAllSettings() {
  if (confirm('确定要恢复默认设置吗？')) {
    await settingsStore.resetSettings()
    alert('设置已恢复默认值')
  }
}

// 返回
function goBack() {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/main/index.html') })
}
</script>