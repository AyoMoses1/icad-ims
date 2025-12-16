"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderTree,
  Link as LinkIcon,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  ConfirmDialog,
} from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { WorkspaceResource } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ResourcesPage() {
  const { workspaces, currentWorkspace } = useWorkspaceStore();
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<WorkspaceResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterWorkspace, setFilterWorkspace] = useState<string>("all");

  const [formData, setFormData] = useState({
    resourceName: "",
    description: "",
    url: "",
    icon: "FolderTree",
    workspaceId: currentWorkspace?.workspaceId || "",
  });

  useEffect(() => {
    loadResources();
  }, [filterWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      setFormData((prev) => ({
        ...prev,
        workspaceId: currentWorkspace.workspaceId,
      }));
      setFilterWorkspace(currentWorkspace.workspaceId);
    }
  }, [currentWorkspace]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const url =
        filterWorkspace && filterWorkspace !== "all"
          ? `/api/resources?workspaceId=${filterWorkspace}`
          : "/api/resources";
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setResources(result.data);
      }
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.resourceName.trim() || !formData.workspaceId) {
      toast.error("Name and workspace are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Resource created successfully");
        setIsCreateOpen(false);
        resetForm();
        loadResources();
      } else {
        toast.error(result.error?.message || "Failed to create resource");
      }
    } catch (error) {
      toast.error("Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    setIsSubmitting(true);
    try {
      toast.success("Resource deleted successfully");
      setIsDeleteOpen(false);
      setSelectedResource(null);
      loadResources();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      resourceName: "",
      description: "",
      url: "",
      icon: "FolderTree",
      workspaceId: currentWorkspace?.workspaceId || "",
    });
  };

  const getWorkspaceName = (workspaceId: string) => {
    return (
      workspaces.find((w) => w.workspaceId === workspaceId)?.name || workspaceId
    );
  };

  const columns: DataTableColumn<WorkspaceResource>[] = [
    {
      id: "name",
      header: "Resource",
      cell: (resource) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <FolderTree className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium">{resource.resourceName}</p>
            <p className="text-sm text-muted-foreground">
              {resource.description || "No description"}
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "url",
      header: "URL",
      cell: (resource) =>
        resource.url ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <LinkIcon className="h-3 w-3" />
            {resource.url}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "workspace",
      header: "Workspace",
      cell: (resource) => (
        <Badge variant="secondary">
          {getWorkspaceName(resource.workspaceId)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (resource) => (
        <Badge variant={resource.isActive ? "success" : "secondary"}>
          {resource.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (resource) => formatDate(resource.createdAt),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (resource) => (
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
                setSelectedResource(resource);
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
        title="Resources"
        description="Manage resources and features available in workspaces"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Resource
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map((ws) => (
                <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={resources}
        isLoading={isLoading}
        emptyMessage="No resources found"
        emptyDescription="Create resources to define what users can access."
        searchPlaceholder="Search resources..."
        getRowId={(row) => row.resourceId}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>
              Create a new resource that can be accessed within a workspace.
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
              <Label htmlFor="resourceName">Resource Name *</Label>
              <Input
                id="resourceName"
                placeholder="e.g., User Management, Reports"
                value={formData.resourceName}
                onChange={(e) =>
                  setFormData({ ...formData, resourceName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this resource"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL Path</Label>
              <Input
                id="url"
                placeholder="/dashboard/reports"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
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
              Create Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Resource"
        description={`Are you sure you want to delete "${selectedResource?.resourceName}"? This will remove it from all roles.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}







