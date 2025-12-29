/**
 * Permission Gate Component
 * Conditionally renders children based on workspace permissions
 * Implements permission checking pattern from integration guide
 */

import { ReactNode } from "react";
import { workspacePermissionService } from "@/lib/services/workspace-permission-service";
import { useWorkspaceStore } from "@/store";
import { useMemo } from "react";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  workspaceId?: string;
}

/**
 * Permission Gate - Conditionally renders children based on permission
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="users:create">
 *   <Button>Create User</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  workspaceId,
}: PermissionGateProps) {
  const { currentWorkspaceId } = useWorkspaceStore();

  const targetWorkspaceId = workspaceId || currentWorkspaceId;

  // Check permission using the permission service
  // Note: This is a synchronous check based on cached permissions
  // For real-time permission checking, permissions should be loaded first
  const hasPermission = useMemo(() => {
    if (!targetWorkspaceId) {
      return false;
    }

    return workspacePermissionService.hasPermission(
      targetWorkspaceId,
      permission
    );
  }, [targetWorkspaceId, permission]);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook to check if user has a specific permission
 *
 * Usage:
 * ```tsx
 * const hasCreatePermission = usePermission("users:create");
 * ```
 */
export function usePermission(permission: string, workspaceId?: string) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const targetWorkspaceId = workspaceId || currentWorkspaceId;

  return useMemo(() => {
    if (!targetWorkspaceId) {
      return false;
    }

    return workspacePermissionService.hasPermission(
      targetWorkspaceId,
      permission
    );
  }, [targetWorkspaceId, permission]);
}

/**
 * Hook to check if user can access a resource
 *
 * Usage:
 * ```tsx
 * const canAccess = useCanAccessResource("resource-id");
 * ```
 */
export function useCanAccessResource(resourceId: string, workspaceId?: string) {
  const { currentWorkspaceId, canAccessResource } = useWorkspaceStore();
  const targetWorkspaceId = workspaceId || currentWorkspaceId;

  return useMemo(() => {
    if (!targetWorkspaceId) {
      return false;
    }

    // Use the workspace store's canAccessResource method
    return canAccessResource(resourceId);
  }, [targetWorkspaceId, resourceId, canAccessResource]);
}


