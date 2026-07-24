# Translate Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-powered translation modal (Chinese <-> English + TTS) to the bookmark-chrome extension, supporting Qwen / Doubao / GLM / Kimi via OpenAI-compatible APIs.

**Architecture:** Independent module: own utils (providers/prompt/translate-api), own Pinia store, own modal component. Triggered from TopNav. API-key auth in settings. Web Speech API for TTS.

**Tech Stack:** Vue 3, Pinia, Vite, CRXJS, Vitest, Web Speech API, OpenAI-compatible chat completions API.

**Spec:** `docs/superpowers/specs/2026-07-25-translate-feature-design.md`

---

## File Structure

- Create: `src/utils/translate/providers.js` -- provider config table
- Create: `src/utils/translate/providers.test.js`
- Create: `src/utils/translate/prompt.js` -- system prompt builder
- Create: `src/utils/translate/prompt.test.js`
- Create: `src/utils/translate/translate-api.js` -- unified translate() entry
- Create: `src/utils/translate/translate-api.test.js`
- Modify: `src/utils/storage.js` -- add `translate` block to DEFAULT_SETTINGS + deep-merge in normalize
- Create: `src/stores/translate.js` -- Pinia store
- Create: `src/pages/main/components/TranslateModal.vue` -- the modal UI
- Modify: `src/pages/main/components/TopNav.vue` -- add "翻译" button, emit `open-translate`
- Modify: `src/pages/main/App.vue` -- wire TranslateModal
- Modify: `src/pages/settings/App.vue` -- add translate config section
- Modify: `manifest.json` -- add `host_permissions`

---

## Task 1: providers.js (provider config table)

**Files:**
- Create: `src/utils/translate/providers.js`
- Test: `src/utils/translate/providers.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/translate/providers.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { PROVIDERS, getProvider, getProviderNames } from './providers'

describe('PROVIDERS', () => {
  it('has all four providers with label, endpoint, defaultModel', () => {
    for (const name of ['qwen', 'doubao', 'glm', 'kimi']) {
      expect(PROVIDERS[name]).toBeDefined()
      expect(PROVIDERS[name].label).toBeTruthy()
      expect(PROVIDERS[name].endpoint).toMatch(/^https:\/\//)
      expect('defaultModel' in PROVIDERS[name]).toBe(true)
    }
  })
})

describe('getProvider', () => {
  it('returns config for known provider', () => {
    expect(getProvider('qwen').endpoint)
      .toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
  })
  it('throws for unknown provider', () => {
    expect(() => getProvider('unknown')).toThrow(/Unknown provider/)
  })
})

describe('getProviderNames', () => {
  it('returns all four provider keys', () => {
    const names = getProviderNames()
    expect(names).toEqual(expect.arrayContaining(['qwen', 'doubao', 'glm', 'kimi']))
    expect(names.length).toBe(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/translate/providers.test.js`
Expected: FAIL with "Cannot find module './providers'"

- [ ] **Step 3: Implement providers.js**

Create `src/utils/translate/providers.js`:

```js
export const PROVIDERS = {
  qwen: {
    label: '阿里千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-max'
  },
  doubao: {
    label: '火山豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    defaultModel: ''
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/translate/providers.test.js`
Expected: PASS (3 describe blocks, all green)

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/providers.js src/utils/translate/providers.test.js
git commit -m "Add translate providers config table"
```

---

## Task 2: prompt.js (system prompt builder)

**Files:**
- Create: `src/utils/translate/prompt.js`
- Test: `src/utils/translate/prompt.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/translate/prompt.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

