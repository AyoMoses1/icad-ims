"use client";

import { useState, useEffect, useCallback } from "react";
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
  LoadingSpinner,
} from "@/components/shared";
import { Permission } from "@/types";
import { formatDate } from "@/lib/utils";
import { apiGet, apiPostAuth, apiPut, apiDelete } from "@/lib/api-client";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPermission, setIsLoadingPermission] = useState(false);

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    permissionName: "",
    description: "",
  });

  const loadPermissions = useCallback(async (query?: string, pageNumber?: number) => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      const searchValue = query !== undefined ? query : searchQuery;
      const page = pageNumber !== undefined ? pageNumber : currentPage;
      
      if (searchValue) {
        params.append("Query", searchValue);
      }
      params.append("PageNumber", String(page));
      params.append("PageSize", String(pageSize));
      const skip = (page - 1) * pageSize;
      params.append("Skip", String(skip));

      const queryString = params.toString();
      const endpoint = `/api/permissions${queryString ? `?${queryString}` : ""}`;
      
      const result = await apiGet<Permission[]>(endpoint);
      if (result.success && result.data) {
        // Handle both array and paginated response formats
        const permissionsData = Array.isArray(result.data) 
          ? result.data 
          : (result.data as any)?.items || result.data;
        setPermissions(permissionsData);
        
        // Update total count if available in response
        if ((result as any).totalCount !== undefined) {
          setTotalCount((result as any).totalCount);
        } else if (Array.isArray(permissionsData)) {
          setTotalCount(permissionsData.length);
        }
      }
    } catch (error) {
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, pageSize]);

  // Initial load
  useEffect(() => {
    loadPermissions();
  }, []);

  // Load permissions when page changes
  useEffect(() => {
    loadPermissions();
  }, [currentPage, loadPermissions]);

  // Debounced search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (3 seconds)
    const timeout = setTimeout(() => {
      loadPermissions(query, 1);
    }, 3000); // 3 second debounce

    setSearchTimeout(timeout);
  }, [loadPermissions, searchTimeout]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleCreate = async () => {
    if (!formData.permissionName.trim()) {
      toast.error("Permission name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPostAuth<any>("/api/permissions", formData);

      // Handle both wrapped and unwrapped response formats
      if ((result as any)?.data || (result as any)?.success) {
        toast.success("Permission created successfully");
        setIsCreateOpen(false);
        resetForm();
        loadPermissions();
      } else {
        toast.error("Failed to create permission");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = async (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditOpen(true);
    setIsLoadingPermission(true);

    try {
      const result = await apiGet<Permission>(`/api/permissions/${permission.permissionId}`);
      
      if (result.success && result.data) {
        const permissionData = result.data;
        setFormData({
          permissionName: permissionData.permissionName,
          description: permissionData.description || "",
        });
        setSelectedPermission(permissionData);
      } else {
        toast.error("Failed to load permission details");
        // Fallback to using the permission from the table
        setFormData({
          permissionName: permission.permissionName,
          description: permission.description || "",
        });
      }
    } catch (error) {
      console.error("Error fetching permission:", error);
      toast.error("Failed to load permission details");
      // Fallback to using the permission from the table
      setFormData({
        permissionName: permission.permissionName,
        description: permission.description || "",
      });
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPermission) return;

    if (!formData.permissionName.trim()) {
      toast.error("Permission name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPut<Permission>(
        `/api/permissions/${selectedPermission.permissionId}`,
        formData
      );

      if (result.success) {
        toast.success("Permission updated successfully");
        setIsEditOpen(false);
        setSelectedPermission(null);
        resetForm();
        loadPermissions();
      } else {
        toast.error(result.error?.message || "Failed to update permission");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;

    setIsSubmitting(true);
    try {
      const result = await apiDelete(`/api/permissions/${selectedPermission.permissionId}`);

      if (result.success) {
        toast.success("Permission deleted successfully");
        setIsDeleteOpen(false);
        setSelectedPermission(null);
        loadPermissions();
      } else {
        toast.error(result.error?.message || "Failed to delete permission");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      permissionName: "",
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
            <p className="font-medium">{permission?.permissionName?.includes(":") ? permission?.permissionName.split(":")[1] : permission?.permissionName}</p>
            <p className="text-sm text-muted-foreground">
              {permission.description}
            </p>
          </div>
        </div>
      ),
      sortable: true,
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
            <DropdownMenuItem onClick={() => openEditDialog(permission)}>
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
        onSearch={handleSearch}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update the permission details.
            </DialogDescription>
          </DialogHeader>
          {isLoadingPermission ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-muted-foreground">Loading permission details...</p>
            </div>
          ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-permissionName">Permission Name *</Label>
              <Input
                id="edit-permissionName"
                placeholder="e.g., View Reports"
                value={formData.permissionName}
                onChange={(e) =>
                  setFormData({ ...formData, permissionName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this permission allows"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedPermission(null);
                resetForm();
              }}
              disabled={isLoadingPermission}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              loading={isSubmitting}
              disabled={isLoadingPermission}
            >
              Save Changes
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







