"use client";

import { useState } from "react";
import { recognizePassportImage } from "@/lib/ocr/tesseract";
import { extractMRZ } from "@/lib/mrz/extractMRZ";
import { parseMRZ } from "@/lib/mrz/parseMRZ";
import { formatPassportData } from "@/lib/mrz/formatPassportData";
import PassportUploader from "@/components/passport/PassportUploader";
import ImagePreview from "@/components/passport/ImagePreview";
import ScanProgress from "@/components/passport/ScanProgress";
import PassportResult from "@/components/passport/PassportResult";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for upload");
  const [result, setResult] = useState(null);

  async function handleFileSelect(file) {
    if (!file) {
      setStatus("Please choose an image file.");
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setStatus("Please choose a valid image file.");
      setResult(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return URL.createObjectURL(file);
    });
    setResult(null);
    setIsScanning(true);
    setProgress(10);
    setStatus("Preparing OCR...");

    try {
      const text = await recognizePassportImage(file, (message) => {
        if (message.status) {
          setStatus(message.status);
        }

        if (typeof message.progress === "number") {
          setProgress(Math.round(message.progress * 55) + 10);
        }
      });

      console.log("Raw OCR:", text);
      setProgress(60);
      setStatus("Extracting MRZ...");

      const mrzLines = extractMRZ(text);
      const parsed = parseMRZ(mrzLines);
      const formatted = formatPassportData(parsed);

      setProgress(100);
      setStatus("Done");
      setResult(formatted);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "Scan failed. Please try another image.");
      setResult(null);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
            Passport OCR
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Extract passport data from images</h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
            Upload a passport image to run OCR, detect the MRZ, and view the parsed traveler information.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <PassportUploader onFileSelect={handleFileSelect} isScanning={isScanning} />
            <ScanProgress status={status} progress={progress} />
          </div>
          <div className="space-y-6">
            <ImagePreview fileUrl={previewUrl} fileName={selectedFile?.name} />
            <PassportResult data={result} />
          </div>
        </div>
      </div>
    </main>
  );
}
