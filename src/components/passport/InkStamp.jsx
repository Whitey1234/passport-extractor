"use client";

import { cn } from "@/lib/utils";

export default function InkStamp({ text, tone = "blue", className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none select-none",
        "stamp-corner absolute -bottom-3 -right-2 z-10 sm:-right-4 sm:-bottom-5",
        className
      )}
    >
      <div className="stamp-in relative grid h-24 w-24 place-items-center rounded-full sm:h-28 sm:w-28">
        <span
          className={cn(
            "absolute inset-0 rounded-full ring-[3px] ring-offset-2",
            tone === "red" ? "ring-pass-stamp" : "ring-pass-blue"
          )}
        />
        <span className="absolute inset-0 rounded-full border border-dashed [mask-image:radial-gradient(closest-side,transparent_78%,#000_79%)]" />
        <span
          className={cn(
            "flex w-full flex-col items-center gap-0.5 px-2 text-center",
            tone === "red" ? "text-pass-stamp" : "text-pass-blue"
          )}
        >
          <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">
            {text}
          </span>
          <span className="font-display text-[9px] uppercase tracking-[0.2em]">
            passport extractor
          </span>
        </span>
      </div>
    </div>
  );
}