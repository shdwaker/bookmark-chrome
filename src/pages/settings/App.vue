<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>设置</h1>
      <p>书签管理器配置</p>
    </div>

    <div class="settings-content">
      <!-- 访问记录追踪 -->
      <div class="settings-section">
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
      <div class="settings-section">
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
      <div class="settings-section">
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

      <!-- 数据管理 -->
      <div class="settings-section">
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
      <div class="settings-section">
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

    <div class="settings-footer">
      <button class="back-btn" @click="goBack">返回书签管理</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useBookmarkStore } from '@/stores/bookmarks'
import { clearAllRecords } from '@/utils/trace-manager'

const settingsStore = useSettingsStore()
const bookmarkStore = useBookmarkStore()

const settings = computed(() => settingsStore.settings)
const rootFolders = computed(() => bookmarkStore.rootFolders)

const newDomain = ref('')

onMounted(async () => {
  await settingsStore.init()
  await bookmarkStore.init()
})

// 保存设置
async function saveSettings() {
  await settingsStore.updateSettings(settings.value)
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