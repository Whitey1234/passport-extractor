import { checkDigitMatches } from "./checksum.js";
import {
  generateCandidates,
  getAmbiguousPositions,
  CONFUSION_MAP,
  CONFUSION_MAP_SIZE,
} from "./confusionMap.js";

const LOG_PREFIX = "[repairField]";

// Fires once in the browser console as soon as this module is imported,
// i.e. when the page loads. Proves the repair layer and confusion map are wired.
console.log(
  `${LOG_PREFIX} module loaded, confusion map connected (${CONFUSION_MAP_SIZE} pairs)`
);

/**
 * Generic checksum-driven repair engine.
 *
 * Given a field value and its ICAO check digit, this tries the original value
 * first and, only if it fails validation, searches through OCR confusion
 * candidates for the closest value whose check digit matches.
 *
 * It is deliberately field-agnostic so the same engine can be reused for the
 * document number, birth date, expiry date, personal number and the composite
 * check digit.
 *
 * @param {object} options
 * @param {string} options.value The raw OCR field value (with fillers as-is).
 * @param {string} options.checkDigit The expected ICAO check digit string.
 * @param {Record<string, string[]>} [options.confusionMap]
 * @returns {string} The repaired value, or the original value unchanged.
 */
export function repairField({ value, checkDigit, confusionMap = CONFUSION_MAP }) {
  if (typeof value !== "string" || value.length === 0) {
    console.log(`${LOG_PREFIX} skipped (empty value)`);
    return value;
  }

  if (typeof checkDigit !== "string" || !/^[0-9]$/.test(checkDigit)) {
    console.log(`${LOG_PREFIX} skipped (invalid check digit "${checkDigit}")`);
    return value;
  }

  console.log(`${LOG_PREFIX} called: value="${value}" checkDigit=${checkDigit}`);

  // Always report which characters the confusion map regards as ambiguous.
  const ambiguous = getAmbiguousPositions(value, confusionMap);
  console.log(
    `${LOG_PREFIX} confusion map consulted, ambiguous positions:`,
    ambiguous.length === 0
      ? "none"
      : ambiguous.map(({ index, alternatives }) => `${index}:${alternatives.join("/")}`)
  );

  // Valid values are never touched.
  if (checkDigitMatches(value, checkDigit)) {
    console.log(`${LOG_PREFIX} original already passes checksum, no change needed`);
    return value;
  }

  console.log(`${LOG_PREFIX} checksum mismatch, searching candidates...`);

  let matched = null;

  for (const candidate of generateCandidates(value, confusionMap)) {
    if (candidate === value) {
      continue;
    }

    if (checkDigitMatches(candidate, checkDigit)) {
      matched = candidate;
      break;
    }
  }

  if (matched === null) {
    console.log(`${LOG_PREFIX} no candidate matched the check digit, keeping value`);
    return value;
  }

  console.log(`${LOG_PREFIX} repaired "${value}" -> "${matched}"`);
  return matched;
}