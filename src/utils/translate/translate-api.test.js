import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { translate } from './translate-api'

function mockResponse(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body
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

  it('throws when doubao has no model (endpoint id) configured', async () => {
    await expect(translate({
      text: 'hi', direction: 'auto', provider: 'doubao', apiKey: 'k', model: ''
    })).rejects.toThrow(/模型/)
  })
})
