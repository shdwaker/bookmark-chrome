import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteVocabularyEntry, getVocabulary, saveVocabularyEntry } from './vocabulary'

const store = new Map()
const chrome = {
  storage: {
    sync: {
      get: vi.fn(async keys => {
        if (!keys) return Object.fromEntries(store)
        if (typeof keys === 'string') {
          return store.has(keys) ? { [keys]: store.get(keys) } : {}
        }
        return keys.reduce((result, key) => {
          if (store.has(key)) result[key] = store.get(key)
          return result
        }, {})
      }),
      set: vi.fn(async data => {
        for (const [key, value] of Object.entries(data)) store.set(key, value)
      }),
      remove: vi.fn(async key => store.delete(key))
    }
  }
}

vi.stubGlobal('chrome', chrome)

afterEach(() => {
  store.clear()
  vi.clearAllMocks()
})

describe('vocabulary storage', () => {
  it('normalizes and stores entries in sync storage', async () => {
    const saved = await saveVocabularyEntry({
      word: ' Ubiquitous ',
      meaning: '无处不在的',
      examples: [{ text: 'It is ubiquitous.', translation: '它无处不在。' }],
      similarWords: [{ word: 'widespread', meaning: '广泛的' }]
    })
    expect(saved.word).toBe('Ubiquitous')
    expect(saved.storageKey).toBe('word:ubiquitous')
    const list = await getVocabulary()
    expect(list).toHaveLength(1)
    expect(list[0].examples[0].translation).toBe('它无处不在。')
  })

  it('deletes only vocabulary keys', async () => {
    const saved = await saveVocabularyEntry({ word: 'test', meaning: '测试' })
    await deleteVocabularyEntry(saved.storageKey)
    expect(await getVocabulary()).toEqual([])
    await expect(deleteVocabularyEntry('settings')).rejects.toThrow('无效的生词记录')
  })
})
