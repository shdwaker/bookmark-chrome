const ARTICLE_CANDIDATE_SELECTORS = [
  'article',
  '[itemprop="articleBody"]',
  '[role="main"]',
  'main',
  '.article-body',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.markdown-body',
  '.content',
  '#content'
]

const NON_ARTICLE_SELECTOR = [
  'nav', 'aside', 'footer', 'header',
  '[role="navigation"]', '[role="banner"]',
  '[role="complementary"]', '[role="contentinfo"]',
  '[aria-hidden="true"]'
].join(',')

const SEMANTIC_BONUS = {
  ARTICLE: 6000,
  MAIN: 3000
}

function candidateScore(el) {
  let score = Math.min((el.textContent || '').trim().length, 50000)
  score += SEMANTIC_BONUS[el.tagName] || 0
  if (el.getAttribute('itemprop') === 'articleBody') score += 4000
  if (el.getAttribute('role') === 'main') score += 2000
  return score
}

export function selectArticleRoot(root) {
  const candidates = [...root.querySelectorAll(ARTICLE_CANDIDATE_SELECTORS.join(','))]
    .filter(el => !el.closest(NON_ARTICLE_SELECTOR))

  const best = candidates.reduce((best, candidate) => {
    if (!best) return candidate
    if (best.contains(candidate)) {
      return (SEMANTIC_BONUS[candidate.tagName] || 0) >
        (SEMANTIC_BONUS[best.tagName] || 0) ? candidate : best
    }
    if (candidate.contains(best)) return candidate
    return candidateScore(candidate) > candidateScore(best) ? candidate : best
  }, null)

  return best
}
