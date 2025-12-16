"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Shield, FolderTree } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import { WorkspaceRole, WorkspaceResource } from "@/types";

export default function RoleResourcesPage() {
  const { workspaces } = useWorkspaceStore();
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, resourcesRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/resources"),
      ]);

      const rolesData = await rolesRes.json();
      const resourcesData = await resourcesRes.json();

      if (rolesData.success) setRoles(rolesData.data);
      if (resourcesData.success) setResources(resourcesData.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Resources Management"
        description="Assign resources to roles"
      />

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pl-9 bg-muted/50 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role.workspaceRoleId}
                    onClick={() => setSelectedRole(role.workspaceRoleId)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRole === role.workspaceRoleId
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                      {role.isSystemRole && (
                        <Badge variant="outline">System</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a role to manage its resources
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.resourceId}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Checkbox id={resource.resourceId} />
                    <label
                      htmlFor={resource.resourceId}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">{resource.resourceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.url}
                      </p>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






