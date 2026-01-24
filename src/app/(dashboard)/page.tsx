"use client";

import { useEffect, useState } from "react";
import { Activity, Building2, ExternalLink } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useWorkspaceStore } from "@/store";
import { getWorkspaces } from "@/lib/services/workspace-service";
import type { Workspace } from "@/types";

export default function DashboardPage() {
  const { token } = useAuthStore();
  const { workspaces: storeWorkspaces } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(true);
  const [workspacesWithUrls, setWorkspacesWithUrls] = useState<Workspace[]>([]);

  useEffect(() => {
    const fetchWorkspacesWithUrls = async () => {
      try {
        // Fetch workspaces from API to get all workspaces
        const response = await getWorkspaces();

        if (response.success && response.data) {
          const apiWorkspaces = Array.isArray(response.data)
            ? response.data
            : response.data.items || [];

          // Filter out deleted workspaces and use all workspaces from API
          const validWorkspaces = apiWorkspaces.filter(
            (ws: Workspace) => !ws.isDeleted
          );

          setWorkspacesWithUrls(validWorkspaces);

          // Also update the store with all workspaces
          const { setWorkspaces } = useWorkspaceStore.getState();
          setWorkspaces(validWorkspaces);
        } else {
          // Fallback to store workspaces if API call fails
          setWorkspacesWithUrls(storeWorkspaces);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces with URLs:", error);
        // Fallback to store workspaces if API call fails
        setWorkspacesWithUrls(storeWorkspaces);
      } finally {
        setIsLoading(false);
      }
    };

    // Always fetch from API to get all workspaces
    fetchWorkspacesWithUrls();
  }, []);

  /**
   * Gets application URL for workspace
   * Uses workspaceUrl from workspace if available, otherwise falls back to localhost:3001
   * Temporary: Redirects "Waste Management" workspace to localhost:3002
   */
  const getApplicationUrl = (workspace: Workspace): string => {
    if (!token) {
      return `/workspaces/${workspace.workspaceId}`;
    }

    // Temporary: Redirect Waste Management workspace to localhost:3002
    if (workspace.name?.toLowerCase() === "waste management") {
      return `http://localhost:3002?token=${encodeURIComponent(token)}`;
    }

    // Use workspaceUrl from workspace if available
    const workspaceUrl = workspace.workspaceUrl || "http://localhost:3001";
    return `${workspaceUrl}?token=${encodeURIComponent(token)}`;
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    if (!token) {
      return;
    }

    const url = getApplicationUrl(workspace);

    // Navigate to the application URL
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Workspaces Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Workspaces</h2>
            <p className="text-muted-foreground">
              Select a workspace to access its dashboard
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                </CardContent>
              </Card>
            ))
          ) : workspacesWithUrls && workspacesWithUrls.length > 0 ? (
            workspacesWithUrls.map((workspace) => (
              <Card
                key={workspace.workspaceId}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: workspace.color || "#3EADC0" }}
                    >
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {workspace.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={workspace.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {workspace.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Click to open
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workspaces found</h3>
              <p className="text-muted-foreground">
                You don't have access to any workspaces yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
