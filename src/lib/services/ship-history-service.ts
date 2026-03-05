/**
 * Ship History Service – Datalastic vessel history via MEMS.IAM.
 * GET /iam/api/v1/ThirdParty/search/history-by-imo
 * @see Datalastic_Ship_History_API.md
 */

import { apiGet, type ApiResponse } from "@/lib/api-client";

const HISTORY_BY_IMO_PATH = "/iam/api/v1/ThirdParty/search/history-by-imo";

/** API returns PascalCase; we expose camelCase for the app */
export interface ShipPositionDto {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  destination: string | null;
  lastPositionEpoch: number;
  lastPositionUtc: string;
}

export interface ShipHistoryDto {
  uuid: string;
  name: string;
  mmsi: string | null;
  imo: string;
  eni: string | null;
  countryIso: string | null;
  type: string | null;
  typeSpecific: string | null;
  positions: ShipPositionDto[];
}

/** Raw position from API (PascalCase) */
interface ShipPositionRaw {
  Lat: number;
  Lon: number;
  Speed: number;
  Course: number;
  Heading: number;
  Destination: string | null;
  LastPositionEpoch: number;
  LastPositionUtc: string;
}

/** Raw ship history from API (PascalCase) */
interface ShipHistoryRaw {
  Uuid: string;
  Name: string;
  Mmsi: string | null;
  Imo: string;
  Eni: string | null;
  CountryIso: string | null;
  Type: string | null;
  TypeSpecific: string | null;
  Positions: ShipPositionRaw[];
}

function mapPosition(p: ShipPositionRaw): ShipPositionDto {
  return {
    lat: p.Lat,
    lon: p.Lon,
    speed: p.Speed,
    course: p.Course,
    heading: p.Heading,
    destination: p.Destination ?? null,
    lastPositionEpoch: p.LastPositionEpoch,
    lastPositionUtc: p.LastPositionUtc,
  };
}

function mapHistory(raw: ShipHistoryRaw): ShipHistoryDto {
  const positions = Array.isArray(raw.Positions)
    ? raw.Positions.map(mapPosition)
    : [];
  return {
    uuid: raw.Uuid ?? "",
    name: raw.Name ?? "",
    mmsi: raw.Mmsi ?? null,
    imo: raw.Imo ?? "",
    eni: raw.Eni ?? null,
    countryIso: raw.CountryIso ?? null,
    type: raw.Type ?? null,
    typeSpecific: raw.TypeSpecific ?? null,
    positions,
  };
}

export interface GetShipHistoryParams {
  imo: string;
  /** Number of days back from today. Takes precedence over from/to when > 0 */
  days?: number;
  /** Start date YYYY-MM-DD. Use with to; max range 30 days. Ignored if days is set */
  from?: string;
  /** End date YYYY-MM-DD. Use with from */
  to?: string;
}

/**
 * Get vessel historical AIS positions by IMO.
 * GET /iam/api/v1/ThirdParty/search/history-by-imo?imo=...&days=...|&from=...&to=...
 */
export async function getShipHistoryByImo(
  params: GetShipHistoryParams
): Promise<ApiResponse<ShipHistoryDto | null>> {
  const { imo, days, from, to } = params;
  const trimmedImo = (imo ?? "").trim().replace(/^IMO\s*-?\s*/i, "");
  if (!trimmedImo) {
    return {
      success: false,
      message: "imo is required.",
      data: null,
    };
  }

  const searchParams = new URLSearchParams();
  searchParams.set("imo", trimmedImo);
  if (days != null && days > 0) {
    searchParams.set("days", String(days));
  } else if (from && to) {
    searchParams.set("from", from);
    searchParams.set("to", to);
  }

  const url = `${HISTORY_BY_IMO_PATH}?${searchParams.toString()}`;
  const response = await apiGet<ShipHistoryRaw | null>(url);

  const raw = response as ApiResponse<ShipHistoryRaw | null> & {
    Success?: boolean;
    Data?: ShipHistoryRaw | null;
  };
  const ok = response.success ?? raw.Success ?? false;
  const rawData = response.data ?? raw.Data ?? null;

  if (!ok) {
    return {
      ...response,
      success: false,
      data: null,
    };
  }

  if (rawData == null) {
    return { ...response, success: true, data: null };
  }

  return {
    ...response,
    success: true,
    data: mapHistory(rawData as ShipHistoryRaw),
  };
}
