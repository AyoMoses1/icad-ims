"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield,
  Key,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  ConfirmDialog,
  LoadingPage,
} from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminRoleDto,
  AdminRoleListItemDto,
  AdminRolePermissionDto,
} from "@/types";
import { apiGetAuth } from "@/lib/api-client";
import type { UserInfo } from "@/types";
import { useWorkspaceStore } from "@/store";
import {
  getAllAdminRoles,
  getAdminRoleById,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  assignPermissionsToAdminRole,
  unassignPermissionsFromAdminRole,
  unassignPermissionsFromWorkspaceRole,
} from "@/lib/services/admin-role-service";
import { apiGet } from "@/lib/api-client";
import type { WorkspaceResource, Permission, PaginatedResponse } from "@/types";

/**
 * Maps role's resource permission flags (canCreate, canRead, etc.) to permission IDs.
 * Matches permission codes case-insensitively (e.g. "Create", "Declarations.Create").
 */
function getAssignedPermissionIdsForResource(
  rolePermission: AdminRolePermissionDto | undefined,
  allPermissions: Permission[]
): string[] {
  if (!rolePermission) return [];

  const actionToCodes: Record<string, string[]> = {
    canCreate: ["create"],
    canRead: ["read"],
    canUpdate: ["update"],
    canDelete: ["delete"],
    canImport: ["import"],
    canExport: ["export"],
    canApprove: ["approve"],
    canManage: ["manage"],
    canReject: ["reject"],
  };

  const assignedIds: string[] = [];
  for (const [flag, codes] of Object.entries(actionToCodes)) {
    const isAssigned = rolePermission[flag as keyof AdminRolePermissionDto];
    if (!isAssigned || typeof isAssigned !== "boolean") continue;

    for (const perm of allPermissions) {
      const codeLower = (perm.permissionCode || "").toLowerCase();
      const matches = codes.some(
        (c) =>
          codeLower === c ||
          codeLower.endsWith(`.${c}`) ||
          codeLower.endsWith(`_${c}`)
      );
      if (matches && !assignedIds.includes(perm.permissionId)) {
        assignedIds.push(perm.permissionId);
      }
    }
  }
  return assignedIds;
}

