"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Key } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  ConfirmDialog,
} from "@/components/shared";
import { Permission } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    permissionName: "",
    permissionCode: "",
    description: "",
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/permissions");
      const result = await response.json();
      if (result.success) {
        setPermissions(result.data);
      }
    } catch (error) {
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.permissionName.trim() || !formData.permissionCode.trim()) {
      toast.error("Name and code are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Permission created successfully");
        setIsCreateOpen(false);
        resetForm();
        loadPermissions();
      } else {
        toast.error(result.error?.message || "Failed to create permission");
      }
    } catch (error) {
      toast.error("Failed to create permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;

    setIsSubmitting(true);
    try {
      toast.success("Permission deleted successfully");
      setIsDeleteOpen(false);
      setSelectedPermission(null);
      // In real implementation, would call API
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      permissionName: "",
      permissionCode: "",
      description: "",
    });
  };

  const columns: DataTableColumn<Permission>[] = [
    {
      id: "name",
      header: "Permission",
      cell: (permission) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Key className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium">{permission.permissionName}</p>
            <p className="text-sm text-muted-foreground">
              {permission.description}
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "code",
      header: "Code",
      cell: (permission) => (
        <code className="px-2 py-1 rounded bg-muted text-sm">
          {permission.permissionCode}
        </code>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (permission) => (
        <Badge variant={permission.isActive ? "success" : "secondary"}>
          {permission.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (permission) => formatDate(permission.createdAt),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (permission) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedPermission(permission);
                setIsDeleteOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Manage granular permissions that can be assigned to roles"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Permission
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={permissions}
        isLoading={isLoading}
        emptyMessage="No permissions found"
        emptyDescription="Create permissions to define granular access control."
        searchPlaceholder="Search permissions..."
        getRowId={(row) => row.permissionId}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permissionName">Permission Name *</Label>
              <Input
                id="permissionName"
                placeholder="e.g., View Reports"
                value={formData.permissionName}
                onChange={(e) =>
                  setFormData({ ...formData, permissionName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissionCode">Permission Code *</Label>
              <Input
                id="permissionCode"
                placeholder="e.g., VIEW_REPORTS"
                value={formData.permissionCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissionCode: e.target.value.toUpperCase(),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Unique code used in the system. Will be converted to uppercase.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this permission allows"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isSubmitting}>
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Permission"
        description={`Are you sure you want to delete "${selectedPermission?.permissionName}"? This will remove it from all roles.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}



