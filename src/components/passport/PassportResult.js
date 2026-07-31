"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PassportResult({ data }) {
  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Extracted passport data
          <Badge variant="secondary">Ready</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{key}</p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
