"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  FolderTree,
  Globe,
  Code,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { Workspace, WorkspaceResource, PaginatedResponse } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Interface for resource with depth info for flat rendering
interface FlattenedResource extends WorkspaceResource {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export default function WorkspaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResourcesLoading, setIsResourcesLoading] = useState(true);

  // Dialog States
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isDeleteResourceOpen, setIsDeleteResourceOpen] = useState(false);

  const [selectedResource, setSelectedResource] =
    useState<WorkspaceResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded state for tree nodes
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set()
  );

  // Forms
  const [workspaceForm, setWorkspaceForm] = useState({
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

  const [resourceMode, setResourceMode] = useState<"create" | "edit">("create");

  const loadWorkspace = useCallback(async () => {
    try {
      const result = await apiGet<Workspace>(`/api/workspaces/${workspaceId}`);
      if (result.success && result.data) {
        setWorkspace(result.data);
        setWorkspaceForm({
          name: result.data.name,
          description: result.data.description || "",
          code: (result.data as any).code || "",
          workspaceUrl: result.data.workspaceUrl || "",
          color: result.data.color || "#6366F1",
          isActive: result.data.isActive,
        });
      } else {
        toast.error("Failed to load workspace details");
        router.push("/admin/workspaces");
      }
    } catch (error) {
      toast.error("Failed to load workspace details");
      router.push("/admin/workspaces");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, router]);

  const loadResources = useCallback(async () => {
    setIsResourcesLoading(true);
    try {
      const result = await apiGet<
        WorkspaceResource[] | PaginatedResponse<WorkspaceResource>
      >(`/api/workspaces/${workspaceId}/resources`);

      if (result.success && result.data) {
        const resourcesData = Array.isArray(result.data)
          ? result.data
          : result.data.items || [];
        setResources(resourcesData);
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error("Failed to load resources:", error);
      toast.error("Failed to load workspace resources");
    } finally {
      setIsResourcesLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
      loadResources();
    }
  }, [workspaceId, loadWorkspace, loadResources]);

  // Flatten tree for table rendering while respecting expanded state
  const flattenedResources = useMemo(() => {
    const flatList: FlattenedResource[] = [];

    // Recursive function to flatten the tree
    const flatten = (nodes: WorkspaceResource[], depth: number) => {
      // Sort nodes by order before processing
      const sortedNodes = [...nodes].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );

      sortedNodes.forEach((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedResources.has(node.resourceId);

        flatList.push({
          ...node,
          depth,
          hasChildren: !!hasChildren,
          isExpanded,
        });

        if (hasChildren && isExpanded && node.children) {
          flatten(node.children, depth + 1);
        }
      });
    };

    flatten(resources, 0);
    return flatList;
  }, [resources, expandedResources]);

  // Flatten all resources for the parent selector dropdown
  const allResourcesFlat = useMemo(() => {
    const flat: WorkspaceResource[] = [];
    const flatten = (nodes: WorkspaceResource[]) => {
      nodes.forEach((node) => {
        flat.push(node);
        if (node.children) {
          flatten(node.children);
        }
      });
    };
    flatten(resources);
    return flat;
  }, [resources]);

  // Map for quick lookup of resource names by ID
  const resourceNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allResourcesFlat.forEach((r) => map.set(r.resourceId, r.resourceName));
    return map;
  }, [allResourcesFlat]);

  const toggleExpand = (resourceId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceId)) {
      newExpanded.delete(resourceId);
    } else {
      newExpanded.add(resourceId);
    }
    setExpandedResources(newExpanded);
  };

  const handleUpdateWorkspace = async () => {
    if (!workspaceForm.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPut<Workspace>(`/api/workspaces/${workspaceId}`, {
        name: workspaceForm.name,
        code: workspaceForm.code || undefined,
        description: workspaceForm.description || undefined,
        workspaceUrl: workspaceForm.workspaceUrl || undefined,
        color: workspaceForm.color || undefined,
        isActive: workspaceForm.isActive,
      });

      if (result.success && result.data) {
        toast.success("Workspace updated successfully");
        setWorkspace(result.data);
        setIsEditWorkspaceOpen(false);
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

  const handleCreateResource = async () => {
    if (!resourceForm.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        resourceName: resourceForm.resourceName,
        description: resourceForm.description || undefined,
        url: resourceForm.url || undefined,
        parentId: resourceForm.parentId || undefined,
        order: Number(resourceForm.order),
        isActive: resourceForm.isActive,
      };

      const result = await apiPost<WorkspaceResource>(
        `/api/workspaces/${workspaceId}/resources`,
        payload
      );

      if (result.success) {
        toast.success("Resource created successfully");
        setIsResourceDialogOpen(false);
        resetResourceForm();
        loadResources();
      } else {
        toast.error(result.error?.message || "Failed to create resource");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create resource"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateResource = async () => {
    if (!selectedResource || !resourceForm.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        resourceName: resourceForm.resourceName,
        description: resourceForm.description || undefined,
        url: resourceForm.url || undefined,
        parentId: resourceForm.parentId || undefined,
        order: Number(resourceForm.order),
        isActive: resourceForm.isActive,
      };

      const result = await apiPut<WorkspaceResource>(
        `/api/workspaces/${workspaceId}/resources/${selectedResource.resourceId}`,
        payload
      );

      if (result.success) {
        toast.success("Resource updated successfully");
        setIsResourceDialogOpen(false);
        setSelectedResource(null);
        resetResourceForm();
        loadResources();
      } else {
        toast.error(result.error?.message || "Failed to update resource");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update resource"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedResource) return;

    setIsSubmitting(true);
    try {
      const result = await apiDelete(
        `/api/workspaces/${workspaceId}/resources/${selectedResource.resourceId}`
      );

      if (result.success) {
        toast.success("Resource deleted successfully");
        setIsDeleteResourceOpen(false);
        setSelectedResource(null);
        loadResources();
      } else {
        toast.error(result.error?.message || "Failed to delete resource");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete resource"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetResourceForm = () => {
    setResourceForm({
      resourceName: "",
      description: "",
      url: "",
      parentId: "",
      order: 0,
      isActive: true,
    });
  };

  const openCreateResourceDialog = (parentId?: string) => {
    setResourceMode("create");
    resetResourceForm();
    if (parentId) {
      setResourceForm((prev) => ({ ...prev, parentId }));
    }
    setIsResourceDialogOpen(true);
  };

  const openEditResourceDialog = (resource: WorkspaceResource) => {
    setResourceMode("edit");
    setSelectedResource(resource);
    setResourceForm({
      resourceName: resource.resourceName,
      description: resource.description || "",
      url: resource.url || "",
      parentId: resource.parentId || "",
      order: resource.order || 0,
      isActive: resource.isActive,
    });
    setIsResourceDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!workspace) {
    return null; // Should redirect in useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit pl-0 hover:bg-transparent"
          onClick={() => router.push("/admin/workspaces")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspaces
        </Button>
        <PageHeader
          title={workspace.name}
          description={
            workspace.description || "Manage workspace details and resources"
          }
          actions={
            <Button onClick={() => setIsEditWorkspaceOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Workspace
            </Button>
          }
        />
      </div>

      {/* Workspace Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Workspace Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: workspace.color || "#6366F1" }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  {workspace.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span>{workspace.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Code
                </p>
                <p>{(workspace as any).code || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">URL</p>
                {workspace.workspaceUrl ? (
                  <a
                    href={workspace.workspaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {workspace.workspaceUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p>N/A</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created At
                </p>
                <p>{formatDate(workspace.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p>{formatDate(workspace.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Resources
          </CardTitle>
          <Button onClick={() => openCreateResourceDialog()} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent>
          {isResourcesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flattenedResources.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No resources found for this workspace
                    </TableCell>
                  </TableRow>
                ) : (
                  flattenedResources.map((resource) => (
                    <TableRow key={resource.resourceId}>
                      <TableCell>
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${resource.depth * 20}px` }}
                        >
                          {resource.hasChildren ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-muted shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(resource.resourceId);
                              }}
                            >
                              {resource.isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          ) : (
                            <div className="w-6 h-6 shrink-0" />
                          )}
                          <span className="font-medium">
                            {resource.resourceName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {resource.description || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs">
                        {resource.url || "-"}
                      </TableCell>
                      <TableCell>{resource.order}</TableCell>
                      <TableCell>
                        <Badge
                          variant={resource.isActive ? "default" : "secondary"}
                        >
                          {resource.isActive ? "Active" : "Active"}
                        </Badge>
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
                              onClick={() => openEditResourceDialog(resource)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openCreateResourceDialog(resource.resourceId)
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Child Resource
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedResource(resource);
                                setIsDeleteResourceOpen(true);
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
          )}
        </CardContent>
      </Card>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditWorkspaceOpen} onOpenChange={setIsEditWorkspaceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update workspace details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name *</Label>
              <Input
                id="ws-name"
                value={workspaceForm.name}
                onChange={(e) =>
                  setWorkspaceForm({ ...workspaceForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-description">Description</Label>
              <Textarea
                id="ws-description"
                value={workspaceForm.description}
                onChange={(e) =>
                  setWorkspaceForm({
                    ...workspaceForm,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ws-code">Code</Label>
                <Input
                  id="ws-code"
                  value={workspaceForm.code}
                  onChange={(e) =>
                    setWorkspaceForm({ ...workspaceForm, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-color">Color</Label>
                <Input
                  id="ws-color"
                  type="color"
                  value={workspaceForm.color}
                  onChange={(e) =>
                    setWorkspaceForm({
                      ...workspaceForm,
                      color: e.target.value,
                    })
                  }
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-url">Workspace URL</Label>
              <Input
                id="ws-url"
                value={workspaceForm.workspaceUrl}
                onChange={(e) =>
                  setWorkspaceForm({
                    ...workspaceForm,
                    workspaceUrl: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ws-active"
                checked={workspaceForm.isActive}
                onChange={(e) =>
                  setWorkspaceForm({
                    ...workspaceForm,
                    isActive: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="ws-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditWorkspaceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateWorkspace}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog (Create/Edit) */}
      <Dialog
        open={isResourceDialogOpen}
        onOpenChange={setIsResourceDialogOpen}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {resourceMode === "create" ? "Add Resource" : "Edit Resource"}
            </DialogTitle>
            <DialogDescription>
              {resourceMode === "create"
                ? "Add a new resource to this workspace"
                : "Update existing resource details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="res-name">Resource Name *</Label>
              <Input
                id="res-name"
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
              <Label htmlFor="res-description">Description</Label>
              <Textarea
                id="res-description"
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
              <Label htmlFor="res-url">URL</Label>
              <Input
                id="res-url"
                value={resourceForm.url}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, url: e.target.value })
                }
                placeholder="/api/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="res-parent">Parent Resource</Label>
                <Select
                  value={resourceForm.parentId || "none"}
                  onValueChange={(value) =>
                    setResourceForm({
                      ...resourceForm,
                      parentId: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="res-parent">
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {allResourcesFlat
                      .filter(
                        (r) => r.resourceId !== selectedResource?.resourceId
                      )
                      .map((r) => {
                        const parentName = r.parentId
                          ? resourceNameMap.get(r.parentId)
                          : null;
                        return (
                          <SelectItem key={r.resourceId} value={r.resourceId}>
                            {r.resourceName}
                            {parentName && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                (Parent: {parentName})
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-order">Order</Label>
                <Input
                  id="res-order"
                  type="number"
                  value={resourceForm.order}
                  onChange={(e) =>
                    setResourceForm({
                      ...resourceForm,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="res-active"
                checked={resourceForm.isActive}
                onChange={(e) =>
                  setResourceForm({
                    ...resourceForm,
                    isActive: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="res-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResourceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={
                resourceMode === "create"
                  ? handleCreateResource
                  : handleUpdateResource
              }
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting
                ? "Saving..."
                : resourceMode === "create"
                  ? "Add Resource"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation */}
      <ConfirmDialog
        open={isDeleteResourceOpen}
        onOpenChange={setIsDeleteResourceOpen}
        title="Delete Resource"
        description={`Are you sure you want to delete "${selectedResource?.resourceName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDeleteResource}
      />
    </div>
  );
}
