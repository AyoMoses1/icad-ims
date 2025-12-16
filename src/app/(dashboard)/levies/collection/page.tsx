"use client";

import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function LevyCollectionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Levy Collection"
        description="Track and manage levy collections"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Levy Collection module is under development. This feature will
            allow you to track and manage levy collections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






