"use client";

import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export default function InvoiceManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Management"
        description="Create and manage invoices"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The Invoice Management module is under development. This feature
            will allow you to create and manage invoices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






