"use client";

import { RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import InkStamp from "./InkStamp";

export default function ScanError({ message, onRetry }) {
  return (
    <div className="relative">
      <Card className="border-0 bg-white shadow-none ring-0">
        <CardContent className="p-0">
          <div className="rounded-2xl border border-pass-stamp/30 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-pass-stamp/10 text-pass-stamp">
                <RefreshCcw aria-hidden className="size-6" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-pass-ink">
                  We couldn&apos;t read that page
                </h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-pass-line bg-pass-paper/70 p-4">
              <p className="font-display text-xs font-semibold tracking-[0.2em] uppercase text-pass-stamp">
                How to get a clean read
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <ListItem>
                  Retake the photo flat, straight over the data page — tilt and glare blur the machine zone.
                </ListItem>
                <ListItem>
                  Make sure the two dark lines of numbers at the bottom are sharp and evenly lit.
                </ListItem>
                <ListItem>
                  Fill the frame: the whole data page, edge to edge, no shadows across the bottom.
                </ListItem>
              </ul>
            </div>

            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pass-stamp px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus-visible:ring-3 focus-visible:ring-pass-stamp/30 hover:bg-pass-stamp/90 sm:w-auto"
            >
              <RefreshCcw aria-hidden className="size-4" />
              <span>Try again</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <InkStamp text="REJECTED" tone="red" />
    </div>
  );
}

function ListItem({ children }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-pass-stamp/60" />
      <span>{children}</span>
    </li>
  );
}