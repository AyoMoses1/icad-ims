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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { WorkspaceResourceTreeDto, Workspace, UserInfo } from "@/types";
import { useWorkspaceStore } from "@/store";
import { apiGetAuth } from "@/lib/api-client";
import {
  getWorkspaceResources,
  getWorkspaceResourceById,
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<ResourceTreeNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [formData, setFormData] = useState({
    resourceName: "",
    url: "",
    parentId: "",
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

  const toggleExpand = (
    resourceId: string,
    resources: ResourceTreeNode[]
  ): ResourceTreeNode[] => {
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

  const handleEdit = async (resource: ResourceTreeNode) => {
    try {
      const result = await getWorkspaceResourceById(
        selectedWorkspaceId,
        resource.resourceId
      );
      if (result.success && result.data) {
        // Convert WorkspaceResourceTreeDto to ResourceTreeNode
        const resourceNode: ResourceTreeNode = {
          ...result.data,
          expanded: false,
          children: result.data.children
            ? buildResourceTree(result.data.children)
            : undefined,
        };
        setSelectedResource(resourceNode);
        setFormData({
          resourceName: result.data.resourceName || "",
          url: result.data.url || "",
          parentId: result.data.parentId || "",
          isActive: true, // API doesn't return isActive, assume true for active resources
        });
        setIsEditOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load resource details");
    }
  };

  const handleDelete = (resource: ResourceTreeNode) => {
    setSelectedResource(resource);
    setIsDeleteOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedResource || !selectedWorkspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await updateWorkspaceResource(
        selectedWorkspaceId,
        selectedResource.resourceId,
        {
          resourceName: formData.resourceName || null,
          url: formData.url || null,
          parentId: formData.parentId || null,
          isActive: formData.isActive,
        }
      );

      if (result.success) {
        toast.success("Resource updated successfully");
        setIsEditOpen(false);
        setSelectedResource(null);
        loadResources();
      } else {
        toast.error(result.message || "Failed to update resource");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update resource"
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
        error instanceof Error ? error.message : "Failed to delete resource"
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
              <span className="font-medium">
                {resource.resourceName || "Unnamed"}
              </span>
              <Badge variant="outline" className="text-xs">
                {resource.url || "—"}
              </Badge>
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
              <SelectItem
                key={workspace.workspaceId}
                value={workspace.workspaceId}
              >
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
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="space-y-1">{renderResourceTree(resources)}</div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workspace Resource</DialogTitle>
            <DialogDescription>
              Update the resource details. Resources with children cannot be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resourceName">Resource Name</Label>
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
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Resource</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Root Level)</SelectItem>
                  {selectedWorkspaceId &&
                    getAllResourcesFlat(resources)
                      .filter(
                        (r) =>
                          r.resourceId !== selectedResource?.resourceId &&
                          !r.resourceId.includes(
                            selectedResource?.resourceId || ""
                          )
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
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Resource"}
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
