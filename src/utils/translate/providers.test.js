import { describe, expect, it } from 'vitest'
import { PROVIDERS, getProvider, getProviderNames } from './providers'

describe('PROVIDERS', () => {
  it('has all four providers with label, baseURL, defaultModel', () => {
    for (const name of ['qwen', 'doubao', 'glm', 'kimi']) {
      expect(PROVIDERS[name]).toBeDefined()
      expect(PROVIDERS[name].label).toBeTruthy()
      expect(PROVIDERS[name].baseURL).toMatch(/^https:\/\//)
      expect('defaultModel' in PROVIDERS[name]).toBe(true)
    }
  })
})

describe('getProvider', () => {
  it('returns config for known provider', () => {
    expect(getProvider('qwen').baseURL)
      .toBe('https://dashscope.aliyuncs.com/compatible-mode/v1')
  })
  it('throws for unknown provider', () => {
    expect(() => getProvider('unknown')).toThrow(/Unknown provider/)
  })
})

describe('getProviderNames', () => {
  it('returns all four provider keys', () => {
    const names = getProviderNames()
    expect(names).toEqual(expect.arrayContaining(['qwen', 'doubao', 'glm', 'kimi']))
    expect(names.length).toBe(4)
  })
})
