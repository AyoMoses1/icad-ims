"use client";

import { FileCheck } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management"
        description="Manage certification documents and records"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Document Management module is under development. This feature
            will allow you to manage and track certification documents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






