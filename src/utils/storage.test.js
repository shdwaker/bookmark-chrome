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
  it('has interaction and voice defaults', () => {
    expect(DEFAULT_SETTINGS.translate.interactionMode).toBe('selection')
    expect(DEFAULT_SETTINGS.translate.voiceChinese).toBe('')
    expect(DEFAULT_SETTINGS.translate.voiceEnglish).toBe('')
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
  it('preserves interaction and voice settings from saved data', () => {
    const result = normalizeSettings({
      translate: { interactionMode: 'contextmenu', voiceChinese: 'v1', voiceEnglish: 'v2' }
    })
    expect(result.translate.interactionMode).toBe('contextmenu')
    expect(result.translate.voiceChinese).toBe('v1')
    expect(result.translate.voiceEnglish).toBe('v2')
  })
  it('fills interaction and voice defaults when missing from saved data', () => {
    const result = normalizeSettings({ translate: { defaultProvider: 'glm' } })
    expect(result.translate.interactionMode).toBe('selection')
    expect(result.translate.voiceChinese).toBe('')
    expect(result.translate.voiceEnglish).toBe('')
  })
})

describe('DEFAULT_SETTINGS.clock', () => {
  it('has weekday on by default, others off', () => {
    expect(DEFAULT_SETTINGS.clock.showWeekday).toBe(true)
    expect(DEFAULT_SETTINGS.clock.showLunar).toBe(false)
    expect(DEFAULT_SETTINGS.clock.showSeconds).toBe(false)
    expect(DEFAULT_SETTINGS.clock.showMilliseconds).toBe(false)
  })
})

describe('normalizeSettings clock deep-merge', () => {
  it('preserves saved clock settings', () => {
    const result = normalizeSettings({ clock: { showLunar: true, showSeconds: true } })
    expect(result.clock.showLunar).toBe(true)
    expect(result.clock.showSeconds).toBe(true)
    expect(result.clock.showWeekday).toBe(true)
    expect(result.clock.showMilliseconds).toBe(false)
  })
  it('fills defaults when clock block missing', () => {
    const result = normalizeSettings({})
    expect(result.clock.showWeekday).toBe(true)
    expect(result.clock.showLunar).toBe(false)
  })
})
