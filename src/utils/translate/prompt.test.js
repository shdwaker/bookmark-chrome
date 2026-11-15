import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserPrompt, buildWordEntryPrompt } from './prompt'

describe('buildSystemPrompt', () => {
  it('includes auto-detect phrasing for auto direction', () => {
    const p = buildSystemPrompt('auto')
    expect(p).toMatch(/互译/)
    expect(p).toMatch(/自动检测/)
  })
  it('specifies Chinese to English for zh-en', () => {
    expect(buildSystemPrompt('zh-en')).toMatch(/中文翻译成英文/)
  })
  it('specifies English to Chinese for en-zh', () => {
    expect(buildSystemPrompt('en-zh')).toMatch(/英文翻译成中文/)
  })
  it('always demands strict JSON output', () => {
    for (const d of ['auto', 'zh-en', 'en-zh']) {
      expect(buildSystemPrompt(d)).toMatch(/"translation"/)
      expect(buildSystemPrompt(d)).toMatch(/"notes"/)
      expect(buildSystemPrompt(d)).toMatch(/只输出 JSON/)
    }
  })
  it('instructs to keep math formulas untranslated', () => {
    for (const d of ['auto', 'zh-en', 'en-zh']) {
      expect(buildSystemPrompt(d)).toMatch(/数学公式/)
      expect(buildSystemPrompt(d)).toMatch(/softmax/)
    }
  })
})

describe('buildUserPrompt', () => {
  it('returns the text as-is', () => {
    expect(buildUserPrompt('hello')).toBe('hello')
  })
})

describe('buildWordEntryPrompt', () => {
  it('includes word and context', () => {
    const prompt = buildWordEntryPrompt({
      word: 'ubiquitous',
      context: 'Cloud computing is ubiquitous.'
    })
    expect(prompt).toContain('Word: ubiquitous')
    expect(prompt).toContain('Context: Cloud computing is ubiquitous.')
  })

  it('omits context when it duplicates the selected word', () => {
    expect(buildWordEntryPrompt({ word: 'test', context: 'test' })).toBe('Word: test')
  })
})
