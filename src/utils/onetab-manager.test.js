import { describe, expect, it } from 'vitest'
import { filterEligibleTabs, buildOnetabView } from './onetab-manager'

describe('filterEligibleTabs', () => {
  const DAY = 86400000
  const now = 1_700_000_000_000

  it('keeps tabs older than threshold and drops newer ones', () => {
    const tabs = [
      { id: 1, url: 'https://old.com', lastAccessed: now - 10 * DAY, active: false },
      { id: 2, url: 'https://new.com', lastAccessed: now - 1 * DAY, active: false }
    ]
    const eligible = filterEligibleTabs(tabs, 7, now)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].id).toBe(1)
  })

  it('excludes the active tab', () => {
    const tabs = [
      { id: 1, url: 'https://old.com', lastAccessed: now - 10 * DAY, active: true }
    ]
    expect(filterEligibleTabs(tabs, 7, now)).toHaveLength(0)
  })

  it('excludes special protocols', () => {
    const old = now - 10 * DAY
    const tabs = [
      { id: 1, url: 'chrome://settings', lastAccessed: old, active: false },
      { id: 2, url: 'chrome-extension://abc/page.html', lastAccessed: old, active: false },
      { id: 3, url: 'about:blank', lastAccessed: old, active: false },
      { id: 4, url: 'https://example.com', lastAccessed: old, active: false }
    ]
    const eligible = filterEligibleTabs(tabs, 7, now)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].url).toBe('https://example.com')
  })

  it('returns empty for threshold 0 or negative', () => {
    const tabs = [
      { id: 1, url: 'https://a.com', lastAccessed: now - 10 * DAY, active: false }
    ]
    expect(filterEligibleTabs(tabs, 0, now)).toHaveLength(0)
  })
})

describe('buildOnetabView', () => {
  it('groups records by domain and sorts groups by latest savedAt', () => {
    const records = [
      { id: 1, url: 'https://a.com/1', title: 'A1', domain: 'a.com', savedAt: 200 },
      { id: 2, url: 'https://a.com/2', title: 'A2', domain: 'a.com', savedAt: 100 },
      { id: 3, url: 'https://b.com/1', title: 'B1', domain: 'b.com', savedAt: 300 }
    ]
    const view = buildOnetabView(records)
    expect(view.stats.totalRecords).toBe(3)
    expect(view.stats.totalDomains).toBe(2)
    expect(view.groups).toHaveLength(2)
    expect(view.groups[0].name).toBe('b.com')
    expect(view.groups[1].name).toBe('a.com')
    expect(view.groups[1].records[0].id).toBe(1)
    expect(view.groups[1].records[1].id).toBe(2)
  })

  it('returns empty stats and groups for no records', () => {
    const view = buildOnetabView([])
    expect(view.stats.totalRecords).toBe(0)
    expect(view.stats.totalDomains).toBe(0)
    expect(view.groups).toHaveLength(0)
  })
})
