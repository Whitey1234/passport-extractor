"use client";

import { useState } from "react";
import { recognizePassportImage } from "@/lib/ocr/tesseract";
import { extractMRZ } from "@/lib/mrz/extractMRZ";
import { repairDocumentNumber } from "@/lib/mrz/repairDocumentNumber";
import { parseMRZ } from "@/lib/mrz/parseMRZ";
import { formatPassportData } from "@/lib/mrz/formatPassportData";
import PassportUploader from "@/components/passport/PassportUploader";
import ImagePreview from "@/components/passport/ImagePreview";
import ScanProgress from "@/components/passport/ScanProgress";
import PassportResult from "@/components/passport/PassportResult";
import ScanError from "@/components/passport/ScanError";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for upload");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    setError(null);
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
      setStatus("Reading the machine-readable zone...");

      const mrzLines = extractMRZ(text);
      const repairedLines = repairDocumentNumber(mrzLines);
      const parsed = parseMRZ(repairedLines);
      const formatted = formatPassportData(parsed);

      setProgress(100);
      setStatus("Done");
      setResult(formatted);
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Scan failed. Please try another image.");
      setError(err?.message || "The machine zone could not be read from this photo.");
      setResult(null);
    } finally {
      setIsScanning(false);
    }
  }

  function handleRetry() {
    setSelectedFile(null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return "";
    });
    setResult(null);
    setError(null);
    setIsScanning(false);
    setProgress(0);
    setStatus("Waiting for upload");
  }

  return (
    <main className="min-h-screen bg-pass-paper text-pass-ink">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6">
        <header className="doc-edge">
          <p className="font-display text-2xl font-bold tracking-tight text-pass-ink">
            PASSPORT <span className="font-normal text-pass-foil">/</span> EXTRACTOR
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Read your passport&apos;s machine-readable zone and copy the record in plain text.
          </p>
        </header>

        <div className="mt-10 space-y-6">
          <PassportUploader onFileSelect={handleFileSelect} isScanning={isScanning} />

          {isScanning && <ScanProgress status={status} progress={progress} />}

          {previewUrl && !error && <ImagePreview fileUrl={previewUrl} fileName={selectedFile?.name} />}

          {!isScanning && result && <PassportResult data={result} />}

          {!isScanning && error && <ScanError message={error} onRetry={handleRetry} />}
        </div>

        <footer className="mt-14 border-t border-pass-line pt-4 font-mono text-xs leading-relaxed text-muted-foreground">
          Photos are read inside your browser — nothing is uploaded.
          <span className="mx-2 text-pass-foil">·</span>
          TD3 machine-readable passports only.
        </footer>
      </div>
    </main>
  );
}