/**
 * Workspace Service - API integration for workspace operations
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  type ApiResponse,
} from "@/lib/api-client";
import type { Workspace, PaginatedResponse } from "@/types";

const API_BASE = "/api/workspaces";

/**
 * Get all workspaces
 */
export async function getWorkspaces(filters?: {
  pageNumber?: number;
  pageSize?: number;
  skip?: number;
  includeInactive?: boolean;
}): Promise<ApiResponse<PaginatedResponse<Workspace> | Workspace[]>> {
  const params = new URLSearchParams();

  if (filters?.pageNumber) {
    params.append("PageNumber", filters.pageNumber.toString());
  }
  if (filters?.pageSize) {
    params.append("PageSize", filters.pageSize.toString());
  }
  if (filters?.skip !== undefined) {
    params.append("Skip", filters.skip.toString());
  }
  if (filters?.includeInactive) {
    params.append("includeInactive", "true");
  }

  const queryString = params.toString();
  const response = await apiGet<Workspace[] | PaginatedResponse<Workspace>>(
    `${API_BASE}${queryString ? `?${queryString}` : ""}`
  );

  return response;
}

/**
 * Get workspace by ID
 */
export async function getWorkspaceById(
  workspaceId: string
): Promise<ApiResponse<Workspace>> {
  const response = await apiGet<Workspace>(`${API_BASE}/${workspaceId}`);

  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as Workspace,
    };
  }

  return response as ApiResponse<Workspace>;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  workspaceData: Partial<Workspace>
): Promise<ApiResponse<Workspace>> {
  const response = await apiPost<Workspace>(API_BASE, workspaceData);

  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as Workspace,
    };
  }

  return response as ApiResponse<Workspace>;
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  workspaceData: Partial<Workspace>
): Promise<ApiResponse<Workspace>> {
  const response = await apiPut<Workspace>(
    `${API_BASE}/${workspaceId}`,
    workspaceData
  );

  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as Workspace,
    };
  }

  return response as ApiResponse<Workspace>;
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(
  workspaceId: string
): Promise<ApiResponse<boolean>> {
  const response = await apiDelete<boolean>(`${API_BASE}/${workspaceId}`);

  return response;
}

/**
 * Switch active workspace
 */
export async function switchWorkspace(
  workspaceId: string
): Promise<ApiResponse<{ token?: string; [key: string]: unknown }>> {
  const response = await apiPost<{
    data?: { token?: string; [key: string]: unknown };
  }>(`${API_BASE}/${workspaceId}/switch`, {});

  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data,
    };
  }

  return response as ApiResponse<{ token?: string; [key: string]: unknown }>;
}

