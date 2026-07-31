"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImagePreview({ fileUrl, fileName }) {
  if (!fileUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Upload an image to see a preview here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative h-72 overflow-hidden rounded-md border">
          <Image src={fileUrl} alt={fileName || "Passport preview"} fill className="object-contain" />
        </div>
        <p className="text-sm text-muted-foreground">{fileName}</p>
      </CardContent>
    </Card>
  );
}
