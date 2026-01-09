/**
 * Workspace Permission Service
 * Service for fetching and caching workspace permissions
 */

import { apiGet, type ApiResponse } from "@/lib/api-client";

export interface WorkspacePermission {
  permissionCode: string;
  permissionName?: string;
  resourceId?: string;
  resourceName?: string;
}

interface PermissionCache {
  permissions: string[];
  timestamp: number;
}

/**
 * Service class for managing workspace permissions with caching
 */
class WorkspacePermissionService {
  private permissionCache: Map<string, PermissionCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetches permissions for a specific workspace
   */
  async getWorkspacePermissions(
    workspaceId: string,
    forceRefresh = false
  ): Promise<string[]> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.permissionCache.get(workspaceId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.permissions;
      }
    }

    try {
      // Fetch from API
      const result = await apiGet<string[]>(
        `/api/workspaces/${workspaceId}/permissions/my`
      );

      let permissions: string[] = [];

      if (result.success && result.data) {
        // Handle both array of strings and array of permission objects
        permissions = Array.isArray(result.data)
          ? result.data.map((p: string | WorkspacePermission) => {
              if (typeof p === "string") {
                return p;
              }
              return p.permissionCode;
            })
          : [];
      }

      // Cache permissions
      this.permissionCache.set(workspaceId, {
        permissions,
        timestamp: Date.now(),
      });

      return permissions;
    } catch (error) {
      console.error("Failed to fetch workspace permissions:", error);
      // Return cached permissions if available, even if expired
      const cached = this.permissionCache.get(workspaceId);
      if (cached) {
        return cached.permissions;
      }
      return [];
    }
  }

  /**
   * Checks if user has a specific permission in the workspace
   */
  hasPermission(
    workspaceId: string,
    permission: string,
    permissions?: string[]
  ): boolean {
    // If permissions are provided, check directly
    if (permissions) {
      return permissions.includes(permission);
    }

    // Otherwise check cache
    const cached = this.permissionCache.get(workspaceId);
    if (cached) {
      return cached.permissions.includes(permission);
    }

    return false;
  }

  /**
   * Clears the permission cache for a specific workspace
   */
  clearCache(workspaceId?: string): void {
    if (workspaceId) {
      this.permissionCache.delete(workspaceId);
    } else {
      this.permissionCache.clear();
    }
  }

  /**
   * Clears expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [workspaceId, cache] of this.permissionCache.entries()) {
      if (now - cache.timestamp >= this.CACHE_TTL) {
        this.permissionCache.delete(workspaceId);
      }
    }
  }
}

// Export singleton instance
export const workspacePermissionService = new WorkspacePermissionService();


