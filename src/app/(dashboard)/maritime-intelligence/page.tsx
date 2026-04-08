"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const VESSELFINDER_URL =
  "https://www.vesselfinder.com/aismap?lat=4.05&lon=9.7&zoom=6&names=false&mmsi=0&track=false&fleet=false&fleet_name=false&menu=true&clicktoact=false&store_pos=true&lang=en";

export default function MaritimeIntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Maritime Intelligence"
        description="Track vessels and maritime traffic"
      />

      <div className="rounded-lg border bg-card overflow-hidden mt-4">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            To view satellite mode,{" "}
            <a
              href="https://www.vesselfinder.com/pro/map#/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
            >
              click here
            </a>
          </p>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href="https://www.vesselfinder.com/pro/map#/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          src={VESSELFINDER_URL}
          title="Maritime Intelligence - VesselFinder"
          className="w-full h-[calc(100vh-220px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
