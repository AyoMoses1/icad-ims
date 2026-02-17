/**
 * System User Service - API integration for system users (non-admin only).
 * These endpoints operate only on users who are not admins.
 * @see System_Users_API_Endpoints.md
 */

import { apiGet, apiPatch, type ApiResponse } from "@/lib/api-client";
import type {
  SystemUserDto,
  SystemUsersListParams,
} from "@/types";

const API_BASE = "/api/users/all-system";

/** Paginated payload returned by GET /api/users/all-system */
export interface SystemUsersPageData {
  items: SystemUserDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Get all system users (paginated, optional filters).
 * GET /api/users/all-system
 */
export async function getAllSystemUsers(
  params?: SystemUsersListParams
): Promise<ApiResponse<SystemUsersPageData>> {
  const searchParams = new URLSearchParams();

  if (params?.pageNumber != null) {
    searchParams.set("PageNumber", String(params.pageNumber));
  }
  if (params?.pageSize != null) {
    searchParams.set("PageSize", String(params.pageSize));
  }
  if (params?.query != null && params.query.trim() !== "") {
    searchParams.set("Query", params.query.trim());
  }
  if (params?.isActive !== undefined) {
    searchParams.set("IsActive", String(params.isActive));
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await apiGet<SystemUsersPageData>(url);

  if (response.success && response.data) {
    const raw = response.data as SystemUsersPageData & { data?: SystemUsersPageData };
    if (raw.data) {
      return { success: true, data: raw.data };
    }
    return { success: true, data: response.data as SystemUsersPageData };
  }

  return response as ApiResponse<SystemUsersPageData>;
}

/**
 * Get a single system user by ID.
 * GET /api/users/all-system/{id}
 */
export async function getSystemUserById(
  id: string
): Promise<ApiResponse<SystemUserDto>> {
  const response = await apiGet<SystemUserDto>(`${API_BASE}/${id}`);

  if (response.success && response.data) {
    const raw = response.data as SystemUserDto & { data?: SystemUserDto };
    if (raw.data) {
      return { success: true, data: raw.data };
    }
    return { success: true, data: response.data as SystemUserDto };
  }

  return response as ApiResponse<SystemUserDto>;
}

/**
 * Activate a system user (IsActive = true).
 * PATCH /api/users/all-system/{id}/activate
 */
export async function activateSystemUser(
  id: string
): Promise<ApiResponse<SystemUserDto>> {
  const response = await apiPatch<SystemUserDto>(`${API_BASE}/${id}/activate`, {});

  if (response.success && response.data) {
    const raw = response.data as SystemUserDto & { data?: SystemUserDto };
    if (raw.data) {
      return { success: true, data: raw.data };
    }
    return { success: true, data: response.data as SystemUserDto };
  }

  return response as ApiResponse<SystemUserDto>;
}

/**
 * Deactivate a system user (IsActive = false).
 * PATCH /api/users/all-system/{id}/deactivate
 */
export async function deactivateSystemUser(
  id: string
): Promise<ApiResponse<SystemUserDto>> {
  const response = await apiPatch<SystemUserDto>(
    `${API_BASE}/${id}/deactivate`,
    {}
  );

  if (response.success && response.data) {
    const raw = response.data as SystemUserDto & { data?: SystemUserDto };
    if (raw.data) {
      return { success: true, data: raw.data };
    }
    return { success: true, data: response.data as SystemUserDto };
  }

  return response as ApiResponse<SystemUserDto>;
}
