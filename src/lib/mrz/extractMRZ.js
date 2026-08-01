const FILLER_OCR_MISTAKES = "LKCSI1";

function normalizeLine(line) {
  return line
    .toUpperCase()
    .replace(/[\u00ab\u2039]/g, "<")
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9<]/g, "");
}

function isFillerMistake(char) {
  return FILLER_OCR_MISTAKES.includes(char);
}

function isFillerLike(char) {
  return char === "<" || isFillerMistake(char);
}

function countFillerLike(value) {
  return [...value].filter(isFillerLike).length;
}

function fixMissingNameSeparator(nameField) {
  if (nameField.includes("<<")) {
    return nameField;
  }

  const chars = [...nameField];
  const firstSeparator = chars.indexOf("<");

  if (firstSeparator >= 0 && isFillerMistake(chars[firstSeparator + 1])) {
    chars[firstSeparator + 1] = "<";
  }

  if (firstSeparator > 0 && isFillerMistake(chars[firstSeparator - 1])) {
    chars[firstSeparator - 1] = "<";
  }

  return chars.join("");
}

function cleanTrailingFiller(value) {
  const match = value.match(/[<LKCSI1]{3,}$/);

  if (!match) {
    return value;
  }

  const run = match[0];
  const runStart = value.length - run.length;
  let cleanValue = value.slice(0, runStart);
  let fillerText = run;

  while (
    fillerText.length > 1 &&
    fillerText[0] !== "<" &&
    fillerText[1] !== "<" &&
    fillerText[0] !== fillerText[1] &&
    cleanValue.length >= 3
  ) {
    cleanValue += fillerText[0];
    fillerText = fillerText.slice(1);
  }

  // Preserve one possible real final letter, like the last L in SHAKIL.
  if (fillerText[0] !== "<" && fillerText[1] !== "<" && cleanValue.length >= 3) {
    cleanValue += fillerText[0];
    fillerText = fillerText.slice(1);
  }

  return cleanValue + "<".repeat(fillerText.length);
}

function cleanTD3NameField(nameField) {
  const repairedNameField = fixMissingNameSeparator(nameField);
  const separatorIndex = repairedNameField.indexOf("<<");

  if (separatorIndex === -1) {
    return repairedNameField;
  }

  const lastName = repairedNameField.slice(0, separatorIndex);
  const firstNames = repairedNameField.slice(separatorIndex + 2);

  return `${lastName}<<${cleanTrailingFiller(firstNames)}`;
}

function getDifferenceCount(left, right) {
  if (!left || !right || left.length !== right.length) {
    return 99;
  }

  return [...left].filter((char, index) => char !== right[index]).length;
}

function repairIssuingState(value, nationality) {
  if (!/^[A-Z]{3}$/.test(nationality || "")) {
    return value;
  }

  if (value === nationality) {
    return value;
  }

  // Use line 2 nationality only for a near-match OCR slip, e.g. BED -> BGD.
  if (getDifferenceCount(value, nationality) <= 1) {
    return nationality;
  }

  return value;
}

function cleanTD3FirstLine(line, nationality) {
  if (!line.startsWith("P") || line.length < 40 || line.length > 60) {
    return line;
  }

  const chars = [...line];

  if (isFillerMistake(chars[1])) {
    chars[1] = "<";
  }

  const documentCode = chars.slice(0, 2).join("");
  const issuingState = repairIssuingState(chars.slice(2, 5).join(""), nationality);
  const nameField = chars.slice(5).join("");
  const cleanedNameField = cleanTD3NameField(nameField);
  let cleanedLine = `${documentCode}${issuingState}${cleanedNameField}`;

  if (cleanedLine.length > 44 && countFillerLike(cleanedLine.slice(44)) === cleanedLine.length - 44) {
    cleanedLine = cleanedLine.slice(0, 44);
  }

  if (cleanedLine.length < 44 && countFillerLike(cleanedLine.slice(-6)) >= 4) {
    cleanedLine = cleanedLine.padEnd(44, "<");
  }

  return cleanedLine;
}

function looksLikeTD3FirstLine(line) {
  return line.length === 44 && line.startsWith("P") && line.slice(1, 2) === "<" && line.includes("<<");
}

function looksLikeTD3SecondLine(line) {
  return line.length === 44 && /^[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}/.test(line);
}

function isCandidateLine(line) {
  return (
    line.length >= 40 &&
    line.length <= 60 &&
    (line.includes("<") || line.startsWith("P") || looksLikeTD3SecondLine(line))
  );
}

export function extractMRZ(text) {
  if (!text?.trim()) {
    throw new Error("No OCR text was available for MRZ extraction.");
  }

  const normalizedLines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const candidateLines = normalizedLines.filter(isCandidateLine);
  const detectedSecondLines = candidateLines.filter(looksLikeTD3SecondLine);
  const nationality = detectedSecondLines[0]?.slice(10, 13) || "";
  const cleanedCandidates = [
    ...new Set(candidateLines.map((line) => (line.startsWith("P") ? cleanTD3FirstLine(line, nationality) : line))),
  ];

  console.log("Detected MRZ:", candidateLines);
  console.log("MRZ cleanup result:", cleanedCandidates);
  console.log(
    "MRZ Lengths:",
    cleanedCandidates.map((line) => line.length)
  );

  const firstLines = cleanedCandidates.filter(looksLikeTD3FirstLine);
  const secondLines = cleanedCandidates.filter(looksLikeTD3SecondLine);

  if (firstLines.length > 0 && secondLines.length > 0) {
    return [firstLines[0], secondLines[0]];
  }

  throw new Error(
    "Could not find two valid TD3 passport MRZ lines. Make sure the full bottom MRZ area is visible and sharp."
  );
}
