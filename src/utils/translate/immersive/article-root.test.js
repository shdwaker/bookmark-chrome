// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { selectArticleRoot } from './article-root'
import { collectPieces } from './paragraph-detector'

describe('selectArticleRoot', () => {
  it('prefers a nested article over the larger main container', () => {
    document.body.innerHTML = `
      <main><nav>Site menu content here.</nav><article><p>Main article paragraph body.</p></article></main>
    `
    expect(selectArticleRoot(document.body).tagName).toBe('ARTICLE')
  })
})

describe('article-aware paragraph detection', () => {
  it('collects article body pieces but skips title, nav, sidebar and footer', () => {
    document.body.innerHTML = `
      <nav><a>Navigation label content</a></nav>
      <h1>Page title should stay untranslated</h1>
      <article>
        <h1>Article title should stay untranslated</h1>
        <p>This paragraph belongs to the article body and is long enough.</p>
      </article>
      <aside><p>Sidebar advertisement sentence content.</p></aside>
      <footer><p>Footer copyright sentence content.</p></footer>
    `
    const texts = collectPieces(document.body, { direction: 'auto', limit: 100 }).map(p => p.text)
    expect(texts).toContain('This paragraph belongs to the article body and is long enough.')
    expect(texts).not.toContain('Page title should stay untranslated')
    expect(texts).not.toContain('Article title should stay untranslated')
    expect(texts).not.toContain('Sidebar advertisement sentence content.')
    expect(texts).not.toContain('Footer copyright sentence content.')
  })
})
