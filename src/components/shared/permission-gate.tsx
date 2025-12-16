"use client";

import { ReactNode } from "react";
import { useWorkspaceStore } from "@/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PermissionGateProps {
  resourceId: string;
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

/**
 * PermissionGate component for RBAC enforcement on UI.
 *
 * This component checks if the current user has the required permission(s)
 * for a specific resource within the current workspace. If the user lacks
 * the permission, it either hides the children or shows a disabled state
 * with a tooltip explaining why.
 *
 * @example
 * // Hide button if user doesn't have CREATE permission
 * <PermissionGate resourceId="res-002" permission="CREATE">
 *   <Button>Create User</Button>
 * </PermissionGate>
 *
 * @example
 * // Show disabled button with tooltip
 * <PermissionGate
 *   resourceId="res-002"
 *   permission="DELETE"
 *   showTooltip
 *   fallback={<Button disabled>Delete</Button>}
 * >
 *   <Button onClick={handleDelete}>Delete</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  resourceId,
  permission,
  children,
  fallback = null,
  showTooltip = false,
  tooltipMessage,
}: PermissionGateProps) {
  const hasPermission = useWorkspaceStore((state) =>
    Array.isArray(permission)
      ? state.hasAnyPermission(resourceId, permission)
      : state.hasPermission(resourceId, permission)
  );

  if (hasPermission) {
    return <>{children}</>;
  }

  if (!fallback && !showTooltip) {
    return null;
  }

  const permissionText = Array.isArray(permission)
    ? permission.join(" or ")
    : permission;

  const message =
    tooltipMessage ||
    `You need the "${permissionText}" permission to access this feature.`;

  if (showTooltip && fallback) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{fallback}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

/**
 * Hook to check permissions programmatically
 */
export function usePermission(
  resourceId: string,
  permission: string | string[]
): boolean {
  return useWorkspaceStore((state) =>
    Array.isArray(permission)
      ? state.hasAnyPermission(resourceId, permission)
      : state.hasPermission(resourceId, permission)
  );
}

/**
 * Hook to check if user can access a resource
 */
export function useCanAccessResource(resourceId: string): boolean {
  return useWorkspaceStore((state) => state.canAccessResource(resourceId));
}







