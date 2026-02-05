"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, LoadingPage } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type {
  AdminRolePermissionDto,
  Permission,
  WorkspaceResource,
  PaginatedResponse,
  WorkspaceRole,
} from "@/types";
import { apiGet, apiPost } from "@/lib/api-client";
import { apiGetAuth } from "@/lib/api-client";
import type { UserInfo } from "@/types";
import {
  getAllAdminRoles,
  assignPermissionsToAdminRole,
  unassignPermissionsFromWorkspaceRole,
  unassignPermissionsFromAdminRole,
} from "@/lib/services/admin-role-service";
import { getAssignedPermissionIdsForResource } from "../role-permissions-utils";

const PERMISSION_FLAGS = [
  { key: "canCreate", label: "Create" },
  { key: "canRead", label: "Read" },
  { key: "canUpdate", label: "Update" },
  { key: "canDelete", label: "Delete" },
  { key: "canImport", label: "Import" },
  { key: "canExport", label: "Export" },
  { key: "canApprove", label: "Approve" },
  { key: "canManage", label: "Manage" },
  { key: "canReject", label: "Reject" },
] as const;

type ResourceTreeItem = WorkspaceResource & { children?: ResourceTreeItem[] };

type PermissionsContext = {
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  getAssignedIds: (id: string) => string[];
  getRolePermForResource: (id: string) => AdminRolePermissionDto | undefined;
  getPermissionIdForAction: (label: string) => string | undefined;
  getAllPermissionIdsForResource: (id: string) => string[];
  handleAssign: (resourceId: string, permissionIds: string[]) => Promise<void>;
  handleUnassign: (
    resourceId: string,
    permissionIds: string[]
  ) => Promise<void>;
  allPermissions: Permission[];
  isSaving: boolean;
};

