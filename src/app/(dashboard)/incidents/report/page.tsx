"use client";

import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function IncidentReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Report"
        description="Report and manage maritime incidents"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Incident Report module is under development. This feature will
            allow you to report and track maritime incidents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






