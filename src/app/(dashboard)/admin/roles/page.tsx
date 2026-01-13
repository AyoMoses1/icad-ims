"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldX,
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
} from "@/components/shared";
import { AdminRoleDto } from "@/types";
import { formatDate } from "@/lib/utils";
import { apiGetAuth } from "@/lib/api-client";
import type { UserInfo } from "@/types";
import {
  getAllAdminRoles,
  getAdminRoleById,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
} from "@/lib/services/admin-role-service";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRoleDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingSuperAdmin, setIsCheckingSuperAdmin] = useState(true);

  const [formData, setFormData] = useState({
    roleName: "",
    roleCode: "",
    description: "",
    isSystemRole: false,
  });

  // Check if user is SuperAdmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      setIsCheckingSuperAdmin(true);
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setUserInfo(info);
        // SuperAdmin check: email contains @rdlc.com
        const isSuper = info.email?.includes("@rdlc.com") || false;
        setIsSuperAdmin(isSuper);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setIsCheckingSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, []);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const result = await getAllAdminRoles();

      if (result.success && result.data) {
        setRoles(result.data);
      } else {
        toast.error(result.message || "Failed to load admin roles");
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load admin roles"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    if (!isSuperAdmin) {
      toast.error("Only SuperAdmin users can create admin roles");
      return;
    }
    setFormData({
      roleName: "",
      roleCode: "",
      description: "",
      isSystemRole: false,
    });
    setIsCreateOpen(true);
  };

  const handleEdit = async (role: AdminRoleDto) => {
    try {
      const result = await getAdminRoleById(role.adminRoleId);
      if (result.success && result.data) {
        setSelectedRole(result.data);
        setFormData({
          roleName: result.data.roleName || "",
          roleCode: result.data.roleCode || "",
          description: result.data.description || "",
          isSystemRole: result.data.isSystemRole,
        });
        setIsEditOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load role details");
    }
  };

  const handleDelete = (role: AdminRoleDto) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAdminRole({
        roleName: formData.roleName,
        roleCode: formData.roleCode || null,
        description: formData.description || null,
        isSystemRole: formData.isSystemRole,
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
        error instanceof Error
          ? error.message
          : "Failed to create admin role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedRole) return;

    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateAdminRole(selectedRole.adminRoleId, {
        roleName: formData.roleName,
        roleCode: formData.roleCode || null,
        description: formData.description || null,
        isActive: undefined, // Can be updated separately if needed
      });

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
        error instanceof Error
          ? error.message
          : "Failed to update admin role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAdminRole(selectedRole.adminRoleId);

      if (result.success) {
        toast.success("Admin role deleted successfully");
        setIsDeleteOpen(false);
        setSelectedRole(null);
        loadRoles();
      } else {
        toast.error(result.message || "Failed to delete admin role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete admin role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<AdminRoleDto>[] = [
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
      id: "roleCode",
      header: "Role Code",
      accessorKey: "roleCode",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.roleCode || "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (row) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "isSystemRole",
      header: "Type",
      cell: (row) => (
        <Badge variant={row.isSystemRole ? "default" : "secondary"}>
          {row.isSystemRole ? "System Role" : "Custom Role"}
        </Badge>
      ),
    },
    {
      id: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={row.isActive ? "success" : "secondary"}
          className="flex items-center gap-1"
        >
          {row.isActive ? (
            <>
              <ShieldCheck className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <ShieldX className="h-3 w-3" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      id: "dateCreated",
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.dateCreated ? formatDate(row.dateCreated) : "—"}
        </span>
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
            {isSuperAdmin && (
              <>
                <DropdownMenuItem onClick={() => handleEdit(row)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(row)}
                  disabled={row.isSystemRole}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {!isSuperAdmin && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground text-sm">
                  SuperAdmin only
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Roles"
        description="Manage admin roles and permissions. Only SuperAdmin users can create, update, or delete roles."
        actions={
          <Button 
            onClick={handleCreate}
            disabled={isCheckingSuperAdmin || !isSuperAdmin}
            title={!isSuperAdmin && !isCheckingSuperAdmin ? "Only SuperAdmin users can create roles" : ""}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />

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
              Create a new admin role. System roles cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the role's purpose and permissions"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSystemRole"
                checked={formData.isSystemRole}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isSystemRole: checked === true,
                  })
                }
              />
              <Label htmlFor="isSystemRole" className="cursor-pointer">
                System Role (cannot be deleted)
              </Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
          selectedRole
            ? `Are you sure you want to delete "${selectedRole.roleName}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleSubmitDelete}
        isLoading={isSubmitting}
        variant="destructive"
      />
    </div>
  );
}
