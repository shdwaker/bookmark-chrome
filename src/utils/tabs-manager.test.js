import { describe, expect, it } from 'vitest'
import { buildAllTabsView, getNormalizedTabUrl, getTabGroupName } from './tabs-manager'

const extensionOrigin = 'chrome-extension://abc123'

function tab(overrides) {
  return {
    id: overrides.id,
    windowId: overrides.windowId || 1,
    index: overrides.index || 0,
    title: overrides.title || `Tab ${overrides.id}`,
    url: overrides.url
  }
}

describe('getNormalizedTabUrl', () => {
  it('ignores query and hash while preserving origin and path', () => {
    expect(getNormalizedTabUrl('https://example.com/path?a=1#top')).toBe('https://example.com/path')
    expect(getNormalizedTabUrl('https://example.com/path?a=2')).toBe('https://example.com/path')
  })

  it('keeps different paths separate', () => {
    expect(getNormalizedTabUrl('https://example.com/path')).not.toBe(getNormalizedTabUrl('https://example.com/other'))
  })
})

describe('getTabGroupName', () => {
  it('groups standard urls by hostname', () => {
    expect(getTabGroupName('https://developer.chrome.com/docs/extensions')).toBe('developer.chrome.com')
  })

  it('gives chrome and extension urls readable groups', () => {
    expect(getTabGroupName('chrome://extensions')).toBe('chrome://')
    expect(getTabGroupName(`${extensionOrigin}/src/pages/main/index.html`, extensionOrigin)).toBe('插件页面')
  })
})

describe('buildAllTabsView', () => {
  it('shows all tabs, merges urls without query, and marks old duplicate tabs for cleanup', () => {
    const view = buildAllTabsView([
      tab({ id: 1, index: 0, title: 'Old issue', url: 'https://github.com/repo/issues?page=1' }),
      tab({ id: 2, index: 1, title: 'New issue', url: 'https://github.com/repo/issues?page=2' }),
      tab({ id: 3, index: 2, title: 'Pulls', url: 'https://github.com/repo/pulls' })
    ], { extensionOrigin })

    expect(view.stats.totalTabs).toBe(3)
    expect(view.stats.totalRecords).toBe(2)
    expect(view.stats.duplicateRecords).toBe(1)
    expect(view.groups[0].records[0].count).toBe(2)
    expect(view.groups[0].records[0].newestTab.id).toBe(2)
    expect(view.groups[0].records[0].oldTabIds).toEqual([1])
    expect(view.groups[0].records[1].count).toBe(1)
  })

  it('places plugin pages first even when they are not duplicates', () => {
    const view = buildAllTabsView([
      tab({ id: 1, index: 0, url: 'https://github.com/repo/issues' }),
      tab({ id: 2, index: 1, url: `${extensionOrigin}/src/pages/main/index.html` })
    ], { extensionOrigin })

    expect(view.groups[0].name).toBe('插件页面')
    expect(view.groups[0].isExtensionGroup).toBe(true)
  })
})