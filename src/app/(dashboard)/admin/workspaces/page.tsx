"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Building,
  ArrowRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { Workspace, PaginatedResponse } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const { setWorkspaces } = useWorkspaceStore();

  const [workspaces, setWorkspacesLocal] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    workspaceUrl: "",
    color: "#6366F1",
    isActive: true,
  });

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const result = await apiGet<Workspace[] | PaginatedResponse<Workspace>>(
        "/api/workspaces?includeInactive=true"
      );
      if (result.success && result.data) {
        // API may return data as a direct array or as { items: Workspace[] }
        const rawList = Array.isArray(result.data)
          ? result.data
          : (result.data as PaginatedResponse<Workspace>).items || [];
        const workspacesArray = rawList.filter((ws) => !ws.isDeleted);
        setWorkspacesLocal(workspacesArray);
        setWorkspaces(workspacesArray);
      } else {
        setWorkspacesLocal([]);
        setWorkspaces([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load workspaces"
      );
      setWorkspacesLocal([]);
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<Workspace>("/api/workspaces", {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        workspaceUrl: formData.workspaceUrl || undefined,
        color: formData.color || undefined,
        isActive: formData.isActive,
      });

      if (result.success) {
        toast.success("Workspace created successfully");
        setIsCreateOpen(false);
        resetForm();
        loadWorkspaces();
      } else {
        toast.error(result.error?.message || "Failed to create workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWorkspace || !formData.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPut<Workspace>(
        `/api/workspaces/${selectedWorkspace.workspaceId}`,
        {
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description || undefined,
          workspaceUrl: formData.workspaceUrl || undefined,
          color: formData.color || undefined,
          isActive: formData.isActive,
        }
      );

      if (result.success) {
        toast.success("Workspace updated successfully");
        setIsEditOpen(false);
        setSelectedWorkspace(null);
        resetForm();
        loadWorkspaces();
      } else {
        toast.error(result.error?.message || "Failed to update workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update workspace"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkspace) return;

    setIsSubmitting(true);
    try {
      const result = await apiDelete(
        `/api/workspaces/${selectedWorkspace.workspaceId}`
      );

      if (result.success) {
        toast.success("Workspace deleted successfully");
        setIsDeleteOpen(false);
        setSelectedWorkspace(null);
        loadWorkspaces();
      } else {
        toast.error(result.error?.message || "Failed to delete workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      const result = await apiPost<any>(
        `/api/workspaces/${workspaceId}/switch`,
        {}
      );

      if (result.success) {
        toast.success("Workspace switched successfully");
        window.location.reload();
      } else {
        toast.error(result.error?.message || "Failed to switch workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to switch workspace"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      workspaceUrl: "",
      color: "#6366F1",
      isActive: true,
    });
  };

  const openEditDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description || "",
      code: (workspace as any).code || "",
      workspaceUrl: workspace.workspaceUrl || "",
      color: workspace.color || "#6366F1",
      isActive: workspace.isActive,
    });
    setIsEditOpen(true);
  };

  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws as any).code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && ws.isActive) ||
      (activeFilter === "inactive" && !ws.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Management"
        description="Create, update, and manage all workspaces in the system"
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces by name, description, or code..."
            className="pl-9 bg-muted/50 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(v: any) => setActiveFilter(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workspaces</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={loadWorkspaces}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Workspaces Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No workspaces found</p>
                      <p className="text-sm">
                        {searchQuery || activeFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Create your first workspace to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkspaces.map((workspace) => (
                  <TableRow key={workspace.workspaceId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            backgroundColor: workspace.color || "#6366F1",
                          }}
                        >
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{workspace.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1 max-w-[200px] text-muted-foreground">
                        {workspace.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(workspace as any).code ? (
                        <Badge variant="outline">
                          {(workspace as any).code}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={workspace.isActive ? "default" : "secondary"}
                      >
                        {workspace.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {workspace.createdAt
                        ? formatDate(workspace.createdAt)
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/admin/workspaces/${workspace.workspaceId}`
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(workspace)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleSwitchWorkspace(workspace.workspaceId)
                            }
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Switch to Workspace
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedWorkspace(workspace);
                              setIsDeleteOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                placeholder="Enter workspace name"
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
                placeholder="Enter workspace description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="Enter workspace code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceUrl">Workspace URL</Label>
              <Input
                id="workspaceUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.workspaceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, workspaceUrl: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
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
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update workspace details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workspace Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter workspace name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter workspace description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  placeholder="Enter workspace code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-workspaceUrl">Workspace URL</Label>
              <Input
                id="edit-workspaceUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.workspaceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, workspaceUrl: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${selectedWorkspace?.name}"? This action cannot be undone and will affect all users in this workspace.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
