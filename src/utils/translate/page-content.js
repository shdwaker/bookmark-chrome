import { Readability } from '@mozilla/readability'

export const PAGE_TEXT_LIMIT = 12000
const MIN_PARAGRAPH_LENGTH = 2
const IGNORED_CONTENT_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'aside',
  'footer', 'header', '[role="navigation"]', '[role="banner"]',
  '[role="complementary"]', '[role="contentinfo"]', '[aria-hidden="true"]'
]

function uniqueParagraphs(elements, maxParagraphs) {
  const seen = new Set()
  const result = []

  for (const element of elements) {
    if (element.closest(IGNORED_CONTENT_SELECTORS.join(','))) continue
    if (element.parentElement?.closest('p, li, blockquote, pre')) continue
    if (/^H[1-6]$/.test(element.tagName)) continue

    const text = (element.innerText || element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text || text.length < MIN_PARAGRAPH_LENGTH || seen.has(text)) continue

    seen.add(text)
    result.push({ id: `p${result.length + 1}`, text })
    if (result.length >= maxParagraphs) break
  }

  return result
}

function parseArticleParagraphs(articleContent, maxParagraphs) {
  const container = new DOMParser().parseFromString(articleContent, 'text/html')
  return uniqueParagraphs(
    container.querySelectorAll('p, li, blockquote, pre'),
    maxParagraphs
  )
}

function fallbackParagraphs(document, maxParagraphs) {
  return uniqueParagraphs(
    document.body?.querySelectorAll('p, li, blockquote') || [],
    maxParagraphs
  )
}

export function extractPageParagraphs(sourceDocument = document, options = {}) {
  const maxParagraphs = options.maxParagraphs || 200
  const maxChars = options.maxChars || PAGE_TEXT_LIMIT

  let paragraphs = []
  try {
    const article = new Readability(sourceDocument.cloneNode(true), {
      charThreshold: 25,
      keepClasses: false
    }).parse()
    paragraphs = article?.content ? parseArticleParagraphs(article.content, maxParagraphs) : []
  } catch {
    paragraphs = []
  }

  if (paragraphs.length === 0) {
    paragraphs = fallbackParagraphs(sourceDocument, maxParagraphs)
  }

  const result = []
  let totalChars = 0
  for (const paragraph of paragraphs) {
    if (totalChars > 0 && totalChars + paragraph.text.length > maxChars) break
    result.push(paragraph)
    totalChars += paragraph.text.length
  }

  const sourceChars = paragraphs.reduce((sum, paragraph) => sum + paragraph.text.length, 0)
  return {
    paragraphs: result,
    truncated: sourceChars > maxChars || paragraphs.length >= maxParagraphs
  }
}
