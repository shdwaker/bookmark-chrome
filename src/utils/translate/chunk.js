// Splits text into ~500-char chunks at sentence boundaries for incremental
// translation. Each chunk is translated independently and results are
// concatenated, allowing the UI to render partial results as they arrive.

const CHUNK_SIZE = 500

export function splitTextIntoChunks(text, maxSize = CHUNK_SIZE) {
  if (text.length <= maxSize) return [text]
  // Split at sentence-ending punctuation or newlines.
  const sentences = text.split(/(?<=[.!?。！？\n])\s*/)
  const chunks = []
  let current = ''
  for (const sentence of sentences) {
    if (!sentence) continue
    if (current && (current.length + sentence.length + 1) > maxSize) {
      chunks.push(current)
      current = sentence
    } else {
      current = current ? current + ' ' + sentence : sentence
    }
    // Hard-split very long single sentences.
    while (current.length > maxSize * 1.5) {
      chunks.push(current.slice(0, maxSize))
      current = current.slice(maxSize)
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export { CHUNK_SIZE }
