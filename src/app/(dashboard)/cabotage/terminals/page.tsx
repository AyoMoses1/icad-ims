"use client";

import { Anchor } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function TerminalOperationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Terminal Operations"
        description="Manage terminal operations and activities"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Anchor className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Terminal Operations module is under development. This feature
            will allow you to manage terminal operations and activities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






