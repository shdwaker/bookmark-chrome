// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createPool, hasLatinLetters, hasCJK } from './inline'

describe('createPool', () => {
  it('runs all items through worker with limited concurrency', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item * 2
    }

    const pool = createPool({ items, worker, concurrency: 3 })
    const result = await pool.promise

    expect(inFlight.max).toBeLessThanOrEqual(3)
    expect(result.completed).toHaveLength(10)
    expect(result.completed.map(c => c.result)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    expect(result.failed).toHaveLength(0)
    expect(result.cancelled).toBe(false)
  })

  it('collects worker errors in failed array without stopping the pool', async () => {
    const items = ['ok1', 'bad', 'ok2', 'bad', 'ok3']
    const worker = async (item) => {
      if (item.startsWith('bad')) throw new Error(`fail: ${item}`)
      return item.toUpperCase()
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    const result = await pool.promise

    expect(result.completed.map(c => c.result)).toEqual(['OK1', 'OK2', 'OK3'])
    expect(result.failed).toHaveLength(2)
    expect(result.failed[0].error.message).toBe('fail: bad')
  })

  it('cancel stops dispatching new items but lets in-flight finish', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 20))
      return item
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    setTimeout(() => pool.cancel(), 30)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    expect(started.length).toBeLessThanOrEqual(4)
  })

  it('shouldCancel callback is checked before each new item', async () => {
    const items = [1, 2, 3, 4, 5, 6]
    let cancelFlag = false
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 10))
      return item
    }

    const pool = createPool({
      items,
      worker,
      concurrency: 1,
      shouldCancel: () => cancelFlag
    })
    setTimeout(() => { cancelFlag = true }, 35)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    expect(started.length).toBeLessThan(6)
  })

  it('handles empty items array', async () => {
    const pool = createPool({ items: [], worker: async (x) => x, concurrency: 3 })
    const result = await pool.promise
    expect(result.completed).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('uses concurrency smaller than items length when items are few', async () => {
    const items = [1, 2]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item
    }
    const pool = createPool({ items, worker, concurrency: 5 })
    await pool.promise
    expect(inFlight.max).toBe(2)
  })
})

describe('language helpers', () => {
  it('hasLatinLetters detects ASCII letters', () => {
    expect(hasLatinLetters('hello')).toBe(true)
    expect(hasLatinLetters('你好 world')).toBe(true)
    expect(hasLatinLetters('你好世界')).toBe(false)
    expect(hasLatinLetters('123')).toBe(false)
    expect(hasLatinLetters('')).toBe(false)
  })

  it('hasCJK detects Chinese/Japanese/Korean characters', () => {
    expect(hasCJK('你好')).toBe(true)
    expect(hasCJK('hello 你')).toBe(true)
    expect(hasCJK('hello world')).toBe(false)
    expect(hasCJK('')).toBe(false)
  })
})

import { collectParagraphs } from './inline'

function domFrom(html) {
  document.body.innerHTML = html
  return document
}

describe('collectParagraphs', () => {
  it('collects p, h1-h6, li, blockquote, td elements', () => {
    domFrom(`
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <p>A short paragraph here.</p>
      <ul><li>First item listed</li><li>Second item listed</li></ul>
      <blockquote>A quoted passage.</blockquote>
      <table><tr><td>Cell content here</td></tr></table>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    const texts = paragraphs.map(p => p.text)
    expect(texts).toContain('A short paragraph here.')
    expect(texts).toContain('First item listed')
    expect(texts).toContain('A quoted passage.')
    expect(texts).toContain('Cell content here')
    expect(texts).toContain('Title')
    expect(texts).toContain('Subtitle')
  })

  it('skips elements with text shorter than 8 characters', () => {
    domFrom(`<p>short</p><p>This is long enough.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('This is long enough.')
  })

  it('skips elements nested inside another matched block (li > p)', () => {
    domFrom(`<li><p>Inner paragraph text here.</p></li>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].el.tagName).toBe('LI')
  })

  it('skips elements inside excluded host IDs', () => {
    domFrom(`
      <div id="__ai_translate_panel_host__"><p>Inside panel host.</p></div>
      <p>Outside paragraph text.</p>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('Outside paragraph text.')
  })

  it('skips elements already marked as translated', () => {
    domFrom(`
      <p data-mt-translated="1">Already done translated.</p>
      <p>Fresh paragraph text here.</p>
    `)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('Fresh paragraph text here.')
  })

  it('respects the limit parameter', () => {
    const html = Array.from({ length: 15 }, (_, i) =>
      `<p>Paragraph number ${i} has enough text.</p>`
    ).join('')
    domFrom(html)
    const paragraphs = collectParagraphs(document.body, 5, { direction: 'auto' })
    expect(paragraphs).toHaveLength(5)
  })

  it('skips Chinese-only paragraphs when direction is en-zh', () => {
    domFrom(`<p>这是一段中文内容。</p><p>This is English content here.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'en-zh' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('This is English content here.')
  })

  it('skips Latin-only paragraphs when direction is zh-en', () => {
    domFrom(`<p>This is English content here.</p><p>这是一段中文内容。</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'zh-en' })
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].text).toBe('这是一段中文内容。')
  })

  it('assigns unique sequential ids', () => {
    domFrom(`<p>First paragraph text.</p><p>Second paragraph text.</p>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs[0].id).toBe('p1')
    expect(paragraphs[1].id).toBe('p2')
    expect(paragraphs[0].status).toBe('pending')
  })

  it('returns empty array when no matches', () => {
    domFrom(`<div>no block elements</div>`)
    const paragraphs = collectParagraphs(document.body, 100, { direction: 'auto' })
    expect(paragraphs).toEqual([])
  })
})
