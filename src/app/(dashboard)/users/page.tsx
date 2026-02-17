"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MoreHorizontal,
  Mail,
  UserCheck,
  UserX,
  Filter,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SystemUserDto, SystemUserStatus } from "@/types";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import {
  getAllSystemUsers,
  getSystemUserById,
  activateSystemUser,
  deactivateSystemUser,
} from "@/lib/services/system-user-service";
import { apiGetAuth } from "@/lib/api-client";
import type { UserInfo } from "@/types";

const statusLabels: Record<number, string> = {
  [SystemUserStatus.Active]: "Active",
  [SystemUserStatus.Inactive]: "Inactive",
  [SystemUserStatus.Suspended]: "Suspended",
  [SystemUserStatus.PendingVerification]: "Pending",
  [SystemUserStatus.Locked]: "Locked",
};

const statusVariant: Record<
  number,
  "success" | "warning" | "destructive" | "secondary"
> = {
  [SystemUserStatus.Active]: "success",
  [SystemUserStatus.Inactive]: "secondary",
  [SystemUserStatus.Suspended]: "destructive",
  [SystemUserStatus.PendingVerification]: "warning",
  [SystemUserStatus.Locked]: "destructive",
};

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUserDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<SystemUserDto | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        pageNumber: number;
        pageSize: number;
        query?: string;
        isActive?: boolean;
      } = {
        pageNumber,
        pageSize,
      };
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (activeFilter === "active") params.isActive = true;
      if (activeFilter === "inactive") params.isActive = false;

      const result = await getAllSystemUsers(params);

      if (result.success && result.data) {
        setUsers(result.data.items);
        setTotalCount(result.data.totalCount);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error loading system users:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load users"
      );
      setUsers([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, searchQuery, activeFilter]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setIsAdmin(Boolean(info?.isAdmin));
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageNumber(1);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleActivate = async () => {
    if (!selectedUser || confirmAction !== "activate") return;
    setIsSubmitting(true);
    try {
      const result = await activateSystemUser(selectedUser.id);
      if (result.success) {
        toast.success("User activated successfully");
        setConfirmAction(null);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(
          result.message ||
          result.error?.message ||
          "Failed to activate user"
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to activate user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser || confirmAction !== "deactivate") return;
    setIsSubmitting(true);
    try {
      const result = await deactivateSystemUser(selectedUser.id);
      if (result.success) {
        toast.success("User deactivated successfully");
        setConfirmAction(null);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(
          result.message ||
          result.error?.message ||
          "Failed to deactivate user"
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to deactivate user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActivateConfirm = (user: SystemUserDto) => {
    setSelectedUser(user);
    setConfirmAction("activate");
  };

  const openDeactivateConfirm = (user: SystemUserDto) => {
    setSelectedUser(user);
    setConfirmAction("deactivate");
  };

  const openViewDetails = async (user: SystemUserDto) => {
    setIsViewOpen(true);
    setViewUser(null);
    setIsLoadingView(true);
    try {
      const result = await getSystemUserById(user.id);
      if (result.success && result.data) {
        setViewUser(result.data);
      } else {
        toast.error(result.message || "Failed to load user details");
        setIsViewOpen(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load user details"
      );
      setIsViewOpen(false);
    } finally {
      setIsLoadingView(false);
    }
  };

  const displayName = (user: SystemUserDto) =>
    user.fullName?.trim() ||
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") ||
    user.userName ||
    user.email;

  const columns: DataTableColumn<SystemUserDto>[] = [
    {
      id: "user",
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={undefined} />
            <AvatarFallback>{getInitials(displayName(user))}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{displayName(user)}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <Badge variant={user.isActive ? "success" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant={statusVariant[user.status] ?? "secondary"}>
            {statusLabels[user.status] ?? user.status}
          </Badge>
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
      cell: (user) => (user.createdAt ? formatDate(user.createdAt) : "—"),
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
            <DropdownMenuItem onClick={() => openViewDetails(user)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            {!user.isActive ? (
              <DropdownMenuItem onClick={() => openActivateConfirm(user)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => openDeactivateConfirm(user)}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  if (isAdmin === null) {
    return <LoadingPage message="Checking access..." />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <PageHeader
          title="Users"
          description="View and manage non-admin (system) users."
        />
        <p className="text-muted-foreground">
          You need admin access to view system users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="View and manage non-admin (system) users. Admin users are excluded from this list."
        actions={
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {showFilters ? <X className="ml-2 h-4 w-4" /> : null}
          </Button>
        }
      />

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status</span>
            <Select
              value={activeFilter}
              onValueChange={(v) => {
                setActiveFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DataTable<SystemUserDto>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No system users found"
        emptyDescription="Only non-admin users appear here."
        searchPlaceholder="Search by name or email..."
        getRowId={(row) => row.id}
        pageSize={pageSize}
        totalCount={totalCount}
        currentPage={pageNumber}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />

      <ConfirmDialog
        open={confirmAction === "activate" && !!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setSelectedUser(null);
          }
        }}
        title="Activate user"
        description={
          selectedUser
            ? `Activate ${displayName(selectedUser)}? They will be able to sign in again.`
            : ""
        }
        confirmLabel="Activate"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isSubmitting}
        onConfirm={handleActivate}
      />

      <ConfirmDialog
        open={confirmAction === "deactivate" && !!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setSelectedUser(null);
          }
        }}
        title="Deactivate user"
        description={
          selectedUser
            ? `Deactivate ${displayName(selectedUser)}? They will not be able to sign in until activated again.`
            : ""
        }
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDeactivate}
      />

      {/* View details dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>
          {isLoadingView ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : viewUser ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(displayName(viewUser))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {displayName(viewUser)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewUser.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={viewUser.isActive ? "success" : "secondary"}>
                      {viewUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={statusVariant[viewUser.status] ?? "secondary"}>
                      {statusLabels[viewUser.status] ?? viewUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">{viewUser.userName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewUser.email ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">First name</Label>
                  <p className="font-medium">{viewUser.firstName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Middle name</Label>
                  <p className="font-medium">{viewUser.middleName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Last name</Label>
                  <p className="font-medium">{viewUser.lastName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Date of birth</Label>
                  <p className="font-medium">
                    {viewUser.dateOfBirth
                      ? formatDate(viewUser.dateOfBirth)
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{viewUser.country ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email verified</Label>
                  <p className="font-medium">
                    {viewUser.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Phone verified</Label>
                  <p className="font-medium">
                    {viewUser.phoneVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Two-factor enabled</Label>
                  <p className="font-medium">
                    {viewUser.twoFactorEnabled ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Onboarding complete</Label>
                  <p className="font-medium">
                    {viewUser.isOnboardingComplete ? "Yes" : "No"}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {viewUser.createdAt
                      ? formatDateTime(viewUser.createdAt)
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground">Last updated</Label>
                  <p className="font-medium">
                    {viewUser.updatedAt
                      ? formatDateTime(viewUser.updatedAt)
                      : "—"}
                  </p>
                </div>
                {viewUser.tenantId && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-muted-foreground">Tenant ID</Label>
                    <p className="font-mono text-xs">{viewUser.tenantId}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
