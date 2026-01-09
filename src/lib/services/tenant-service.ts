/**
 * Tenant Service - API integration for tenant operations
 */

import { apiGet, apiPost, type ApiResponse } from "@/lib/api-client";
import type { TenantDto, SwitchTenantRequestDto } from "@/types";

/**
 * Get tenant by ID
 */
export async function getTenantById(
  tenantId: string
): Promise<ApiResponse<TenantDto>> {
  const response = await apiGet<{ data?: TenantDto }>(
    `/iam/api/v1/tenants/${tenantId}`
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as TenantDto,
    };
  }

  return response as ApiResponse<TenantDto>;
}

/**
 * Get all tenants for current user
 */
export async function getMyTenants(): Promise<ApiResponse<TenantDto[]>> {
  const response = await apiGet<{ data?: TenantDto[] }>(
    `/iam/api/v1/users/me/tenants`
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: Array.isArray(response.data)
        ? response.data
        : [response.data as TenantDto],
    };
  }

  return response as ApiResponse<TenantDto[]>;
}

/**
 * Switch active tenant context
 */
export async function switchTenant(
  tenantId: string,
  refreshToken?: string
): Promise<
  ApiResponse<{ token?: string; accessToken?: string; [key: string]: unknown }>
> {
  // Get refresh token from auth store if not provided
  let tokenToUse = refreshToken;
  if (!tokenToUse && typeof window !== "undefined") {
    try {
      const { useAuthStore } = await import("@/store");
      tokenToUse = useAuthStore.getState().refreshToken || undefined;
    } catch (error) {
      console.warn("Failed to get refresh token from auth store:", error);
    }
  }

  // Build headers with refresh token if available
  const headers: Record<string, string> = {};
  if (tokenToUse) {
    headers["X-Refresh-Token"] = tokenToUse;
  }

  // Use apiClient directly to pass custom headers
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const url = `${API_BASE_URL}/iam/api/v1/users/me/tenants/${tenantId}/switch`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
        // Include auth token if available
        ...(typeof window !== "undefined" &&
        (await import("@/store")).useAuthStore.getState().token
          ? {
              Authorization: `Bearer ${(await import("@/store")).useAuthStore.getState().token}`,
            }
          : {}),
      },
      body: JSON.stringify({}),
    });

    const data: ApiResponse<{
      token?: string;
      accessToken?: string;
      [key: string]: unknown;
    }> = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to switch tenant");
    }

    // Handle nested response structure
    if (data.success && data.data) {
      if ((data.data as any).data) {
        return {
          success: true,
          data: (data.data as any).data,
        };
      }
      return {
        success: true,
        data: data.data,
      };
    }

    return data;
  } catch (error) {
    console.error("Error switching tenant:", error);
    throw error;
  }
}


