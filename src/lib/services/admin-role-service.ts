/**
 * Admin Role Service - API integration for admin role management operations
 * Based on Admin_Role_and_User_Creation_Guide.md
 * All endpoints require workspaceId as a query parameter
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  type ApiResponse,
} from "@/lib/api-client";
import type {
  AdminRoleDto,
  CreateAdminRoleRequestDto,
  UpdateAdminRoleRequestDto,
} from "@/types";

const API_BASE = "/api/admin-roles";

/**
 * Get all admin roles for a workspace
 * URL: GET /api/admin-roles?workspaceId={workspaceId}
 * Permission: AdminRoles.view
 */
export async function getAllAdminRoles(
  workspaceId: string
): Promise<ApiResponse<AdminRoleDto[]>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiGet<AdminRoleDto[]>(`${API_BASE}?${params.toString()}`);
}

/**
 * Get admin role by ID
 * URL: GET /api/admin-roles/{id}?workspaceId={workspaceId}
 * Permission: AdminRoles.view
 */
export async function getAdminRoleById(
  id: string,
  workspaceId: string
): Promise<ApiResponse<AdminRoleDto>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiGet<AdminRoleDto>(`${API_BASE}/${id}?${params.toString()}`);
}

/**
 * Create a new admin role
 * URL: POST /api/admin-roles?workspaceId={workspaceId}
 * Permission: AdminRoles.create
 */
export async function createAdminRole(
  workspaceId: string,
  data: CreateAdminRoleRequestDto
): Promise<ApiResponse<AdminRoleDto>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiPost<AdminRoleDto>(`${API_BASE}?${params.toString()}`, data);
}

/**
 * Update an existing admin role
 * URL: PUT /api/admin-roles/{id}?workspaceId={workspaceId}
 * Permission: AdminRoles.update
 */
export async function updateAdminRole(
  id: string,
  workspaceId: string,
  data: UpdateAdminRoleRequestDto
): Promise<ApiResponse<AdminRoleDto>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiPut<AdminRoleDto>(`${API_BASE}/${id}?${params.toString()}`, data);
}

/**
 * Delete an admin role (soft delete)
 * URL: DELETE /api/admin-roles/{id}?workspaceId={workspaceId}
 * Permission: AdminRoles.delete
 */
export async function deleteAdminRole(
  id: string,
  workspaceId: string
): Promise<ApiResponse<boolean>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiDelete<boolean>(`${API_BASE}/${id}?${params.toString()}`);
}

/**
 * Assign permissions to an admin role
 * URL: POST /api/admin-roles/{id}/permissions?workspaceId={workspaceId}
 * Permission: AdminRoles.update
 */
export async function assignPermissionsToAdminRole(
  id: string,
  workspaceId: string,
  permissions: Array<{ resourceId: string; permissionId: string }>
): Promise<ApiResponse<AdminRoleDto>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);
  return apiPost<AdminRoleDto>(
    `${API_BASE}/${id}/permissions?${params.toString()}`,
    { permissions }
  );
}
