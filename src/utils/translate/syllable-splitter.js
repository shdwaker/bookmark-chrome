// Syllable splitter for English pronunciation teaching.
//
// Splits words into syllable chunks using enhanced rules:
// - Vowel digraphs (ea, oo, ai, igh, etc.) treated as one vowel sound
// - R-controlled vowels (ar, er, ir, or, ur) kept together
// - Magic e (CVCe pattern) detected; silent e marked
// - Consonant-le endings (ta-ble, ap-ple) handled
// - Consonant blends (bl, cr, str, etc.) kept together within a syllable
//
// Not a perfect phonetic analyzer -- English spelling is too irregular for
// that. This is an educational aid that gives reasonable splits for most
// common words.

const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u'])

// Consonant blends that should stay together as an onset (start of syllable).
const ONSET_BLENDS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'fl', 'gl',
  'pl', 'sl', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'ch', 'sh',
  'th', 'wh', 'ph', 'wr', 'kn', 'gn', 'sch', 'scr', 'shr', 'sph',
  'spl', 'spr', 'squ', 'str', 'thr'
])

function isVowel(ch) {
  return VOWEL_LETTERS.has(ch.toLowerCase())
}

// 'y' at the end of a word functions as a vowel (happy, sky, fly).
function isVowelAt(ch, pos, word) {
  if (VOWEL_LETTERS.has(ch.toLowerCase())) return true
  return ch.toLowerCase() === 'y' && pos === word.length - 1
}

// Find vowel groups in a word. Each group is { start, end } index pair
// (inclusive). Consecutive vowel letters form one group. A following 'r'
// is included for r-controlled vowels. 'y' at the end is treated as vowel.
function findVowelGroups(word) {
  const w = word.toLowerCase()
  const groups = []
  let i = 0
  while (i < w.length) {
    if (isVowelAt(w[i], i, w)) {
      let end = i
      // Extend through consecutive vowels (including end-y).
      while (end + 1 < w.length && isVowelAt(w[end + 1], end + 1, w)) {
        end++
      }
      // Include trailing 'r' for r-controlled vowels (car, bird, fork).
      if (end + 1 < w.length && w[end + 1] === 'r') {
        end++
      }
      groups.push({ start: i, end })
      i = end + 1
    } else {
      i++
    }
  }
  return groups
}

// Check if the word ends with a consonant-le pattern (table, apple, little).
// Returns the index of the consonant before 'le', or -1 if no match.
function findConsonantLeEnding(word) {
  const w = word.toLowerCase()
  if (w.length < 3) return -1
  const tail = w.slice(-3) // last 3 chars
  // Pattern: consonant + 'l' + 'e' at the end
  if (tail[1] === 'l' && tail[2] === 'e' && !isVowel(tail[0])) {
    return w.length - 3 // index of the consonant before 'le'
  }
  return -1
}

// Check if word has a magic-e pattern: ends with e, preceded by CVC,
// where the final e is silent and the preceding vowel says its name.
// Returns true if the final 'e' should be attached to the previous syllable
// rather than forming its own.
function isMagicE(word, vowelGroups) {
  const w = word.toLowerCase()
  if (w.length < 4) return false
  if (w[w.length - 1] !== 'e') return false
  // The last vowel group must not include the final 'e' (i.e., 'e' is
  // a separate single vowel letter at the end).
  const lastGroup = vowelGroups[vowelGroups.length - 1]
  if (!lastGroup) return false
  // Final 'e' is its own vowel group at the very end.
  if (lastGroup.start !== w.length - 1 || lastGroup.end !== w.length - 1) {
    return false
  }
  // There must be exactly one consonant between the penultimate vowel group
  // and the final 'e'.
  const prevGroup = vowelGroups[vowelGroups.length - 2]
  if (!prevGroup) return false
  const consonantsBetween = prevGroup.end + 1
  return consonantsBetween === w.length - 2 // one consonant between
}

// Check if a consonant pair is a blend that should stay together.
function isOnsetBlend(pair) {
  return ONSET_BLENDS.has(pair.toLowerCase())
}

