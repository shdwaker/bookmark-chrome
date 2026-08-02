// Smart paragraph detection via DOM tree traversal.
// Walks the DOM recursively, classifying elements as inline/block/skip,
// grouping consecutive inline text nodes into "pieces" (paragraphs).
// Block elements force piece breaks. Pieces exceeding 1000 chars are split.
//
// Reimplemented from scratch -- algorithm inspired by immersive-translate's
// getPiecesToTranslate, but written independently in modern ES module syntax.

import { hasLatinLetters, hasCJK, looksLikeMath } from './language-detect.js'

export const INLINE_TAGS = new Set([
  'A', 'B', 'I', 'SPAN', 'STRONG', 'EM', 'SUB', 'SUP', 'SMALL',
  'MARK', 'ABBR', 'CITE', 'Q', 'CODE', 'U', 'S', 'DEL', 'INS',
  'BDO', 'BDI', 'TIME', 'DATA', 'RB', 'RT', 'RTC', 'RP'
])

export const BLOCK_TAGS = new Set([
  'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE',
  'TD', 'TH', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE',
  'FIGURE', 'FIGCAPTION', 'PRE', 'TABLE', 'TR', 'TBODY', 'THEAD', 'TFOOT',
  'UL', 'OL', 'DL', 'DD', 'DT', 'ADDRESS', 'FIELDSET', 'LEGEND',
  'DETAILS', 'SUMMARY', 'FORM'
])

export const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEXTAREA', 'SVG', 'NOSCRIPT', 'IFRAME',
  'BR', 'KBD', 'WBR', 'SELECT', 'DATALIST', 'OPTION', 'OPTGROUP',
  'OBJECT', 'EMBED', 'CANVAS', 'AUDIO', 'VIDEO', 'TRACK', 'MAP', 'AREA',
  'MATH', 'MJX-CONTAINER'
])

const MATH_CLASSES = new Set(['katex', 'MathJax', 'mathjax', 'math'])

const MAX_PIECE_CHARS = 1000
const EXCLUDED_ROOTS = new Set([
  '#__ai_translate_panel_host__',
  '#__ai_translate_read_aloud_host__',
  '#__ai_translate_popper_host__',
  '#__mt_control_bar_host__',
  '#__immersive_control_bar_host__'
])

// Find the nearest block ancestor of a text node.
function findBlockAncestor(node) {
  let el = node.parentElement
  while (el) {
    if (BLOCK_TAGS.has(el.tagName) || el === document.body) {
      return el
    }
    el = el.parentElement
  }
  return document.body
}

// Check if an element should be skipped (notranslate, translate=no, contenteditable, excluded root, math).
function shouldSkipElement(el) {
  if (SKIP_TAGS.has(el.tagName)) return true
  if (el.classList?.contains('notranslate')) return true
  if (el.getAttribute?.('translate') === 'no') return true
  if (el.isContentEditable) return true
  if (el.getAttribute?.('contenteditable') === 'true') return true
  if (el.id && EXCLUDED_ROOTS.has(el.id)) return true
  if (el.dataset?.immersiveOriginal !== undefined) return true
  if (el.dataset?.immersiveTranslated !== undefined) return true
  // Skip KaTeX/MathJax rendered math.
  if (el.classList) {
    for (const cls of MATH_CLASSES) {
      if (el.classList.contains(cls)) return true
    }
  }
  return false
}

// Check if text should be skipped based on direction + language.
function shouldSkipByLanguage(text, direction) {
  if (direction === 'en-zh' && !hasLatinLetters(text)) return true
  if (direction === 'zh-en' && !hasCJK(text)) return true
  return false
}

// Mark noTranslateSelectors matches with .notranslate.
function applyNoTranslateSelectors(root, selectors) {
  for (const selector of selectors) {
    try {
      root.querySelectorAll(selector).forEach(el => {
        el.classList.add('notranslate')
      })
    } catch {
      // Invalid selector -- skip
    }
  }
}

// Get roots to traverse: either site rule containers or the root itself.
function getTraversalRoots(root, rule) {
  if (rule?.containerSelectors?.length) {
    const roots = []
    for (const selector of rule.containerSelectors) {
      try {
        root.querySelectorAll(selector).forEach(el => roots.push(el))
      } catch {
        // Invalid selector -- skip
      }
    }
    return roots.length > 0 ? roots : [root]
  }
  return [root]
}

export function collectPieces(root, options = {}) {
  const { direction = 'auto', limit = 500, rule = null } = options

  // Apply site rule: mark no-translate elements.
  if (rule?.noTranslateSelectors?.length) {
    applyNoTranslateSelectors(root, rule.noTranslateSelectors)
  }

  const traversalRoots = getTraversalRoots(root, rule)
  const pieces = []
  let idCounter = 0

  for (const trRoot of traversalRoots) {
    walkAndCollect(trRoot, direction, pieces, () => {
      idCounter++
      return `p${idCounter}`
    })
  }

  // Truncate to limit.
  const result = pieces.slice(0, limit)
  return result
}

// Recursive DOM walker. Maintains an "open piece" that accumulates
// consecutive inline text nodes. Block elements close and reopen pieces.
function walkAndCollect(node, direction, pieces, nextId) {
  let openPiece = null

  const ensureOpen = (blockEl) => {
    if (openPiece && openPiece.text.length >= MAX_PIECE_CHARS) {
      closePiece(openPiece, pieces)
      openPiece = null
    }
    if (!openPiece) {
      openPiece = {
        id: nextId(),
        blockEl: blockEl || document.body,
        textNodes: [],
        text: '',
        status: 'pending'
      }
    }
    return openPiece
  }

  const processNode = (node, currentBlockEl) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      const trimmed = text.trim()
      if (trimmed.length === 0) return

      if (shouldSkipByLanguage(trimmed, direction)) return
      if (looksLikeMath(trimmed)) return

      const blockEl = currentBlockEl || findBlockAncestor(node)

      // Split long text into chunks that fit within MAX_PIECE_CHARS
      let remaining = trimmed
      while (remaining.length > 0) {
        const piece = ensureOpen(blockEl)
        const prefix = piece.text ? ' ' : ''
        const available = MAX_PIECE_CHARS - piece.text.length - prefix.length
        if (available <= 0) {
          // Current piece is full -- close and retry
          closePiece(piece, pieces)
          openPiece = null
          continue
        }
        const chunk = remaining.slice(0, available)
        piece.textNodes.push(node)
        piece.text += prefix + chunk
        remaining = remaining.slice(available)
        if (remaining.length > 0) {
          closePiece(piece, pieces)
          openPiece = null
        }
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node

    // Skip excluded elements entirely.
    if (shouldSkipElement(el)) {
      if (openPiece) {
        closePiece(openPiece, pieces)
        openPiece = null
      }
      return
    }

    // Determine if this element is a block boundary.
    const isBlock = BLOCK_TAGS.has(el.tagName)
    const newBlockEl = isBlock ? el : currentBlockEl

    if (isBlock && openPiece) {
      closePiece(openPiece, pieces)
      openPiece = null
    }

    // Recurse into children.
    for (const child of el.childNodes) {
      processNode(child, newBlockEl)
    }

    if (isBlock && openPiece) {
      closePiece(openPiece, pieces)
      openPiece = null
    }
  }

  processNode(node, null)

  if (openPiece) {
    closePiece(openPiece, pieces)
  }
}

function closePiece(piece, pieces) {
  if (piece.textNodes.length > 0 && piece.text.trim().length > 0) {
    pieces.push(piece)
  }
}