export default function AdminRolesPage() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [roles, setRoles] = useState<AdminRoleListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRoleDto | null>(null);
  const [selectedListItem, setSelectedListItem] =
    useState<AdminRoleListItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    roleName: "",
    roleCode: "",
    roleDescription: "",
    isAdmin: false,
    createRoleWorkspaceId: "" as string,
  });

  // Assign Permissions dialog (for domain roles only)
  const [isAssignPermissionsOpen, setIsAssignPermissionsOpen] = useState(false);
  const [assignPermissionsRole, setAssignPermissionsRole] =
    useState<AdminRoleDto | null>(null);
  const [assignResources, setAssignResources] = useState<WorkspaceResource[]>(
    []
  );
  const [assignPermissionsList, setAssignPermissionsList] = useState<
    Permission[]
  >([]);
  const [assignSelectedResourceId, setAssignSelectedResourceId] =
    useState<string>("");
  const [assignSelectedPermissionIds, setAssignSelectedPermissionIds] =
    useState<string[]>([]);
  const [isLoadingAssignPermissions, setIsLoadingAssignPermissions] =
    useState(false);
  const [isSubmittingAssignPermissions, setIsSubmittingAssignPermissions] =
    useState(false);

  // Unassign Permissions dialog
  const [isUnassignPermissionsOpen, setIsUnassignPermissionsOpen] =
    useState(false);
  const [unassignPermissionsRole, setUnassignPermissionsRole] =
    useState<AdminRoleDto | null>(null);
  const [unassignResources, setUnassignResources] = useState<
    WorkspaceResource[]
  >([]);
  const [unassignPermissionsList, setUnassignPermissionsList] = useState<
    Permission[]
  >([]);
  const [unassignSelectedResourceId, setUnassignSelectedResourceId] =
    useState<string>("");
  const [unassignSelectedPermissionIds, setUnassignSelectedPermissionIds] =
    useState<string[]>([]);
  const [unassignEntireResource, setUnassignEntireResource] = useState(false);
  const [isLoadingUnassignPermissions, setIsLoadingUnassignPermissions] =
    useState(false);
  const [isSubmittingUnassignPermissions, setIsSubmittingUnassignPermissions] =
    useState(false);

  const loadRoles = async () => {
    if (!workspaceId) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await getAllAdminRoles(workspaceId);

      if (result.success && result.data) {
        setRoles(result.data);
      } else {
        toast.error(result.message || "Failed to load admin roles");
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load admin roles"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user info and determine workspace ID
  useEffect(() => {
    const fetchUserInfoAndWorkspace = async () => {
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setUserInfo(info);

        // Determine workspace ID to use
        let targetWorkspaceId: string | null = null;

        // First, try to use current workspace if available
        if (currentWorkspace?.workspaceId) {
          targetWorkspaceId = currentWorkspace.workspaceId;
        } else if (
          info.adminDetails?.adminWorkspaces &&
          info.adminDetails.adminWorkspaces.length > 0
        ) {
          // If no current workspace, use the first admin workspace
          targetWorkspaceId = info.adminDetails.adminWorkspaces[0].workspaceId;

          // Optionally set it in the workspace store
          const { workspaces } = useWorkspaceStore.getState();
          const adminWorkspace = workspaces.find(
            (w) => w.workspaceId === targetWorkspaceId
          );
          if (adminWorkspace) {
            setCurrentWorkspace(adminWorkspace);
          } else {
            // Create a workspace object from admin workspace info
            const adminWsInfo = info.adminDetails.adminWorkspaces[0];
            const newWorkspace = {
              workspaceId: adminWsInfo.workspaceId,
              name: adminWsInfo.workspaceName,
              description: "",
              isActive: true,
              isDeleted: false,
              color: undefined,
              createdBy: "",
              createdAt: "",
              updatedAt: "",
            };
            setCurrentWorkspace(newWorkspace);
          }
        }

        if (targetWorkspaceId) {
          setWorkspaceId(targetWorkspaceId);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        toast.error("Failed to load user information");
      }
    };

    fetchUserInfoAndWorkspace();
  }, [currentWorkspace, setCurrentWorkspace]);

  const handleWorkspaceChange = (newWorkspaceId: string) => {
    setWorkspaceId(newWorkspaceId);
  };

  useEffect(() => {
    if (workspaceId) {
      loadRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleCreate = () => {
    setFormData({
      roleName: "",
      roleCode: "",
      roleDescription: "",
      isAdmin: false,
      createRoleWorkspaceId: workspaceId || "",
    });
    setIsCreateOpen(true);
  };

  const handleEdit = async (role: AdminRoleListItemDto) => {
    if (!workspaceId) {
      toast.error("Please select a workspace");
      return;
    }
    try {
      const result = await getAdminRoleById(role.workspaceRoleId, workspaceId);
      if (result.success && result.data) {
        setSelectedRole(result.data);
        setFormData({
          roleName: result.data.roleName || "",
          roleCode: result.data.roleCode || "",
          roleDescription: result.data.roleDescription || "",
          isAdmin: result.data.isAdmin ?? false,
          createRoleWorkspaceId: result.data.workspaceId || workspaceId || "",
        });
        setIsEditOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load role details");
    }
  };

  const handleDelete = (role: AdminRoleListItemDto) => {
    setSelectedListItem(role);
    setIsDeleteOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (!formData.isAdmin) {
      const wId = formData.createRoleWorkspaceId || workspaceId;
      if (!wId) {
        toast.error("Please select a workspace for this domain role");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const workspaceIdForCreate = formData.isAdmin
        ? undefined
        : formData.createRoleWorkspaceId || workspaceId || undefined;
      const result = await createAdminRole(
        {
          roleName: formData.roleName,
          roleCode: formData.roleCode || null,
          roleDescription: formData.roleDescription || null,
          isAdmin: formData.isAdmin,
        },
        workspaceIdForCreate ?? null
      );

      if (result.success) {
        toast.success(
          formData.isAdmin
            ? "Administrative role created"
            : "Domain role created"
        );
        setIsCreateOpen(false);
        if (workspaceIdForCreate && workspaceIdForCreate === workspaceId) {
          loadRoles();
        } else if (workspaceIdForCreate) {
          loadRoles();
        } else if (workspaceId) {
          loadRoles();
        }
      } else {
        toast.error(result.message || "Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedRole || !workspaceId) return;

    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateAdminRole(
        selectedRole.workspaceRoleId,
        workspaceId,
        {
          roleName: formData.roleName,
          roleCode: formData.roleCode || null,
          roleDescription: formData.roleDescription || null,
        }
      );

      if (result.success) {
        toast.success("Admin role updated successfully");
        setIsEditOpen(false);
        setSelectedRole(null);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to update admin role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update admin role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPermissionsClick = async (row: AdminRoleListItemDto) => {
    if (!workspaceId) {
      toast.error("Please select a workspace");
      return;
    }
    try {
      const result = await getAdminRoleById(row.workspaceRoleId, workspaceId);
      if (!result.success || !result.data) {
        toast.error("Failed to load role details");
        return;
      }
      const role = result.data;
      const workspaceIdForPermissions = role.workspaceId || workspaceId || "";
      if (!workspaceIdForPermissions) {
        toast.error("Please select a workspace to assign permissions");
        return;
      }
      setAssignPermissionsRole({
        ...role,
        workspaceId: workspaceIdForPermissions,
      });
      setAssignSelectedResourceId("");
      setAssignSelectedPermissionIds([]);
      setIsAssignPermissionsOpen(true);
      setIsLoadingAssignPermissions(true);
      try {
        const [resourcesRes, permissionsRes] = await Promise.all([
          apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
            `/api/workspaces/${workspaceIdForPermissions}/resources`
          ),
          apiGet<Permission[] | PaginatedResponse<Permission>>(
            `/api/permissions`
          ),
        ]);
        const resourcesData =
          resourcesRes.success && resourcesRes.data
            ? Array.isArray(resourcesRes.data)
              ? resourcesRes.data
              : (resourcesRes.data as PaginatedResponse<WorkspaceResource>)
                  .items || []
            : [];
        const permissionsData =
          permissionsRes.success && permissionsRes.data
            ? Array.isArray(permissionsRes.data)
              ? permissionsRes.data
              : (permissionsRes.data as PaginatedResponse<Permission>).items ||
                []
            : [];
        setAssignResources(resourcesData);
        setAssignPermissionsList(permissionsData);
      } finally {
        setIsLoadingAssignPermissions(false);
      }
    } catch (error) {
      console.error("Error loading role for assign permissions:", error);
      toast.error("Failed to load role details");
    }
  };

  const handleAssignPermissionsSubmit = async () => {
    if (
      !assignPermissionsRole ||
      !assignSelectedResourceId ||
      assignSelectedPermissionIds.length === 0
    ) {
      toast.error("Please select a resource and at least one permission");
      return;
    }
    setIsSubmittingAssignPermissions(true);
    try {
      const result = await assignPermissionsToAdminRole(
        assignPermissionsRole.workspaceRoleId,
        assignPermissionsRole.workspaceId,
        {
          resourceId: assignSelectedResourceId,
          permissionIds: assignSelectedPermissionIds,
        }
      );
      if (result.success) {
        toast.success("Permissions assigned successfully");
        setIsAssignPermissionsOpen(false);
        setAssignPermissionsRole(null);
        setAssignSelectedResourceId("");
        setAssignSelectedPermissionIds([]);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to assign permissions");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign permissions"
      );
    } finally {
      setIsSubmittingAssignPermissions(false);
    }
  };

  const handleUnassignPermissionsClick = async (row: AdminRoleListItemDto) => {
    if (!workspaceId) {
      toast.error("Please select a workspace");
      return;
    }
    try {
      const result = await getAdminRoleById(row.workspaceRoleId, workspaceId);
      if (!result.success || !result.data) {
        toast.error("Failed to load role details");
        return;
      }
      const role = result.data;
      const workspaceIdForPermissions = role.workspaceId || workspaceId || "";
      if (!workspaceIdForPermissions) {
        toast.error("Please select a workspace to unassign permissions");
        return;
      }
      setUnassignPermissionsRole({
        ...role,
        workspaceId: workspaceIdForPermissions,
      });
      setUnassignSelectedResourceId("");
      setUnassignSelectedPermissionIds([]);
      setUnassignEntireResource(false);
      setIsUnassignPermissionsOpen(true);
      setIsLoadingUnassignPermissions(true);
      try {
        const [resourcesRes, permissionsRes] = await Promise.all([
          apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
            `/api/workspaces/${workspaceIdForPermissions}/resources`
          ),
          apiGet<Permission[] | PaginatedResponse<Permission>>(
            `/api/permissions`
          ),
        ]);
        const resourcesData =
          resourcesRes.success && resourcesRes.data
            ? Array.isArray(resourcesRes.data)
              ? resourcesRes.data
              : (resourcesRes.data as PaginatedResponse<WorkspaceResource>)
                  .items || []
            : [];
        const permissionsData =
          permissionsRes.success && permissionsRes.data
            ? Array.isArray(permissionsRes.data)
              ? permissionsRes.data
              : (permissionsRes.data as PaginatedResponse<Permission>).items ||
                []
            : [];
        setUnassignResources(resourcesData);
        setUnassignPermissionsList(permissionsData);
      } finally {
        setIsLoadingUnassignPermissions(false);
      }
    } catch (error) {
      console.error("Error loading role for unassign permissions:", error);
      toast.error("Failed to load role details");
    }
  };

  const handleUnassignPermissionsSubmit = async () => {
    if (!unassignPermissionsRole || !unassignSelectedResourceId) {
      toast.error("Please select a resource");
      return;
    }
    if (!unassignEntireResource && unassignSelectedPermissionIds.length === 0) {
      toast.error(
        "Please select at least one permission to unassign, or check 'Unassign entire resource'"
      );
      return;
    }
    setIsSubmittingUnassignPermissions(true);
    try {
      const workspaceIdForApi =
        unassignPermissionsRole.workspaceId || workspaceId || "";
      const data = {
        resourceId: unassignSelectedResourceId,
        permissionIds: unassignEntireResource
          ? []
          : unassignSelectedPermissionIds,
        unassignResource: unassignEntireResource,
      };
      const result = unassignPermissionsRole.isAdmin
        ? await unassignPermissionsFromAdminRole(
            unassignPermissionsRole.workspaceRoleId,
            workspaceIdForApi,
            data
          )
        : await unassignPermissionsFromWorkspaceRole(
            workspaceIdForApi,
            unassignPermissionsRole.workspaceRoleId,
            data
          );
      if (result.success) {
        toast.success("Permissions unassigned successfully");
        setIsUnassignPermissionsOpen(false);
        setUnassignPermissionsRole(null);
        setUnassignSelectedResourceId("");
        setUnassignSelectedPermissionIds([]);
        setUnassignEntireResource(false);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to unassign permissions");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to unassign permissions"
      );
    } finally {
      setIsSubmittingUnassignPermissions(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedListItem || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAdminRole(
        selectedListItem.workspaceRoleId,
        workspaceId
      );

      if (result.success) {
        toast.success("Admin role deleted successfully");
        setIsDeleteOpen(false);
        setSelectedListItem(null);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to delete admin role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete admin role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<AdminRoleListItemDto>[] = [
    {
      id: "roleName",
      header: "Role Name",
      accessorKey: "roleName",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.roleName || "N/A"}</span>
        </div>
      ),
    },
    {
      id: "workspaceRoleId",
      header: "Role ID",
      accessorKey: "workspaceRoleId",
      cell: (row) => (
        <span className="text-muted-foreground text-xs font-mono">
          {row.workspaceRoleId.substring(0, 8)}...
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant={row.isAdmin ? "default" : "secondary"}>
          {row.isAdmin ? "Administrative" : "Domain Role"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignPermissionsClick(row)}>
              <Key className="mr-2 h-4 w-4" />
              Assign Permissions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleUnassignPermissionsClick(row)}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Unassign Permissions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Get workspace name from userInfo or currentWorkspace
  const workspaceName =
    userInfo?.adminDetails?.adminWorkspaces?.find(
      (ws) => ws.workspaceId === workspaceId
    )?.workspaceName ||
    currentWorkspace?.name ||
    "Selected Workspace";

  // Check if we're still loading workspace info
  const isCheckingWorkspace = !workspaceId && !userInfo;

  if (isCheckingWorkspace) {
    return <LoadingPage message="Loading workspace information..." />;
  }

  const hasAnyWorkspace =
    (userInfo?.adminDetails?.adminWorkspaces?.length ?? 0) > 0;
  if (!workspaceId && !hasAnyWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">No workspace available</p>
          <p className="text-sm text-muted-foreground mt-2">
            You need admin access to at least one workspace to manage roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Roles"
        description={`Manage admin roles and permissions for ${workspaceName}.`}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />

      {/* Workspace selector - choose which workspace to manage roles for */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-2 min-w-[200px]">
          <Label htmlFor="admin-roles-workspace">Workspace</Label>
          <Select
            value={workspaceId ?? ""}
            onValueChange={handleWorkspaceChange}
          >
            <SelectTrigger id="admin-roles-workspace">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {userInfo?.adminDetails?.adminWorkspaces?.map((ws) => (
                <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                  {ws.workspaceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground self-end pb-2">
          Roles below are for the selected workspace. Create Role adds a role to
          this workspace.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyMessage="No admin roles found"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>
              Create an administrative role or a domain role tied to a
              workspace. Domain roles can have resource-level permissions
              assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isAdmin: checked === true,
                  })
                }
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Administrative role (no resource-level permissions)
              </Label>
            </div>
            {!formData.isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="createRoleWorkspace">
                  Workspace <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.createRoleWorkspaceId || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      createRoleWorkspaceId: value,
                    })
                  }
                >
                  <SelectTrigger id="createRoleWorkspace">
                    <SelectValue placeholder="Select workspace for this role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userInfo?.adminDetails?.adminWorkspaces?.map((ws) => (
                      <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                        {ws.workspaceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Domain roles are tied to a workspace. You can assign
                  permissions after creating the role.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="roleName">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roleName"
                value={formData.roleName}
                onChange={(e) =>
                  setFormData({ ...formData, roleName: e.target.value })
                }
                placeholder="e.g., VESSEL_OPERATOR or Workspace Administrator"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleCode">Role Code</Label>
              <Input
                id="roleCode"
                value={formData.roleCode}
                onChange={(e) =>
                  setFormData({ ...formData, roleCode: e.target.value })
                }
                placeholder="e.g., VESSEL_OPERATOR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={formData.roleDescription}
                onChange={(e) =>
                  setFormData({ ...formData, roleDescription: e.target.value })
                }
                placeholder="Describe the role's purpose and permissions"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog (domain roles only) */}
      <Dialog
        open={isAssignPermissionsOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignPermissionsRole(null);
            setAssignSelectedResourceId("");
            setAssignSelectedPermissionIds([]);
          }
          setIsAssignPermissionsOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Permissions</DialogTitle>
            <DialogDescription>
              {assignPermissionsRole
                ? `Choose a resource and select the permissions to grant ${assignPermissionsRole.roleName}.`
                : "Assign permissions to this role."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select
                value={assignSelectedResourceId}
                onValueChange={(value) => {
                  setAssignSelectedResourceId(value);
                  setAssignSelectedPermissionIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {assignResources.map((resource) => (
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
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                {isLoadingAssignPermissions ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading...
                  </p>
                ) : assignPermissionsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No permissions available
                  </p>
                ) : (
                  assignPermissionsList.map((permission) => (
                    <div
                      key={permission.permissionId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`assign-${permission.permissionId}`}
                        checked={assignSelectedPermissionIds.includes(
                          permission.permissionId
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAssignSelectedPermissionIds([
                              ...assignSelectedPermissionIds,
                              permission.permissionId,
                            ]);
                          } else {
                            setAssignSelectedPermissionIds(
                              assignSelectedPermissionIds.filter(
                                (id) => id !== permission.permissionId
                              )
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`assign-${permission.permissionId}`}
                        className="cursor-pointer flex-1"
                      >
                        <div>
                          <div className="font-medium">
                            {permission.permissionName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {permission.permissionCode}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignPermissionsOpen(false);
                setAssignPermissionsRole(null);
                setAssignSelectedResourceId("");
                setAssignSelectedPermissionIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPermissionsSubmit}
              disabled={
                isSubmittingAssignPermissions ||
                !assignSelectedResourceId ||
                assignSelectedPermissionIds.length === 0
              }
            >
              {isSubmittingAssignPermissions
                ? "Assigning..."
                : "Assign Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Permissions Dialog */}
      <Dialog
        open={isUnassignPermissionsOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUnassignPermissionsRole(null);
            setUnassignSelectedResourceId("");
            setUnassignSelectedPermissionIds([]);
            setUnassignEntireResource(false);
          }
          setIsUnassignPermissionsOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unassign Permissions</DialogTitle>
            <DialogDescription>
              {unassignPermissionsRole
                ? `Choose a resource and select the permissions to remove from ${unassignPermissionsRole.roleName}.`
                : "Unassign permissions from this role."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select
                value={unassignSelectedResourceId}
                onValueChange={(value) => {
                  setUnassignSelectedResourceId(value);
                  const rolePerm = unassignPermissionsRole?.permissions?.find(
                    (p) => p.resourceId === value
                  );
                  const assignedIds = getAssignedPermissionIdsForResource(
                    rolePerm,
                    unassignPermissionsList
                  );
                  setUnassignSelectedPermissionIds(assignedIds);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {unassignResources.map((resource) => (
                    <SelectItem
                      key={resource.resourceId}
                      value={resource.resourceId}
                    >
                      {resource.resourceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignSelectedResourceId && (
                <p className="text-xs text-muted-foreground">
                  Currently assigned permissions for this resource are
                  pre-checked. Uncheck the ones you want to remove.
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unassign-entire-resource"
                checked={unassignEntireResource}
                onCheckedChange={(checked) => {
                  setUnassignEntireResource(checked === true);
                  if (checked) {
                    setUnassignSelectedPermissionIds([]);
                  }
                }}
              />
              <Label
                htmlFor="unassign-entire-resource"
                className="cursor-pointer"
              >
                Unassign entire resource (removes resource and all its
                permissions from this role)
              </Label>
            </div>
            {!unassignEntireResource && (
              <div className="space-y-2">
                <Label>
                  Permissions to remove (assigned permissions are pre-checked)
                </Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                  {isLoadingUnassignPermissions ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Loading...
                    </p>
                  ) : unassignPermissionsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No permissions available
                    </p>
                  ) : (
                    unassignPermissionsList.map((permission) => (
                      <div
                        key={permission.permissionId}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`unassign-${permission.permissionId}`}
                          checked={unassignSelectedPermissionIds.includes(
                            permission.permissionId
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setUnassignSelectedPermissionIds([
                                ...unassignSelectedPermissionIds,
                                permission.permissionId,
                              ]);
                            } else {
                              setUnassignSelectedPermissionIds(
                                unassignSelectedPermissionIds.filter(
                                  (id) => id !== permission.permissionId
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`unassign-${permission.permissionId}`}
                          className="cursor-pointer flex-1"
                        >
                          <div>
                            <div className="font-medium">
                              {permission.permissionName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {permission.permissionCode}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUnassignPermissionsOpen(false);
                setUnassignPermissionsRole(null);
                setUnassignSelectedResourceId("");
                setUnassignSelectedPermissionIds([]);
                setUnassignEntireResource(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnassignPermissionsSubmit}
              disabled={
                isSubmittingUnassignPermissions ||
                !unassignSelectedResourceId ||
                (!unassignEntireResource &&
                  unassignSelectedPermissionIds.length === 0)
              }
            >
              {isSubmittingUnassignPermissions
                ? "Unassigning..."
                : "Unassign Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admin Role</DialogTitle>
            <DialogDescription>
              Update the admin role details. System roles cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-roleName">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-roleName"
                value={formData.roleName}
                onChange={(e) =>
                  setFormData({ ...formData, roleName: e.target.value })
                }
                placeholder="e.g., Workspace Administrator"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roleCode">Role Code</Label>
              <Input
                id="edit-roleCode"
                value={formData.roleCode}
                onChange={(e) =>
                  setFormData({ ...formData, roleCode: e.target.value })
                }
                placeholder="e.g., WORKSPACE_ADMIN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roleDescription">Description</Label>
              <Textarea
                id="edit-roleDescription"
                value={formData.roleDescription}
                onChange={(e) =>
                  setFormData({ ...formData, roleDescription: e.target.value })
                }
                placeholder="Describe the role's purpose and permissions"
                rows={3}
              />
            </div>
            {selectedRole && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>System Role:</strong>{" "}
                  {selectedRole.isSystemRole ? "Yes" : "No"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Admin Role"
        description={
          selectedListItem
            ? `Are you sure you want to delete "${selectedListItem.roleName}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleSubmitDelete}
        isLoading={isSubmitting}
        variant="destructive"
      />
    </div>
  );
}
