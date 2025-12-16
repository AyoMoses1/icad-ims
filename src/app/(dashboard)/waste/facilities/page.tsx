"use client";

import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function FacilitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Manage waste management facilities"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Facilities module is under development. This feature will allow
            you to manage waste disposal facilities and their operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






