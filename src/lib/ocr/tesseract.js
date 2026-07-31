import { createWorker, PSM } from "tesseract.js";

const MRZ_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Could not load the selected image for OCR."));
    };

    image.src = imageUrl;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not prepare the MRZ area for OCR."));
      }
    }, "image/png");
  });
}

function drawCrop(image, startRatio, endRatio, shouldThreshold) {
  const sourceY = Math.floor(image.height * startRatio);
  const sourceHeight = Math.floor(image.height * endRatio) - sourceY;
  const scale = 3;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = image.width * scale;
  canvas.height = sourceHeight * scale;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    0,
    sourceY,
    image.width,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (!shouldThreshold) {
    return canvas;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const gray = red * 0.3 + green * 0.59 + blue * 0.11;
    const value = gray > 165 ? 255 : 0;

    imageData.data[index] = value;
    imageData.data[index + 1] = value;
    imageData.data[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
}

async function createMRZCrops(imageFile) {
  const image = await loadImage(imageFile);
  const cropSettings = [
    [0.78, 1, false],
    [0.78, 1, true],
    [0.72, 1, false],
    [0.72, 1, true],
    [0.84, 1, false],
    [0.84, 1, true],
  ];

  return Promise.all(
    cropSettings.map(([startRatio, endRatio, shouldThreshold]) =>
      canvasToBlob(drawCrop(image, startRatio, endRatio, shouldThreshold))
    )
  );
}

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
    const fullImageResult = await worker.recognize(imageFile);
    const mrzTexts = [];

    try {
      const mrzCrops = await createMRZCrops(imageFile);

      await worker.setParameters({
        tessedit_char_whitelist: MRZ_CHARACTERS,
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: "1",
      });

      for (const mrzCrop of mrzCrops) {
        const result = await worker.recognize(mrzCrop);
        mrzTexts.push(result.data?.text || "");
      }
    } catch (error) {
      console.warn("MRZ-focused OCR pass failed", error);
    }

    const text = [fullImageResult.data?.text, ...mrzTexts].filter(Boolean).join("\n");

    if (!text.trim()) {
      throw new Error("OCR finished, but no text was found in the image.");
    }

    return text;
  } catch (error) {
    throw new Error(error?.message || "OCR failed while reading the passport image.");
  } finally {
    await worker.terminate();
  }
}
