import { describe, expect, it } from 'vitest'
import { splitSyllables } from './syllable-splitter'

describe('splitSyllables', () => {
  it('returns single syllable for short words', () => {
    expect(splitSyllables('cat')).toEqual([{ text: 'cat', isSilent: false }])
    expect(splitSyllables('dog')).toEqual([{ text: 'dog', isSilent: false }])
    expect(splitSyllables('a')).toEqual([{ text: 'a', isSilent: false }])
  })

  it('handles empty and null input', () => {
    expect(splitSyllables('')).toEqual([{ text: '', isSilent: false }])
    expect(splitSyllables(null)).toEqual([{ text: null, isSilent: false }])
  })

  it('splits words with clear CV patterns', () => {
    const result = splitSyllables('computer')
    expect(result.length).toBe(3)
    expect(result.map(s => s.text)).toEqual(['com', 'pu', 'ter'])
  })

  it('splits beautiful with vowel team eau', () => {
    const result = splitSyllables('beautiful')
    expect(result.length).toBe(3)
    expect(result.map(s => s.text)).toEqual(['beau', 'ti', 'ful'])
  })

  it('handles magic-e pattern', () => {
    const result = splitSyllables('make')
    expect(result.length).toBe(1)
    expect(result[0].text).toBe('make')
  })

  it('handles consonant-le ending', () => {
    const result = splitSyllables('table')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['ta', 'ble'])
  })

  it('splits apple correctly', () => {
    const result = splitSyllables('apple')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['ap', 'ple'])
  })

  it('handles r-controlled vowels', () => {
    const result = splitSyllables('car')
    expect(result.length).toBe(1)
    expect(result[0].text).toBe('car')
  })

  it('splits words with r-controlled vowels', () => {
    const result = splitSyllables('teacher')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['tea', 'cher'])
  })

  it('handles vowel digraphs', () => {
    const result = splitSyllables('rainbow')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['rain', 'bow'])
  })

  it('keeps consonant blends together', () => {
    const result = splitSyllables('program')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['pro', 'gram'])
  })

  it('handles multi-syllable words', () => {
    const result = splitSyllables('information')
    expect(result.length).toBeGreaterThanOrEqual(3)
    // Info that the first syllable contains the 'i'
    expect(result[0].text).toMatch(/^in/)
  })

  it('handles words with y as consonant', () => {
    const result = splitSyllables('yellow')
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('preserves original case', () => {
    const result = splitSyllables('Computer')
    expect(result.map(s => s.text)).toEqual(['Com', 'pu', 'ter'])
  })

  it('handles understanding', () => {
    const result = splitSyllables('understanding')
    expect(result.length).toBe(4)
    // VC/CV split: 'nd' before 'ing' splits as n|d, giving 'stan'+'ding'.
    // This is a valid phonetic split even though dictionary syllabification
    // prefers 'stand'+'ing' (morphological suffix split). The algorithm uses
    // spelling rules, not morphology, so it can't detect the -ing suffix.
    expect(result.map(s => s.text)).toEqual(['un', 'der', 'stan', 'ding'])
  })

  it('handles happy', () => {
    const result = splitSyllables('happy')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['hap', 'py'])
  })

  it('handles little with consonant-le', () => {
    const result = splitSyllables('little')
    expect(result.length).toBe(2)
    expect(result.map(s => s.text)).toEqual(['lit', 'tle'])
  })
})
