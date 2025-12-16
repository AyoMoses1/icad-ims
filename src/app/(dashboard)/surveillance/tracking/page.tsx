"use client";

import { Ship } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function VesselTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel Tracking"
        description="Track vessel positions and movements"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Ship className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Vessel Tracking module is under development. This feature will
            allow you to track vessel positions and movements in real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






