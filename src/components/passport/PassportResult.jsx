"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStampSound } from "./useStamp";
import InkStamp from "./InkStamp";

const FIELDS = [
  { key: "fullName", label: "Full name" },
  { key: "passportNumber", label: "Passport number" },
  { key: "nationality", label: "Nationality" },
  { key: "birthDate", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "expiryDate", label: "Expiry date" },
  { key: "issuingState", label: "Issuing state" },
  { key: "valid", label: "Validity" },
];

function buildRecord(data) {
  const lines = FIELDS.filter((f) => {
    const v = data[f.key];
    return v !== undefined && v !== "" && v !== "Unknown";
  }).map((f) => `${f.label}: ${data[f.key]}`);

  return [...lines, "", "Copied from Passport Extractor"].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to legacy method */
    }
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function CopyLine({ text, label }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex min-w-0 items-center gap-3 sm:min-w-40">
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <button
        type="button"
        onClick={async () => {
          const ok = await copyText(text);
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-pass-blue outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pass-blue/40 aria-disabled:cursor-not-allowed hover:bg-pass-blue/10 border-pass-blue/30"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
        <span className="tabular-nums">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export default function PassportResult({ data }) {
  const { play } = useStampSound();
  const [stamped, setStamped] = useState(false);

  const handleCopyAll = useCallback(async () => {
    const ok = await copyText(buildRecord(data));
    if (ok) {
      play();
      setStamped(true);
      setTimeout(() => setStamped(false), 2600);
    }
  }, [data, play]);

  if (!data) return null;

  return (
    <div className="relative">
      <section
        aria-label="Extracted passport data"
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-0"
      >
        <header className="bg-pass-ink px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-xs tracking-[0.28em] uppercase text-pass-foil">
                Passport verified
              </p>
              <h2 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight">
                {data.fullName}
              </h2>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-zinc-200">
              <span aria-hidden className="size-1.5 rounded-full bg-pass-foil" />
              Ready
            </span>
          </div>
          <div className="mt-4 border-t border-white/15 pt-3 font-mono text-xs tracking-wider text-zinc-300">
            MRZ · TD3 · {data.issuingState}
          </div>
        </header>

        <div className="divide-y divide-pass-line">
          {FIELDS.map((field, i) => (
            <div
              key={field.key}
              className="print-in flex items-center justify-between gap-4 px-5 py-3 sm:px-6"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className="min-w-0">
                <p className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {field.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[15px] text-pass-ink",
                    field.key === "passportNumber" &&
                      "font-mono text-base font-bold tracking-wider text-pass-blue"
                  )}
                >
                  {data[field.key]}
                </p>
              </div>
              <CopyLine text={`${field.label}: ${data[field.key]}`} label={field.label} />
            </div>
          ))}
        </div>

        <div className="border-t border-pass-line bg-pass-paper/70 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pass-ink px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus-visible:ring-3 focus-visible:ring-pass-blue/40 hover:bg-pass-blue sm:w-auto"
          >
            <Copy aria-hidden className="size-4" />
            <span>Copy certified record</span>
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Copies the full record as plain text you can paste into a form.
          </p>
        </div>
      </section>

      {stamped && <InkStamp text="COPIED" tone="blue" />}
    </div>
  );
}