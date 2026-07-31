// Site-specific translation rules for better results on popular sites.
// Each rule narrows the paragraph detector's traversal scope to container
// selectors and marks certain elements as "do not translate".

export const SITE_RULES = [
  {
    hosts: ['twitter.com', 'x.com'],
    containerSelectors: ['article', '[data-testid="tweetText"]'],
    noTranslateSelectors: ['[data-testid="User-Name"]', 'time']
  },
  {
    hosts: ['reddit.com', 'old.reddit.com'],
    containerSelectors: ['.Post', '.Comment', '[data-testid="post-container"]'],
    noTranslateSelectors: ['.vote-buttons', '.Post__flatListItemButton']
  },
  {
    hosts: ['news.ycombinator.com'],
    containerSelectors: ['.athing', '.commtext'],
    noTranslateSelectors: ['.votearrow', '.score']
  },
  {
    hosts: ['github.com'],
    containerSelectors: ['.markdown-body', '.comment-body', '.blob-code'],
    noTranslateSelectors: ['.blob-num', '.js-clipboard']
  },
  {
    hosts: ['wikipedia.org'],
    containerSelectors: ['#mw-content-text'],
    noTranslateSelectors: ['.mw-editsection', '.reference', '.citation']
  }
]

// Match a URL against SITE_RULES by hostname substring.
// Returns the first matching rule, or null.
export function getSiteRule(url) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  for (const rule of SITE_RULES) {
    if (rule.hosts.some(h => hostname.includes(h))) {
      return rule
    }
  }
  return null
}
