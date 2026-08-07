"use client";

import { useRef } from "react";
import { ScanLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PassportUploader({ onFileSelect, isScanning }) {
  const inputRef = useRef(null);

  return (
    <Card className="border-0 bg-transparent shadow-none ring-0">
      <CardContent className="p-0">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={(event) => onFileSelect(event.target.files?.[0])}
          disabled={isScanning}
          aria-label="Choose a passport photo"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isScanning}
          className="group relative block w-full rounded-2xl border-2 border-dashed border-pass-blue/40 bg-white/60 p-8 text-center outline-none transition-colors focus-visible:border-pass-blue focus-visible:ring-3 focus-visible:ring-pass-blue/25 hover:border-pass-blue aria-disabled:cursor-not-allowed sm:p-12"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-pass-blue/25 bg-white text-pass-blue shadow-sm transition-transform group-hover:-translate-y-0.5">
            <ScanLine aria-hidden className="size-7" />
          </span>
          <span className="mt-5 block font-display text-lg font-semibold tracking-tight text-pass-ink">
            {isScanning ? "Reading your passport\u2026" : "Fold open the data page to the light"}
          </span>
          <span className="mx-auto mt-2 block max-w-md text-sm leading-relaxed text-muted-foreground">
            {isScanning
              ? "Keep the passport steady while the kiosk reads the machine-readable zone at the bottom."
              : "Take the photo flat, in even light, with the two dark MRZ lines at the bottom sharp and in focus. The kiosk reads them."}
          </span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-pass-blue px-4 py-2.5 text-sm font-medium text-white transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0">
            {isScanning ? "Scanning\u2026" : "Choose a photo"}
          </span>
        </button>
      </CardContent>
    </Card>
  );
}