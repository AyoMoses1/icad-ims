"use client";

import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function AccreditedMIIsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accredited MIIs"
        description="Manage accredited Maritime Institute of Instruction"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Accredited MIIs module is under development. This feature will
            allow you to manage accredited maritime training institutions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}




