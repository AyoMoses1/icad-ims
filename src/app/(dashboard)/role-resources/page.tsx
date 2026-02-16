"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, FolderTree, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { WorkspaceRole, WorkspaceResource, Permission } from "@/types";
import {
  extractPermissionAssignments,
  groupPermissionAssignments,
  getPermissionIdsForResource,
  type RolePermissionGroup,
} from "@/lib/permission-utils";

export default function RoleResourcesPage() {
  const searchParams = useSearchParams();
  const queryWorkspaceId = searchParams?.get("workspaceId") ?? null;
  const queryRoleId = searchParams?.get("roleId") ?? null;
  const { workspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspaceStore();
  const [workspaceId, setWorkspaceId] = useState(() => {
    return (
      queryWorkspaceId ||
      currentWorkspace?.workspaceId ||
      workspaces[0]?.workspaceId ||
      ""
    );
  });
  const [pendingRoleId, setPendingRoleId] = useState(queryRoleId || "");
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RolePermissionGroup[]>(
    []
  );
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      const resolvedWorkspaceId =
        currentWorkspace?.workspaceId || workspaces[0]?.workspaceId || "";
      if (resolvedWorkspaceId) {
        setWorkspaceId(resolvedWorkspaceId);
      }
    }
  }, [workspaceId, currentWorkspace?.workspaceId, workspaces]);

  useEffect(() => {
    if (queryWorkspaceId && queryWorkspaceId !== workspaceId) {
      setWorkspaceId(queryWorkspaceId);
    }
    if (queryRoleId && queryRoleId !== pendingRoleId) {
      setPendingRoleId(queryRoleId);
      // If roles, resources, and permissions are already loaded, select the role immediately
      if (roles.length > 0 && resources.length > 0 && permissions.length > 0) {
        const role = roles.find((r) => r.workspaceRoleId === queryRoleId);
        if (role && role.workspaceRoleId !== selectedRole?.workspaceRoleId) {
          setSelectedRole(role);
          loadRoleAssignments(role, resources, permissions);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queryWorkspaceId,
    queryRoleId,
    workspaceId,
    pendingRoleId,
    roles,
    resources,
    permissions,
    selectedRole,
  ]);

  useEffect(() => {
    if (workspaceId) {
      // Use queryRoleId if available, otherwise use pendingRoleId
      const roleIdToUse = queryRoleId || pendingRoleId || undefined;
      loadWorkspaceContext(workspaceId, roleIdToUse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, queryRoleId]);

  useEffect(() => {
    // Only auto-select role if we have a pendingRoleId, roles are loaded,
    // and the role hasn't been selected yet (to avoid conflicts with loadWorkspaceContext)
    if (
      pendingRoleId &&
      roles.length > 0 &&
      resources.length > 0 &&
      permissions.length > 0 &&
      !selectedRole
    ) {
      const role = roles.find((r) => r.workspaceRoleId === pendingRoleId);
      if (role) {
        setSelectedRole(role);
        loadRoleAssignments(role, resources, permissions);
        setPendingRoleId("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoleId, roles, resources, permissions, selectedRole]);

  const loadRoleAssignments = async (
    role: WorkspaceRole,
    resourcesSnapshot: WorkspaceResource[] = resources,
    permissionsSnapshot: Permission[] = permissions,
    preferredResourceId?: string
  ) => {
    if (!workspaceId) return;

    setIsLoadingAssignments(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/roles/${role.workspaceRoleId}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const assignments = extractPermissionAssignments(result.data);

        // Fetch all resources and permissions to resolve names
        const query = new URLSearchParams({
          workspaceId: workspaceId,
          pageSize: "200",
        });

        const [resourcesRes, permissionsRes] = await Promise.all([
          fetch(`/api/resources?${query.toString()}`),
          fetch(`/api/permissions?pageSize=200`),
        ]);

        const [resourcesData, permissionsData] = await Promise.all([
          resourcesRes.json(),
          permissionsRes.json(),
        ]);

        const allResources: WorkspaceResource[] = resourcesData.success
          ? resourcesData.data || []
          : [];
        const allPermissions: Permission[] = permissionsData.success
          ? permissionsData.data || []
          : [];

        const groups = groupPermissionAssignments(
          assignments,
          allResources,
          allPermissions
        );
        setRoleAssignments(groups);

        // Set all resources and permissions (so user can add new assignments)
        setResources(allResources);
        setPermissions(allPermissions);

        const fallbackResourceId =
          preferredResourceId ?? selectedResourceId ?? "";
        const resolvedResourceId =
          fallbackResourceId &&
          groups.some((group) => group.resourceId === fallbackResourceId)
            ? fallbackResourceId
            : groups[0]?.resourceId || "";

        setSelectedResourceId(resolvedResourceId);
        setSelectedPermissionIds(
          resolvedResourceId
            ? getPermissionIdsForResource(resolvedResourceId, groups)
            : []
        );
      } else {
        setRoleAssignments([]);
        setSelectedPermissionIds([]);
        setResources([]);
        setPermissions([]);
        toast.error(result.error?.message || "Failed to load role resources");
      }
    } catch (error) {
      console.error("Failed to load role permissions", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load role resources"
      );
      setRoleAssignments([]);
      setSelectedPermissionIds([]);
      setResources([]);
      setPermissions([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadWorkspaceContext = async (
    targetWorkspaceId: string,
    preferredRoleId?: string
  ) => {
    if (!targetWorkspaceId) {
      setRoles([]);
      setResources([]);
      setPermissions([]);
      setSelectedRole(null);
      setRoleAssignments([]);
      setSelectedResourceId("");
      setSelectedPermissionIds([]);
      return;
    }
    setIsLoadingWorkspace(true);
    try {
      const query = new URLSearchParams({
        workspaceId: targetWorkspaceId,
        pageSize: "200",
      });

      const [rolesRes, resourcesRes, permissionsRes] = await Promise.all([
        fetch(`/api/roles?${query.toString()}`),
        fetch(`/api/resources?${query.toString()}`),
        fetch(`/api/permissions?pageSize=200`),
      ]);

      const [rolesData, resourcesData, permissionsData] = await Promise.all([
        rolesRes.json(),
        resourcesRes.json(),
        permissionsRes.json(),
      ]);

      const resolvedRoles: WorkspaceRole[] = rolesData.success
        ? rolesData.data || []
        : [];
      const resolvedResources: WorkspaceResource[] = resourcesData.success
        ? resourcesData.data || []
        : [];
      const resolvedPermissions: Permission[] = permissionsData.success
        ? permissionsData.data || []
        : [];

      setRoles(resolvedRoles);
      setResources(resolvedResources);
      setPermissions(resolvedPermissions);

      if (
        (!currentWorkspace ||
          currentWorkspace.workspaceId !== targetWorkspaceId) &&
        workspaces.length > 0
      ) {
        const workspace = workspaces.find(
          (ws) => ws.workspaceId === targetWorkspaceId
        );
        if (workspace) {
          setCurrentWorkspace(workspace);
        }
      }

      if (resolvedRoles.length > 0) {
        // Prioritize preferredRoleId (from URL) over pendingRoleId or selectedRole
        const priorityRoleId =
          preferredRoleId ||
          pendingRoleId ||
          selectedRole?.workspaceRoleId ||
          "";

        // Find the role by ID, or fall back to first role
        const roleToSelect = priorityRoleId
          ? resolvedRoles.find(
              (role) => role.workspaceRoleId === priorityRoleId
            ) || resolvedRoles[0]
          : resolvedRoles[0];

        setSelectedRole(roleToSelect);

        // Only clear pendingRoleId if we successfully selected the preferred role
        if (
          preferredRoleId &&
          roleToSelect.workspaceRoleId === preferredRoleId
        ) {
          setPendingRoleId("");
        }

        await loadRoleAssignments(
          roleToSelect,
          resolvedResources,
          resolvedPermissions
        );
      } else {
        setSelectedRole(null);
        setRoleAssignments([]);
        setSelectedResourceId("");
        setSelectedPermissionIds([]);
      }
    } catch (error) {
      console.error("Failed to load workspace data", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load workspace data"
      );
      setRoles([]);
      setResources([]);
      setPermissions([]);
      setSelectedRole(null);
      setRoleAssignments([]);
      setSelectedResourceId("");
      setSelectedPermissionIds([]);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleWorkspaceChange = (value: string) => {
    setWorkspaceId(value);
    setPendingRoleId("");
    setSelectedRole(null);
    setRoleAssignments([]);
    setSelectedResourceId("");
    setSelectedPermissionIds([]);
  };

  const handleSelectRole = (roleId: string) => {
    const role = roles.find((r) => r.workspaceRoleId === roleId) || null;
    setRoleAssignments([]);
    setSelectedResourceId("");
    setSelectedPermissionIds([]);
    if (role) {
      setSelectedRole(role);
      loadRoleAssignments(role, resources, permissions);
    } else {
      setSelectedRole(null);
    }
  };

  const handleSelectResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setSelectedPermissionIds(
      getPermissionIdsForResource(resourceId, roleAssignments)
    );
  };

  const handleAssignPermissions = async () => {
    if (!workspaceId || !selectedRole) {
      toast.error("Select a workspace and role first");
      return;
    }

    if (!selectedResourceId) {
      toast.error("Select a resource to attach");
      return;
    }

    if (selectedPermissionIds.length === 0) {
      toast.error("Choose at least one permission to assign");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/roles/${selectedRole.workspaceRoleId}/permissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceId: selectedResourceId,
            permissionIds: selectedPermissionIds,
          }),
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success("Permissions assigned successfully");
        await loadRoleAssignments(selectedRole);
      } else {
        toast.error(result.error?.message || "Failed to assign permissions");
      }
    } catch (error) {
      console.error("Failed to assign permissions", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign permissions"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRefreshAssignments = () => {
    if (selectedRole) {
      loadRoleAssignments(selectedRole);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManageAssignments =
    selectedRole &&
    !isLoadingAssignments &&
    resources.length > 0 &&
    permissions.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          selectedRole
            ? `Role Resources Management - ${selectedRole.name}`
            : "Role Resources Management"
        }
        description={
          selectedRole
            ? `View and assign workspace resources to ${selectedRole.name}`
            : "View and assign workspace resources to each role"
        }
        actions={
          workspaces.length > 0 ? (
            <div className="min-w-[220px]">
              <Select value={workspaceId} onValueChange={handleWorkspaceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem
                      key={workspace.workspaceId}
                      value={workspace.workspaceId}
                    >
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null
        }
      />

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search roles..."
            className="pl-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWorkspace ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {roles.length === 0
                  ? "No roles available for this workspace."
                  : "No roles match your search."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role.workspaceRoleId}
                    onClick={() => handleSelectRole(role.workspaceRoleId)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRole?.workspaceRoleId === role.workspaceRoleId
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                      {role.isSystemRole && (
                        <Badge variant="outline">System</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Assigned Resources
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedRole
                    ? `Resources currently tied to ${selectedRole.name}`
                    : "Select a role to view assignments"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAssignments}
                disabled={!selectedRole || isLoadingAssignments}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Select a role to view its resources and permissions.
                </p>
              ) : isLoadingAssignments ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : roleAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No resources or permissions have been assigned to this role
                  yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {roleAssignments.map((group) => (
                    <div
                      key={group.resourceId}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{group.resourceName}</p>
                        <Badge variant="outline">
                          {group.permissions.length} permissions
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions.map((permission) => (
                          <Badge
                            key={`${group.resourceId}-${permission.permissionId}`}
                            variant="secondary"
                          >
                            {permission.permissionName ||
                              permission.permissionCode ||
                              permission.permissionId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attach Resources & Permissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a resource and select the permissions to grant the role.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRole ? (
                <p className="text-sm text-muted-foreground">
                  Select a role to start assigning resources.
                </p>
              ) : isLoadingAssignments ? (
                <p className="text-sm text-muted-foreground">
                  Loading assigned resources and permissions...
                </p>
              ) : !canManageAssignments ? (
                <p className="text-sm text-muted-foreground">
                  Loading workspace resources and permissions...
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Resource</Label>
                    <Select
                      value={selectedResourceId}
                      onValueChange={handleSelectResource}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.map((resource) => (
                          <SelectItem
                            key={resource.resourceId}
                            value={resource.resourceId}
                          >
                            {resource.resourceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto border rounded-lg p-3">
                      {permissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No permissions available.
                        </p>
                      ) : (
                        permissions.map((permission) => (
                          <div
                            key={permission.permissionId}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`perm-${permission.permissionId}`}
                              checked={selectedPermissionIds.includes(
                                permission.permissionId
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissionIds([
                                    ...selectedPermissionIds,
                                    permission.permissionId,
                                  ]);
                                } else {
                                  setSelectedPermissionIds(
                                    selectedPermissionIds.filter(
                                      (id) => id !== permission.permissionId
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`perm-${permission.permissionId}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="font-medium">
                                {permission.permissionName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {permission.permissionCode}
                              </p>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAssignPermissions}
                      disabled={
                        isAssigning ||
                        !selectedRole ||
                        !selectedResourceId ||
                        selectedPermissionIds.length === 0
                      }
                    >
                      {isAssigning ? "Assigning..." : "Attach to Role"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
