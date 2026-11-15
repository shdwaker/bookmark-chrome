import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings } from '@/utils/storage'
import { translate as translateApi } from '@/utils/translate/translate-api'
import { splitTextIntoChunks, splitTextIntoParagraphs } from '@/utils/translate/chunk'
import { createPool } from '@/utils/translate/inline'

const MODAL_CONCURRENCY = 5

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

    const callOpts = {
      direction: direction.value,
      provider: useProvider,
      apiKey: providerConfig.apiKey,
      model: providerConfig.model,
      baseURL: providerConfig.baseURL,
      apiFormat: providerConfig.apiFormat
    }

    const items = splitTextIntoParagraphs(text).flatMap((paragraph, paragraphIndex) => {
      const chunks = splitTextIntoChunks(paragraph)
      return chunks.map((chunkText, chunkIndex) => ({
        id: chunks.length > 1
          ? `p${paragraphIndex + 1}-${chunkIndex + 1}`
          : `p${paragraphIndex + 1}`,
        text: chunkText,
        translation: '',
        notes: '',
        error: '',
        done: false
      }))
    })

    loading.value = true
    error.value = ''
    result.value = items

    try {
      const pool = createPool({
        items,
        concurrency: MODAL_CONCURRENCY,
        worker: async (item) => {
          const r = await translateApi({ text: item.text, ...callOpts })
          const index = result.value.findIndex(entry => entry.id === item.id)
          if (index >= 0) {
            result.value[index] = {
              ...item,
              translation: r.translation,
              notes: r.notes,
              done: true
            }
          }
          return r
        }
      })

      const { failed } = await pool.promise
      if (failed.length > 0) {
        for (const { item, error: itemError } of failed) {
          const index = result.value.findIndex(entry => entry.id === item.id)
          if (index >= 0) {
            result.value[index] = {
              ...item,
              error: itemError.message,
              done: true
            }
          }
        }
        error.value = `${failed.length} 个段落翻译失败：${failed[0].error.message}`
      }
    } catch (err) {
      // Keep partial results if we have them; show error alongside.
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
