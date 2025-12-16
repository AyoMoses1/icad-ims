"use client";

import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function WasteTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Tracking"
        description="Track and monitor waste management activities"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Waste Tracking module is under development. This feature will
            allow you to track waste disposal and management activities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






