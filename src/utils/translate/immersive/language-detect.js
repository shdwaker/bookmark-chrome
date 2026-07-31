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
