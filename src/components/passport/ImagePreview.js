"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export default function ImagePreview({ fileUrl, fileName }) {
  if (!fileUrl) {
    return (
      <Card className="border-0 bg-white shadow-none ring-0">
        <CardContent className="grid h-44 place-items-center rounded-xl border border-dashed border-pass-line text-center text-sm text-muted-foreground">
          Your passport photo will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-white shadow-none ring-0">
      <CardContent className="p-0">
        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-pass-paper sm:h-64">
          <Image
            src={fileUrl}
            alt={fileName || "Passport preview"}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            className="object-contain p-2"
          />
        </div>
        <p className="truncate px-1 pt-2 font-mono text-xs text-muted-foreground">
          {fileName || "image"}
        </p>
      </CardContent>
    </Card>
  );
}