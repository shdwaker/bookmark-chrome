import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings } from '@/utils/storage'
import { translate as translateApi } from '@/utils/translate/translate-api'

export const useTranslateStore = defineStore('translate', () => {
  const result = ref(null)
  const loading = ref(false)
  const error = ref('')
  const provider = ref('qwen')
  const direction = ref('auto')

  async function translate(text) {
    const settings = await getSettings()
    const tSettings = settings.translate
    const useProvider = provider.value || tSettings.defaultProvider
    const providerConfig = tSettings.providers[useProvider]
    if (!providerConfig || !providerConfig.apiKey) {
      error.value = `请先在设置中配置 ${useProvider} 的 API key`
      return
    }
    loading.value = true
    error.value = ''
    result.value = null
    try {
      result.value = await translateApi({
        text,
        direction: direction.value,
        provider: useProvider,
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        endpoint: providerConfig.endpoint,
        apiFormat: providerConfig.apiFormat
      })
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function setProvider(p) { provider.value = p }
  function setDirection(d) { direction.value = d }
  function clear() { result.value = null; error.value = '' }

  return { result, loading, error, provider, direction, translate, setProvider, setDirection, clear }
})
