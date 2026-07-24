import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings } from './storage'

describe('DEFAULT_SETTINGS.translate', () => {
  it('has default provider qwen and all four providers with empty apiKey', () => {
    expect(DEFAULT_SETTINGS.translate.defaultProvider).toBe('qwen')
    for (const name of ['qwen', 'doubao', 'glm', 'kimi']) {
      expect(DEFAULT_SETTINGS.translate.providers[name].apiKey).toBe('')
      expect('model' in DEFAULT_SETTINGS.translate.providers[name]).toBe(true)
    }
  })
})

describe('normalizeSettings deep-merge', () => {
  it('keeps a provided provider key without wiping other providers', () => {
    const result = normalizeSettings({
      translate: { providers: { glm: { apiKey: 'sk-xxx', model: 'glm-4' } } }
    })
    expect(result.translate.providers.glm.apiKey).toBe('sk-xxx')
    expect(result.translate.providers.qwen.apiKey).toBe('')
    expect(result.translate.providers.kimi.apiKey).toBe('')
    expect(result.translate.defaultProvider).toBe('qwen')
  })
  it('keeps other top-level settings intact', () => {
    const result = normalizeSettings({ enableTrace: false, bookmarksPerPage: 50 })
    expect(result.enableTrace).toBe(false)
    expect(result.bookmarksPerPage).toBe(50)
    expect(result.translate).toBeDefined()
  })
  it('handles missing translate block', () => {
    const result = normalizeSettings({})
    expect(result.translate.defaultProvider).toBe('qwen')
  })
})
