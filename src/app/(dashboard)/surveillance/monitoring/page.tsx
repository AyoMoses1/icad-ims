"use client";

import { Ship } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function VesselSurveillancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel Surveillance"
        description="Monitor vessel activities and compliance"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Ship className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Vessel Surveillance module is under development. This feature
            will allow you to monitor vessel activities and ensure compliance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






