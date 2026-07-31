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

import { collectPieces, INLINE_TAGS, BLOCK_TAGS, SKIP_TAGS } from './paragraph-detector'

describe('collectPieces', () => {
  function domFrom(html) {
    document.body.innerHTML = html
    return document.body
  }

  it('collects text from a simple paragraph', () => {
    const root = domFrom('<p>Hello world this is a test paragraph</p>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello world this is a test paragraph')
    expect(pieces[0].blockEl.tagName).toBe('P')
    expect(pieces[0].textNodes.length).toBe(1)
  })

  it('separates pieces at block boundaries', () => {
    const root = domFrom('<div><p>First paragraph here</p><p>Second paragraph here</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text).toBe('First paragraph here')
    expect(pieces[1].text).toBe('Second paragraph here')
  })

  it('groups inline elements into same piece', () => {
    const root = domFrom('<p>Hello <strong>bold</strong> and <em>italic</em> text</p>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello bold and italic text')
    expect(pieces[0].textNodes.length).toBe(5)
  })

  it('skips SCRIPT, STYLE, and TEXTAREA content', () => {
    const root = domFrom('<div><p>Visible text</p><script>var x = 1</script><style>.x{color:red}</style></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Visible text')
  })

  it('skips elements with class notranslate', () => {
    const root = domFrom('<div><p>Translate this</p><p class="notranslate">Skip this</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('skips elements with translate="no" attribute', () => {
    const root = domFrom('<div><p>Translate this</p><p translate="no">Skip this</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('skips isContentEditable elements', () => {
    const root = domFrom('<div><p>Translate this</p><div contenteditable="true">Edit me</div></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('splits pieces exceeding 1000 characters', () => {
    const longText = 'A'.repeat(1200)
    const root = domFrom(`<p>${longText}</p>`)
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text.length).toBe(1000)
    expect(pieces[1].text.length).toBe(200)
    expect(pieces[0].blockEl).toBe(pieces[1].blockEl)
  })

  it('skips empty/whitespace-only text nodes', () => {
    const root = domFrom('<div>   \n\n  <p>Real text</p>  \n  </div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Real text')
  })

  it('skips CJK-only text when direction is en-zh', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'en-zh' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Hello world')
  })

  it('skips Latin-only text when direction is zh-en', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'zh-en' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('这是中文')
  })

  it('does not skip based on language when direction is auto', () => {
    const root = domFrom('<div><p>Hello world</p><p>这是中文</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
  })

  it('respects the limit option', () => {
    let html = ''
    for (let i = 0; i < 10; i++) {
      html += `<p>Paragraph number ${i} here</p>`
    }
    const root = domFrom(html)
    const pieces = collectPieces(root, { direction: 'auto', limit: 3 })
    expect(pieces.length).toBe(3)
  })

  it('assigns monotonic ids', () => {
    const root = domFrom('<div><p>First</p><p>Second</p><p>Third</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('all pieces start with status pending', () => {
    const root = domFrom('<div><p>First</p><p>Second</p></div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.every(p => p.status === 'pending')).toBe(true)
  })

  it('uses containerSelectors from site rule', () => {
    const root = domFrom(`
      <div class="sidebar">Sidebar text here</div>
      <article><p>Article body text here</p></article>
    `)
    const rule = {
      hosts: ['example.com'],
      containerSelectors: ['article'],
      noTranslateSelectors: []
    }
    const pieces = collectPieces(root, { direction: 'auto', rule })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Article body text here')
  })

  it('respects noTranslateSelectors from site rule', () => {
    const root = domFrom(`
      <div class="content">
        <p>Translate this</p>
        <div class="meta">Skip this metadata</div>
      </div>
    `)
    const rule = {
      hosts: ['example.com'],
      containerSelectors: ['.content'],
      noTranslateSelectors: ['.meta']
    }
    const pieces = collectPieces(root, { direction: 'auto', rule })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Translate this')
  })

  it('collects text from div without p tags', () => {
    const root = domFrom('<div>Direct text in a div without any p tags</div>')
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(1)
    expect(pieces[0].text).toBe('Direct text in a div without any p tags')
    expect(pieces[0].blockEl.tagName).toBe('DIV')
  })

  it('handles nested block elements', () => {
    const root = domFrom(`
      <div>
        <p>Outer text</p>
        <blockquote>
          <p>Quoted text</p>
        </blockquote>
      </div>
    `)
    const pieces = collectPieces(root, { direction: 'auto' })
    expect(pieces.length).toBe(2)
    expect(pieces[0].text).toBe('Outer text')
    expect(pieces[1].text).toBe('Quoted text')
  })
})

describe('paragraph-detector constants', () => {
  it('INLINE_TAGS includes common inline elements', () => {
    expect(INLINE_TAGS.has('A')).toBe(true)
    expect(INLINE_TAGS.has('SPAN')).toBe(true)
    expect(INLINE_TAGS.has('STRONG')).toBe(true)
    expect(INLINE_TAGS.has('EM')).toBe(true)
  })

  it('BLOCK_TAGS includes common block elements', () => {
    expect(BLOCK_TAGS.has('DIV')).toBe(true)
    expect(BLOCK_TAGS.has('P')).toBe(true)
    expect(BLOCK_TAGS.has('H1')).toBe(true)
    expect(BLOCK_TAGS.has('LI')).toBe(true)
  })

  it('SKIP_TAGS includes script, style, textarea', () => {
    expect(SKIP_TAGS.has('SCRIPT')).toBe(true)
    expect(SKIP_TAGS.has('STYLE')).toBe(true)
    expect(SKIP_TAGS.has('TEXTAREA')).toBe(true)
    expect(SKIP_TAGS.has('SVG')).toBe(true)
  })
})
