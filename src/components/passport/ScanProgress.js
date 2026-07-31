"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ScanProgress({ status, progress }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground">{status}</p>
      </CardContent>
    </Card>
  );
}
