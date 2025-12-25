/**
 * Workspace Switcher Hook
 * Implements workspace switching with permission fetching as per integration guide
 */

import { useCallback, useEffect } from "react";
import { useWorkspaceStore } from "@/store";
import { workspacePermissionService } from "@/lib/services/workspace-permission-service";
import { switchWorkspace as switchWorkspaceApi } from "@/lib/services/workspace-service";
import { useAuthStore } from "@/store";
import {
  getWorkspacesFromToken,
  getDefaultWorkspaceId,
} from "@/lib/token-utils";
import type { Workspace } from "@/types";
import { toast } from "sonner";

/**
 * Hook for workspace switching functionality
 * Implements the workspace switcher pattern from the integration guide
 */
export function useWorkspaceSwitcher() {
  const {
    currentWorkspace,
    currentWorkspaceId,
    setCurrentWorkspace,
    setWorkspaces,
    workspaces,
  } = useWorkspaceStore();
  const { token, setSession, user } = useAuthStore();

  /**
   * Initialize workspaces from token on mount
   */
  useEffect(() => {
    if (token && !workspaces.length) {
      try {
        const workspacesFromToken = getWorkspacesFromToken(token);
        if (workspacesFromToken.length > 0) {
          const workspaceObjects: Workspace[] = workspacesFromToken.map(
            (ws) => ({
              workspaceId: ws.workspaceId,
              name: ws.workspaceName,
              description: "",
              isActive: true,
              isDeleted: false,
              color: undefined,
              createdBy: "",
              createdAt: "",
              updatedAt: "",
            })
          );
          setWorkspaces(workspaceObjects);

          // Set default workspace
          const defaultWorkspaceId = getDefaultWorkspaceId(token);
          if (defaultWorkspaceId) {
            const defaultWorkspace =
              workspaceObjects.find(
                (w) => w.workspaceId === defaultWorkspaceId
              ) || workspaceObjects[0];
            if (defaultWorkspace) {
              setCurrentWorkspace(defaultWorkspace);
              // Fetch permissions for default workspace
              workspacePermissionService
                .getWorkspacePermissions(defaultWorkspace.workspaceId)
                .catch((error) => {
                  console.error(
                    "Failed to fetch permissions for default workspace:",
                    error
                  );
                });
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize workspaces from token:", error);
      }
    }
  }, [token, workspaces.length, setWorkspaces, setCurrentWorkspace]);

  /**
   * Switch to a different workspace
   * Calls the switch endpoint and updates token/permissions
   */
  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        // Call workspace switch API endpoint to get new token
        const result = await switchWorkspaceApi(workspaceId);

        if (result.success && result.data) {
          // If token is returned, update the auth session
          const newToken = (result.data as any).token;
          if (newToken && user) {
            // Update token in auth store
            setSession({
              user,
              token: newToken,
              refreshToken: useAuthStore.getState().refreshToken || "",
              expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(), // 24 hours
            });

            // Update workspaces from new token
            const workspacesFromToken = getWorkspacesFromToken(newToken);
            if (workspacesFromToken.length > 0) {
              const workspaceObjects: Workspace[] = workspacesFromToken.map(
                (ws) => ({
                  workspaceId: ws.workspaceId,
                  name: ws.workspaceName,
                  description: "",
                  isActive: true,
                  isDeleted: false,
                  color: undefined,
                  createdBy: "",
                  createdAt: "",
                  updatedAt: "",
                })
              );
              setWorkspaces(workspaceObjects);
            }

            // Set current workspace
            const workspace = workspaces.find(
              (w) => w.workspaceId === workspaceId
            );
            if (workspace) {
              setCurrentWorkspace(workspace);
            }
          } else {
            // If no token returned, just update current workspace
            const workspace = workspaces.find(
              (w) => w.workspaceId === workspaceId
            );
            if (workspace) {
              setCurrentWorkspace(workspace);
            }
          }

          // Fetch permissions for the new workspace (as per integration guide)
          const permissions =
            await workspacePermissionService.getWorkspacePermissions(
              workspaceId
            );

          // Emit workspace changed event for other components
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("workspaceChanged", {
                detail: {
                  workspaceId,
                  permissions,
                },
              })
            );
          }

          return permissions;
        } else {
          toast.error(
            result.error?.message ||
              "Failed to switch workspace. Please try again."
          );
          return [];
        }
      } catch (error) {
        console.error("Error switching workspace:", error);
        toast.error("Failed to switch workspace");
        return [];
      }
    },
    [workspaces, user, setSession, setWorkspaces, setCurrentWorkspace]
  );

  /**
   * Get permissions for current workspace
   */
  const getCurrentWorkspacePermissions = useCallback(async () => {
    if (!currentWorkspaceId) {
      return [];
    }

    return await workspacePermissionService.getWorkspacePermissions(
      currentWorkspaceId
    );
  }, [currentWorkspaceId]);

  /**
   * Check if user has a specific permission in current workspace
   */
  const hasPermission = useCallback(
    (permission: string) => {
      if (!currentWorkspaceId) {
        return false;
      }

      return workspacePermissionService.hasPermission(
        currentWorkspaceId,
        permission
      );
    },
    [currentWorkspaceId]
  );

  return {
    currentWorkspace,
    currentWorkspaceId,
    workspaces,
    switchWorkspace,
    getCurrentWorkspacePermissions,
    hasPermission,
  };
}

