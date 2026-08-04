/**
 * ICAO Doc 9303 check digit primitives.
 *
 * The check digit algorithm is the same for every MRZ field:
 * - Map each character to its value (0-9 -> 0-9, A-Z -> 10-35, '<' -> 0).
 * - Multiply each value by a repeating weight of 7, 3, 1 (per position).
 * - Sum the weighted values and take modulo 10.
 */

export const WEIGHTS = [7, 3, 1];

export function charValue(char) {
  const code = char.charCodeAt(0);

  if (code === 60) return 0; // '<' filler
  if (code >= 48 && code <= 57) return code - 48; // '0'-'9'
  if (code >= 65 && code <= 90) return code - 55; // 'A'-'Z'

  throw new Error(`Invalid MRZ character for check digit computation: "${char}".`);
}

export function computeCheckDigit(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Cannot compute a check digit for an empty value.");
  }

  let sum = 0;

  for (let index = 0; index < value.length; index += 1) {
    sum += charValue(value[index]) * WEIGHTS[index % WEIGHTS.length];
  }

  return sum % 10;
}

export function checkDigitMatches(value, checkDigit) {
  if (typeof checkDigit !== "string" || !/^[0-9]$/.test(checkDigit)) {
    return false;
  }

  return computeCheckDigit(value) === Number(checkDigit);
}