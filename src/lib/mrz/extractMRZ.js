function normalizeLine(line) {
  return line
    .toUpperCase()
    .replace(/[\u00ab\u2039]/g, "<")
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9<]/g, "");
}

function normalizeLength(line) {
  if (line.length === 44) {
    return line;
  }

  // TD3 lines are fixed at 44 chars. Extra trailing fillers are OCR spillover.
  if (line.length > 44 && line.length <= 46 && /^P[A-Z0-9<]/.test(line)) {
    return line.slice(0, 44);
  }

  if (line.length > 44 && line.length <= 46 && /^[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}/.test(line)) {
    return line.slice(0, 44);
  }

  return line;
}

function repairFirstLineFillers(line) {
  if (!line.startsWith("P") || line.length < 40 || line.length > 46) {
    return line;
  }

  const fillerMistakes = (line.match(/[LC]/g) || []).length;
  const realFillers = (line.match(/</g) || []).length;

  if (realFillers > 6 || fillerMistakes < 8) {
    return line;
  }

  const chars = [...line];
  const firstSeparator = chars.findIndex((char, index) => index > 5 && char === "<");
  const repairStart = firstSeparator > 0 ? Math.max(5, firstSeparator - 1) : 5;

  for (let index = repairStart; index < chars.length; index += 1) {
    if (chars[index] === "L" || chars[index] === "C") {
      chars[index] = "<";
    }
  }

  return chars.join("").slice(0, 44);
}

function looksLikeTD3FirstLine(line) {
  return line.length === 44 && line.startsWith("P") && line.includes("<<");
}

function looksLikeTD3SecondLine(line) {
  return line.length === 44 && /^[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}/.test(line);
}

function isCandidateLine(line) {
  return (
    line.length >= 40 &&
    line.length <= 46 &&
    (line.includes("<") || line.startsWith("P") || looksLikeTD3SecondLine(line))
  );
}

export function extractMRZ(text) {
  if (!text?.trim()) {
    throw new Error("No OCR text was available for MRZ extraction.");
  }

  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .map(repairFirstLineFillers)
    .map(normalizeLength)
    .filter(Boolean);

  const mrzCandidates = [...new Set(lines.filter(isCandidateLine))];

  console.log("MRZ Candidates:", mrzCandidates);
  console.log(
    "MRZ Lengths:",
    mrzCandidates.map((line) => line.length)
  );

  const firstLines = mrzCandidates.filter(looksLikeTD3FirstLine);
  const secondLines = mrzCandidates.filter(looksLikeTD3SecondLine);

  if (firstLines.length > 0 && secondLines.length > 0) {
    return [firstLines[0], secondLines[0]];
  }

  throw new Error(
    "Could not find two valid TD3 passport MRZ lines. Make sure the full bottom MRZ area is visible and sharp."
  );
}
