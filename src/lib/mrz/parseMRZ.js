import { parse } from "mrz";

export function parseMRZ(mrzLines) {
  if (!Array.isArray(mrzLines) || mrzLines.length !== 2) {
    throw new Error("Invalid MRZ: a TD3 passport requires exactly 2 MRZ lines.");
  }

  if (mrzLines.some((line) => line.length !== 44)) {
    throw new Error("Invalid MRZ: each TD3 passport MRZ line must be 44 characters.");
  }

  try {
    console.log("MRZ sent to parser:", mrzLines);
    const parsed = parse(mrzLines, {
      autocorrect: true,
    });

    console.log("Parsed MRZ:", parsed);

    const fields = parsed.fields || {};

    if (parsed.format !== "TD3") {
      throw new Error("MRZ parsing failed: expected a TD3 passport MRZ.");
    }

    if (!fields.documentNumber || !fields.issuingState || !fields.nationality) {
      throw new Error("MRZ parsing failed: required passport fields are missing.");
    }

    const firstName = fields.firstName || "";
    const lastName = fields.lastName || "";

    return {
      fullName: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      passportNumber: fields.documentNumber || "",
      nationality: fields.nationality || "",
      birthDate: fields.birthDate || "",
      expiryDate: fields.expirationDate || "",
      sex: fields.sex || "",
      issuingState: fields.issuingState || "",
      valid: Boolean(parsed.valid),
    };
  } catch (error) {
    console.error("MRZ parsing failed", error);
    throw new Error(error?.message || "MRZ parsing failed.");
  }
}
