import { getProvider } from './providers'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

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
    const keywords = new Set(['completions', 'chat', 'api', 'v1', 'v3', 'v4'])
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

export async function translate({ text, direction, provider, apiKey, model }) {
  if (!text || !text.trim()) throw new Error('文本不能为空')
  if (!provider) throw new Error('未选择翻译模型')
  if (!apiKey) throw new Error('未配置 API key')

  const config = getProvider(provider)
  const useModel = normalizeModel(model) || config.defaultModel
  if (!useModel) {
    throw new Error('未配置模型（豆包需要填 endpoint id 或模型名，如 ep-2024xxx 或 doubao-1.5-pro-32k）')
  }

  const body = {
    model: useModel,
    messages: [
      { role: 'system', content: buildSystemPrompt(direction) },
      { role: 'user', content: buildUserPrompt(text) }
    ]
  }

  let response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
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

  const content = data?.choices?.[0]?.message?.content
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
