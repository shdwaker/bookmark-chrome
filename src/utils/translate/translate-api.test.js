import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { translate, normalizeModel } from './translate-api'

function mockResponse(body, status = 200) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => bodyStr
  }
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
})
afterEach(() => {
  delete globalThis.fetch
})

describe('translate', () => {
  it('sends OpenAI-compatible request with Bearer auth and parses JSON content', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: '{"translation":"hello","notes":"问候语"}' } }]
    }))

    const result = await translate({
      text: '你好',
      direction: 'zh-en',
      provider: 'qwen',
      apiKey: 'sk-test',
      model: 'qwen-max'
    })

    expect(result).toEqual({ translation: 'hello', notes: '问候语' })
    const [url, opts] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer sk-test')
    const body = JSON.parse(opts.body)
    expect(body.model).toBe('qwen-max')
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].content).toBe('你好')
  })

  it('uses provider defaultModel when model is empty', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: '{"translation":"hi","notes":""}' } }]
    }))

    await translate({
      text: '你好',
      direction: 'auto',
      provider: 'glm',
      apiKey: 'sk-test',
      model: ''
    })

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.model).toBe('glm-4')
  })

  it('throws on 401 with clear message', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ error: 'bad key' }, 401))
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'glm', apiKey: 'bad', model: 'glm-4'
    })).rejects.toThrow(/API key 无效/)
  })

  it('throws on 429 with quota message', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ error: 'rate limit' }, 429))
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'glm', apiKey: 'k', model: 'glm-4'
    })).rejects.toThrow(/额度/)
  })

  it('throws when content is not valid JSON', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: 'not json at all' } }]
    }))
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'glm', apiKey: 'k', model: 'glm-4'
    })).rejects.toThrow(/JSON/)
  })

  it('throws when fetch rejects (network error)', async () => {
    globalThis.fetch.mockRejectedValue(new Error('connect ECONNREFUSED'))
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'glm', apiKey: 'k', model: 'glm-4'
    })).rejects.toThrow(/网络错误/)
  })

  it('throws when text is empty', async () => {
    await expect(translate({
      text: '   ', direction: 'auto', provider: 'glm', apiKey: 'k', model: 'glm-4'
    })).rejects.toThrow(/文本不能为空/)
  })

  it('falls back to doubao defaultModel when model is empty', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: '{"translation":"hi","notes":""}' } }]
    }))
    await translate({
      text: '你好',
      direction: 'auto',
      provider: 'doubao',
      apiKey: 'k',
      model: ''
    })
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.model).toBe('doubao-1.5-pro-32k-250115')
  })

  it('includes response body detail in non-OK error message', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse(
      { error: { message: 'Invalid endpoint id' } }, 400
    ))
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'doubao', apiKey: 'k', model: 'ep-bad'
    })).rejects.toThrow(/Invalid endpoint id/)
  })

  it('extracts model from URL with model query param', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: '{"translation":"hi","notes":""}' } }]
    }))
    await translate({
      text: '你好',
      direction: 'auto',
      provider: 'doubao',
      apiKey: 'k',
      model: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions?model=ep-2024abc'
    })
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.model).toBe('ep-2024abc')
  })

  it('extracts model from URL last path segment', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({
      choices: [{ message: { content: '{"translation":"hi","notes":""}' } }]
    }))
    await translate({
      text: '你好',
      direction: 'auto',
      provider: 'doubao',
      apiKey: 'k',
      model: 'https://ark.cn-beijing.volces.com/api/v3/ep-2024xyz'
    })
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.model).toBe('ep-2024xyz')
  })
})

describe('normalizeModel', () => {
  it('returns plain string as-is', () => {
    expect(normalizeModel('qwen-max')).toBe('qwen-max')
    expect(normalizeModel('ep-2024abc-xyz')).toBe('ep-2024abc-xyz')
  })
  it('returns empty for empty input', () => {
    expect(normalizeModel('')).toBe('')
    expect(normalizeModel(null)).toBe('')
    expect(normalizeModel(undefined)).toBe('')
  })
  it('extracts model from ?model= query param', () => {
    expect(normalizeModel('https://ark.cn-beijing.volces.com/api/v3/chat/completions?model=ep-2024abc'))
      .toBe('ep-2024abc')
  })
  it('extracts last non-keyword path segment from URL', () => {
    expect(normalizeModel('https://ark.cn-beijing.volces.com/api/v3/ep-2024xyz'))
      .toBe('ep-2024xyz')
  })
  it('returns empty when URL is just the endpoint with no model', () => {
    expect(normalizeModel('https://ark.cn-beijing.volces.com/api/v3/chat/completions'))
      .toBe('')
  })
  it('trims whitespace', () => {
    expect(normalizeModel('  qwen-max  ')).toBe('qwen-max')
  })
})
