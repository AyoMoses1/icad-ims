/**
 * Workspace Resource Service - API integration for workspace resource management operations
 * Only SuperAdmin users (email contains @rdlc.com) can perform update and delete operations
 */

import { apiGet, apiPut, apiDelete, type ApiResponse } from "@/lib/api-client";
import type {
  WorkspaceResourceTreeDto,
  UpdateWorkspaceResourceRequestDto,
} from "@/types";

/**
 * Get all workspace resources for a workspace
 * Returns only active resources where IsActive = true and IsDeleted = false
 */
export async function getWorkspaceResources(
  workspaceId: string
): Promise<ApiResponse<WorkspaceResourceTreeDto[]>> {
  return apiGet<WorkspaceResourceTreeDto[]>(
    `/api/workspaces/${workspaceId}/resources`
  );
}

/**
 * Get a specific workspace resource by ID
 */
export async function getWorkspaceResourceById(
  workspaceId: string,
  resourceId: string
): Promise<ApiResponse<WorkspaceResourceTreeDto>> {
  return apiGet<WorkspaceResourceTreeDto>(
    `/api/workspaces/${workspaceId}/resources/${resourceId}`
  );
}

/**
 * Update a workspace resource
 * Only SuperAdmin can update resources
 * All fields are optional - only provided fields will be updated
 */
export async function updateWorkspaceResource(
  workspaceId: string,
  resourceId: string,
  data: UpdateWorkspaceResourceRequestDto
): Promise<ApiResponse<WorkspaceResourceTreeDto>> {
  return apiPut<WorkspaceResourceTreeDto>(
    `/api/workspaces/${workspaceId}/resources/${resourceId}`,
    data
  );
}

/**
 * Delete a workspace resource (soft delete)
 * Only SuperAdmin can delete resources
 * Resources with child resources cannot be deleted
 */
export async function deleteWorkspaceResource(
  workspaceId: string,
  resourceId: string
): Promise<ApiResponse<boolean>> {
  return apiDelete<boolean>(
    `/api/workspaces/${workspaceId}/resources/${resourceId}`
  );
}
