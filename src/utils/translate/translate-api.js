import { getProvider } from './providers'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function translate({ text, direction, provider, apiKey, model }) {
  if (!text || !text.trim()) throw new Error('文本不能为空')
  if (!provider) throw new Error('未选择翻译模型')
  if (!apiKey) throw new Error('未配置 API key')

  const config = getProvider(provider)
  const useModel = model || config.defaultModel
  if (!useModel) throw new Error('未配置模型（豆包需要填 endpoint id）')

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

  if (response.status === 401) throw new Error('API key 无效或已过期')
  if (response.status === 429) throw new Error('请求过于频繁或额度已用完')
  if (!response.ok) throw new Error(`模型返回错误（HTTP ${response.status}）`)

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
