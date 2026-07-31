// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { hasLatinLetters, hasCJK } from './language-detect'

describe('hasLatinLetters', () => {
  it('returns true for English text', () => {
    expect(hasLatinLetters('Hello World')).toBe(true)
  })

  it('returns false for pure CJK text', () => {
    expect(hasCJK('你好世界')).toBe(true)
    expect(hasLatinLetters('你好世界')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasLatinLetters('')).toBe(false)
    expect(hasCJK('')).toBe(false)
  })

  it('returns true for mixed text', () => {
    expect(hasLatinLetters('Hello 你好')).toBe(true)
    expect(hasCJK('Hello 你好')).toBe(true)
  })

  it('handles null/undefined input', () => {
    expect(hasLatinLetters(null)).toBe(false)
    expect(hasCJK(undefined)).toBe(false)
  })
})

import { getSiteRule, SITE_RULES } from './site-rules'

describe('getSiteRule', () => {
  it('returns rule for twitter.com', () => {
    const rule = getSiteRule('https://twitter.com/user/status/123')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('twitter.com')
  })

  it('returns rule for x.com', () => {
    const rule = getSiteRule('https://x.com/user/status/123')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('x.com')
  })

  it('returns rule for reddit.com', () => {
    const rule = getSiteRule('https://www.reddit.com/r/programming/')
    expect(rule).toBeTruthy()
    expect(rule.hosts).toContain('reddit.com')
  })

  it('returns rule for news.ycombinator.com', () => {
    const rule = getSiteRule('https://news.ycombinator.com/item?id=123')
    expect(rule).toBeTruthy()
  })

  it('returns rule for github.com', () => {
    const rule = getSiteRule('https://github.com/user/repo')
    expect(rule).toBeTruthy()
  })

  it('returns rule for en.wikipedia.org', () => {
    const rule = getSiteRule('https://en.wikipedia.org/wiki/Test')
    expect(rule).toBeTruthy()
  })

  it('returns null for unmatched site', () => {
    expect(getSiteRule('https://example.com/page')).toBeNull()
    expect(getSiteRule('https://blog.example.org/post')).toBeNull()
  })

  it('all rules have required fields', () => {
    for (const rule of SITE_RULES) {
      expect(Array.isArray(rule.hosts)).toBe(true)
      expect(rule.hosts.length).toBeGreaterThan(0)
      expect(Array.isArray(rule.containerSelectors)).toBe(true)
      expect(Array.isArray(rule.noTranslateSelectors)).toBe(true)
    }
  })
})
