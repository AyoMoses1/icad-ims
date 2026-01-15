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
  Settings,
  FolderTree,
  Users,
  Shield,
  ArrowRight,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { Workspace, WorkspaceResource, PaginatedResponse } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();

  const [workspaces, setWorkspacesLocal] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [workspaceResources, setWorkspaceResources] = useState<
    WorkspaceResource[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [resourcesTab, setResourcesTab] = useState<"list" | "add">("list");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    workspaceUrl: "",
    color: "#6366F1",
    isActive: true,
  });

  const [resourceForm, setResourceForm] = useState({
    resourceName: "",
    description: "",
    url: "",
    parentId: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const result = await apiGet<PaginatedResponse<Workspace>>(
        "/api/workspaces?includeInactive=true"
      );
      if (result.success && result.data) {
        const workspacesArray = (result.data.items || []).filter(
          (ws) => !ws.isDeleted
        );
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

  const loadWorkspaceResources = async (workspaceId: string) => {
    try {
      const result = await apiGet<
        WorkspaceResource[] | PaginatedResponse<WorkspaceResource>
      >(`/api/workspaces/${workspaceId}/resources`);
      if (result.success && result.data) {
        const resourcesData = Array.isArray(result.data)
          ? result.data
          : result.data.items || [];
        setWorkspaceResources(resourcesData);
      } else {
        setWorkspaceResources([]);
      }
    } catch (error) {
      console.error("Failed to load workspace resources:", error);
      setWorkspaceResources([]);
    }
  };

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

  const handleAddResource = async () => {
    if (!selectedWorkspace || !resourceForm.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<WorkspaceResource>(
        `/api/workspaces/${selectedWorkspace.workspaceId}/resources`,
        {
          resourceName: resourceForm.resourceName,
          description: resourceForm.description || undefined,
          url: resourceForm.url || undefined,
          parentId: resourceForm.parentId || undefined,
          order: resourceForm.order,
          isActive: resourceForm.isActive,
        }
      );

      if (result.success) {
        toast.success("Resource added successfully");
        setResourceForm({
          resourceName: "",
          description: "",
          url: "",
          parentId: "",
          order: 0,
          isActive: true,
        });
        loadWorkspaceResources(selectedWorkspace.workspaceId);
        // Switch to list tab to show the newly added resource
        setResourcesTab("list");
      } else {
        toast.error(result.error?.message || "Failed to add resource");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add resource"
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
        // Reload the page or update workspace store
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

  const openResourcesDialog = async (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setResourcesTab("list");
    setIsResourcesOpen(true);
    await loadWorkspaceResources(workspace.workspaceId);
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

      {/* Workspaces Table/List */}
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
        <div className="space-y-3">
          {filteredWorkspaces.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No workspaces found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || activeFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first workspace to get started"}
                </p>
                {!searchQuery && activeFilter === "all" && (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workspace
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredWorkspaces.map((workspace) => (
              <Card
                key={workspace.workspaceId}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                        style={{
                          backgroundColor: workspace.color || "#6366F1",
                        }}
                      >
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {workspace.name}
                          </h3>
                          <Badge
                            variant={
                              workspace.isActive ? "default" : "secondary"
                            }
                          >
                            {workspace.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {(workspace as any).code && (
                            <Badge variant="outline">
                              {(workspace as any).code}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {workspace.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Created:{" "}
                            {workspace.createdAt
                              ? formatDate(workspace.createdAt)
                              : "N/A"}
                          </span>
                          {workspace.workspaceUrl && (
                            <span className="truncate max-w-xs">
                              URL: {workspace.workspaceUrl}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(workspace)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openResourcesDialog(workspace)}
                        >
                          <FolderTree className="mr-2 h-4 w-4" />
                          Manage Resources
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
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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

      {/* Manage Resources Dialog */}
      <Dialog open={isResourcesOpen} onOpenChange={setIsResourcesOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Manage Resources - {selectedWorkspace?.name}
            </DialogTitle>
            <DialogDescription>
              Add and manage resources for this workspace
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={resourcesTab}
            onValueChange={(v) => setResourcesTab(v as "list" | "add")}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="list">Resources</TabsTrigger>
              <TabsTrigger value="add">Add Resource</TabsTrigger>
            </TabsList>
            <TabsContent
              value="list"
              className="space-y-4 max-h-[400px] overflow-y-auto"
            >
              {workspaceResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resources configured for this workspace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workspaceResources.map((resource) => (
                    <div
                      key={resource.resourceId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{resource.resourceName}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">
                            {resource.description}
                          </p>
                        )}
                        {resource.url && (
                          <p className="text-xs text-muted-foreground">
                            {resource.url}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={resource.isActive ? "default" : "secondary"}
                      >
                        {resource.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceName">Resource Name *</Label>
                  <Input
                    id="resourceName"
                    placeholder="Enter resource name"
                    value={resourceForm.resourceName}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        resourceName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceDescription">Description</Label>
                  <Textarea
                    id="resourceDescription"
                    placeholder="Enter resource description"
                    value={resourceForm.description}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceUrl">URL</Label>
                  <Input
                    id="resourceUrl"
                    placeholder="/api/resource or full URL"
                    value={resourceForm.url}
                    onChange={(e) =>
                      setResourceForm({ ...resourceForm, url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentResource">Parent Resource</Label>
                  <Select
                    value={resourceForm.parentId || undefined}
                    onValueChange={(value) =>
                      setResourceForm({
                        ...resourceForm,
                        parentId: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top level)</SelectItem>
                      {workspaceResources.map((resource) => (
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="resourceIsActive"
                    checked={resourceForm.isActive}
                    onChange={(e) =>
                      setResourceForm({
                        ...resourceForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="resourceIsActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
              <Button
                onClick={handleAddResource}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Adding..." : "Add Resource"}
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResourcesOpen(false)}>
              Close
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
