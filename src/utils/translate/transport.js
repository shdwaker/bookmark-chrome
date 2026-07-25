// Transport layer for translate API requests.
//
// Why this exists: extension pages (chrome-extension://...) and content scripts
// are subject to CORS preflight for non-simple headers. The Anthropic Messages
// API requires `x-api-key` and `anthropic-version` headers, which trigger a
// preflight that the Volcengine server does not allow. The background service
// worker has host_permissions and is NOT subject to CORS, so we route the fetch
// through it via chrome.runtime.sendMessage.
//
// When doFetch runs INSIDE the background worker itself (e.g. the DO_TRANSLATE
// handler), there's no separate worker to message - we do a direct fetch.
// We detect this by checking `typeof window === 'undefined'` (service workers
// have no window).
//
// In the test environment `chrome` is undefined and `window` exists (jsdom),
// so we fall back to a direct `fetch()` call. This lets tests mock
// `globalThis.fetch` exactly as before without needing to mock chrome.

function isBackgroundWorker() {
  return typeof window === 'undefined'
}

function hasBackgroundWorker() {
  return typeof chrome !== 'undefined'
    && chrome.runtime
    && typeof chrome.runtime.sendMessage === 'function'
}

async function fetchViaBackground(url, options) {
  // Service worker may be inactive (MV3 lazy startup). First sendMessage can
  // fail with "Receiving end does not exist" while Chrome spins up the worker.
  // Retry once after a short delay to let the worker register its listener.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_FETCH',
        url,
        options: {
          method: options.method,
          headers: options.headers,
          body: options.body
        }
      })
      if (!response) {
        throw new Error('后台未响应翻译请求')
      }
      if (response.error) {
        throw new Error(response.error)
      }
      return {
        status: response.status,
        ok: response.ok,
        text: async () => response.bodyText,
        json: async () => JSON.parse(response.bodyText)
      }
    } catch (err) {
      const isReceivingEnd = err.message && err.message.includes('Receiving end does not exist')
      if (!isReceivingEnd || attempt === 1) {
        throw err
      }
      // Wait briefly for the service worker to finish starting up, then retry.
      await new Promise((r) => setTimeout(r, 150))
    }
  }
}

export async function doFetch(url, options) {
  if (isBackgroundWorker()) {
    return fetch(url, options)
  }
  if (hasBackgroundWorker()) {
    return fetchViaBackground(url, options)
  }
  return fetch(url, options)
}
