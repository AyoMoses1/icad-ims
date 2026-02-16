"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const POWERBI_REPORT_URL =
  "https://app.powerbi.com/reportEmbed?reportId=5ee1483e-8783-4579-8690-684c5243e997&autoAuth=true&ctid=304f62e4-1c81-43c9-aca7-95e37121e147";

export default function DebtorsAnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Debtors Analysis"
        description="NIMASA financial debtors reporting and analysis"
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-end">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href={POWERBI_REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          src={POWERBI_REPORT_URL}
          title="NIMASA Debtors Analysis Report"
          className="w-full h-[calc(100vh-220px)] min-h-[541px] border-0"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
