"use client";

import { Waves } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function EnvironmentalMonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Environmental Monitoring"
        description="Monitor marine environmental conditions"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Waves className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Environmental Monitoring module is under development. This
            feature will allow you to monitor marine environmental conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






