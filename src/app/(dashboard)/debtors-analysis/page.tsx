"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const DEBTORS_ANALYSIS_URL =
  "https://m365.cloud.microsoft/m365apps/1c4340de-2a85-40e5-8eb0-4f295368978b/?fromcode=cmmiadtp424&refOrigin=Bing&origindomain=Office&auth=2";

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
              href={DEBTORS_ANALYSIS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          src={DEBTORS_ANALYSIS_URL}
          title="Debtors Analysis"
          className="w-full h-[calc(100vh-220px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
