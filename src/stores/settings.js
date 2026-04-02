// 设置状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings, saveSettings } from '@/utils/storage'

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings = {
    enableTrace: true,           // 是否启用访问记录追踪
    traceRetentionDays: 7,       // 记录保留天数
    bookmarksPerPage: 20,        // 每页显示书签数量
    defaultRootFolder: '',       // 默认选中的根文件夹
    excludedDomains: []          // 排除的域名列表
  }

  // 设置状态
  const settings = ref({ ...defaultSettings })

  // 初始化
  async function init() {
    const savedSettings = await getSettings()
    if (savedSettings) {
      settings.value = { ...defaultSettings, ...savedSettings }
    }
  }

  // 更新设置
  async function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    await saveSettings(settings.value)
  }

  // 重置设置
  async function resetSettings() {
    settings.value = { ...defaultSettings }
    await saveSettings(settings.value)
  }

  // 添加排除域名
  async function addExcludedDomain(domain) {
    if (!settings.value.excludedDomains.includes(domain)) {
      settings.value.excludedDomains.push(domain)
      await saveSettings(settings.value)
    }
  }

  // 移除排除域名
  async function removeExcludedDomain(domain) {
    const index = settings.value.excludedDomains.indexOf(domain)
    if (index > -1) {
      settings.value.excludedDomains.splice(index, 1)
      await saveSettings(settings.value)
    }
  }

  return {
    settings,
    init,
    updateSettings,
    resetSettings,
    addExcludedDomain,
    removeExcludedDomain
  }
})