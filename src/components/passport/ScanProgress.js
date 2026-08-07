"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export default function ScanProgress({ status, progress }) {
  const readyCells = Math.round((progress / 100) * 28);

  return (
    <Card className="overflow-hidden border-0 bg-pass-ink text-zinc-100 shadow-none ring-0">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm tracking-[0.3em] uppercase text-pass-foil">
              Machine reading
            </p>
            <p className="mt-1 text-sm text-zinc-300">{status}</p>
          </div>
          <p className="font-mono text-lg font-bold text-white tabular-nums">
            {progress}
            <span className="text-xs text-zinc-400">%</span>
          </p>
        </div>

        <Progress
          value={progress}
          aria-label="Scan progress"
          className="gap-0"
          data-slot="scan-progress"
        />

        <div
          className="rounded-lg border border-white/10 bg-black/25 p-4 font-mono text-sm leading-loose tracking-widest text-pass-foil"
          aria-hidden
        >
          <span className="text-zinc-600">&#9646;&#9646;&#9646;&#9646;&#9646;&#9646;</span>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className={i < readyCells ? "text-zinc-200" : "text-white/12"}>
              {"\u25A0"}
            </span>
          ))}
          <span className="text-zinc-600">&#9646;&#9646;&#9646;&#9646;&#9646;&#9646;</span>
        </div>
      </CardContent>
    </Card>
  );
}