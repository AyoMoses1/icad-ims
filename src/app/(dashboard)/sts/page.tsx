"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const MARINETRAFFIC_URL =
  "https://www.marinetraffic.com/en/ais/embed/zoom:6/centery:2.7/centerx:5.5/maptype:0/shownames:false/mmsi:0/shipid:0/fleet:/vtypes:/showmenu:true/remember:false";

export default function STSPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ship-to-Ship (STS)"
        description="Monitor live AIS data for Ship-to-Ship transfer operations."
      />

      <div className="rounded-lg border bg-card overflow-hidden mt-4">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-end">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a
              href={MARINETRAFFIC_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
        <iframe
          src={MARINETRAFFIC_URL}
          title="Ship-to-Ship (STS) - Live AIS - MarineTraffic"
          className="w-full h-[calc(100vh-220px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
