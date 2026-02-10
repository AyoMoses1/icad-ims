/**
 * WCO (Waste Collection Operator) Service
 * Fetches WCO companies from Waste Management API for admin user creation.
 * See: Adding_WCO_to_Admin_Users.md
 */

import { getValidToken, type ApiResponse } from "@/lib/api-client";
import type { WcoCompanyDto } from "@/types";

/**
 * Waste Management API base URL
 * Uses NEXT_PUBLIC_WASTE_MANAGEMENT_API_URL if set, otherwise falls back to staging URL
 */
function getWasteManagementBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WASTE_MANAGEMENT_API_URL?.trim() ||
    "https://icad-staging.icadpays.com"
  );
}

/** API path for fetching waste collection operators */
const WCO_MASTER_DATA_PATH =
  "/waste-management/api/v1/MasterData/waste-collection-operators";

/**
 * Get WCO companies for dropdown (company selection when creating WCO_EMPLOYEE users).
 * Endpoint: GET {waste-management-api}/api/v1/MasterData/waste-collection-operators
 * Returns active, non-deleted WCOs with id, name, description, code.
 * Use data[].id as wcoId in IAM create/update user payloads.
 */
export async function getWcoCompanies(): Promise<ApiResponse<WcoCompanyDto[]>> {
  try {
    const baseUrl = getWasteManagementBaseUrl();
    const url = `${baseUrl}${WCO_MASTER_DATA_PATH}`;

    // Get valid token for authentication
    const token = await getValidToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("getWcoCompanies HTTP error:", response.status, errorText);
      return {
        success: false,
        message: `Failed to load WCO companies: ${response.status}`,
      };
    }

    const result = await response.json();

    // Handle different response shapes: { success, data } or { data } or array directly
    let data: WcoCompanyDto[] = [];
    if (Array.isArray(result)) {
      data = result;
    } else if (result.data && Array.isArray(result.data)) {
      data = result.data;
    } else if (result.success && result.data && Array.isArray(result.data)) {
      data = result.data;
    }

    return { success: true, data };
  } catch (error) {
    console.error("getWcoCompanies failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to load WCO companies",
    };
  }
}
