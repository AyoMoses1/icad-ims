"use client";

import { Anchor } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function CabotagePermitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cabotage Permits"
        description="Manage cabotage permits and licenses"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Anchor className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Cabotage Permits module is under development. This feature will
            allow you to manage cabotage permits and licenses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






