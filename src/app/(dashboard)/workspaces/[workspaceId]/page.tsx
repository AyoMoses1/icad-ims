"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Shield,
  FolderTree,
  Settings,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, LoadingPage } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { Workspace, WorkspaceResource, WorkspaceRole } from "@/types";
import { formatDate } from "@/lib/utils";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { setCurrentWorkspace } = useWorkspaceStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      // Load workspace details
      const [wsResponse, resourcesResponse, rolesResponse] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`),
        fetch(`/api/resources?workspaceId=${workspaceId}`),
        fetch(`/api/roles?workspaceId=${workspaceId}`),
      ]);

      const wsResult = await wsResponse.json();
      const resourcesResult = await resourcesResponse.json();
      const rolesResult = await rolesResponse.json();

      if (wsResult.success) {
        setWorkspace(wsResult.data);
        setCurrentWorkspace(wsResult.data);
      }
      if (resourcesResult.success) {
        setResources(resourcesResult.data);
      }
      if (rolesResult.success) {
        setRoles(rolesResult.data);
      }
    } catch (error) {
      toast.error("Failed to load workspace data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Workspace not found</h2>
        <p className="text-muted-foreground mb-4">
          The workspace you're looking for doesn't exist.
        </p>
        <Link href="/workspaces">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workspaces">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: workspace.color || "#6366F1" }}
          >
            {workspace.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {workspace.name}
              <Badge variant={workspace.isActive ? "success" : "secondary"}>
                {workspace.isActive ? "Active" : "Inactive"}
              </Badge>
            </h1>
            <p className="text-muted-foreground">{workspace.description}</p>
          </div>
        </div>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active resources in this workspace
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
                <p className="text-xs text-muted-foreground">
                  Configured roles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Users with access
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(workspace.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {formatDate(workspace.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Workspace ID</p>
                  <p className="font-mono text-sm">{workspace.workspaceId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={workspace.isActive ? "success" : "secondary"}>
                    {workspace.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Resources and features available in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No resources configured for this workspace.
                  </p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.resourceId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FolderTree className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{resource.resourceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {resource.description || resource.url}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={resource.isActive ? "success" : "secondary"}
                      >
                        {resource.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Roles configured for this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No roles configured for this workspace.
                  </p>
                ) : (
                  roles.map((role) => (
                    <div
                      key={role.workspaceRoleId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {role.name}
                            {role.isSystemRole && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant={role.isActive ? "success" : "secondary"}>
                        {role.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Users who have access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Member management coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


