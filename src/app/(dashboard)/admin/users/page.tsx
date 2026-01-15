"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  ConfirmDialog,
  LoadingPage,
} from "@/components/shared";
import { User, UserWithFullName, UserStatus, UserInfo } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { useWorkspaceStore } from "@/store";
import { apiGetAuth } from "@/lib/api-client";
import {
  getAdminUsers,
  getAdminUserById,
  createAdminUserWithRole,
  updateAdminUser,
  deleteAdminUser,
  activateAdminUser,
  deactivateAdminUser,
  type WorkspaceRoleAssignment,
} from "@/lib/services/admin-user-service";
import { getAllAdminRoles } from "@/lib/services/admin-role-service";
import { AdminRoleDto } from "@/types";

const statusColors: Record<
  UserStatus,
  "success" | "warning" | "destructive" | "secondary"
> = {
  [UserStatus.ACTIVE]: "success",
  [UserStatus.PENDING]: "warning",
  [UserStatus.INACTIVE]: "secondary",
  [UserStatus.SUSPENDED]: "destructive",
  [UserStatus.DELETED]: "destructive",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [users, setUsers] = useState<UserWithFullName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateWithRoleOpen, setIsCreateWithRoleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithFullName | null>(
    null
  );
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [formDataWithRole, setFormDataWithRole] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    wcoId: "",
    workspaceRoles: [] as Array<{
      workspaceId: string;
      roleIds: string[];
      availableRoles: AdminRoleDto[];
    }>,
  });
  const [workspaceRolesMap, setWorkspaceRolesMap] = useState<
    Record<string, AdminRoleDto[]>
  >({});
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "",
    stateOrProvince: "",
    countryId: "",
  });

  // Fetch userinfo and determine workspace ID
  useEffect(() => {
    const fetchUserInfoAndWorkspace = async () => {
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setUserInfo(info);

        // Determine workspace ID to use
        let targetWorkspaceId: string | null = null;

        // First, try to use current workspace if available
        if (currentWorkspace?.workspaceId) {
          targetWorkspaceId = currentWorkspace.workspaceId;
        } else if (
          info.adminDetails?.adminWorkspaces &&
          info.adminDetails.adminWorkspaces.length > 0
        ) {
          // If no current workspace, use the first admin workspace
          targetWorkspaceId = info.adminDetails.adminWorkspaces[0].workspaceId;

          // Optionally set it in the workspace store
          const { workspaces } = useWorkspaceStore.getState();
          const adminWorkspace = workspaces.find(
            (w) => w.workspaceId === targetWorkspaceId
          );
          if (adminWorkspace) {
            setCurrentWorkspace(adminWorkspace);
          } else {
            // Create a workspace object from admin workspace info
            const adminWsInfo = info.adminDetails.adminWorkspaces[0];
            const newWorkspace = {
              workspaceId: adminWsInfo.workspaceId,
              name: adminWsInfo.workspaceName,
              description: "",
              isActive: true,
              isDeleted: false,
              color: undefined,
              createdBy: "",
              createdAt: "",
              updatedAt: "",
            };
            setCurrentWorkspace(newWorkspace);
          }
        }

        if (targetWorkspaceId) {
          setWorkspaceId(targetWorkspaceId);
        } else {
          toast.error(
            "No admin workspace available. You need admin access to at least one workspace."
          );
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        toast.error("Failed to load user information");
      }
    };

    fetchUserInfoAndWorkspace();
  }, [currentWorkspace]);

  useEffect(() => {
    if (workspaceId) {
      loadUsers();
    }
  }, [workspaceId, pageNumber, statusFilter, searchQuery]);

  const loadUsers = async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const filters: any = {
        pageNumber,
        pageSize,
      };

      if (searchQuery) {
        filters.query = searchQuery;
      }

      if (statusFilter !== "all") {
        filters.isActive = statusFilter === "active";
      }

      const result = await getAdminUsers(workspaceId, filters);

      if (result.success && result.data) {
        let usersData: User[] = [];
        let paginationData: any = null;

        if (Array.isArray(result.data)) {
          usersData = result.data;
        } else if ((result.data as any)?.items) {
          usersData = (result.data as any).items;
          paginationData = result.data;
        } else {
          usersData = [];
        }

        const usersWithFullName: UserWithFullName[] = usersData.map((user) => ({
          ...user,
          fullName:
            `${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim(),
        }));

        setUsers(usersWithFullName);

        if (paginationData) {
          setTotalPages(paginationData.totalPages || 0);
          setTotalCount(paginationData.totalCount || 0);
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load users. You may not have admin permissions."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWithRole = async () => {
    if (
      !formDataWithRole.email ||
      !formDataWithRole.firstName ||
      !formDataWithRole.lastName
    ) {
      toast.error(
        "Please fill in all required fields (email, first name, last name)"
      );
      return;
    }

    if (formDataWithRole.workspaceRoles.length === 0) {
      toast.error("Please add at least one workspace with roles");
      return;
    }

    // Validate each workspace-role assignment
    for (const wr of formDataWithRole.workspaceRoles) {
      if (!wr.workspaceId) {
        toast.error("Please select a workspace for all assignments");
        return;
      }
      if (!wr.roleIds || wr.roleIds.length === 0) {
        toast.error("Please select at least one role for each workspace");
        return;
      }
    }

    // Check if WCO_EMPLOYEE role is assigned and validate wcoId
    const hasWcoRole = formDataWithRole.workspaceRoles.some((wr) => {
      const roles = workspaceRolesMap[wr.workspaceId] || [];
      return wr.roleIds.some((roleId) => {
        const role = roles.find((r) => r.adminRoleId === roleId);
        return role?.roleCode === "WCO_EMPLOYEE";
      });
    });

    if (hasWcoRole && !formDataWithRole.wcoId) {
      toast.error("WCO ID is required when assigning WCO_EMPLOYEE role");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert form data to API format
      const workspaceRoles: WorkspaceRoleAssignment[] =
        formDataWithRole.workspaceRoles.map((wr) => ({
          workspaceId: wr.workspaceId,
          roleIds: wr.roleIds,
        }));

      const result = await createAdminUserWithRole({
        email: formDataWithRole.email,
        firstName: formDataWithRole.firstName,
        lastName: formDataWithRole.lastName,
        phoneNumber: formDataWithRole.phoneNumber || undefined,
        workspaceRoles,
        wcoId: formDataWithRole.wcoId || undefined,
      });

      if (result.success && result.data) {
        toast.success(
          "User created with roles successfully. Password has been sent via email."
        );
        setIsCreateWithRoleOpen(false);
        resetFormWithRole();
        loadUsers();
      } else {
        toast.error(result.error?.message || "Failed to create user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewUser = async (user: UserWithFullName) => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const result = await getAdminUserById(user.id, workspaceId);
      if (result.success && result.data) {
        setViewUser(result.data);
        setIsViewOpen(true);
      } else {
        toast.error("Failed to load user details");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load user details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await updateAdminUser(
        selectedUser.id,
        editFormData,
        workspaceId
      );

      if (result.success) {
        toast.success("User updated successfully");
        setIsEditOpen(false);
        setSelectedUser(null);
        resetEditForm();
        loadUsers();
      } else {
        toast.error(result.error?.message || "Failed to update user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAdminUser(selectedUser.id, workspaceId);

      if (result.success) {
        toast.success("User deleted successfully");
        setIsDeleteOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(result.error?.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (user: UserWithFullName) => {
    if (!workspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await activateAdminUser(user.id, workspaceId);

      if (result.success) {
        toast.success("User activated successfully");
        loadUsers();
      } else {
        toast.error(result.error?.message || "Failed to activate user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to activate user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (user: UserWithFullName) => {
    if (!workspaceId) return;

    setIsSubmitting(true);
    try {
      const result = await deactivateAdminUser(user.id, workspaceId);

      if (result.success) {
        toast.success("User deactivated successfully");
        loadUsers();
      } else {
        toast.error(result.error?.message || "Failed to deactivate user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to deactivate user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: UserWithFullName) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || "",
      address: "",
      city: "",
      stateOrProvince: "",
      countryId: user.country || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: UserWithFullName) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const resetFormWithRole = () => {
    setFormDataWithRole({
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      wcoId: "",
      workspaceRoles: [],
    });
    setWorkspaceRolesMap({});
  };

  const loadRoles = async (targetWorkspaceId: string) => {
    if (workspaceRolesMap[targetWorkspaceId]) {
      return; // Already loaded
    }

    setIsLoadingRoles(true);
    try {
      const result = await getAllAdminRoles(targetWorkspaceId);
      if (result.success && result.data) {
        // Map the API response to handle both workspaceRoleId and adminRoleId
        const mappedRoles = result.data.map((role: any) => ({
          ...role,
          adminRoleId: role.workspaceRoleId || role.adminRoleId,
          description: role.roleDescription || role.description,
        }));
        setWorkspaceRolesMap((prev) => ({
          ...prev,
          [targetWorkspaceId]: mappedRoles,
        }));
      } else {
        toast.error(result.message || "Failed to load roles");
        setWorkspaceRolesMap((prev) => ({
          ...prev,
          [targetWorkspaceId]: [],
        }));
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error("Failed to load roles");
      setWorkspaceRolesMap((prev) => ({
        ...prev,
        [targetWorkspaceId]: [],
      }));
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleOpenCreateWithRoleDialog = async () => {
    // Load roles for all available workspaces
    const workspaces =
      userInfo?.adminDetails?.adminWorkspaces || currentWorkspace
        ? [
            {
              workspaceId: currentWorkspace!.workspaceId,
              workspaceName: currentWorkspace!.name,
            },
          ]
        : [];

    for (const ws of workspaces) {
      await loadRoles(ws.workspaceId);
    }

    setIsCreateWithRoleOpen(true);
  };

  const addWorkspaceRole = () => {
    setFormDataWithRole((prev) => ({
      ...prev,
      workspaceRoles: [
        ...prev.workspaceRoles,
        {
          workspaceId: "",
          roleIds: [],
          availableRoles: [],
        },
      ],
    }));
  };

  const removeWorkspaceRole = (index: number) => {
    setFormDataWithRole((prev) => ({
      ...prev,
      workspaceRoles: prev.workspaceRoles.filter((_, i) => i !== index),
    }));
  };

  const updateWorkspaceRole = (
    index: number,
    updates: Partial<{
      workspaceId: string;
      roleIds: string[];
    }>
  ) => {
    setFormDataWithRole((prev) => {
      const updated = [...prev.workspaceRoles];
      updated[index] = {
        ...updated[index],
        ...updates,
        availableRoles:
          updates.workspaceId && workspaceRolesMap[updates.workspaceId]
            ? workspaceRolesMap[updates.workspaceId]
            : updated[index].availableRoles,
      };
      return {
        ...prev,
        workspaceRoles: updated,
      };
    });
  };

  // Load roles when workspace is selected in a workspace-role assignment
  useEffect(() => {
    formDataWithRole.workspaceRoles.forEach((wr, index) => {
      if (wr.workspaceId && !workspaceRolesMap[wr.workspaceId]) {
        loadRoles(wr.workspaceId);
      }
    });
  }, [formDataWithRole.workspaceRoles.map((wr) => wr.workspaceId).join(",")]);

  const resetEditForm = () => {
    setEditFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      city: "",
      stateOrProvince: "",
      countryId: "",
    });
  };

  const columns: DataTableColumn<UserWithFullName>[] = [
    {
      id: "user",
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[user.status]}>{user.status}</Badge>
          {user.emailVerified && (
            <span title="Email verified">
              <Mail className="h-4 w-4 text-green-600" />
            </span>
          )}
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      accessorKey: "createdAt",
      cell: (user) => (user.createdAt ? formatDate(user.createdAt) : "N/A"),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewUser(user)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.status === UserStatus.INACTIVE ||
            user.status === UserStatus.SUSPENDED ? (
              <DropdownMenuItem onClick={() => handleActivate(user)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openDeleteDialog(user)}
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

  // Get workspace name from userInfo or currentWorkspace
  const workspaceName =
    userInfo?.adminDetails?.adminWorkspaces?.find(
      (ws) => ws.workspaceId === workspaceId
    )?.workspaceName ||
    currentWorkspace?.name ||
    "Selected Workspace";

  // Check if we're still loading workspace info
  const isCheckingWorkspace = !workspaceId && !userInfo;

  if (isCheckingWorkspace) {
    return <LoadingPage message="Loading workspace information..." />;
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">No workspace available</p>
          <p className="text-sm text-muted-foreground mt-2">
            You need admin access to at least one workspace to manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`Manage users in ${workspaceName}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" onClick={handleOpenCreateWithRoleDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add User with Role
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setShowFilters(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {totalCount > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {(pageNumber - 1) * pageSize + 1} to{" "}
          {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} users
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found"
        emptyDescription="Get started by adding your first user."
        searchPlaceholder="Search users..."
        getRowId={(row) => row.id}
        pageSize={pageSize}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pageNumber} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(totalPages)}
              disabled={pageNumber === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editFormData.phoneNumber}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phoneNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    address: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editFormData.city}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      city: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State/Province</Label>
                <Input
                  id="edit-state"
                  value={editFormData.stateOrProvince}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      stateOrProvince: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={editFormData.countryId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    countryId: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedUser(null);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} loading={isSubmitting}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User with Role Dialog */}
      <Dialog
        open={isCreateWithRoleOpen}
        onOpenChange={setIsCreateWithRoleOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User with Workspaces and Roles</DialogTitle>
            <DialogDescription>
              Create a new user account and assign roles across multiple
              workspaces. Password will be auto-generated and sent via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="withRole-firstName">First Name *</Label>
                <Input
                  id="withRole-firstName"
                  placeholder="John"
                  value={formDataWithRole.firstName}
                  onChange={(e) =>
                    setFormDataWithRole({
                      ...formDataWithRole,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withRole-lastName">Last Name *</Label>
                <Input
                  id="withRole-lastName"
                  placeholder="Doe"
                  value={formDataWithRole.lastName}
                  onChange={(e) =>
                    setFormDataWithRole({
                      ...formDataWithRole,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withRole-email">Email *</Label>
              <Input
                id="withRole-email"
                type="email"
                placeholder="john@example.com"
                value={formDataWithRole.email}
                onChange={(e) =>
                  setFormDataWithRole({
                    ...formDataWithRole,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withRole-phone">Phone Number</Label>
              <Input
                id="withRole-phone"
                placeholder="+2341234567890"
                value={formDataWithRole.phoneNumber}
                onChange={(e) =>
                  setFormDataWithRole({
                    ...formDataWithRole,
                    phoneNumber: e.target.value,
                  })
                }
              />
            </div>

            {/* Workspace-Role Assignments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Workspace-Role Assignments *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWorkspaceRole}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Workspace
                </Button>
              </div>

              {formDataWithRole.workspaceRoles.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                  No workspace assignments yet. Click "Add Workspace" to get
                  started.
                </div>
              )}

              {formDataWithRole.workspaceRoles.map((wr, index) => {
                const availableRolesForWorkspace =
                  workspaceRolesMap[wr.workspaceId] || [];
                const selectedRoles = wr.roleIds || [];
                const hasWcoRole = selectedRoles.some((roleId) => {
                  const role = availableRolesForWorkspace.find(
                    (r) => r.adminRoleId === roleId
                  );
                  return role?.roleCode === "WCO_EMPLOYEE";
                });

                return (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-4 bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <Label>Assignment {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkspaceRole(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Workspace *</Label>
                      <Select
                        value={wr.workspaceId}
                        onValueChange={(value) => {
                          updateWorkspaceRole(index, {
                            workspaceId: value,
                            roleIds: [], // Clear roles when workspace changes
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {userInfo?.adminDetails?.adminWorkspaces?.map(
                            (ws) => (
                              <SelectItem
                                key={ws.workspaceId}
                                value={ws.workspaceId}
                              >
                                {ws.workspaceName}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {wr.workspaceId && (
                      <div className="space-y-2">
                        <Label>Roles *</Label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (!selectedRoles.includes(value)) {
                              updateWorkspaceRole(index, {
                                roleIds: [...selectedRoles, value],
                              });
                            }
                          }}
                          disabled={
                            isLoadingRoles ||
                            availableRolesForWorkspace.length === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingRoles
                                  ? "Loading roles..."
                                  : availableRolesForWorkspace.length === 0
                                    ? "No roles available"
                                    : "Select roles to add"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRolesForWorkspace
                              .filter(
                                (role) =>
                                  !selectedRoles.includes(role.adminRoleId)
                              )
                              .map((role) => (
                                <SelectItem
                                  key={role.adminRoleId}
                                  value={role.adminRoleId}
                                >
                                  {role.roleName ||
                                    role.roleCode ||
                                    role.adminRoleId}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {selectedRoles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedRoles.map((roleId) => {
                              const role = availableRolesForWorkspace.find(
                                (r) => r.adminRoleId === roleId
                              );
                              return (
                                <Badge
                                  key={roleId}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {role?.roleName || role?.roleCode || roleId}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateWorkspaceRole(index, {
                                        roleIds: selectedRoles.filter(
                                          (id) => id !== roleId
                                        ),
                                      });
                                    }}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* WCO ID - shown if any workspace has WCO_EMPLOYEE role */}
            {formDataWithRole.workspaceRoles.some((wr) => {
              const roles = workspaceRolesMap[wr.workspaceId] || [];
              return wr.roleIds.some((roleId) => {
                const role = roles.find((r) => r.adminRoleId === roleId);
                return role?.roleCode === "WCO_EMPLOYEE";
              });
            }) && (
              <div className="space-y-2">
                <Label htmlFor="withRole-wcoId">WCO ID *</Label>
                <Input
                  id="withRole-wcoId"
                  placeholder="WCO Company ID (UUID)"
                  value={formDataWithRole.wcoId}
                  onChange={(e) =>
                    setFormDataWithRole({
                      ...formDataWithRole,
                      wcoId: e.target.value,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Required when assigning WCO_EMPLOYEE role. The WCO company
                  must exist and be active.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateWithRoleOpen(false);
                resetFormWithRole();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWithRole} loading={isSubmitting}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete information about this user.
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {viewUser.firstName} {viewUser.middleName || ""}{" "}
                    {viewUser.lastName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewUser.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">
                    {(viewUser as any).userName || viewUser.username || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{viewUser.phoneNumber || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={statusColors[viewUser.status]}>
                    {viewUser.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{viewUser.country || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Email Verified
                  </Label>
                  <p className="font-medium">
                    {viewUser.emailVerified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Phone Verified
                  </Label>
                  <p className="font-medium">
                    {viewUser.phoneVerified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">2FA Enabled</Label>
                  <p className="font-medium">
                    {viewUser.twoFactorEnabled ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-600">No</span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">
                    {viewUser.dateOfBirth
                      ? formatDate(viewUser.dateOfBirth)
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">
                    {viewUser.createdAt
                      ? formatDate(viewUser.createdAt)
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">
                    {viewUser.updatedAt
                      ? formatDate(viewUser.updatedAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${selectedUser?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