function buildResourceTree(
  items: WorkspaceResource[],
  parentId: string | null = null
): ResourceTreeItem[] {
  return items
    .filter((r) => (r.parentId ?? null) === parentId)
    .map((r) => ({
      ...r,
      children: buildResourceTree(items, r.resourceId),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeResourceList(data: unknown): WorkspaceResource[] {
  if (Array.isArray(data)) return data as WorkspaceResource[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown[] }).items)
  )
    return (data as { items: WorkspaceResource[] }).items;
  return [];
}

function ResourcePermissionRow({
  resource,
  depth,
  compact,
  ctx,
}: {
  resource: ResourceTreeItem;
  depth: number;
  compact?: boolean;
  ctx: PermissionsContext;
}) {
  const hasChildren = resource.children && resource.children.length > 0;
  const isExpanded = ctx.expandedIds.has(resource.resourceId);
  const assignedIds = ctx.getAssignedIds(resource.resourceId);
  const rolePerm = ctx.getRolePermForResource(resource.resourceId);

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-background/60 transition-colors"
        style={{ paddingLeft: depth > 0 ? `${12 + depth * 20}px` : undefined }}
      >
        <div className="flex items-center gap-1 min-w-[24px]">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => ctx.toggleExpand(resource.resourceId)}
              className="p-0.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
        </div>
        <div className="min-w-[120px] sm:min-w-[140px] md:min-w-[180px] flex-shrink-0 flex items-center gap-2">
          {depth > 0 && (
            <FolderTree className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span
            className="font-medium text-sm truncate"
            title={resource.resourceName}
          >
            {resource.resourceName?.trim() || resource.resourceId}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 flex-1 min-w-0">
          {PERMISSION_FLAGS.map(({ key, label }) => {
            const permIds = getAssignedPermissionIdsForResource(
              rolePerm,
              ctx.allPermissions
            );
            const permissionId = ctx.getPermissionIdForAction(label);
            const isChecked = permissionId
              ? permIds.includes(permissionId)
              : false;
            return (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer text-sm shrink-0 min-w-[4.75rem]"
              >
                <Checkbox
                  checked={isChecked}
                  disabled={ctx.isSaving}
                  onCheckedChange={(checked) => {
                    if (!permissionId) return;
                    if (checked) {
                      ctx.handleAssign(resource.resourceId, [
                        ...assignedIds,
                        permissionId,
                      ]);
                    } else {
                      ctx.handleUnassign(resource.resourceId, [permissionId]);
                    }
                  }}
                />
                <span className="text-muted-foreground">{label}</span>
              </label>
            );
          })}
        </div>
      </div>
      {hasChildren &&
        isExpanded &&
        resource.children!.map((child) => (
          <ResourcePermissionRow
            key={child.resourceId}
            resource={child}
            depth={depth + 1}
            compact={compact}
            ctx={ctx}
          />
        ))}
    </div>
  );
}

function PermissionCard({
  resource,
  ctx,
}: {
  resource: ResourceTreeItem;
  ctx: PermissionsContext;
}) {
  const assignedIds = ctx.getAssignedIds(resource.resourceId);
  const allIds = ctx.getAllPermissionIdsForResource(resource.resourceId);
  const allChecked =
    allIds.length > 0 && allIds.every((id) => assignedIds.includes(id));
  const someChecked = allIds.some((id) => assignedIds.includes(id));

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate" || !allIds.length) return;
    if (checked) {
      ctx.handleAssign(resource.resourceId, [
        ...assignedIds,
        ...allIds.filter((id) => !assignedIds.includes(id)),
      ]);
    } else {
      ctx.handleUnassign(resource.resourceId, allIds);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60 bg-muted/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground truncate">
            {resource.resourceName?.trim() || resource.resourceId}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0 text-sm text-muted-foreground">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            disabled={ctx.isSaving}
            onCheckedChange={handleSelectAll}
          />
          <span>Select all</span>
        </label>
      </div>
      <div className="p-3 sm:p-4">
        <ResourcePermissionRow
          resource={resource}
          depth={0}
          compact
          ctx={ctx}
        />
      </div>
    </div>
  );
}

export default function RolePermissionsPage() {
  const searchParams = useSearchParams();
  const queryWorkspaceId = searchParams?.get("workspaceId") ?? "";
  const queryRoleId = searchParams?.get("roleId") ?? "";

  const [workspaceId, setWorkspaceId] = useState(queryWorkspaceId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [roles, setRoles] = useState<
    { workspaceRoleId: string; roleName: string; isAdmin?: boolean }[]
  >([]);
  const [selectedRole, setSelectedRole] = useState<{
    workspaceRoleId: string;
    roleName: string;
    isAdmin?: boolean;
    workspaceId?: string;
  } | null>(null);
  const [resourceTree, setResourceTree] = useState<ResourceTreeItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<
    AdminRolePermissionDto[]
  >([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const workspaceName =
    userInfo?.adminDetails?.adminWorkspaces?.find(
      (w) => w.workspaceId === workspaceId
    )?.workspaceName ?? "Workspace";

  const loadUserAndWorkspaces = useCallback(async () => {
    try {
      const info = await apiGetAuth<UserInfo>("/connect/userinfo");
      setUserInfo(info);
      if (!queryWorkspaceId && info?.adminDetails?.adminWorkspaces?.length) {
        const first = info.adminDetails.adminWorkspaces[0];
        setWorkspaceId(first.workspaceId);
      } else if (queryWorkspaceId) {
        setWorkspaceId(queryWorkspaceId);
      }
    } catch {
      toast.error("Failed to load user info");
    }
  }, [queryWorkspaceId]);

  useEffect(() => {
    loadUserAndWorkspaces();
  }, [loadUserAndWorkspaces]);

  const loadRoles = useCallback(
    async (wId: string) => {
      const res = await getAllAdminRoles(wId);
      if (res.success && res.data) {
        setRoles(res.data);
        if (
          queryRoleId &&
          res.data.some((r) => r.workspaceRoleId === queryRoleId)
        ) {
          const r = res.data.find((x) => x.workspaceRoleId === queryRoleId);
          if (r) setSelectedRole({ ...r, workspaceId: wId });
        } else if (!queryRoleId) {
          setSelectedRole(null);
        }
      } else {
        setRoles([]);
        setSelectedRole(null);
      }
    },
    [queryRoleId]
  );

  useEffect(() => {
    if (workspaceId) loadRoles(workspaceId);
  }, [workspaceId, loadRoles]);

  const loadPageData = useCallback(async () => {
    if (!workspaceId || !selectedRole) {
      setResourceTree([]);
      setRolePermissions([]);
      setAllPermissions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [resourcesRes, roleRes, permissionsRes] = await Promise.all([
        apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
          `/api/workspaces/${workspaceId}/resources?pageSize=500&tree=true`
        ),
        apiGet<WorkspaceRole>(
          `/api/workspaces/${workspaceId}/roles/${selectedRole.workspaceRoleId}`
        ),
        apiGet<Permission[] | PaginatedResponse<Permission>>(
          `/api/permissions?pageSize=500`
        ),
      ]);

      const list = normalizeResourceList(resourcesRes.data);
      const hasNestedChildren =
        list.length > 0 &&
        list.some((r) =>
          Array.isArray((r as { children?: unknown[] }).children)
        );
      const tree: ResourceTreeItem[] = hasNestedChildren
        ? (list as ResourceTreeItem[])
        : buildResourceTree(list);
      setResourceTree(tree);
      setExpandedIds(new Set(tree.map((r) => r.resourceId)));

      const roleData =
        roleRes.data ?? (roleRes as { data?: WorkspaceRole })?.data;
      const perms = roleData?.permissions ?? [];
      setRolePermissions(
        (Array.isArray(perms) ? perms : []) as AdminRolePermissionDto[]
      );

      const permList =
        permissionsRes.success && permissionsRes.data
          ? Array.isArray(permissionsRes.data)
            ? permissionsRes.data
            : ((permissionsRes.data as PaginatedResponse<Permission>).items ??
              [])
          : [];
      setAllPermissions(permList);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load resources and permissions");
      setResourceTree([]);
      setRolePermissions([]);
      setAllPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedRole]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const toggleExpand = (resourceId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId);
      else next.add(resourceId);
      return next;
    });
  };

  const getRolePermForResource = (
    resourceId: string
  ): AdminRolePermissionDto | undefined =>
    rolePermissions.find((p) => p.resourceId === resourceId);

  const getAssignedIds = (resourceId: string): string[] => {
    const rp = getRolePermForResource(resourceId);
    return getAssignedPermissionIdsForResource(rp, allPermissions);
  };

  const getPermissionIdForAction = (label: string): string | undefined =>
    allPermissions.find((p) => {
      const code = (p.permissionCode || "").toLowerCase();
      const name = (p.permissionName || "").toLowerCase();
      const action = label.toLowerCase();
      return (
        code === action || code.endsWith(`.${action}`) || name.includes(action)
      );
    })?.permissionId;

  const getAllPermissionIdsForResource = (resourceId: string): string[] => {
    const ids: string[] = [];
    for (const { label } of PERMISSION_FLAGS) {
      const id = getPermissionIdForAction(label);
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  };

  const handleAssign = async (resourceId: string, permissionIds: string[]) => {
    if (!selectedRole || !workspaceId || permissionIds.length === 0) return;
    setIsSaving(true);
    try {
      const res = selectedRole.isAdmin
        ? await assignPermissionsToAdminRole(
            selectedRole.workspaceRoleId,
            workspaceId,
            { resourceId, permissionIds }
          )
        : await apiPost<{ success?: boolean; message?: string }>(
            `/api/workspaces/${workspaceId}/roles/${selectedRole.workspaceRoleId}/permissions`,
            { resourceId, permissionIds }
          );
      if (res?.success !== false) {
        toast.success("Permissions assigned");
        loadPageData();
      } else {
        toast.error(
          (res as { message?: string })?.message ?? "Failed to assign"
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassign = async (
    resourceId: string,
    permissionIds: string[]
  ) => {
    if (!selectedRole || !workspaceId) return;
    setIsSaving(true);
    try {
      const res = selectedRole.isAdmin
        ? await unassignPermissionsFromAdminRole(
            selectedRole.workspaceRoleId,
            workspaceId,
            { resourceId, permissionIds, unassignResource: false }
          )
        : await unassignPermissionsFromWorkspaceRole(
            workspaceId,
            selectedRole.workspaceRoleId,
            { resourceId, permissionIds, unassignResource: false }
          );
      if (res?.success !== false) {
        toast.success("Permissions unassigned");
        loadPageData();
      } else {
        toast.error(res?.message ?? "Failed to unassign");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unassign");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userInfo) {
    return <LoadingPage message="Loading..." />;
  }

  const hasWorkspaces =
    (userInfo?.adminDetails?.adminWorkspaces?.length ?? 0) > 0;
  if (!hasWorkspaces) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Role permissions"
          description="Manage permissions per resource."
        />
        <p className="text-muted-foreground">No workspaces available.</p>
      </div>
    );
  }

  const ctx: PermissionsContext = {
    expandedIds,
    toggleExpand,
    getAssignedIds,
    getRolePermForResource,
    getPermissionIdForAction,
    getAllPermissionIdsForResource,
    handleAssign,
    handleUnassign,
    allPermissions,
    isSaving,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role permissions"
        description={
          selectedRole
            ? `Manage permissions for ${selectedRole.roleName} in ${workspaceName}.`
            : `Choose a workspace and role to manage resource permissions.`
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to roles
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[200px]">
            <Label className="text-sm font-medium text-muted-foreground">
              Workspace
            </Label>
            <Select
              value={workspaceId}
              onValueChange={(v) => {
                setWorkspaceId(v);
                setSelectedRole(null);
              }}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {userInfo?.adminDetails?.adminWorkspaces?.map((w) => (
                  <SelectItem key={w.workspaceId} value={w.workspaceId}>
                    {w.workspaceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[220px]">
            <Label className="text-sm font-medium text-muted-foreground">
              Role
            </Label>
            <Select
              value={selectedRole?.workspaceRoleId ?? ""}
              onValueChange={(v) => {
                const r = roles.find((x) => x.workspaceRoleId === v);
                setSelectedRole(r ? { ...r, workspaceId } : null);
              }}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.workspaceRoleId} value={r.workspaceRoleId}>
                    {r.roleName} {r.isAdmin ? "(Admin)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedRole?.isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Administrative roles do not have resource-level permissions; only
          domain roles can be configured here.
        </div>
      )}

      {!selectedRole && workspaceId && (
        <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
          Select a role to view and edit permissions.
        </div>
      )}

      {selectedRole && !selectedRole.isAdmin && (
        <>
          {isLoading ? (
            <LoadingPage message="Loading resources and permissions..." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {resourceTree.map((node) => (
                <PermissionCard
                  key={node.resourceId}
                  resource={node}
                  ctx={ctx}
                />
              ))}
              {resourceTree.length === 0 && (
                <div className="col-span-full rounded-xl border border-border/80 bg-muted/30 py-12 text-center text-muted-foreground">
                  No resources in this workspace.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
