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
