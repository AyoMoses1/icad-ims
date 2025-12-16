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
  Plus,
  Trash2,
  MoreHorizontal,
  Search,
  UserPlus,
  Key,
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, LoadingPage, ConfirmDialog } from "@/components/shared";
import { useWorkspaceStore } from "@/store";
import {
  Workspace,
  WorkspaceResource,
  WorkspaceRole,
  WorkspaceMember,
  MemberType,
  User,
  PaginatedResponse,
  UserStatus,
} from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { setCurrentWorkspace } = useWorkspaceStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [menu, setMenu] = useState<WorkspaceResource[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAssignPermissionsOpen, setIsAssignPermissionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  const [selectedResource, setSelectedResource] =
    useState<WorkspaceResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    description: "",
    code: "",
    color: "#6366F1",
    isActive: true,
  });
  const [memberForm, setMemberForm] = useState({
    userId: "",
    type: "MEMBER" as MemberType,
    status: true,
  });
  const [resourceForm, setResourceForm] = useState({
    resourceName: "",
    description: "",
    url: "",
    icon: "FolderTree",
    parentId: "",
    order: 0,
    isActive: true,
  });
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
      loadAllUsers();
      loadAllPermissions();
    }
  }, [workspaceId]);

  // Enrich members with user data when allUsers becomes available
  useEffect(() => {
    if (members.length > 0 && allUsers.length > 0) {
      // Check if any members need enrichment (have user.id but no user.firstName)
      const needsEnrichment = members.some(
        (member) => member.user?.id && !member.user?.firstName
      );

      if (!needsEnrichment) {
        return; // All members already have user data
      }

      const enrichedMembers = members.map((member) => {
        // If member already has complete user data, keep it
        if (member.user && member.user.firstName) {
          return member;
        }

        // If member has user.id but incomplete user data, look it up
        if (member.user?.id) {
          const foundUser = allUsers.find((u) => u.id === member.user?.id);
          if (foundUser) {
            return {
              ...member,
              user: foundUser,
            };
          }
        }

        // If userId is null (like Owner), keep member as-is without user
        return member;
      });

      setMembers(enrichedMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers.length]); // Only depend on allUsers.length to avoid infinite loops

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [wsResult, resourcesResult, rolesResult, membersResult] =
        await Promise.all([
          apiGet<Workspace>(`/api/workspaces/${workspaceId}`),
          // Backend returns array directly, but handle PaginatedResponse for compatibility
          apiGet<WorkspaceResource[] | PaginatedResponse<WorkspaceResource>>(
            `/api/workspaces/${workspaceId}/resources`
          ),
          apiGet<WorkspaceRole[] | PaginatedResponse<WorkspaceRole>>(
            `/api/workspaces/${workspaceId}/roles`
          ),
          apiGet<WorkspaceMember[] | PaginatedResponse<WorkspaceMember>>(
            `/api/workspaces/${workspaceId}/members`
          ),
        ]);

      if (wsResult.success && wsResult.data) {
        setWorkspace(wsResult.data);
        setCurrentWorkspace(wsResult.data);
        setWorkspaceForm({
          name: wsResult.data.name,
          description: wsResult.data.description || "",
          code: (wsResult.data as any).code || "",
          color: wsResult.data.color || "#6366F1",
          isActive: wsResult.data.isActive,
        });
      }
      if (resourcesResult.success && resourcesResult.data) {
        // Handle both direct array and PaginatedResponse formats
        const resourcesData = Array.isArray(resourcesResult.data)
          ? resourcesResult.data
          : resourcesResult.data.items || [];

        if (process.env.NODE_ENV === "development") {
          console.log("Resources response structure:", {
            isArray: Array.isArray(resourcesResult.data),
            hasItems:
              !Array.isArray(resourcesResult.data) &&
              resourcesResult.data.items,
            count: resourcesData.length,
          });
        }

        setResources(resourcesData);
      } else {
        setResources([]);
      }
      if (rolesResult.success && rolesResult.data) {
        // Handle both direct array and PaginatedResponse formats
        const rawRolesData = Array.isArray(rolesResult.data)
          ? rolesResult.data
          : rolesResult.data.items || [];

        // Transform roles to match expected structure
        // API may return roleDescription instead of name
        const rolesData: WorkspaceRole[] = rawRolesData.map((role: any) => ({
          ...role,
          name:
            role.name ||
            role.roleDescription ||
            role.roleName ||
            "Unnamed Role",
          description: role.description || role.roleDescription || "",
        }));

        if (process.env.NODE_ENV === "development") {
          console.log("Roles response structure:", {
            isArray: Array.isArray(rolesResult.data),
            hasItems:
              !Array.isArray(rolesResult.data) && rolesResult.data.items,
            count: rolesData.length,
            sample: rolesData.length > 0 ? rolesData[0] : null,
          });
        }

        setRoles(rolesData);
      } else {
        setRoles([]);
      }
      if (membersResult.success && membersResult.data) {
        // Handle both direct array and PaginatedResponse formats
        const membersData = Array.isArray(membersResult.data)
          ? membersResult.data
          : membersResult.data.items || [];

        // Debug: Log the actual structure received
        if (process.env.NODE_ENV === "development") {
          console.log("Members response structure:", {
            isArray: Array.isArray(membersResult.data),
            hasItems:
              !Array.isArray(membersResult.data) && membersResult.data.items,
            count: membersData.length,
            sample: membersData.length > 0 ? membersData[0] : null,
          });
        }

        // Transform the response to WorkspaceMember format
        // The API might return User objects directly or flattened WorkspaceMember objects
        // If only userId is provided, look up user details from allUsers
        const transformedMembers: WorkspaceMember[] = membersData.map(
          (item: any) => {
            // If it already has workspaceMemberId and user property, it's already a WorkspaceMember
            if (item.workspaceMemberId && item.user) {
              return item as WorkspaceMember;
            }

            // Get user details - either from item or from allUsers lookup
            let userData: User | undefined = undefined;

            // If user data is already in the response (flattened structure)
            if (
              item.email ||
              item.firstName ||
              (item.id && !item.workspaceMemberId)
            ) {
              userData = {
                id: item.userId || item.id || "",
                username: item.userName || item.username || "",
                email: item.email || "",
                phoneNumber: item.phoneNumber || "",
                firstName: item.firstName || "",
                middleName: item.middleName,
                lastName: item.lastName || "",
                dateOfBirth: item.dateOfBirth,
                country: item.country || "",
                status:
                  typeof item.status === "string"
                    ? (item.status as UserStatus)
                    : UserStatus.ACTIVE,
                emailVerified: item.emailVerified || false,
                phoneVerified: item.phoneVerified || false,
                twoFactorEnabled: item.twoFactorEnabled || false,
                createdAt: item.createdAt || "",
                updatedAt: item.updatedAt || "",
                avatarUrl: item.avatarUrl,
              };
            }
            // If only userId is provided, try to look up from allUsers
            // If allUsers not loaded yet, create minimal user object with just id for later enrichment
            else if (item.userId) {
              const foundUser = allUsers.find((u) => u.id === item.userId);
              if (foundUser) {
                userData = foundUser;
              } else {
                // Create minimal user object with just id - will be enriched later
                userData = {
                  id: item.userId,
                  username: "",
                  email: "",
                  phoneNumber: "",
                  firstName: "",
                  lastName: "",
                  country: "",
                  status: UserStatus.ACTIVE,
                  emailVerified: false,
                  phoneVerified: false,
                  twoFactorEnabled: false,
                  createdAt: "",
                  updatedAt: "",
                };
              }
            }

            // Build the WorkspaceMember object
            if (item.workspaceMemberId) {
              return {
                workspaceMemberId: item.workspaceMemberId,
                workspaceId: item.workspaceId || workspaceId,
                tenantId: item.tenantId || "",
                type:
                  (item.type === "Owner"
                    ? "OWNER"
                    : item.type === "Member"
                      ? "MEMBER"
                      : (item.type as MemberType)) || "MEMBER",
                status: item.status !== undefined ? item.status : true,
                createdBy: item.createdBy || "",
                createdAt: item.createdAt || "",
                user: userData,
              };
            }

            // If it's just a User object (has id, email, firstName, etc. but no workspaceMemberId)
            // Wrap it in a WorkspaceMember structure
            if (item.id && (item.email || item.firstName)) {
              return {
                workspaceMemberId: item.workspaceMemberId || item.id,
                workspaceId: workspaceId,
                tenantId: item.tenantId || "",
                type: (item.type as MemberType) || "MEMBER",
                status:
                  item.status !== undefined
                    ? typeof item.status === "boolean"
                      ? item.status
                      : true
                    : true,
                createdBy: item.createdBy || "",
                createdAt: item.createdAt || item.dateCreated || "",
                user: userData,
              };
            }

            // Fallback: return as-is if structure is unknown
            return item;
          }
        );

        if (process.env.NODE_ENV === "development") {
          console.log("Transformed members:", transformedMembers.length);
          if (transformedMembers.length > 0) {
            console.log("Sample transformed member:", transformedMembers[0]);
          }
        }

        setMembers(transformedMembers);
      } else {
        setMembers([]);
      }
    } catch (error) {
      toast.error("Failed to load workspace data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const result = await apiGet<User[] | PaginatedResponse<User>>(
        "/api/users"
      );
      if (result.success && result.data) {
        // Handle both direct array and PaginatedResponse formats
        const usersData = Array.isArray(result.data)
          ? result.data
          : result.data.items || [];
        setAllUsers(usersData);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users", error);
      setAllUsers([]);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const result = await apiGet<PaginatedResponse<any>>("/api/permissions");
      if (result.success && result.data) {
        // Extract the items array from the paginated response
        setAllPermissions(result.data.items || []);
      } else {
        setAllPermissions([]);
      }
    } catch (error) {
      console.error("Failed to load permissions", error);
      setAllPermissions([]);
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!workspaceForm.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPut<Workspace>(
        `/api/workspaces/${workspaceId}`,
        workspaceForm
      );

      if (result.success) {
        toast.success("Workspace updated successfully");
        setIsEditWorkspaceOpen(false);
        loadWorkspaceData();
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

  const handleAddMember = async () => {
    if (!memberForm.userId) {
      toast.error("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<WorkspaceMember>(
        `/api/workspaces/${workspaceId}/members`,
        memberForm
      );

      if (result.success) {
        toast.success("Member added successfully");
        setIsAddMemberOpen(false);
        setMemberForm({
          userId: "",
          type: "MEMBER" as MemberType,
          status: true,
        });
        loadWorkspaceData();
      } else {
        toast.error(result.error?.message || "Failed to add member");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRoles = async () => {
    if (selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      // Assign each role individually since the endpoint accepts one workspaceRoleId at a time
      const results = await Promise.all(
        selectedRoleIds.map((workspaceRoleId) =>
          apiPost<any>(
            `/api/workspaces/${workspaceId}/members/${selectedMember.workspaceMemberId}/roles`,
            { workspaceRoleId }
          )
        )
      );

      // Check if all assignments were successful
      const allSuccessful = results.every((result) => result.success);
      if (allSuccessful) {
        toast.success("Roles assigned successfully");
        setIsAssignRolesOpen(false);
        setSelectedRoleIds([]);
        setSelectedMember(null);
        loadWorkspaceData();
      } else {
        const failedResults = results.filter((result) => !result.success);
        const errorMessage =
          failedResults[0]?.error?.message || "Failed to assign some roles";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign roles"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<WorkspaceResource>(
        `/api/workspaces/${workspaceId}/resources`,
        {
          ...resourceForm,
          parentId: resourceForm.parentId || undefined,
        }
      );

      if (result.success) {
        toast.success("Resource created successfully");
        setIsAddResourceOpen(false);
        setResourceForm({
          resourceName: "",
          description: "",
          url: "",
          icon: "FolderTree",
          parentId: "",
          order: 0,
          isActive: true,
        });
        loadWorkspaceData();
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

  const handleAddRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (!roleForm.description.trim()) {
      toast.error("Role description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<WorkspaceRole>(
        `/api/workspaces/${workspaceId}/roles`,
        {
          name: roleForm.name,
          roleDescription: roleForm.description,
          isActive: roleForm.isActive,
        }
      );

      if (result.success) {
        toast.success("Role created successfully");
        setIsAddRoleOpen(false);
        setRoleForm({ name: "", description: "", isActive: true });
        loadWorkspaceData();
      } else {
        toast.error(result.error?.message || "Failed to create role");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create role"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedResource || selectedPermissionIds.length === 0) {
      toast.error("Please select a resource and at least one permission");
      return;
    }

    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const result = await apiPost<any>(
        `/api/workspaces/${workspaceId}/roles/${selectedRole.workspaceRoleId}/permissions`,
        {
          resourceId: selectedResource.resourceId,
          permissionIds: selectedPermissionIds,
        }
      );

      if (result.success) {
        toast.success("Permissions assigned successfully");
        setIsAssignPermissionsOpen(false);
        setSelectedPermissionIds([]);
        setSelectedResource(null);
        setSelectedRole(null);
        loadWorkspaceData();
      } else {
        toast.error(result.error?.message || "Failed to assign permissions");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign permissions"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsSubmitting(true);
    try {
      const result = await apiDelete(`/api/workspaces/${workspaceId}`);

      if (result.success) {
        toast.success("Workspace deleted successfully");
        router.push("/workspaces");
      } else {
        toast.error(result.error?.message || "Failed to delete workspace");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      );
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const user = member.user;
    if (!user) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredResources = resources.filter((resource) =>
    resource.resourceName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter((role) =>
    role.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Badge variant={workspace.isActive ? "default" : "secondary"}>
                {workspace.isActive ? "Active" : "Inactive"}
              </Badge>
            </h1>
            <p className="text-muted-foreground">{workspace.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditWorkspaceOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
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
                <div className="text-2xl font-bold">{members.length}</div>
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
                  <Badge variant={workspace.isActive ? "default" : "secondary"}>
                    {workspace.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resources</CardTitle>
                  <CardDescription>
                    Resources and features available in this workspace
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddResourceOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchQuery
                      ? "No resources found matching your search."
                      : "No resources configured for this workspace."}
                  </p>
                ) : (
                  filteredResources.map((resource) => (
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
                            {resource.description ||
                              resource.url ||
                              "No description"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={resource.isActive ? "default" : "secondary"}
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

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>
                    Roles configured for this workspace
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddRoleOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {filteredRoles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchQuery
                      ? "No roles found matching your search."
                      : "No roles configured for this workspace."}
                  </p>
                ) : (
                  filteredRoles.map((role) => (
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
                            {role.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setSelectedResource(resources[0] || null);
                            setIsAssignPermissionsOpen(true);
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Assign Permissions
                        </Button>
                        <Badge
                          variant={role.isActive ? "default" : "secondary"}
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    Users who have access to this workspace
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchQuery
                      ? "No members found matching your search."
                      : "No members in this workspace."}
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const user = member.user;
                    const displayName = user
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        user.email ||
                        "Unknown User"
                      : member.type === "OWNER"
                        ? "Workspace Owner"
                        : "Unknown Member";
                    const displayEmail = user?.email || "";

                    return (
                      <div
                        key={member.workspaceMemberId}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback>
                              {user
                                ? getInitials(
                                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                      user.email ||
                                      "U"
                                  )
                                : member.type === "OWNER"
                                  ? "WO"
                                  : "M"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            {displayEmail && (
                              <p className="text-sm text-muted-foreground">
                                {displayEmail}
                              </p>
                            )}
                            {!user && (
                              <p className="text-xs text-muted-foreground">
                                User ID: {member.user?.id || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.type === "ADMIN" || member.type === "OWNER"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.type}
                          </Badge>
                          {user && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsAssignRolesOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Assign Roles
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditWorkspaceOpen} onOpenChange={setIsEditWorkspaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update workspace details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                value={workspaceForm.name}
                onChange={(e) =>
                  setWorkspaceForm({ ...workspaceForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={workspaceForm.description}
                onChange={(e) =>
                  setWorkspaceForm({
                    ...workspaceForm,
                    description: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="Enter workspace code"
                value={workspaceForm.code}
                onChange={(e) =>
                  setWorkspaceForm({ ...workspaceForm, code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="text"
                value={workspaceForm.color}
                onChange={(e) =>
                  setWorkspaceForm({ ...workspaceForm, color: e.target.value })
                }
                placeholder="#6366F1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditWorkspaceOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkspace} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a user to this workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User *</Label>
              <Select
                value={memberForm.userId}
                onValueChange={(value) =>
                  setMemberForm({ ...memberForm, userId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(
                      (user) => !members.some((m) => m.user?.id === user.id)
                    )
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Member Type *</Label>
              <Select
                value={memberForm.type}
                onValueChange={(value) =>
                  setMemberForm({
                    ...memberForm,
                    type: value as MemberType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={isAssignRolesOpen} onOpenChange={setIsAssignRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription>
              Assign roles to {selectedMember?.user?.firstName}{" "}
              {selectedMember?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {roles.map((role) => (
              <div
                key={role.workspaceRoleId}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={role.workspaceRoleId}
                  checked={selectedRoleIds.includes(role.workspaceRoleId)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoleIds([
                        ...selectedRoleIds,
                        role.workspaceRoleId,
                      ]);
                    } else {
                      setSelectedRoleIds(
                        selectedRoleIds.filter(
                          (id) => id !== role.workspaceRoleId
                        )
                      );
                    }
                  }}
                />
                <Label
                  htmlFor={role.workspaceRoleId}
                  className="flex-1 cursor-pointer"
                >
                  {role.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignRolesOpen(false);
                setSelectedRoleIds([]);
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRoles} disabled={isSubmitting}>
              {isSubmitting ? "Assigning..." : "Assign Roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog */}
      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Create a new resource for this workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resourceName">Resource Name *</Label>
              <Input
                id="resourceName"
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
                  {resources.map((resource) => (
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddResourceOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddResource} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Create a new role for this workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description *</Label>
              <Textarea
                id="roleDescription"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog */}
      <Dialog
        open={isAssignPermissionsOpen}
        onOpenChange={setIsAssignPermissionsOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Permissions</DialogTitle>
            <DialogDescription>
              Assign permissions to {selectedRole?.name} for{" "}
              {selectedResource?.resourceName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select
                value={selectedResource?.resourceId || ""}
                onValueChange={(value) => {
                  const resource = resources.find(
                    (r) => r.resourceId === value
                  );
                  setSelectedResource(resource || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
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
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                {allPermissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading permissions...
                  </p>
                ) : (
                  allPermissions.map((permission) => (
                    <div
                      key={permission.permissionId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={permission.permissionId}
                        checked={selectedPermissionIds.includes(
                          permission.permissionId
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissionIds([
                              ...selectedPermissionIds,
                              permission.permissionId,
                            ]);
                          } else {
                            setSelectedPermissionIds(
                              selectedPermissionIds.filter(
                                (id) => id !== permission.permissionId
                              )
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={permission.permissionId}
                        className="cursor-pointer flex-1"
                      >
                        <div>
                          <div className="font-medium">
                            {permission.permissionName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {permission.permissionCode}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignPermissionsOpen(false);
                setSelectedPermissionIds([]);
                setSelectedResource(null);
                setSelectedRole(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions} disabled={isSubmitting}>
              {isSubmitting ? "Assigning..." : "Assign Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDeleteWorkspace}
      />
    </div>
  );
}
