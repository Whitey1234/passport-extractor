function formatDate(value) {
  if (!value || !/^\d{6}$/.test(value)) {
    return value || "Unknown";
  }

  const year = value.slice(0, 2);
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);

  return `${year}-${month}-${day}`;
}

export function formatPassportData(parsed) {
  if (!parsed) return null;

  return {
    fullName: parsed.fullName || "Unknown",
    firstName: parsed.firstName || "Unknown",
    lastName: parsed.lastName || "Unknown",
    passportNumber: parsed.passportNumber || "Unknown",
    nationality: parsed.nationality || "Unknown",
    birthDate: formatDate(parsed.birthDate),
    expiryDate: formatDate(parsed.expiryDate),
    sex: parsed.sex || "Unknown",
    issuingState: parsed.issuingState || "Unknown",
    valid: parsed.valid ? "Valid" : "Invalid",
  };
}
