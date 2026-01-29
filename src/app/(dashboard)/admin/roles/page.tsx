"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Shield } from "lucide-react";
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
import { AdminRoleDto, AdminRoleListItemDto } from "@/types";
import { apiGetAuth } from "@/lib/api-client";
import type { UserInfo } from "@/types";
import { useWorkspaceStore } from "@/store";
import {
  getAllAdminRoles,
  getAdminRoleById,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
} from "@/lib/services/admin-role-service";

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
  });

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
    if (!workspaceId) {
      toast.error("Please select a workspace");
      return;
    }
    setFormData({
      roleName: "",
      roleCode: "",
      roleDescription: "",
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
    if (!workspaceId) {
      toast.error("Please select a workspace");
      return;
    }

    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAdminRole(workspaceId, {
        roleName: formData.roleName,
        roleCode: formData.roleCode || null,
        roleDescription: formData.roleDescription || null,
      });

      if (result.success) {
        toast.success("Admin role created successfully");
        setIsCreateOpen(false);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to create admin role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create admin role"
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
      cell: () => <Badge variant="secondary">Custom Role</Badge>,
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

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">No workspace available</p>
          <p className="text-sm text-muted-foreground mt-2">
            You need admin access to at least one workspace to manage admin
            roles.
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
            <DialogTitle>Create Admin Role</DialogTitle>
            <DialogDescription>
              Create a new admin role for <strong>{workspaceName}</strong>.
              System roles cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              Role will be created in workspace:{" "}
              <strong className="text-foreground">{workspaceName}</strong>. To
              create in a different workspace, cancel and select another
              workspace above first.
            </div>
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
                placeholder="e.g., Workspace Administrator"
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
                placeholder="e.g., WORKSPACE_ADMIN"
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
