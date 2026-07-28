import { describe, expect, it, vi } from 'vitest'
import { createPool } from './inline'

describe('createPool', () => {
  it('runs all items through worker with limited concurrency', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item * 2
    }

    const pool = createPool({ items, worker, concurrency: 3 })
    const result = await pool.promise

    expect(inFlight.max).toBeLessThanOrEqual(3)
    expect(result.completed).toHaveLength(10)
    expect(result.completed.map(c => c.result)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])
    expect(result.failed).toHaveLength(0)
    expect(result.cancelled).toBe(false)
  })

  it('collects worker errors in failed array without stopping the pool', async () => {
    const items = ['ok1', 'bad', 'ok2', 'bad', 'ok3']
    const worker = async (item) => {
      if (item.startsWith('bad')) throw new Error(`fail: ${item}`)
      return item.toUpperCase()
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    const result = await pool.promise

    expect(result.completed.map(c => c.result)).toEqual(['OK1', 'OK2', 'OK3'])
    expect(result.failed).toHaveLength(2)
    expect(result.failed[0].error.message).toBe('fail: bad')
  })

  it('cancel stops dispatching new items but lets in-flight finish', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 20))
      return item
    }

    const pool = createPool({ items, worker, concurrency: 2 })
    setTimeout(() => pool.cancel(), 30)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    expect(started.length).toBeLessThanOrEqual(4)
  })

  it('shouldCancel callback is checked before each new item', async () => {
    const items = [1, 2, 3, 4, 5, 6]
    let cancelFlag = false
    const started = []
    const worker = async (item) => {
      started.push(item)
      await new Promise(r => setTimeout(r, 10))
      return item
    }

    const pool = createPool({
      items,
      worker,
      concurrency: 1,
      shouldCancel: () => cancelFlag
    })
    setTimeout(() => { cancelFlag = true }, 35)

    const result = await pool.promise
    expect(result.cancelled).toBe(true)
    expect(started.length).toBeLessThan(6)
  })

  it('handles empty items array', async () => {
    const pool = createPool({ items: [], worker: async (x) => x, concurrency: 3 })
    const result = await pool.promise
    expect(result.completed).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('uses concurrency smaller than items length when items are few', async () => {
    const items = [1, 2]
    const inFlight = { current: 0, max: 0 }
    const worker = async (item) => {
      inFlight.current++
      inFlight.max = Math.max(inFlight.max, inFlight.current)
      await new Promise(r => setTimeout(r, 10))
      inFlight.current--
      return item
    }
    const pool = createPool({ items, worker, concurrency: 5 })
    await pool.promise
    expect(inFlight.max).toBe(2)
  })
})
