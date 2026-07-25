import { getProvider } from './providers'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { doFetch } from './transport'

// Accept either a plain model/endpoint id (e.g. "qwen-max", "ep-2024xxx")
// or a full URL (e.g. "https://ark.cn-beijing.volces.com/api/v3/chat/completions?model=ep-xxx")
// and return the model id. Returns '' if no model can be extracted.
export function normalizeModel(input) {
  if (!input) return ''
  const trimmed = String(input).trim()
  if (!/^https?:\/\//i.test(trimmed)) return trimmed
  try {
    const u = new URL(trimmed)
    // 1. ?model=xxx query param
    const m = u.searchParams.get('model')
    if (m) return m
    // 2. last non-keyword path segment
    const keywords = new Set(['completions', 'chat', 'api', 'v1', 'v3', 'v4', 'plan', 'messages'])
    const parts = u.pathname.split('/').filter(Boolean)
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!keywords.has(parts[i])) return parts[i]
    }
    return ''
  } catch {
    return trimmed
  }
}

async function readErrorDetail(response) {
  let text
  try {
    text = await response.text()
  } catch {
    return ''
  }
  if (!text) return ''
  try {
    const body = JSON.parse(text)
    return body?.error?.message || body?.message || text
  } catch {
    return text.slice(0, 300)
  }
}

// Build the full request URL from a base URL and API format.
// OpenAI format  -> baseURL + /chat/completions
// Anthropic      -> baseURL + /v1/messages
// If the base URL already ends with the target path, use as-is.
export function buildRequestURL(baseURL, format) {
  const base = (baseURL || '').trim().replace(/\/+$/, '')
  if (format === 'anthropic') {
    if (base.endsWith('/v1/messages')) return base
    return base + '/v1/messages'
  }
  if (base.endsWith('/chat/completions')) return base
  return base + '/chat/completions'
}

function buildOpenAIRequest({ text, direction, model }) {
  return {
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(direction) },
      { role: 'user', content: buildUserPrompt(text) }
    ]
  }
}

function buildAnthropicRequest({ text, direction, model }) {
  return {
    model,
    max_tokens: 1024,
    system: buildSystemPrompt(direction),
    messages: [
      { role: 'user', content: buildUserPrompt(text) }
    ]
  }
}

function parseOpenAIResponse(data) {
  const content = data?.choices?.[0]?.message?.content
  return content
}

function parseAnthropicResponse(data) {
  const content = data?.content?.[0]?.text
  return content
}

export async function translate({ text, direction, provider, apiKey, model, baseURL, apiFormat }) {
  if (!text || !text.trim()) throw new Error('文本不能为空')
  if (!provider) throw new Error('未选择翻译模型')

  const useApiKey = (apiKey || '').trim()
  if (!useApiKey) throw new Error('未配置 API key')

  const config = getProvider(provider)
  const format = apiFormat || 'openai'
  const useBaseURL = (baseURL || '').trim() || config.baseURL
  const useModel = normalizeModel(model) || config.defaultModel
  if (!useModel) {
    throw new Error('未配置模型（豆包填模型名即可，如 doubao-1.5-pro-32k-250115）')
  }

  const useURL = buildRequestURL(useBaseURL, format)

  let body, headers
  if (format === 'anthropic') {
    body = buildAnthropicRequest({ text, direction, model: useModel })
    headers = {
      'x-api-key': useApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }
  } else {
    body = buildOpenAIRequest({ text, direction, model: useModel })
    headers = {
      Authorization: `Bearer ${useApiKey}`,
      'Content-Type': 'application/json'
    }
  }

  let response
  try {
    response = await doFetch(useURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  } catch (err) {
    throw new Error(`网络错误：${err.message}`)
  }

  if (response.status === 401) {
    const detail = await readErrorDetail(response)
    throw new Error(`API key 无效或已过期${detail ? '：' + detail : ''}`)
  }
  if (response.status === 429) {
    const detail = await readErrorDetail(response)
    throw new Error(`请求过于频繁或额度已用完${detail ? '：' + detail : ''}`)
  }
  if (!response.ok) {
    const detail = await readErrorDetail(response)
    throw new Error(`模型返回错误（HTTP ${response.status}）${detail ? '：' + detail : ''}`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('模型返回的不是有效 JSON')
  }

  const content = format === 'anthropic'
    ? parseAnthropicResponse(data)
    : parseOpenAIResponse(data)
  if (!content) throw new Error('模型返回内容为空')

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('模型未返回有效 JSON 格式')
  }

  if (!parsed.translation) throw new Error('模型返回缺少 translation 字段')

  return {
    translation: parsed.translation,
    notes: parsed.notes || ''
  }
}
