const FILLER_OCR_MISTAKES = "LKCSI1";
const SEPARATOR_OCR_CHARS = "<CK";

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

function isPossibleSeparatorPair(pair) {
  return (
    pair.length === 2 &&
    [...pair].every((char) => SEPARATOR_OCR_CHARS.includes(char))
  );
}

function getVisibleName(value) {
  return value.replace(/<+$/g, "");
}

function getTrailingFillerLikeCount(value) {
  const match = value.match(/[<LKCSI1]+$/);
  return match ? match[0].length : 0;
}

function createSeparatorCandidate(nameField, separatorIndex) {
  const originalPair = nameField.slice(separatorIndex, separatorIndex + 2);
  const lastName = nameField.slice(0, separatorIndex);
  const rawFirstNames = nameField.slice(separatorIndex + 2);

  if (!lastName || !rawFirstNames || !isPossibleSeparatorPair(originalPair)) {
    return null;
  }

  // TD3 line 1 is: surname << given-names, then filler characters.
  // TD3 line 1 is: surname << given-names, then filler characters.
  const cleanedFirstNames = cleanTrailingFiller(cleanLeadingFiller(rawFirstNames));
  const visibleFirstNames = getVisibleName(cleanedFirstNames);

  if (!visibleFirstNames || /[0-9]/.test(lastName + visibleFirstNames)) {
    return null;
  }

  let score = 0;

  if (originalPair === "<<") {
    score += 80;
  } else if (originalPair.includes("<")) {
    score += 55;
  } else {
    score += 35;
  }

  score += Math.min(visibleFirstNames.length, 12);
  score += Math.min(getTrailingFillerLikeCount(rawFirstNames), 20);
  // Tie-breaker: when two candidates score equally, prefer the one that
  // keeps more of the surname intact (e.g. "TAREK" over "TARE") rather
  // than the accidental first-found split.
  score += lastName.length * 0.01;
  
  if (lastName.includes("<")) {
    score -= 4;
  }

  if (visibleFirstNames.length <= 1) {
    score -= 10;
  }

  return {
    field: `${lastName}<<${cleanedFirstNames}`,
    score,
  };
}

function fixMissingNameSeparator(nameField) {
  const candidates = [];

  for (let index = 1; index < nameField.length - 1; index += 1) {
    const pair = nameField.slice(index, index + 2);

    if (isPossibleSeparatorPair(pair)) {
      const candidate = createSeparatorCandidate(nameField, index);

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  if (candidates.length === 0) {
    return nameField;
  }

  return candidates.sort((left, right) => right.score - left.score)[0].field;
}
function cleanLeadingFiller(value) {
  const match = value.match(/^[<LKCSI1]+/);
  if (!match) return value;

  const run = match[0];

  // Only treat this as corrupted-separator debris if the leading run
  // contains a literal '<'. A pure run of letters (e.g. name starting
  // with "K" like "KAMAL") is more likely a real name, not OCR noise —
  // so we leave it alone in that case.
  if (!run.includes("<")) {
    return value;
  }

  const rest = value.slice(run.length);

  // Only strip if what remains still looks like a real name.
  if (/^[A-Z]{2,}/.test(rest)) {
    return rest;
  }

  return value;
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

  if (fillerText[0] !== "<" && fillerText[0] === fillerText[1] && cleanValue.length >= 4) {
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
  if (!/^[A-Z]{3}$/.test(nationality || "") || !/^[A-Z0-9<]{3}$/.test(value || "")) {
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

function cleanTD3SecondLine(line, issuingState) {
  if (line.length < 30 || line.length > 46) {
    return line;
  }

  const documentAndCheckDigit = line.slice(0, 10);

  if (!/^[A-Z0-9<]{9}[0-9]$/.test(documentAndCheckDigit)) {
    return line;
  }

  const nationality = repairIssuingState(line.slice(10, 13), issuingState);
  let cleanedLine = `${documentAndCheckDigit}${nationality}${line.slice(13)}`;

  if (cleanedLine.length > 44 && countFillerLike(cleanedLine.slice(44)) === cleanedLine.length - 44) {
    cleanedLine = cleanedLine.slice(0, 44);
  }

  if (cleanedLine.length < 44 && cleanedLine.length >= 38) {
    cleanedLine = cleanedLine.padEnd(44, "<");
  }

  return cleanedLine;
}

function cleanTD3FirstLine(line, nationality) {
  if (!line.startsWith("P") || line.length < 25 || line.length > 60) {
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

function isLikelyFirstLineCandidate(line) {
  return line.length >= 25 && line.length <= 60 && line.startsWith("P");
}

function isLikelySecondLineCandidate(line) {
  if (line.length < 30 || line.length > 46) {
    return false;
  }

  return /^[A-Z0-9<]{9}[0-9][A-Z0-9<]{3}[0-9]{6}/.test(line);
}

function isCandidateLine(line) {
  return isLikelyFirstLineCandidate(line) || isLikelySecondLineCandidate(line);
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
  const likelyFirstLines = candidateLines.filter(isLikelyFirstLineCandidate);
  const likelySecondLines = candidateLines.filter(isLikelySecondLineCandidate);
  const detectedSecondLines = likelySecondLines.filter(looksLikeTD3SecondLine);
  const nationality = detectedSecondLines[0]?.slice(10, 13) || "";
  const cleanedFirstLines = likelyFirstLines.map((line) => cleanTD3FirstLine(line, nationality));
  const issuingState = cleanedFirstLines.find(looksLikeTD3FirstLine)?.slice(2, 5) || "";
  const cleanedSecondLines = likelySecondLines.map((line) => cleanTD3SecondLine(line, issuingState));
  const cleanedCandidates = [...new Set([...cleanedFirstLines, ...cleanedSecondLines])];

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