describe('buildSystemPrompt', () => {
  it('includes auto-detect phrasing for auto direction', () => {
    const p = buildSystemPrompt('auto')
    expect(p).toMatch(/互译/)
    expect(p).toMatch(/自动检测/)
  })
  it('specifies Chinese to English for zh-en', () => {
    expect(buildSystemPrompt('zh-en')).toMatch(/中文翻译成英文/)
  })
  it('specifies English to Chinese for en-zh', () => {
    expect(buildSystemPrompt('en-zh')).toMatch(/英文翻译成中文/)
  })
  it('always demands strict JSON output', () => {
    for (const d of ['auto', 'zh-en', 'en-zh']) {
      expect(buildSystemPrompt(d)).toMatch(/"translation"/)
      expect(buildSystemPrompt(d)).toMatch(/"notes"/)
      expect(buildSystemPrompt(d)).toMatch(/不要输出 JSON 以外的内容/)
    }
  })
})

describe('buildUserPrompt', () => {
  it('returns the text as-is', () => {
    expect(buildUserPrompt('hello')).toBe('hello')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/translate/prompt.test.js`
Expected: FAIL with "Cannot find module './prompt'"

- [ ] **Step 3: Implement prompt.js**

Create `src/utils/translate/prompt.js`:

```js
export function buildSystemPrompt(direction = 'auto') {
  let task
  if (direction === 'zh-en') {
    task = '中文翻译成英文'
  } else if (direction === 'en-zh') {
    task = '英文翻译成中文'
  } else {
    task = '中文和英文互译（自动检测源语言）'
  }
  return [
    `你是专业翻译。任务：${task}。`,
    '- 自动检测源语言，如果已经是目标语言就原样返回',
    '- 输出严格 JSON：{"translation": "译文", "notes": "1-2 句关键点（词性/语境/用法/或为什么这么译）"}',
    '- 不要输出 JSON 以外的内容'
  ].join('\n')
}

export function buildUserPrompt(text) {
  return text
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/translate/prompt.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/translate/prompt.js src/utils/translate/prompt.test.js
git commit -m "Add translate system prompt builder"
```

---

## Task 3: translate-api.js (unified call + error handling)

**Files:**
- Create: `src/utils/translate/translate-api.js`
- Test: `src/utils/translate/translate-api.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/translate/translate-api.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/translate/translate-api.test.js`
Expected: FAIL with "Cannot find module './translate-api'"

- [ ] **Step 3: Implement translate-api.js**

Create `src/utils/translate/translate-api.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/translate/translate-api.test.js`
Expected: PASS (all 8 cases green)

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `npm test`
Expected: PASS (previous 13 + new tests all green)

- [ ] **Step 6: Commit**

```bash
git add src/utils/translate/translate-api.js src/utils/translate/translate-api.test.js
git commit -m "Add unified translate API with error handling"
```

---

## Task 4: storage.js extension (translate settings + deep-merge normalize)

**Files:**
- Modify: `src/utils/storage.js` (DEFAULT_SETTINGS + normalizeSettings)
- Test: `src/utils/storage.test.js` (create new file)

- [ ] **Step 1: Write the failing test**

Create `src/utils/storage.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings } from './storage'

describe('DEFAULT_SETTINGS.translate', () => {
  it('has default provider qwen and all four providers with empty apiKey', () => {
    expect(DEFAULT_SETTINGS.translate.defaultProvider).toBe('qwen')
    for (const name of ['qwen', 'doubao', 'glm', 'kimi']) {
      expect(DEFAULT_SETTINGS.translate.providers[name].apiKey).toBe('')
      expect('model' in DEFAULT_SETTINGS.translate.providers[name]).toBe(true)
    }
  })
})

describe('normalizeSettings deep-merge', () => {
  it('keeps a provided provider key without wiping other providers', () => {
    const result = normalizeSettings({
      translate: { providers: { glm: { apiKey: 'sk-xxx', model: 'glm-4' } } }
    })
    expect(result.translate.providers.glm.apiKey).toBe('sk-xxx')
    expect(result.translate.providers.qwen.apiKey).toBe('')
    expect(result.translate.providers.kimi.apiKey).toBe('')
    expect(result.translate.defaultProvider).toBe('qwen')
  })
  it('keeps other top-level settings intact', () => {
    const result = normalizeSettings({ enableTrace: false, bookmarksPerPage: 50 })
    expect(result.enableTrace).toBe(false)
    expect(result.bookmarksPerPage).toBe(50)
    expect(result.translate).toBeDefined()
  })
  it('handles missing translate block', () => {
    const result = normalizeSettings({})
    expect(result.translate.defaultProvider).toBe('qwen')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/storage.test.js`
Expected: FAIL with "Cannot read properties of undefined (reading 'translate')" or similar (DEFAULT_SETTINGS has no translate yet)

- [ ] **Step 3: Modify storage.js**

In `src/utils/storage.js`, replace the `DEFAULT_SETTINGS` and `normalizeSettings` blocks:

```js
export const DEFAULT_SETTINGS = {
  enableTrace: true,
  traceRetentionDays: 7,
  bookmarksPerPage: 20,
  defaultRootFolder: '',
  excludedDomains: [],
  translate: {
    defaultProvider: 'qwen',
    providers: {
      qwen:   { apiKey: '', model: 'qwen-max' },
      doubao: { apiKey: '', model: '' },
      glm:    { apiKey: '', model: 'glm-4' },
      kimi:   { apiKey: '', model: 'moonshot-v1-8k' }
    }
  }
}

export function normalizeSettings(settings) {
  const defaults = { ...DEFAULT_SETTINGS }
  const result = { ...defaults, ...(settings || {}) }
  result.translate = {
    ...defaults.translate,
    ...(settings?.translate || {}),
    providers: {
      ...defaults.translate.providers,
      ...(settings?.translate?.providers || {})
    }
  }
  result.excludedDomains = Array.isArray(settings?.excludedDomains) ? settings.excludedDomains : []
  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/storage.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.js src/utils/storage.test.js
git commit -m "Add translate block to settings with deep-merge normalize"
```

---

## Task 5: manifest.json host_permissions

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: Add host_permissions to manifest.json**

In `manifest.json`, add the `host_permissions` array after `permissions`:

```json
"permissions": [
  "bookmarks",
  "storage",
  "tabs",
  "history",
  "alarms"
],
"host_permissions": [
  "https://dashscope.aliyuncs.com/*",
  "https://ark.cn-beijing.volces.com/*",
  "https://open.bigmodel.cn/*",
  "https://api.moonshot.cn/*"
],
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"`
Expected: `manifest OK`

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "Add host_permissions for translate providers"
```

---

## Task 6: translate store (Pinia)

**Files:**
- Create: `src/stores/translate.js`

No unit test (project convention: stores have no tests). Verified by build + manual run.

- [ ] **Step 1: Create the store**

Create `src/stores/translate.js`:

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings } from '@/utils/storage'
import { translate as translateApi } from '@/utils/translate/translate-api'

export const useTranslateStore = defineStore('translate', () => {
  const result = ref(null)
  const loading = ref(false)
  const error = ref('')
  const provider = ref('qwen')
  const direction = ref('auto')

  async function translate(text) {
    const settings = await getSettings()
    const tSettings = settings.translate
    const useProvider = provider.value || tSettings.defaultProvider
    const providerConfig = tSettings.providers[useProvider]
    if (!providerConfig || !providerConfig.apiKey) {
      error.value = `请先在设置中配置 ${useProvider} 的 API key`
      return
    }
    loading.value = true
    error.value = ''
    result.value = null
    try {
      result.value = await translateApi({
        text,
        direction: direction.value,
        provider: useProvider,
        apiKey: providerConfig.apiKey,
        model: providerConfig.model
      })
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function setProvider(p) { provider.value = p }
  function setDirection(d) { direction.value = d }
  function clear() { result.value = null; error.value = '' }

  return { result, loading, error, provider, direction, translate, setProvider, setDirection, clear }
})
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: build succeeds (no import errors)

- [ ] **Step 3: Commit**

```bash
git add src/stores/translate.js
git commit -m "Add translate Pinia store"
```

---

## Task 7: TranslateModal.vue

**Files:**
- Create: `src/pages/main/components/TranslateModal.vue`

No unit test (project convention: components have no tests). Verified by build + manual run.

- [ ] **Step 1: Create the modal component**

Create `src/pages/main/components/TranslateModal.vue`:

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content translate-modal">
      <button class="modal-close" @click="$emit('close')">×</button>
      <h3 class="modal-title">AI 翻译</h3>

      <div class="translate-controls">
        <select v-model="provider" @change="store.setProvider(provider)">
          <option v-for="name in configuredProviders" :key="name" :value="name">
            {{ providerLabel(name) }}
          </option>
        </select>
        <select v-model="direction" @change="store.setDirection(direction)">
          <option value="auto">自动检测</option>
          <option value="zh-en">中→英</option>
          <option value="en-zh">英→中</option>
        </select>
      </div>

      <textarea
        v-model="inputText"
        placeholder="输入要翻译的文本..."
        rows="4"
        @keydown.ctrl.enter="handleTranslate"
      ></textarea>

      <button
        class="btn btn-primary"
        :disabled="store.loading || !inputText.trim()"
        @click="handleTranslate"
      >
        {{ store.loading ? '翻译中...' : '翻译' }}
      </button>

      <div v-if="store.error" class="translate-error">{{ store.error }}</div>

      <div v-if="store.result" class="translate-result">
        <div class="result-row">
          <div class="result-label">译文</div>
          <button class="speak-btn" @click="speak(store.result.translation)">朗读</button>
        </div>
        <div class="result-translation">{{ store.result.translation }}</div>
        <div v-if="store.result.notes" class="result-notes">{{ store.result.notes }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTranslateStore } from '@/stores/translate'
import { getSettings } from '@/utils/storage'
import { PROVIDERS } from '@/utils/translate/providers'

defineEmits(['close'])
const store = useTranslateStore()

const inputText = ref('')
const provider = ref('qwen')
const direction = ref('auto')
const configuredProviders = ref([])

onMounted(async () => {
  const settings = await getSettings()
  provider.value = store.provider || settings.translate.defaultProvider
  direction.value = store.direction
  const withKeys = Object.keys(settings.translate.providers).filter(
    name => settings.translate.providers[name].apiKey
  )
  configuredProviders.value = withKeys.length > 0 ? withKeys : Object.keys(PROVIDERS)
})

function providerLabel(name) {
  return PROVIDERS[name]?.label || name
}

async function handleTranslate() {
  store.setProvider(provider.value)
  store.setDirection(direction.value)
  await store.translate(inputText.value)
}

function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = direction.value === 'zh-en' ? 'en-US' : 'zh-CN'
  window.speechSynthesis.speak(utter)
}
</script>

<style scoped>
.translate-modal { max-width: 520px; padding: 24px; position: relative; }
.modal-close { position: absolute; top: 12px; right: 16px; background: transparent; border: none; font-size: 24px; cursor: pointer; color: #999; }
.modal-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.translate-controls { display: flex; gap: 8px; margin-bottom: 12px; }
.translate-controls select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical; margin-bottom: 12px; box-sizing: border-box; }
.btn-primary { background: #4a90d9; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.translate-error { color: #e53935; font-size: 13px; margin-top: 12px; }
.translate-result { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
.result-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.result-label { font-size: 13px; color: #888; }
.speak-btn { background: transparent; border: 1px solid #4a90d9; color: #4a90d9; padding: 3px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.result-translation { font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 12px; }
.result-notes { font-size: 13px; color: #666; line-height: 1.5; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; }
</style>
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/main/components/TranslateModal.vue
git commit -m "Add TranslateModal component"
```

---

## Task 8: TopNav translate button + App wiring

**Files:**
- Modify: `src/pages/main/components/TopNav.vue`
- Modify: `src/pages/main/App.vue`

- [ ] **Step 1: Add the translate button to TopNav**

In `src/pages/main/components/TopNav.vue`, in the `top-nav-right` div, insert a new button between the "全部页签" button and the "设置" button:

```html
      <button class="nav-action-btn" @click="$emit('open-translate')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 8l6 6"/>
          <path d="M4 14l6-6 2-2"/>
          <path d="M2 5h12"/>
          <path d="M7 2h1"/>
          <path d="M22 22l-5-10-5 10"/>
          <path d="M14 18h6"/>
        </svg>
        翻译
      </button>
```

- [ ] **Step 2: Add `open-translate` to TopNav emits**

In the same file, change the `defineEmits` line:

```js
defineEmits(['select-root-folder', 'open-trace', 'open-settings', 'open-all-tabs', 'open-translate'])
```

- [ ] **Step 3: Wire TranslateModal in App.vue**

In `src/pages/main/App.vue`:

(a) Add the import (after the other modal imports, around line 78):

```js
import TranslateModal from './components/TranslateModal.vue'
```

(b) Add the state ref (next to the other `showXxx` refs, around line 87):

```js
const showTranslate = ref(false)
```

(c) Add the handler (next to `handleOpenSettings`, around line 235):

```js
// 处理打开翻译
function handleOpenTranslate() {
  showTranslate.value = true
}
```

(d) Wire the emit on TopNav (add `@open-translate="handleOpenTranslate"` to the `<TopNav ... />` tag, around line 11):

```html
    @open-all-tabs="handleOpenAllTabs"
    @open-translate="handleOpenTranslate"
```

(e) Add the modal markup (after the ConfirmModal block, before the closing `</div>` of `app-container`, around line 64):

```html
    <!-- 翻译弹窗 -->
    <TranslateModal
      v-if="showTranslate"
      @close="showTranslate = false"
    />
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/main/components/TopNav.vue src/pages/main/App.vue
git commit -m "Wire translate button in TopNav and modal in App"
```

---

## Task 9: Settings page translate config section

**Files:**
- Modify: `src/pages/settings/App.vue`
- Modify: `src/pages/settings/styles.css` (append translate-inputs styles)

- [ ] **Step 1: Add the translate config section to the template**

In `src/pages/settings/App.vue`, insert this block **before** the `<!-- 数据管理 -->` section:

```html
      <!-- AI 翻译 -->
      <div class="settings-section">
        <h2>AI 翻译</h2>
        <p class="section-desc">配置大模型 API key，支持阿里千问、火山豆包、智谱 GLM、Kimi</p>
        <div v-for="name in translateProviderNames" :key="name" class="setting-item">
          <div class="setting-label">
            <span>{{ translateProviderLabel(name) }}</span>
            <span class="setting-desc">{{ translateProviderHint(name) }}</span>
          </div>
          <div class="translate-inputs">
            <input
              v-model="settings.translate.providers[name].apiKey"
              type="password"
              placeholder="API key"
              @change="saveSettings"
            >
            <input
              v-model="settings.translate.providers[name].model"
              type="text"
              :placeholder="translateModelPlaceholder(name)"
              @change="saveSettings"
            >
            <button class="secondary-btn" @click="testConnection(name)">测试</button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>默认模型</span>
            <span class="setting-desc">打开翻译弹窗时默认使用的模型</span>
          </div>
          <select v-model="settings.translate.defaultProvider" @change="saveSettings">
            <option v-for="name in translateProviderNames" :key="name" :value="name">
              {{ translateProviderLabel(name) }}
            </option>
          </select>
        </div>
      </div>
```

- [ ] **Step 2: Add imports to the script**

In the same file's `<script setup>`, after the existing imports (around line 130):

```js
import { PROVIDERS } from '@/utils/translate/providers'
import { translate as translateApi } from '@/utils/translate/translate-api'
```

- [ ] **Step 3: Add the helper functions**

In the same file's `<script setup>`, after `removeDomain` / before `clearAllTraces` (around line 162):

```js
const translateProviderNames = Object.keys(PROVIDERS)

function translateProviderLabel(name) {
  return PROVIDERS[name]?.label || name
}

function translateProviderHint(name) {
  if (name === 'doubao') return '需要在火山方舟控制台创建 endpoint，model 填 endpoint id'
  return ''
}

function translateModelPlaceholder(name) {
  if (name === 'doubao') return 'endpoint id'
  return PROVIDERS[name]?.defaultModel || '模型名'
}

async function testConnection(name) {
  const cfg = settings.value.translate.providers[name]
  if (!cfg.apiKey) { alert('请先填 API key'); return }
  try {
    await translateApi({
      text: 'hi',
      direction: 'auto',
      provider: name,
      apiKey: cfg.apiKey,
      model: cfg.model
    })
    alert(`${translateProviderLabel(name)} 连接成功`)
  } catch (err) {
    alert(`${translateProviderLabel(name)} 连接失败：${err.message}`)
  }
}
```

- [ ] **Step 4: Append translate-inputs styles**

Append to `src/pages/settings/styles.css`:

```css
.translate-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}
.translate-inputs input[type="password"],
.translate-inputs input[type="text"] {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}
.translate-inputs input[type="password"] {
  width: 180px;
}
.translate-inputs input[type="text"] {
  width: 140px;
}
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/App.vue src/pages/settings/styles.css
git commit -m "Add translate config section to settings page"
```

---

## Task 10: Rebuild dist, manual verify, push

**Files:** none modified (build + verify + push)

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: PASS (previous 13 + providers tests + prompt tests + translate-api tests + storage tests, all green)

- [ ] **Step 2: Rebuild dist**

Run: `npm run build`
Expected: build succeeds, `dist/` updated with new assets

- [ ] **Step 3: Load extension and manually verify**

Open `chrome://extensions` -> reload the unpacked extension from `dist/`. Then:

1. Open a new tab -> bookmark manager appears
2. Click "翻译" in TopNav -> TranslateModal opens
3. Enter "hello world" -> select a configured provider -> click 翻译
4. Verify translation + notes appear
5. Click 朗读 -> verify speech plays
6. Open settings -> verify "AI 翻译" section shows all 4 providers with API key / model / 测试 buttons
7. Click 测试 on a configured provider -> verify success/fail alert

If any step fails, fix the relevant component before pushing.

- [ ] **Step 4: Commit rebuilt dist**

```bash
git add dist
git commit -m "Rebuild dist for translate feature"
```

- [ ] **Step 5: Push all commits**

```bash
git push origin main
```

Expected: pushes 10+ new commits to `origin/main` (uses the configured global `http.proxy`)

- [ ] **Step 6: Confirm remote in sync**

Run: `git rev-list --left-right --count origin/main...HEAD`
Expected: `0	0`

---

## Self-Review

**1. Spec coverage:**
- Provider abstraction (OpenAI-compatible, config-driven) -> Task 1 + Task 3
- Prompt design (JSON output, direction) -> Task 2
- Data flow (store -> api -> provider) -> Task 3 + Task 6 + Task 7
- Permission changes (host_permissions) -> Task 5
- Settings extension (translate block + deep-merge) -> Task 4
- UI (TranslateModal + TopNav + App wiring) -> Task 7 + Task 8
- Settings page translate section -> Task 9
- Testing (utils TDD) -> Task 1-4 with tests
- TTS (Web Speech) -> Task 7 (speak function)
- Manual verify + push -> Task 10

All spec sections covered.

**2. Placeholder scan:**
No TBD / TODO / "add error handling" / "similar to Task N". All code blocks are complete. The only `<!-- ... -->` are Vue template comments (intentional).

**3. Type consistency:**
- `translate({ text, direction, provider, apiKey, model })` signature consistent across Task 3 (impl), Task 6 (store calls api), Task 9 (testConnection calls api)
- `PROVIDERS` object keys (`qwen`/`doubao`/`glm`/`kimi`) consistent across Task 1, Task 4 (DEFAULT_SETTINGS), Task 7 (Modal), Task 9 (settings)
- `direction` values (`auto`/`zh-en`/`en-zh`) consistent across Task 2 (prompt), Task 7 (Modal select), Task 9 (testConnection)
- `buildSystemPrompt(direction)` signature consistent across Task 2 (def), Task 3 (call)

No inconsistencies found. Plan is complete.
