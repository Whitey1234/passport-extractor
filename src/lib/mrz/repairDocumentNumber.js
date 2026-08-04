import { repairField } from "./repairField.js";

const LOG_PREFIX = "[repairDocumentNumber]";

export const DOCUMENT_NUMBER_START = 0;
export const DOCUMENT_NUMBER_END = 9;
export const DOCUMENT_NUMBER_CHECK_DIGIT_INDEX = 9;

/**
 * Checksum-driven repair for the TD3 document number.
 *
 * Runs after MRZ extraction and before the MRZ parser. It reads the document
 * number from MRZ line 2 (positions 0-8), validates it against its check digit
 * (position 9), and only rewrites ambiguous OCR characters when a candidate
 * satisfies the ICAO check digit. Valid numbers and all other lines are
 * returned untouched.
 *
 * @param {string[]} mrzLines Two 44-character TD3 MRZ lines.
 * @returns {string[]} The MRZ lines, with the document number repaired when possible.
 */
export function repairDocumentNumber(mrzLines) {
  console.log(
    `${LOG_PREFIX} called with ${Array.isArray(mrzLines) ? mrzLines.length : 0} line(s)`
  );

  if (!Array.isArray(mrzLines) || mrzLines.length !== 2) {
    return mrzLines;
  }

  const line2 = mrzLines[1];

  if (typeof line2 !== "string" || line2.length < DOCUMENT_NUMBER_CHECK_DIGIT_INDEX + 1) {
    return mrzLines;
  }

  const checkDigit = line2[DOCUMENT_NUMBER_CHECK_DIGIT_INDEX];

  if (!/^[0-9]$/.test(checkDigit)) {
    return mrzLines;
  }

  const documentNumber = line2.slice(DOCUMENT_NUMBER_START, DOCUMENT_NUMBER_END);
  const repairedNumber = repairField({
    value: documentNumber,
    checkDigit,
  });

  if (repairedNumber === documentNumber) {
    return mrzLines;
  }

  console.log(
    `${LOG_PREFIX} document number "${documentNumber}" -> "${repairedNumber}"`
  );

  return [mrzLines[0], `${repairedNumber}${line2.slice(DOCUMENT_NUMBER_END)}`];
}