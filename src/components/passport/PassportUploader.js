"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PassportUploader({ onFileSelect, isScanning }) {
  const inputRef = useRef(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload passport image</CardTitle>
        <CardDescription>
          Select a passport photo to extract the MRZ and display the parsed profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(event) => onFileSelect(event.target.files?.[0])}
          disabled={isScanning}
        />
        <Button
          type="button"
          className="w-full"
          disabled={isScanning}
          onClick={() => inputRef.current?.click()}
        >
          {isScanning ? "Scanning..." : "Start scan"}
        </Button>
      </CardContent>
    </Card>
  );
}
