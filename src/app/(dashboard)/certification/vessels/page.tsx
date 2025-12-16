"use client";

import { FileCheck } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function VesselCertificationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel Certification"
        description="Manage vessel certification and documentation"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Vessel Certification module is under development. This feature
            will allow you to manage vessel certifications, renewals, and
            compliance documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