// Split a word into syllable chunks.
// Returns an array of objects: { text, isSilent } where isSilent marks
// magic-e letters that don't form a separate syllable.
export function splitSyllables(word) {
  if (!word) return [{ text: word, isSilent: false }]
  if (word.length <= 1) return [{ text: word, isSilent: false }]
  const w = word.toLowerCase()

  // Words with no vowel letters -- return as-is.
  const vowelGroups = findVowelGroups(w)
  if (vowelGroups.length === 0) {
    return [{ text: word, isSilent: false }]
  }

  // Handle consonant-le ending: split off the final C+le as one syllable.
  const cleIdx = findConsonantLeEnding(w)
  if (cleIdx >= 0 && vowelGroups.length >= 2) {
    // Recursively split the part before the consonant-le, then append.
    const before = w.slice(0, cleIdx)
    const lePart = w.slice(cleIdx)
    const beforeSyllables = before ? splitSyllables(before) : []
    return [...beforeSyllables, { text: lePart, isSilent: false }]
  }

  // Handle magic-e: the final silent 'e' doesn't form its own syllable.
  // Remove it from the vowel groups and attach to the previous syllable.
  let groups = vowelGroups
  let magicE = false
  if (isMagicE(w, vowelGroups)) {
    groups = vowelGroups.slice(0, -1)
    magicE = true
  }

  if (groups.length === 0) {
    return [{ text: word, isSilent: false }]
  }

  if (groups.length === 1) {
    // Single syllable word (magic-e is already absorbed into the word).
    return [{ text: word, isSilent: false }]
  }

  // Multiple vowel groups: split between them.
  // Build syllable segments by assigning consonants between groups.
  const syllables = []
  let prevEnd = -1

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    // Determine the onset (consonants before this vowel group, after prevEnd).
    const consonantStart = prevEnd + 1
    const consonantEnd = group.start - 1
    const consonantSpan = consonantEnd - consonantStart + 1

    if (gi === 0) {
      // First syllable: includes leading consonants + first vowel group.
      const start = 0
      const end = group.end
      syllables.push({ start, end })
    } else {
      // Decide how to split consonants between prev vowel group and this one.
      const prevSyllable = syllables[syllables.length - 1]
      const consonants = w.slice(consonantStart, consonantEnd + 1)

      if (consonantSpan === 0) {
        // No consonants between vowel groups -- extend previous syllable
        // to just before this vowel group, start new syllable at vowel.
        prevSyllable.end = group.start - 1
        syllables.push({ start: group.start, end: group.end })
      } else if (consonantSpan === 1) {
        // One consonant: open syllable, consonant goes to next syllable.
        prevSyllable.end = consonantStart - 1
        syllables.push({ start: consonantStart, end: group.end })
      } else if (consonantSpan === 2) {
        // Two consonants: keep onset blends together, otherwise split VC/CV.
        if (isOnsetBlend(consonants)) {
          // Valid onset (bl, cr, gr, etc.): give both to next syllable.
          prevSyllable.end = consonantStart - 1
          syllables.push({ start: consonantStart, end: group.end })
        } else {
          // Split between the two consonants (VC/CV): com-pu, rab-bit.
          prevSyllable.end = consonantStart
          syllables.push({ start: consonantStart + 1, end: group.end })
        }
      } else {
        // 3+ consonants: try to keep an onset blend at the end together.
        const lastPair = consonants.slice(-2)
        if (isOnsetBlend(lastPair)) {
          // Last two form an onset: give them to next syllable.
          prevSyllable.end = consonantEnd - 2
          syllables.push({ start: consonantEnd - 1, end: group.end })
        } else {
          // Default: give first consonant to previous, rest to next.
          prevSyllable.end = consonantStart
          syllables.push({ start: consonantStart + 1, end: group.end })
        }
      }
    }
    prevEnd = group.end
  }

  // Extend the last syllable to include any trailing consonants.
  if (syllables.length > 0) {
    syllables[syllables.length - 1].end = w.length - 1
  }

  // Convert to { text, isSilent } objects, preserving original case.
  return syllables.map(s => ({
    text: word.slice(s.start, s.end + 1),
    isSilent: false
  }))
}
