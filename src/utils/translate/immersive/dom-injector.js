// DOM injection for immersive translation: cloning block elements,
// replacing text nodes with translated spans, mode switching, and cleanup.
//
// Cloning strategy: each unique blockEl is cloned once and inserted as
// previousSibling. The original blockEl's text nodes are replaced with
// <span data-immersive-translated> elements containing the translation.
// Mode switching toggles display on clones and originals.

const TRANSLATED_ATTR = 'data-immersive-translated'
const ORIGINAL_ATTR = 'data-immersive-original'
const TRANSLATED_TAG = 'span'

// Clone a block element and insert it as previousSibling.
// Returns { clone, blockEl } for tracking.
export function cloneBlockElement(blockEl) {
  const clone = blockEl.cloneNode(true)
  clone.setAttribute(ORIGINAL_ATTR, '1')
  clone.style.display = 'none'
  blockEl.parentNode.insertBefore(clone, blockEl)
  return { clone, blockEl }
}

// Inject a translation into a piece's text nodes.
// The translation covers the WHOLE piece (all text nodes combined), so it
// is shown once in the first text node's position; remaining text nodes are
// replaced with hidden empty spans so the original text doesn't show through.
//
// translation may be a string or a { translation, notes } object (stale cache
// entries from before the string-extraction fix). Both are normalized to a
// string here.
// Returns array of { originalNode, translatedSpan, blockEl } for cleanup.
export function injectTranslation(piece, translation) {
  const spans = []
  if (piece.textNodes.length === 0) return spans

  // Normalize to string: handle stale cache objects and array wrappers.
  const raw = Array.isArray(translation) ? translation[0] : translation
  const text = (raw && typeof raw === 'object') ? (raw.translation || '') : String(raw || '')

  for (let i = 0; i < piece.textNodes.length; i++) {
    const textNode = piece.textNodes[i]
    const span = document.createElement(TRANSLATED_TAG)
    span.setAttribute(TRANSLATED_ATTR, '1')
    if (i === 0) {
      span.textContent = text
    } else {
      // The translation already covers this text; hide the placeholder so
      // the original fragment doesn't appear alongside the translation.
      span.textContent = ''
      span.style.display = 'none'
    }
    textNode.parentNode.replaceChild(span, textNode)
    spans.push({
      originalNode: textNode,
      translatedSpan: span,
      blockEl: piece.blockEl
    })
  }

  piece.status = 'translated'
  return spans
}

// Mark a piece as failed with a retry indicator.
export function markFailed(piece, err, onRetry) {
  const span = document.createElement(TRANSLATED_TAG)
  span.setAttribute(TRANSLATED_ATTR, '1')
  span.setAttribute('data-immersive-failed', '1')
  span.style.cssText = 'color:#e53935;cursor:pointer;border-bottom:1px dashed #e53935;'
  span.textContent = `翻译失败：${err.message}（点击重试）`
  span.addEventListener('click', () => onRetry(piece))

  // Replace the first text node with the failed indicator.
  if (piece.textNodes.length > 0) {
    const firstNode = piece.textNodes[0]
    firstNode.parentNode.replaceChild(span, firstNode)
  }

  piece.status = 'failed'
  return [{
    originalNode: piece.textNodes[0],
    translatedSpan: span,
    blockEl: piece.blockEl
  }]
}

// Switch display mode for all tracked clones and blockEls.
// mode: 'dual' | 'translated' | 'original'
// clones: Map of blockEl -> cloneNode
// translatedSpans: array of { originalNode, translatedSpan, blockEl }
export function setMode(mode, clones, translatedSpans) {
  const blockEls = new Set()
  for (const { blockEl } of translatedSpans) {
    blockEls.add(blockEl)
  }

  for (const [blockEl, clone] of clones) {
    if (!blockEls.has(blockEl)) continue
    switch (mode) {
      case 'dual':
        clone.style.display = ''
        clone.style.opacity = '0.6'
        blockEl.style.display = ''
        break
      case 'translated':
        clone.style.display = 'none'
        blockEl.style.display = ''
        break
      case 'original':
        clone.style.display = ''
        clone.style.opacity = ''
        blockEl.style.display = 'none'
        break
    }
  }
}

// Restore all text nodes and remove clones.
// translatedSpans: array of { originalNode, translatedSpan, blockEl }
// clones: Map of blockEl -> cloneNode
export function clearAll(translatedSpans, clones) {
  // Restore original text nodes (reverse order to handle nested spans).
  for (let i = translatedSpans.length - 1; i >= 0; i--) {
    const { originalNode, translatedSpan } = translatedSpans[i]
    if (translatedSpan.parentNode) {
      translatedSpan.parentNode.replaceChild(originalNode, translatedSpan)
    }
  }

  // Remove all clones.
  for (const clone of clones.values()) {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone)
    }
  }
}
