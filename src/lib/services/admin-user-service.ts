/**
 * Admin User Service - API integration for admin user management operations
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiClient,
  type ApiResponse,
} from "@/lib/api-client";
import type { User, PaginatedResponse } from "@/types";

const API_BASE = "/iam/api/v1/admin/users";

/**
 * Helper to add workspace ID to headers
 */
function getWorkspaceHeaders(workspaceId: string): Record<string, string> {
  return {
    "X-Workspace-Id": workspaceId,
  };
}

/**
 * Get paginated list of users (admin only)
 */
export async function getAdminUsers(
  workspaceId: string,
  filters?: {
    pageNumber?: number;
    pageSize?: number;
    query?: string;
    isActive?: boolean;
    roleId?: string;
  }
): Promise<ApiResponse<PaginatedResponse<User> | User[]>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  if (filters?.pageNumber) {
    params.append("PageNumber", filters.pageNumber.toString());
  }
  if (filters?.pageSize) {
    params.append("PageSize", filters.pageSize.toString());
  }
  if (filters?.query) {
    params.append("Query", filters.query);
  }
  if (filters?.isActive !== undefined) {
    params.append("IsActive", filters.isActive.toString());
  }
  if (filters?.roleId) {
    params.append("RoleId", filters.roleId);
  }

  const queryString = params.toString();
  const response = await apiGet<User[] | PaginatedResponse<User>>(
    `${API_BASE}?${queryString}`,
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
  );

  return response;
}

/**
 * Get user by ID (admin only)
 */
export async function getAdminUserById(
  userId: string,
  workspaceId: string
): Promise<ApiResponse<User>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiGet<User>(
    `${API_BASE}/${userId}?${params.toString()}`,
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Create a new user (admin only)
 */
export async function createAdminUser(
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId?: string;
    phoneNumber?: string;
  },
  workspaceId: string
): Promise<ApiResponse<User>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiPost<User>(
    `${API_BASE}?${params.toString()}`,
    userData,
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Create a new user with role (admin only)
 * Endpoint: POST /iam/api/v1/admin/users/with-role
 * Password is auto-generated and sent via email
 * Supports multiple workspaces and roles
 * Permission: users.create
 */
export interface WorkspaceRoleAssignment {
  workspaceId: string;
  roleIds: string[];
}

export async function createAdminUserWithRole(userData: {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  workspaceRoles: WorkspaceRoleAssignment[]; // Array of workspace-role assignments
  wcoId?: string; // Required for WCO_EMPLOYEE role in Waste Management workspace
}): Promise<ApiResponse<User>> {
  const response = await apiPost<User>(`${API_BASE}/with-role`, userData);

  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Update user (admin only)
 */
export async function updateAdminUser(
  userId: string,
  userData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    stateOrProvince?: string;
    countryId?: string;
  },
  workspaceId: string
): Promise<ApiResponse<User>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiPut<User>(
    `${API_BASE}/${userId}?${params.toString()}`,
    userData,
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Delete user (admin only - soft delete)
 */
export async function deleteAdminUser(
  userId: string,
  workspaceId: string
): Promise<ApiResponse<void>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiDelete<void>(
    `${API_BASE}/${userId}?${params.toString()}`,
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
  );

  return response;
}

/**
 * Activate user (admin only)
 */
export async function activateAdminUser(
  userId: string,
  workspaceId: string
): Promise<ApiResponse<User>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiPost<User>(
    `${API_BASE}/${userId}/activate?${params.toString()}`,
    {},
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateAdminUser(
  userId: string,
  workspaceId: string
): Promise<ApiResponse<User>> {
  const params = new URLSearchParams();
  params.append("workspaceId", workspaceId);

  const response = await apiPost<User>(
    `${API_BASE}/${userId}/deactivate?${params.toString()}`,
    {},
    {
      headers: getWorkspaceHeaders(workspaceId),
    }
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Update admin user workspaces and roles
 * Endpoint: PUT /iam/api/v1/admin/users/{userId}/workspaces
 * Replaces all existing workspace-role assignments with the provided ones
 */
export async function updateAdminUserWorkspaces(
  userId: string,
  userData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    workspaceRoles: WorkspaceRoleAssignment[]; // Array of workspace-role assignments
    wcoId?: string; // Required for WCO_EMPLOYEE role
  }
): Promise<ApiResponse<User>> {
  const response = await apiPut<User>(
    `${API_BASE}/${userId}/workspaces`,
    userData
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
      data: response.data as User,
    };
  }

  return response as ApiResponse<User>;
}

/**
 * Delete admin user workspaces/roles
 * Endpoint: DELETE /iam/api/v1/admin/users/{userId}/workspaces
 * Supports multiple deletion modes:
 * - Delete entire workspaces (removeRolesOnly = false)
 * - Delete specific roles from workspaces (removeRolesOnly = true)
 */
export interface DeleteAdminUserWorkspacesRequest {
  workspaceIds?: string[] | null; // null = all workspaces
  removeRolesOnly?: boolean; // false = remove entire workspaces, true = remove only specific roles
  workspaceRoleAssignments?: WorkspaceRoleAssignment[]; // Required if removeRolesOnly = true
}

export async function deleteAdminUserWorkspaces(
  userId: string,
  request: DeleteAdminUserWorkspacesRequest
): Promise<ApiResponse<boolean>> {
  // Use apiClient directly since apiDelete doesn't support body
  const response = await apiClient<boolean>(
    `${API_BASE}/${userId}/workspaces`,
    {
      method: "DELETE",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response;
}
