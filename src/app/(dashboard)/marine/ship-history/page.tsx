"use client";

import { useState } from "react";
import { Ship, MapPin, Loader2, Search, History, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared";
import { formatDateTime } from "@/lib/utils";
import {
  getShipHistoryByImo,
  type ShipHistoryDto,
  type ShipPositionDto,
} from "@/lib/services/ship-history-service";
import { toast } from "sonner";

type DateRangeMode = "days" | "range";

const POSITIONS_PAGE_SIZE = 10;

export default function ShipHistoryPage() {
  const [imo, setImo] = useState("");
  const [dateMode, setDateMode] = useState<DateRangeMode>("days");
  const [days, setDays] = useState("7");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShipHistoryDto | null>(null);
  const [positionsPage, setPositionsPage] = useState(1);

  const totalPositions = result?.positions?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPositions / POSITIONS_PAGE_SIZE));
  const startIndex = (positionsPage - 1) * POSITIONS_PAGE_SIZE;
  const paginatedPositions = result?.positions?.slice(
    startIndex,
    startIndex + POSITIONS_PAGE_SIZE
  ) ?? [];

  const handleSearch = async () => {
    const trimmedImo = imo.trim();
    if (!trimmedImo) {
      toast.error("Enter vessel IMO number");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const params: { imo: string; days?: number; from?: string; to?: string } = {
        imo: trimmedImo,
      };
      if (dateMode === "days") {
        const d = parseInt(days, 10);
        if (!Number.isNaN(d) && d > 0) params.days = d;
      } else {
        if (fromDate && toDate) {
          params.from = fromDate;
          params.to = toDate;
        }
      }

      const response = await getShipHistoryByImo(params);
      const ok = response.success ?? (response as { success?: boolean }).success;
      if (!ok) {
        toast.error(response.message ?? "Failed to load ship history");
        return;
      }
      setResult(response.data ?? null);
      setPositionsPage(1);
      if (response.data?.positions?.length) {
        toast.success(
          `Loaded ${response.data.positions.length} position(s) for ${response.data.name}`
        );
      } else if (response.data) {
        toast.info("No position history found for this period");
      } else {
        toast.info("No history data returned for this vessel/period");
      }
    } catch (err) {
      console.error("Ship history error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load ship history");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ship History (AIS)"
        description="View historical AIS positions and movement for a vessel by IMO number. Data is provided via Datalastic."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="imo">IMO Number *</Label>
              <Input
                id="imo"
                placeholder="e.g. 9797058"
                value={imo}
                onChange={(e) => setImo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time range</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={dateMode === "days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("days")}
                >
                  Last N days
                </Button>
                <Button
                  type="button"
                  variant={dateMode === "range" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateMode("range")}
                >
                  Date range
                </Button>
              </div>
            </div>
            {dateMode === "days" ? (
              <div className="space-y-2">
                <Label htmlFor="days">Days back</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="from">From (YYYY-MM-DD)</Label>
                  <Input
                    id="from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To (YYYY-MM-DD)</Label>
                  <Input
                    id="to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      )}

      {!isLoading && result && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Ship className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">{result.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    IMO {result.imo}
                    {result.mmsi && ` · MMSI ${result.mmsi}`}
                    {result.countryIso && ` · ${result.countryIso}`}
                    {result.type && ` · ${result.type}`}
                    {result.typeSpecific && ` (${result.typeSpecific})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Positions ({totalPositions})
              </h3>
              {result.positions.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No position records for the selected period.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">Time (UTC)</th>
                          <th className="text-left py-2 px-2 font-medium">Lat</th>
                          <th className="text-left py-2 px-2 font-medium">Lon</th>
                          <th className="text-left py-2 px-2 font-medium">Speed</th>
                          <th className="text-left py-2 px-2 font-medium">Course</th>
                          <th className="text-left py-2 px-2 font-medium">Heading</th>
                          <th className="text-left py-2 px-2 font-medium">Destination</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPositions.map((pos: ShipPositionDto, i: number) => (
                          <tr
                            key={`${pos.lastPositionEpoch}-${startIndex + i}`}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                              {pos.lastPositionUtc
                                ? formatDateTime(pos.lastPositionUtc)
                                : "—"}
                            </td>
                            <td className="py-2 px-2">{pos.lat.toFixed(5)}</td>
                            <td className="py-2 px-2">{pos.lon.toFixed(5)}</td>
                            <td className="py-2 px-2">{pos.speed}</td>
                            <td className="py-2 px-2">{pos.course}</td>
                            <td className="py-2 px-2">{pos.heading}</td>
                            <td
                              className="py-2 px-2 max-w-[200px] truncate"
                              title={pos.destination ?? undefined}
                            >
                              {pos.destination ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPositions > POSITIONS_PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={positionsPage <= 1}
                        onClick={() => setPositionsPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {positionsPage} of {totalPages}
                        {" · "}
                        Showing {startIndex + 1}–{Math.min(startIndex + POSITIONS_PAGE_SIZE, totalPositions)} of {totalPositions}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={positionsPage >= totalPages}
                        onClick={() => setPositionsPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && !result && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ship history</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Enter a vessel IMO number and time range above to view historical
              AIS positions from Datalastic.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
