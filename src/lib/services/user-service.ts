/**
 * User Service - API integration for user operations
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  type ApiResponse,
} from "@/lib/api-client";
import type { User, PaginatedResponse } from "@/types";

const API_BASE = "/api/users";

/**
 * Get paginated list of users
 */
export async function getUsers(filters?: {
  pageNumber?: number;
  pageSize?: number;
  skip?: number;
  query?: string;
}): Promise<ApiResponse<PaginatedResponse<User> | User[]>> {
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
  if (filters?.query) {
    params.append("Query", filters.query);
  }

  const queryString = params.toString();
  const response = await apiGet<User[] | PaginatedResponse<User>>(
    `${API_BASE}${queryString ? `?${queryString}` : ""}`
  );

  return response;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<ApiResponse<User>> {
  const response = await apiGet<User>(`${API_BASE}/${userId}`);

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
 * Create a new user
 */
export async function createUser(
  userData: Partial<User>
): Promise<ApiResponse<User>> {
  const response = await apiPost<User>(API_BASE, userData);

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
 * Activate a user
 */
export async function activateUser(userId: string): Promise<ApiResponse<User>> {
  const response = await apiPatch<User>(`${API_BASE}/${userId}/activate`, {});

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
 * Deactivate a user
 */
export async function deactivateUser(
  userId: string
): Promise<ApiResponse<User>> {
  const response = await apiPatch<User>(`${API_BASE}/${userId}/deactivate`, {});

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




