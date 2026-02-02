"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const SHIP_TRACKING_URL = "https://signin.wnwd.com/";

export default function MaritimeIntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Maritime Intelligence"
        description="Track vessels and maritime traffic"
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-end">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href={SHIP_TRACKING_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          src={SHIP_TRACKING_URL}
          title="Maritime Intelligence - WNWD Sign In"
          className="w-full h-[calc(100vh-220px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
