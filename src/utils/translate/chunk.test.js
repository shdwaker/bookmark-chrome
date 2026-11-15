import { describe, expect, it } from 'vitest'
import { splitTextIntoParagraphs } from './chunk'

describe('splitTextIntoParagraphs', () => {
  it('splits and trims non-empty paragraphs', () => {
    expect(splitTextIntoParagraphs('\n First paragraph. \n\nSecond paragraph.\n\n\n')).toEqual([
      'First paragraph.',
      'Second paragraph.'
    ])
  })

  it('returns an empty array for blank input', () => {
    expect(splitTextIntoParagraphs(' \n ')).toEqual([])
  })
})
