const WORD_KEY_PREFIX = 'word:'

function storageArea() {
  return chrome.storage.sync
}

function normalizeEntry(entry) {
  return {
    word: String(entry.word || '').trim(),
    meaning: String(entry.meaning || ''),
    examples: Array.isArray(entry.examples)
      ? entry.examples.map(example => ({
          text: String(example?.text || ''),
          translation: String(example?.translation || '')
        }))
      : [],
    similarWords: Array.isArray(entry.similarWords)
      ? entry.similarWords.map(similar => ({
          word: String(similar?.word || ''),
          meaning: String(similar?.meaning || '')
        }))
      : [],
    context: String(entry.context || ''),
    createdAt: Number(entry.createdAt) || Date.now(),
    updatedAt: Number(entry.updatedAt) || Date.now()
  }
}

export async function getVocabulary() {
  const all = await storageArea().get(null)
  return Object.entries(all)
    .filter(([key]) => key.startsWith(WORD_KEY_PREFIX))
    .map(([key, entry]) => ({ ...normalizeEntry(entry), storageKey: key }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveVocabularyEntry(entry) {
  const normalized = normalizeEntry(entry)
  if (!normalized.word) throw new Error('生词不能为空')
  const key = WORD_KEY_PREFIX + normalized.word.toLowerCase()
  const existing = await storageArea().get(key)
  const saved = {
    ...normalized,
    createdAt: existing[key]?.createdAt || normalized.createdAt,
    updatedAt: Date.now()
  }
  await storageArea().set({ [key]: saved })
  return { ...saved, storageKey: key }
}

export async function deleteVocabularyEntry(storageKey) {
  if (!String(storageKey || '').startsWith(WORD_KEY_PREFIX)) {
    throw new Error('无效的生词记录')
  }
  await storageArea().remove(storageKey)
}
