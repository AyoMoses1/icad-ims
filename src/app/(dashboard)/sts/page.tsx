"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExternalLink, Ship, MapPin, Activity, Info } from "lucide-react";

const MARINETRAFFIC_URL =
  "https://www.marinetraffic.com/en/ais/embed/zoom:6/centery:2.7/centerx:5.5/maptype:0/shownames:false/mmsi:0/shipid:0/fleet:/vtypes:/showmenu:true/remember:false";

export default function STSPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ship-to-Ship (STS)"
        description="Monitor live AIS data for Ship-to-Ship transfer operations. Track vessels engaged in STS operations and transfer zones."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Ship className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              STS Operations
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ship-to-Ship transfer involves cargo transfer between two vessels
              at sea (e.g. oil, LNG, products). Use the live map to identify
              vessels in proximity and transfer areas.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Transfer Zones
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Common STS areas include designated anchorages and offshore
              locations. AIS helps monitor vessel positions and safety during
              transfers.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Live Tracking
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Real-time AIS positions, speed, course and vessel details are
              shown on the map. Data is sourced from MarineTraffic live feed.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Data Source
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Live AIS integration via MarineTraffic. Use filters and search in
              the map to focus on tankers, LNG carriers or specific regions.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Live AIS map — Ship-to-Ship & vessel positions
          </span>
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
          className="w-full h-[calc(100vh-380px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
