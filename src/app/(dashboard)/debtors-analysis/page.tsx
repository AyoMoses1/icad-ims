"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const POWER_BI_REPORT_URL =
  "https://app.powerbi.com/reportEmbed?reportId=5ee1483e-8783-4579-8690-684c5243e997&autoAuth=true&ctid=304f62e4-1c81-43c9-aca7-95e37121e147";

export default function DebtorsAnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Debtors Analysis"
        description="View and analyze debtor information"
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-end">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href={POWER_BI_REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          title="NIMASA"
          src={POWER_BI_REPORT_URL}
          className="w-full h-[calc(100vh-220px)] min-h-[500px] border-0"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
