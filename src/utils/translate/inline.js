// Pure helpers for inline page translation: concurrency pool and paragraph
// collection. Tested in isolation; DOM operations live in the content script.

export function createPool({ items, worker, concurrency = 3, shouldCancel }) {
  let index = 0
  let cancelled = false
  const results = { completed: [], failed: [] }

  const runNext = async () => {
    while (index < items.length) {
      if (cancelled) {
        return
      }
      if (shouldCancel && shouldCancel()) {
        cancelled = true
        return
      }
      const myIndex = index++
      const item = items[myIndex]
      try {
        const result = await worker(item, myIndex)
        if (cancelled) return
        results.completed.push({ item, result })
      } catch (err) {
        if (cancelled) return
        results.failed.push({ item, error: err })
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  const workers = Array.from({ length: workerCount }, runNext)
  const promise = Promise.all(workers).then(() => ({
    ...results,
    cancelled
  }))

  return {
    promise,
    cancel() { cancelled = true }
  }
}
