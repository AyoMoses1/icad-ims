"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderTree,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import {
  WorkspaceResourceTreeDto,
  UserInfo,
} from "@/types";
import { useWorkspaceStore } from "@/store";
import { apiGetAuth } from "@/lib/api-client";
import {
  getWorkspaceResources,
  createWorkspaceResource,
  updateWorkspaceResource,
  deleteWorkspaceResource,
} from "@/lib/services/workspace-resource-service";

interface ResourceTreeNode extends WorkspaceResourceTreeDto {
  children?: ResourceTreeNode[];
  expanded?: boolean;
}

export default function AdminResourcesPage() {
  const { workspaces, currentWorkspace } = useWorkspaceStore();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [resources, setResources] = useState<ResourceTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceTreeNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [resourceMode, setResourceMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    resourceName: "",
    description: "",
    url: "",
    parentId: "",
    order: 0,
    isActive: true,
  });

  // Check if user is SuperAdmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setUserInfo(info);
        // SuperAdmin check: email contains @rdlc.com
        const isSuper = info.email?.includes("@rdlc.com") || false;
        setIsSuperAdmin(isSuper);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    checkSuperAdmin();
  }, []);

  // Set default workspace
  useEffect(() => {
    if (currentWorkspace?.workspaceId && !selectedWorkspaceId) {
      setSelectedWorkspaceId(currentWorkspace.workspaceId);
    } else if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].workspaceId);
    }
  }, [currentWorkspace, workspaces, selectedWorkspaceId]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadResources();
    }
  }, [selectedWorkspaceId]);

  const loadResources = async () => {
    if (!selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      const result = await getWorkspaceResources(selectedWorkspaceId);

      if (result.success && result.data) {
        // Build tree structure
        const tree = buildResourceTree(result.data);
        setResources(tree);
      } else {
        toast.error(result.message || "Failed to load resources");
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load workspace resources"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const buildResourceTree = (
    resources: WorkspaceResourceTreeDto[]
  ): ResourceTreeNode[] => {
    // Resources already come in tree structure from API
    return resources.map((resource) => ({
      ...resource,
      expanded: false,
      children: resource.children
        ? buildResourceTree(resource.children)
        : undefined,
    }));
  };

  const toggleExpand = (resourceId: string, resources: ResourceTreeNode[]): ResourceTreeNode[] => {
    return resources.map((resource) => {
      if (resource.resourceId === resourceId) {
        return { ...resource, expanded: !resource.expanded };
      }
      if (resource.children) {
        return {
          ...resource,
          children: toggleExpand(resourceId, resource.children),
        };
      }
      return resource;
    });
  };

  const handleExpand = (resourceId: string) => {
    setResources((prev) => toggleExpand(resourceId, prev));
  };

  const resetForm = () => {
    setFormData({
      resourceName: "",
      description: "",
      url: "",
      parentId: "",
      order: 0,
      isActive: true,
    });
  };

  const handleCreate = (parentId?: string) => {
    setResourceMode("create");
    setSelectedResource(null);
    resetForm();
    if (parentId) {
      setFormData((prev) => ({ ...prev, parentId }));
    }
    setIsDialogOpen(true);
  };

  const handleEdit = (resource: ResourceTreeNode) => {
    setResourceMode("edit");
    setSelectedResource(resource);
    setFormData({
      resourceName: resource.resourceName || "",
      description: resource.description || "",
      url: resource.url || "",
      parentId: resource.parentId || "",
      order: resource.order || 0,
      isActive: resource.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (resource: ResourceTreeNode) => {
    setSelectedResource(resource);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedWorkspaceId) return;
    if (!formData.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (resourceMode === "create") {
        const result = await createWorkspaceResource(selectedWorkspaceId, {
          resourceName: formData.resourceName,
          description: formData.description || null,
          url: formData.url || null,
          parentId: formData.parentId || null,
          order: Number(formData.order) || 0,
          isActive: formData.isActive,
        });

        if (result.success) {
          toast.success("Resource created successfully");
          setIsDialogOpen(false);
          resetForm();
          loadResources();
        } else {
          toast.error(result.message || "Failed to create resource");
        }
      } else {
        if (!selectedResource) return;
        const result = await updateWorkspaceResource(
          selectedWorkspaceId,
          selectedResource.resourceId,
          {
            resourceName: formData.resourceName || null,
            description: formData.description || null,
            url: formData.url || null,
            parentId: formData.parentId || null,
            order: Number(formData.order) || 0,
            isActive: formData.isActive,
          }
        );

        if (result.success) {
          toast.success("Resource updated successfully");
          setIsDialogOpen(false);
          setSelectedResource(null);
          loadResources();
        } else {
          toast.error(result.message || "Failed to update resource");
        }
      }
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${resourceMode} resource`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedResource || !selectedWorkspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await deleteWorkspaceResource(
        selectedWorkspaceId,
        selectedResource.resourceId
      );

      if (result.success) {
        toast.success("Resource deleted successfully");
        setIsDeleteOpen(false);
        setSelectedResource(null);
        loadResources();
      } else {
        toast.error(result.message || "Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete resource"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderResourceTree = (
    resources: ResourceTreeNode[],
    level: number = 0
  ) => {
    return resources.map((resource) => {
      const hasChildren = resource.children && resource.children.length > 0;
      const isExpanded = resource.expanded || false;

      return (
        <div key={resource.resourceId}>
          <div
            className={`flex items-center gap-2 p-2 hover:bg-muted rounded ${
              level > 0 ? "ml-4" : ""
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleExpand(resource.resourceId)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              {hasChildren ? (
                <Folder className="h-4 w-4 text-muted-foreground" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{resource.resourceName || "Unnamed"}</span>
              <Badge variant="outline" className="text-xs">
                {resource.url || "—"}
              </Badge>
              {resource.order !== undefined && resource.order !== null && (
                <span className="text-xs text-muted-foreground ml-2">
                  Order: {resource.order}
                </span>
              )}
            </div>
            {isSuperAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(resource)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreate(resource.resourceId)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(resource)}
                    disabled={hasChildren}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                    {hasChildren && " (has children)"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderResourceTree(resource.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getAllResourcesFlat = (
    resources: ResourceTreeNode[],
    flat: ResourceTreeNode[] = []
  ): ResourceTreeNode[] => {
    resources.forEach((resource) => {
      flat.push(resource);
      if (resource.children) {
        getAllResourcesFlat(resource.children, flat);
      }
    });
    return flat;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Resources"
        description="Manage workspace resources and permissions. Only SuperAdmin users can update or delete resources."
        actions={
          isSuperAdmin && selectedWorkspaceId ? (
            <Button onClick={() => handleCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          ) : undefined
        }
      />

      {/* Workspace Selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="workspace-select">Workspace:</Label>
        <Select
          value={selectedWorkspaceId}
          onValueChange={setSelectedWorkspaceId}
        >
          <SelectTrigger id="workspace-select" className="w-[300px]">
            <SelectValue placeholder="Select a workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.workspaceId} value={workspace.workspaceId}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources Tree */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No resources found for this workspace</p>
          {isSuperAdmin && (
            <Button variant="outline" className="mt-4" onClick={() => handleCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="space-y-1">
            {renderResourceTree(resources)}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {resourceMode === "create" ? "Add Workspace Resource" : "Edit Workspace Resource"}
            </DialogTitle>
            <DialogDescription>
              {resourceMode === "create"
                ? "Add a new resource to this workspace."
                : "Update the resource details. Resources with children cannot be deleted."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resourceName">Resource Name *</Label>
              <Input
                id="resourceName"
                value={formData.resourceName}
                onChange={(e) =>
                  setFormData({ ...formData, resourceName: e.target.value })
                }
                placeholder="e.g., Dashboard"
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
                placeholder="Description of the resource"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL Path</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="e.g., /dashboard"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Resource</Label>
                <Select
                  value={formData.parentId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="None (Root Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Level)</SelectItem>
                    {selectedWorkspaceId &&
                      getAllResourcesFlat(resources)
                        .filter(
                          (r) =>
                            // In edit mode, prevent selecting self or children as parent
                            resourceMode === "create" ||
                            (r.resourceId !== selectedResource?.resourceId &&
                              !r.resourceId.includes(
                                selectedResource?.resourceId || ""
                              ))
                        )
                        .map((resource) => (
                          <SelectItem
                            key={resource.resourceId}
                            value={resource.resourceId}
                          >
                            {resource.resourceName || "Unnamed"}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isActive: checked === true,
                  })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : resourceMode === "create"
                ? "Add Resource"
                : "Update Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Workspace Resource"
        description={
          selectedResource
            ? `Are you sure you want to delete "${selectedResource.resourceName}"? This action cannot be undone. Resources with children cannot be deleted.`
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
