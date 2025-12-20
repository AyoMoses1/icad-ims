import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Workspace,
  WorkspaceResource,
  WorkspaceRole,
  EffectivePermission,
} from "@/types";
import { safeLocalStorage } from "@/lib/utils";

interface WorkspaceState {
  // State
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  resources: WorkspaceResource[];
  roles: WorkspaceRole[];
  userPermissions: EffectivePermission[];
  isLoadingWorkspaces: boolean;
  isLoadingResources: boolean;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentWorkspaceById: (workspaceId: string | null) => void;
  setResources: (resources: WorkspaceResource[]) => void;
  setRoles: (roles: WorkspaceRole[]) => void;
  setUserPermissions: (permissions: EffectivePermission[]) => void;
  setLoadingWorkspaces: (loading: boolean) => void;
  setLoadingResources: (loading: boolean) => void;
  clearWorkspaceData: () => void;

  // Permission checks
  hasPermission: (resourceId: string, permissionCode: string) => boolean;
  hasAnyPermission: (resourceId: string, permissionCodes: string[]) => boolean;
  canAccessResource: (resourceId: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: [],
      currentWorkspace: null,
      currentWorkspaceId: null,
      resources: [],
      roles: [],
      userPermissions: [],
      isLoadingWorkspaces: false,
      isLoadingResources: false,

      // Actions
      setWorkspaces: (workspaces: Workspace[]) => {
        set({ workspaces });
      },

      setCurrentWorkspace: (workspace: Workspace | null) => {
        set({
          currentWorkspace: workspace,
          currentWorkspaceId: workspace?.workspaceId || null,
        });
      },

      setCurrentWorkspaceById: (workspaceId: string | null) => {
        const { workspaces } = get();
        const workspace =
          workspaces.find((w) => w.workspaceId === workspaceId) || null;
        set({
          currentWorkspace: workspace,
          currentWorkspaceId: workspaceId,
        });
      },

      setResources: (resources: WorkspaceResource[]) => {
        set({ resources });
      },

      setRoles: (roles: WorkspaceRole[]) => {
        set({ roles });
      },

      setUserPermissions: (permissions: EffectivePermission[]) => {
        set({ userPermissions: permissions });
      },

      setLoadingWorkspaces: (loading: boolean) => {
        set({ isLoadingWorkspaces: loading });
      },

      setLoadingResources: (loading: boolean) => {
        set({ isLoadingResources: loading });
      },

      clearWorkspaceData: () => {
        set({
          currentWorkspace: null,
          currentWorkspaceId: null,
          resources: [],
          roles: [],
          userPermissions: [],
        });
      },

      // Permission checks
      hasPermission: (resourceId: string, permissionCode: string) => {
        const { userPermissions } = get();
        const resourcePermissions = userPermissions.find(
          (p) => p.resourceId === resourceId
        );
        if (!resourcePermissions) return false;
        return resourcePermissions.permissions.some(
          (p) =>
            p.permissionCode === permissionCode || p.permissionCode === "MANAGE"
        );
      },

      hasAnyPermission: (resourceId: string, permissionCodes: string[]) => {
        const { hasPermission } = get();
        return permissionCodes.some((code) => hasPermission(resourceId, code));
      },

      canAccessResource: (resourceId: string) => {
        const { userPermissions } = get();
        return userPermissions.some((p) => p.resourceId === resourceId);
      },
    }),
    {
      name: "workspace-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const str = safeLocalStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          safeLocalStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          safeLocalStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);

// Selector hooks
export const useCurrentWorkspace = () =>
  useWorkspaceStore((state) => state.currentWorkspace);
export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);
export const useWorkspaceResources = () =>
  useWorkspaceStore((state) => state.resources);
export const useWorkspaceRoles = () =>
  useWorkspaceStore((state) => state.roles);
