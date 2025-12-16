"use client";

import { CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function ComplianceChecksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Checks"
        description="Conduct and manage compliance checks"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Compliance Checks module is under development. This feature will
            allow you to conduct and manage compliance checks and audits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






