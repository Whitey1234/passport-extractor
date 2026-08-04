/**
 * OCR confusion map and deterministic candidate generation.
 *
 * The map pairs characters that Tesseract most often confuses with one
 * another. Candidates are only generated for positions whose character is
 * present in the map (ambiguous positions). Everything else stays untouched.
 */

export const CONFUSION_MAP = Object.freeze({
  "4": Object.freeze(["4", "A"]),
  A: Object.freeze(["A", "4"]),
  "0": Object.freeze(["0", "O"]),
  O: Object.freeze(["O", "0"]),
  "1": Object.freeze(["1", "I"]),
  I: Object.freeze(["I", "1"]),
  "5": Object.freeze(["5", "S"]),
  S: Object.freeze(["S", "5"]),
  "8": Object.freeze(["8", "B"]),
  B: Object.freeze(["B", "8"]),
  "2": Object.freeze(["2", "Z"]),
  Z: Object.freeze(["Z", "2"]),
  "6": Object.freeze(["6", "G"]),
  G: Object.freeze(["G", "6"]),
});

export const CONFUSION_MAP_SIZE = Object.keys(CONFUSION_MAP).length;

/**
 * Return the positions of `value` whose character exists in the confusion map.
 * Each entry carries the alternatives to try for that position. This is the
 * confirmation that the confusion map is being consulted.
 *
 * @param {string} value
 * @param {Record<string, string[]>} confusionMap
 */
export function getAmbiguousPositions(value, confusionMap = CONFUSION_MAP) {
  const positions = [];

  for (let index = 0; index < value.length; index += 1) {
    const alternatives = confusionMap[value[index]];

    if (alternatives && alternatives.length > 1) {
      positions.push({ index, alternatives });
    }
  }

  return positions;
}

/**
 * Yield every subset of `array` of exactly `size` elements, in index order.
 * Deterministic so results are reproducible run after run.
 */
function* subsets(array, size, start = 0, current = []) {
  if (current.length === size) {
    yield [...current];
    return;
  }

  for (let index = start; index < array.length; index += 1) {
    current.push(array[index]);
    yield* subsets(array, size, index + 1, current);
    current.pop();
  }
}

/**
 * Lazily generate repair candidates ordered by how many characters differ
 * from the original value (fewest edits first). This mirrors real-world OCR,
 * where single-character slips are the most common, so the most likely fix is
 * attempted first. Generation is lazy and stops as soon as a match is found.
 *
 * @param {string} value
 * @param {Record<string, string[]>} confusionMap
 * @returns {Generator<string, void, void>}
 */
export function* generateCandidates(value, confusionMap = CONFUSION_MAP) {
  const ambiguous = getAmbiguousPositions(value, confusionMap);
  const chars = [...value];

  if (ambiguous.length === 0) {
    yield value;
    return;
  }

  for (let changeCount = 0; changeCount <= ambiguous.length; changeCount += 1) {
    for (const chosen of subsets(ambiguous, changeCount)) {
      const candidate = [...chars];

      for (const { index, alternatives } of chosen) {
        const current = value[index];
        candidate[index] = alternatives.find((option) => option !== current);
      }

      yield candidate.join("");
    }
  }
}