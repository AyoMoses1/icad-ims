/**
 * Admin Role Service - API integration for admin role management operations
 * Only SuperAdmin users (email contains @rdlc.com) can perform create, update, and delete operations
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
 * Get all admin roles
 * Returns only active roles where IsActive = true and IsDeleted = false
 */
export async function getAllAdminRoles(): Promise<
  ApiResponse<AdminRoleDto[]>
> {
  return apiGet<AdminRoleDto[]>(API_BASE);
}

/**
 * Get admin role by ID
 */
export async function getAdminRoleById(
  id: string
): Promise<ApiResponse<AdminRoleDto>> {
  return apiGet<AdminRoleDto>(`${API_BASE}/${id}`);
}

/**
 * Create a new admin role
 * Only SuperAdmin can create admin roles
 */
export async function createAdminRole(
  data: CreateAdminRoleRequestDto
): Promise<ApiResponse<AdminRoleDto>> {
  return apiPost<AdminRoleDto>(API_BASE, data);
}

/**
 * Update an existing admin role
 * Only SuperAdmin can update admin roles
 */
export async function updateAdminRole(
  id: string,
  data: UpdateAdminRoleRequestDto
): Promise<ApiResponse<AdminRoleDto>> {
  return apiPut<AdminRoleDto>(`${API_BASE}/${id}`, data);
}

/**
 * Delete an admin role (soft delete)
 * Only SuperAdmin can delete admin roles
 * System roles cannot be deleted
 */
export async function deleteAdminRole(
  id: string
): Promise<ApiResponse<boolean>> {
  return apiDelete<boolean>(`${API_BASE}/${id}`);
}
