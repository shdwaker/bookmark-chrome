export const PROVIDERS = {
  qwen: {
    label: '阿里千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-max'
  },
  doubao: {
    label: '火山豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    defaultModel: 'doubao-1.5-pro-32k-250115'
  },
  glm: {
    label: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4'
  },
  kimi: {
    label: 'Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k'
  }
}

export function getProvider(name) {
  const provider = PROVIDERS[name]
  if (!provider) throw new Error(`Unknown provider: ${name}`)
  return provider
}

export function getProviderNames() {
  return Object.keys(PROVIDERS)
}
