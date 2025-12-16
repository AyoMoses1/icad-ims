"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { WorkspaceRole } from "@/types";

const roleColors = [
  "#3EADC0",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function RolesPage() {
  const { workspaces, currentWorkspace } = useWorkspaceStore();
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workspaceId: currentWorkspace?.workspaceId || "",
  });

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      setFormData((prev) => ({
        ...prev,
        workspaceId: currentWorkspace.workspaceId,
      }));
    }
  }, [currentWorkspace]);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/roles");
      const result = await response.json();
      if (result.success) {
        setRoles(result.data);
      }
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.workspaceId) {
      toast.error("Name and workspace are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Role created successfully");
        setIsCreateOpen(false);
        resetForm();
        loadRoles();
      } else {
        toast.error(result.error?.message || "Failed to create role");
      }
    } catch (error) {
      toast.error("Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    if (selectedRole.isSystemRole) {
      toast.error("System roles cannot be deleted");
      setIsDeleteOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/roles/${selectedRole.workspaceRoleId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Role deleted successfully");
        setIsDeleteOpen(false);
        setSelectedRole(null);
        loadRoles();
      } else {
        toast.error(result.error?.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error("Failed to delete role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      workspaceId: currentWorkspace?.workspaceId || "",
    });
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock permissions for display
  const getRolePermissions = (roleName: string): string[] => {
    const permissionMap: Record<string, string[]> = {
      Administrator: ["all"],
      Manager: ["view", "create", "edit", "approve"],
      Supervisor: ["view", "create", "edit"],
      Inspector: ["view", "create", "inspect"],
      Analyst: ["view", "analyze", "export"],
      Officer: ["view", "create"],
      Viewer: ["view"],
    };
    return permissionMap[roleName] || ["view"];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Define and manage user roles and permissions"
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Role
          </Button>
        }
      />

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces"
            className="pl-9 bg-muted/50 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredRoles.map((role, index) => (
            <Card
              key={role.workspaceRoleId}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor:
                        roleColors[index % roleColors.length] + "20",
                    }}
                  >
                    <div
                      className="h-6 w-6 rounded border-2"
                      style={{
                        borderColor: roleColors[index % roleColors.length],
                      }}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          setSelectedRole(role);
                          setIsDeleteOpen(true);
                        }}
                        className="text-destructive"
                        disabled={role.isSystemRole}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  {role.isSystemRole && (
                    <Badge variant="outline" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <Users className="h-4 w-4" />
                  <span>3 Users</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {role.description || "No description"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {getRolePermissions(role.name).map((perm) => (
                    <Badge
                      key={perm}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No roles found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first role to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Role
            </Button>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>
              Create a new role to assign to users in a workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace *</Label>
              <Select
                value={formData.workspaceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, workspaceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Editor, Viewer, Manager"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this role can do"
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
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Role"
        description={`Are you sure you want to delete "${selectedRole?.name}"? Users with this role will lose their permissions.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}






