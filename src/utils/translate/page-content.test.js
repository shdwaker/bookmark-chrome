// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { extractPageParagraphs } from './page-content'

function pageDocument() {
  document.body.innerHTML = `
    <nav><a href="#">Home navigation</a><a href="#">Docs navigation</a></nav>
    <h1>Page title here</h1>
    <article>
      <p>First article paragraph with body content.</p>
      <li>First article list item content.</li>
      <aside><p>Advertisement paragraph should be removed.</p></aside>
    </article>
  `
  return document
}

describe('extractPageParagraphs', () => {
  it('extracts article paragraphs while excluding navigation and page titles', () => {
    const { paragraphs } = extractPageParagraphs(pageDocument())
    const texts = paragraphs.map(paragraph => paragraph.text)
    expect(texts).toContain('First article paragraph with body content.')
    expect(texts.some(text => text.includes('navigation'))).toBe(false)
    expect(texts.some(text => text.includes('Page title'))).toBe(false)
    expect(texts.some(text => text.includes('Advertisement'))).toBe(false)
  })

  it('stops at the character limit and reports truncation', () => {
    document.body.innerHTML = Array.from({ length: 10 }, (_, index) =>
      `<p>Paragraph ${index} has enough meaningful body text.</p>`
    ).join('')
    const { paragraphs, truncated } = extractPageParagraphs(document, { maxChars: 30 })
    expect(paragraphs).toHaveLength(1)
    expect(truncated).toBe(true)
  })
})
