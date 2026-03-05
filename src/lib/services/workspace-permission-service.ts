/**
 * Workspace Permission Service
 * Service for fetching and caching workspace permissions
 *
 * Note: GET /api/workspaces/{workspaceId}/permissions/my is not available (404),
 * so getWorkspacePermissions returns an empty array and no API call is made.
 */

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
   * Returns permissions for a specific workspace.
   * The permissions/my endpoint is disabled (404), so we always return [].
   */
  async getWorkspacePermissions(
    workspaceId: string,
    _forceRefresh = false
  ): Promise<string[]> {
    // Check cache first (in case we add another source later)
    const cached = this.permissionCache.get(workspaceId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    // Endpoint not available - return empty and cache it
    const permissions: string[] = [];
    this.permissionCache.set(workspaceId, {
      permissions,
      timestamp: Date.now(),
    });
    return permissions;
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
