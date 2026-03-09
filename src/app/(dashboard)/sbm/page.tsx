"use client";

import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExternalLink, Anchor, MapPin, Activity, Info } from "lucide-react";

const MARINETRAFFIC_URL =
  "https://www.marinetraffic.com/en/ais/embed/zoom:6/centery:2.7/centerx:5.5/maptype:0/shownames:false/mmsi:0/shipid:0/fleet:/vtypes:/showmenu:true/remember:false";

export default function SBMPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Single Buoy Mooring (SBM)"
        description="Monitor live AIS data for Single Buoy Mooring operations. Track tankers, FPSOs and vessels at SBM locations."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Anchor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              SBM Operations
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Single Buoy Mooring allows tankers to load or discharge cargo
              (crude, products) at a mooring buoy. Use the map to see vessels
              at or approaching SBM points.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Mooring Locations
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              SBM facilities are typically offshore. AIS shows real-time
              positions of tankers, FPSOs and support vessels at these
              locations.
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
              Real-time AIS data: position, speed, course, destination and
              vessel type. Filter by tankers or specific areas on the map.
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
              Live AIS integration via MarineTraffic. Use vessel type filters
              to focus on tankers and vessels near SBM/offshore facilities.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Live AIS map — SBM, tankers & offshore vessel positions
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
          title="Single Buoy Mooring (SBM) - Live AIS - MarineTraffic"
          className="w-full h-[calc(100vh-380px)] min-h-[500px] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
