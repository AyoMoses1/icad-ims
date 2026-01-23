"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCcw, Key } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  WorkspaceRole,
  WorkspaceResource,
  Permission,
  PaginatedResponse,
} from "@/types";
import {
  extractPermissionAssignments,
  groupPermissionAssignments,
  getPermissionIdsForResource,
  type RolePermissionGroup,
} from "@/lib/permission-utils";
import { apiGet, apiPost } from "@/lib/api-client";

export default function AssignPermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryWorkspaceId = searchParams.get("workspaceId");
  const queryRoleId = searchParams.get("roleId");
  
  const [workspaceId, setWorkspaceId] = useState(queryWorkspaceId || "");
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [allResources, setAllResources] = useState<WorkspaceResource[]>([]); // All available resources for dropdown
  const [assignedResources, setAssignedResources] = useState<WorkspaceResource[]>([]); // Only assigned resources for display
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RolePermissionGroup[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load role details and assigned permissions
  useEffect(() => {
    if (workspaceId && queryRoleId) {
      loadRoleAndAssignments();
    } else if (!queryRoleId) {
      toast.error("Role ID is required");
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, queryRoleId]);

  const loadRoleAndAssignments = async () => {
    if (!workspaceId || !queryRoleId) return;

    setIsLoading(true);
    setIsLoadingAssignments(true);
    try {
      // Use GET /api/workspaces/{workspaceId}/roles/{roleId} to get role with resources and permissions
      const roleResult = await apiGet<WorkspaceRole & {
        permissions?: Array<{
          resourceId: string;
          resourceName: string;
          canCreate: boolean;
          canRead: boolean;
          canUpdate: boolean;
          canDelete: boolean;
          canImport?: boolean;
          canExport?: boolean;
          canApprove?: boolean;
          canManage?: boolean;
          canReject?: boolean;
        }>;
      }>(`/api/workspaces/${workspaceId}/roles/${queryRoleId}`);

      if (!roleResult.success || !roleResult.data) {
        toast.error(roleResult.error?.message || "Role not found");
        router.back();
        return;
      }

      const roleData = roleResult.data;
      const resourcePermissions = roleData.permissions || [];

      // Transform role to match expected structure
      const transformedRole: WorkspaceRole = {
        ...roleData,
        name: roleData.roleName || roleData.name || "Unnamed Role",
        description: roleData.roleDescription || roleData.description || "",
        permissions: resourcePermissions,
      };

      setRole(transformedRole);

      // Process the permissions array from the role response
      // Extract permission assignments from ResourcePermissionDto format
      const assignments = extractPermissionAssignments(resourcePermissions);

      // Fetch ALL workspace resources (for dropdown) and all permissions in parallel
      const [allResourcesResult, permissionsResult] = await Promise.all([
        apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
          `/api/workspaces/${workspaceId}/resources`
        ),
        apiGet<Permission[] | PaginatedResponse<Permission>>(
          `/api/permissions`
        ),
      ]);

      // Handle both direct array and PaginatedResponse formats for resources
      const allWorkspaceResources: WorkspaceResource[] = allResourcesResult.success && allResourcesResult.data
        ? Array.isArray(allResourcesResult.data)
          ? allResourcesResult.data
          : allResourcesResult.data.items || []
        : [];

      // Handle both direct array and PaginatedResponse formats for permissions
      const allPermissions: Permission[] = permissionsResult.success && permissionsResult.data
        ? Array.isArray(permissionsResult.data)
          ? permissionsResult.data
          : permissionsResult.data.items || []
        : [];

      // Convert ResourcePermissionDto to WorkspaceResource objects (only assigned ones)
      const assignedResourcesList: WorkspaceResource[] = resourcePermissions.map((rp) => ({
        resourceId: rp.resourceId,
        resourceName: rp.resourceName,
        workspaceId: workspaceId,
        description: undefined,
        url: undefined,
        icon: undefined,
        parentId: undefined,
        order: 0,
        isActive: true,
        createdBy: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Group permissions by resource
      const groups = groupPermissionAssignments(
        assignments,
        assignedResourcesList,
        allPermissions
      );
      setRoleAssignments(groups);

      // Set all resources for dropdown and assigned resources for display
      setAllResources(allWorkspaceResources);
      setAssignedResources(assignedResourcesList);
      setPermissions(allPermissions);

      // Auto-select first resource if available
      if (groups.length > 0 && !selectedResourceId) {
        const firstResourceId = groups[0].resourceId;
        setSelectedResourceId(firstResourceId);
        setSelectedPermissionIds(
          getPermissionIdsForResource(firstResourceId, groups)
        );
      }
    } catch (error) {
      console.error("Failed to load role", error);
      toast.error("Failed to load role information");
      router.back();
    } finally {
      setIsLoading(false);
      setIsLoadingAssignments(false);
    }
  };

  const loadRoleAssignments = async () => {
    if (!workspaceId || !role) return;

    setIsLoadingAssignments(true);
    try {
      // Use GET /api/workspaces/{workspaceId}/roles/{roleId} to get role with resources and permissions
      const roleResult = await apiGet<WorkspaceRole & {
        permissions?: Array<{
          resourceId: string;
          resourceName: string;
          canCreate: boolean;
          canRead: boolean;
          canUpdate: boolean;
          canDelete: boolean;
          canImport?: boolean;
          canExport?: boolean;
          canApprove?: boolean;
          canManage?: boolean;
          canReject?: boolean;
        }>;
      }>(`/api/workspaces/${workspaceId}/roles/${role.workspaceRoleId}`);

      if (!roleResult.success || !roleResult.data) {
        toast.error(roleResult.error?.message || "Failed to load role permissions");
        setRoleAssignments([]);
        setAllResources([]);
        setAssignedResources([]);
        setPermissions([]);
        return;
      }

      const resourcePermissions = roleResult.data.permissions || [];

      // Extract permission assignments from ResourcePermissionDto format
      const assignments = extractPermissionAssignments(resourcePermissions);

      // Fetch ALL workspace resources (for dropdown) and all permissions in parallel
      const [allResourcesResult, permissionsResult] = await Promise.all([
        apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
          `/api/workspaces/${workspaceId}/resources`
        ),
        apiGet<Permission[] | PaginatedResponse<Permission>>(
          `/api/permissions`
        ),
      ]);

      // Handle both direct array and PaginatedResponse formats for resources
      const allWorkspaceResources: WorkspaceResource[] = allResourcesResult.success && allResourcesResult.data
        ? Array.isArray(allResourcesResult.data)
          ? allResourcesResult.data
          : allResourcesResult.data.items || []
        : [];

      // Handle both direct array and PaginatedResponse formats for permissions
      const allPermissions: Permission[] = permissionsResult.success && permissionsResult.data
        ? Array.isArray(permissionsResult.data)
          ? permissionsResult.data
          : permissionsResult.data.items || []
        : [];

      // Convert ResourcePermissionDto to WorkspaceResource objects (only assigned ones)
      const assignedResourcesList: WorkspaceResource[] = resourcePermissions.map((rp) => ({
        resourceId: rp.resourceId,
        resourceName: rp.resourceName,
        workspaceId: workspaceId,
        description: undefined,
        url: undefined,
        icon: undefined,
        parentId: undefined,
        order: 0,
        isActive: true,
        createdBy: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Group permissions by resource
      const groups = groupPermissionAssignments(
        assignments,
        assignedResourcesList,
        allPermissions
      );
      setRoleAssignments(groups);

      // Set all resources for dropdown and assigned resources for display
      setAllResources(allWorkspaceResources);
      setAssignedResources(assignedResourcesList);
      setPermissions(allPermissions);

      // Auto-select first resource if available
      if (groups.length > 0 && !selectedResourceId) {
        const firstResourceId = groups[0].resourceId;
        setSelectedResourceId(firstResourceId);
        setSelectedPermissionIds(
          getPermissionIdsForResource(firstResourceId, groups)
        );
      }
    } catch (error) {
      console.error("Failed to load role permissions", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load role permissions"
      );
      setRoleAssignments([]);
      setAllResources([]);
      setAssignedResources([]);
      setPermissions([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleSelectResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setSelectedPermissionIds(
      getPermissionIdsForResource(resourceId, roleAssignments)
    );
  };

  const handleAssignPermissions = async () => {
    if (!workspaceId || !role) {
      toast.error("Missing workspace or role information");
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
      const result = await apiPost<any>(
        `/api/workspaces/${workspaceId}/roles/${role.workspaceRoleId}/permissions`,
        {
          resourceId: selectedResourceId,
          permissionIds: selectedPermissionIds,
        }
      );

      if (result.success) {
        toast.success("Permissions assigned successfully");
        await loadRoleAssignments();
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

  const handleRefresh = () => {
    if (role) {
      loadRoleAssignments();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assign Permissions"
          description="Loading role information..."
        />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assign Permissions"
          description="Role not found"
        />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">The requested role could not be found.</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Assign Permissions - ${role.name}`}
        description={role.description || `Manage permissions for ${role.name}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Resources Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assigned Resources</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Resources currently assigned to {role.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingAssignments}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAssignments ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : roleAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No resources or permissions have been assigned to this role yet.
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

        {/* Attach Resources & Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Attach Resources & Permissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a resource and select the permissions to grant {role.name}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAssignments ? (
              <p className="text-sm text-muted-foreground">
                Loading resources and permissions...
              </p>
            ) : allResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No resources available for this workspace.
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
                      {allResources.map((resource) => (
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
                  {selectedResourceId && (
                    <p className="text-xs text-muted-foreground">
                      {roleAssignments.find(g => g.resourceId === selectedResourceId)?.permissions.length || 0} permission(s) currently assigned to this resource
                    </p>
                  )}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto border rounded-lg p-3">
                    {permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No permissions available.
                      </p>
                    ) : (
                      permissions.map((permission) => {
                        const isAssigned = selectedResourceId
                          ? getPermissionIdsForResource(selectedResourceId, roleAssignments).includes(permission.permissionId)
                          : false;
                        return (
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {permission.permissionName}
                              </p>
                              {isAssigned && (
                                <Badge variant="outline" className="text-xs">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {permission.permissionCode}
                            </p>
                          </label>
                        </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAssignPermissions}
                    disabled={
                      isAssigning ||
                      !selectedResourceId ||
                      selectedPermissionIds.length === 0
                    }
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {isAssigning ? "Assigning..." : "Assign Permissions"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
