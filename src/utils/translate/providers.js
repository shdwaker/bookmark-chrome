export const PROVIDERS = {
  qwen: {
    label: '阿里千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max'
  },
  doubao: {
    label: '火山豆包',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1.5-pro-32k-250115'
  },
  glm: {
    label: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4'
  },
  kimi: {
    label: 'Kimi',
    baseURL: 'https://api.moonshot.cn/v1',
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
