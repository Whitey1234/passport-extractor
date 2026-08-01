import { createWorker, PSM } from "tesseract.js";

const MRZ_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

export async function recognizePassportImage(imageFile, onProgress) {
  if (!imageFile) {
    throw new Error("No passport image was selected.");
  }

  if (!imageFile.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (typeof onProgress === "function") {
        onProgress(message);
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: MRZ_CHARACTERS,
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: "1",
    });

    const { data } = await worker.recognize(imageFile);
    console.log("OCR confidence:", data.confidence);

    if (!data?.text?.trim()) {
      throw new Error("OCR finished, but no text was found in the image.");
    }

    return data.text;
  } catch (error) {
    throw new Error(error?.message || "OCR failed while reading the passport image.");
  } finally {
    await worker.terminate();
  }
}
