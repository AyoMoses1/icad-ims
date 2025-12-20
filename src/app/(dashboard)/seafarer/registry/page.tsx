"use client";

import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function SeafarerRegistryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seafarer Registry"
        description="Manage the seafarer registry database"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Seafarer Registry module is under development. This feature will
            allow you to manage the central seafarer registry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}




