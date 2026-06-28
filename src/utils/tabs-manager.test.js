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

  it('returns about:blank for undefined, null, or empty string', () => {
    expect(getNormalizedTabUrl(undefined)).toBe('about:blank')
    expect(getNormalizedTabUrl(null)).toBe('about:blank')
    expect(getNormalizedTabUrl('')).toBe('about:blank')
  })

  it('returns base URL for invalid URLs without protocol', () => {
    expect(getNormalizedTabUrl('not a url?x=1#hash')).toBe('not a url')
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

  it('returns 其他页面 for undefined or invalid URLs', () => {
    expect(getTabGroupName(undefined)).toBe('其他页面')
    expect(getTabGroupName('not a url')).toBe('其他页面')
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

  it('handles tabs with missing URLs without crashing', () => {
    const view = buildAllTabsView([
      tab({ id: 1, index: 0, title: 'Normal tab', url: 'https://github.com' }),
      tab({ id: 2, index: 1, title: 'Blank tab', url: undefined }),
      tab({ id: 3, index: 2, title: 'Null URL tab', url: null }),
      tab({ id: 4, index: 3, title: 'Empty URL tab', url: '' }),
      tab({ id: 5, index: 4, title: 'Invalid URL tab', url: 'not a valid url' }),
      tab({ id: 6, index: 5, title: 'Extension tab', url: `${extensionOrigin}/src/pages/main/index.html` })
    ], { extensionOrigin })

    expect(view.stats.totalTabs).toBe(6)

    // Should have 3 groups: 插件页面, github.com, 其他页面
    expect(view.groups.length).toBe(3)

    // Find the 其他页面 group
    const otherGroup = view.groups.find(g => g.name === '其他页面')
    expect(otherGroup).toBeDefined()
    expect(otherGroup.tabCount).toBe(4) // 3 invalid/missing + 1 invalid URL
  })
})