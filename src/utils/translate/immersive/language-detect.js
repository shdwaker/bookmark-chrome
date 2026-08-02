// Language detection helpers for immersive translation.
// Simple letter-class checks -- not full language detection, but sufficient
// for skip logic (avoid translating text already in the target language).

export function hasLatinLetters(text) {
  return /[A-Za-z]/.test(text || '')
}

export function hasCJK(text) {
  // CJK Unified Ideographs + Hiragana/Katakana + Hangul
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || '')
}

// --- Math formula detection ---
// Unicode ranges for mathematical symbols.
const MATH_ALPHA_RE = /[\u{1D400}-\u{1D7FF}]/u   // Mathematical Alphanumeric Symbols (𝐳, 𝑥, 𝒂)
const SUPER_SUB_RE = /[\u{00B2}\u{00B3}\u{00B9}\u{2070}-\u{209F}]/u // ²³¹ + Subscripts/Superscripts block
const MATH_OPS_RE = /[\u{2200}-\u{22FF}]/u         // Mathematical Operators (∑, ∫, ∂, √, ≤, ≥, ∞)
const MATH_MISC_RE = /[\u{27C0}-\u{27EF}\u{2980}-\u{29FF}\u{2A00}-\u{2AFF}]/u
const LATEX_CMD_RE = /\\[a-zA-Z]+/                  // LaTeX commands: \frac, \sum

const STANDALONE_MATH_TERM = /^(sqrt|exp|log|ln|sin|cos|tan|softmax|relu|sigmoid|tanh|argmax|argmin|norm|det|tr|max|min|sum|avg|abs)$/i

const MATH_FUNC_CALL = /\b(sqrt|exp|log|ln|sin|cos|tan|softmax|relu|sigmoid|tanh|argmax|argmin|norm|det|tr)\s*\(/i

// Check if text looks like a mathematical formula or math symbol.
// Returns true for strong math signals: Unicode math characters, LaTeX
// commands, function-call notation, or standalone math function names.
export function looksLikeMath(text) {
  if (!text) return false
  const t = text.trim()
  if (!t) return false

  if (MATH_ALPHA_RE.test(t)) return true
  if (MATH_OPS_RE.test(t)) return true
  if (MATH_MISC_RE.test(t)) return true
  if (SUPER_SUB_RE.test(t) && /[=+\-*/()]/.test(t)) return true
  if (LATEX_CMD_RE.test(t)) return true
  if (MATH_FUNC_CALL.test(t)) return true
  if (t.length <= 20 && STANDALONE_MATH_TERM.test(t)) return true
  // Short text that is entirely a function call: f(x,y), T(x)
  if (t.length < 50 && /^[a-zA-Z]\w*\([^)]*\)$/.test(t)) return true

  return false
}

// Proportion of mathematical symbol characters in text.
// Used to decide if a paragraph is primarily a formula (vs. natural
// language that merely mentions a math term).
export function mathSymbolRatio(text) {
  if (!text || text.length === 0) return 0
  let count = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (
      (code >= 0x1D400 && code <= 0x1D7FF) ||
      (code === 0x00B2 || code === 0x00B3 || code === 0x00B9) ||
      (code >= 0x2070 && code <= 0x209F) ||
      (code >= 0x2200 && code <= 0x22FF) ||
      (code >= 0x27C0 && code <= 0x27EF) ||
      (code >= 0x2980 && code <= 0x29FF) ||
      (code >= 0x2A00 && code <= 0x2AFF)
    ) {
      count++
    }
  }
  return count / text.length
}
