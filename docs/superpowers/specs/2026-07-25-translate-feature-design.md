# Translate Feature Design Spec

**Date:** 2026-07-25
**Topic:** AI-powered translation modal (Chinese ↔ English + TTS) added to the bookmark-chrome extension as an independent module.

## Goal

Add an AI-powered translation feature to the existing bookmark-chrome Chrome extension. Supports Chinese ↔ English translation with brief explanatory notes, plus pronunciation via Web Speech API. Uses LLM providers (Qwen / Doubao / GLM / Kimi) via OpenAI-compatible APIs. Triggered as a modal from the new-tab page's TopNav. Configured via API keys in settings.

## Decisions

- **Placement**: Added to existing extension as an independent module (own store / utils / component). Not a new standalone extension.
- **Trigger**: A modal opened from a "翻译" button in TopNav. No view switch, no context menu, no content-script injection.
- **Auth**: Unified API key. User registers at each provider, gets a key, fills it into settings. No OAuth (providers don't open OAuth to third-party extensions).
- **TTS**: Browser-native Web Speech API (`SpeechSynthesis`). Free, no config, no permission.
- **Translation mode**: Translation + brief notes (1-2 sentences: part of speech / context / usage / why translated that way). Plays to AI's strength vs Google Translate.
- **Model selection UX**: UI switch. User configures multiple providers in settings, switches between them at the top of the modal.

## Architecture

Translation is an independent module:

```
src/stores/translate.js                          # Pinia store (state + actions)
src/utils/translate/providers.js                 # provider config table
src/utils/translate/translate-api.js             # unified translate() entry
src/utils/translate/prompt.js                    # system prompt generation
src/pages/main/components/TranslateModal.vue     # the modal UI
```

TopNav gets a "翻译" button that opens the modal. The bookmark view stays as-is; the modal floats on top.

## Provider Abstraction

**Key finding**: Qwen (DashScope compatible mode), Doubao (Volcano Ark), GLM (Zhipu), and Kimi (Moonshot) all support the OpenAI-compatible `/v1/chat/completions` protocol. So all four adapters share a base; each adapter is just config (endpoint + default model). Adding a new model = one line in the config table.

### `providers.js`

```js
export const PROVIDERS = {
  qwen:   { label: '阿里千问', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', defaultModel: 'qwen-max' },
  doubao: { label: '火山豆包', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', defaultModel: '' /* uses endpoint id */ },
  glm:    { label: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', defaultModel: 'glm-4' },
  kimi:   { label: 'Kimi',     endpoint: 'https://api.moonshot.cn/v1/chat/completions', defaultModel: 'moonshot-v1-8k' }
}
```

### `translate-api.js`

- `translate({ text, from, to, provider, apiKey, model }) -> { translation, notes }`
- Builds OpenAI-compatible request body: `{ model, messages: [{role:'system', content:...}, {role:'user', content: text}] }`
- Headers: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`
- POST to provider endpoint
- Parse response: extract `choices[0].message.content`, parse it as JSON, return `{ translation, notes }`
- Error handling: network error, 401 (key invalid), 429 (rate limit / quota exhausted), 5xx (server), JSON parse error

## Prompt Design

System prompt (shared by all providers):

```
你是专业翻译。把用户输入从{from}翻译成{to}。
- 自动检测源语言，如果已经是目标语言就原样返回
- 输出严格 JSON：{"translation": "译文", "notes": "1-2 句关键点（词性/语境/用法/或为什么这么译）"}
- 不要输出 JSON 以外的内容
```

`from` / `to`: `中文` / `英文` / `auto`. Default `auto` (model auto-detects). User can manually override direction in the modal.

## Data Flow

1. User clicks "翻译" in TopNav → TranslateModal opens
2. User enters text, selects provider (dropdown shows only providers with apiKey set), selects direction (auto / 中→英 / 英→中)
3. Click translate → TranslateModal calls translate store
4. Store calls `translate-api.js` `translate()`
5. `translate-api` looks up provider config, builds OpenAI-compatible request, fetches
6. Parses JSON response, returns `{ translation, notes }`
7. Store updates result; UI shows translation + notes + speak button
8. Click speak → `speechSynthesis.speak(new SpeechSynthesisUtterance(translation))`

## Permission Changes

`manifest.json` add `host_permissions` (extension page calling external API requires this):

```json
"host_permissions": [
  "https://dashscope.aliyuncs.com/*",
  "https://ark.cn-beijing.volces.com/*",
  "https://open.bigmodel.cn/*",
  "https://api.moonshot.cn/*"
]
```

No `contextMenus` / `activeTab` / `scripting` added (called from extension page, not injected into pages).

## Settings Extension

`DEFAULT_SETTINGS` add a `translate` block:

```js
translate: {
  defaultProvider: 'qwen',
  providers: {
    qwen:   { apiKey: '', model: 'qwen-max' },
    doubao: { apiKey: '', model: '' /* endpoint id */ },
    glm:    { apiKey: '', model: 'glm-4' },
    kimi:   { apiKey: '', model: 'moonshot-v1-8k' }
  }
}
```

`normalizeSettings` extended to deep-merge the `translate` block (so partial updates don't wipe other providers' keys).

Settings page gets a "翻译" section: one row per provider with name + API key input + model input + "测试连接" button (sends a minimal request to verify the key).

UI hint for Doubao: model field placeholder says `填 endpoint id（火山方舟控制台创建）`.

## UI Components

### `TranslateModal.vue`

- **Top**: provider dropdown (only providers with `apiKey` set) + direction toggle (auto / 中→英 / 英→中)
- **Middle**: input textarea + translate button
- **Bottom**: result area (translation + speak button + notes)
- **Top-right**: close button (X)
- **States**: loading (during API call), error (key invalid / quota / network), empty

Follows existing modal pattern (`ConfirmModal` / `BookmarkEditModal` / etc.) for styling, z-index, backdrop click to close, ESC to close.

### TopNav

Adds a "翻译" button → opens TranslateModal. Bookmark view stays visible underneath.

### Settings page

Adds a translate configuration section below existing options.

## Testing

- `translate-api.test.js` -- mock `fetch`, test request construction, response parsing, error handling (401 / 429 / 5xx / JSON parse error)
- `prompt.test.js` -- test prompt generation with different `from` / `to`
- providers config test -- ensure each provider config is complete (`endpoint` + `defaultModel`)

Follow the existing test pattern (`src/utils/*.test.js`, Vitest).

## YAGNI (not doing in this iteration)

- No web-page selected-text translation (chose new-tab input box)
- No OAuth (using API key)
- No LLM TTS (using Web Speech)
- No multi-style translation (translation + notes only)
- No auto fallback (user manually switches)
- No translation history (can add later)

## Risks / Follow-ups

- **Doubao requires endpoint id** (not a model name). Settings UI must hint this; users go to Volcano Ark console to create an endpoint.
- **Web Speech API quality** depends on the system / browser TTS engine. Acceptable for MVP.
- **API keys stored in `chrome.storage.local`** (not encrypted). Acceptable for a personal-use extension; document this in the settings UI.
- **Rate limits / quotas vary by provider.** No retry logic in MVP; on error the user manually switches provider.
