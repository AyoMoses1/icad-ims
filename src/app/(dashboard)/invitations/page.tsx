"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  LoadingSpinner,
  EmptyState,
} from "@/components/shared";
import {
  InvitationDto,
  InvitationStatus,
  CreateInvitationRequestDto,
} from "@/types";
import { formatDate } from "@/lib/utils";
import {
  getInvitations,
  getMyInvitations,
  createInvitation,
  acceptInvitation,
  declineInvitation,
  deleteInvitation,
} from "@/lib/services/invitation-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiGet } from "@/lib/api-client";
import { getWorkspaces } from "@/lib/services/workspace-service";
import type { WorkspaceRole, Workspace } from "@/types";

const statusConfig: Record<
  InvitationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  [InvitationStatus.Pending]: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  [InvitationStatus.Accepted]: {
    label: "Accepted",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [InvitationStatus.Declined]: {
    label: "Declined",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  [InvitationStatus.Expired]: {
    label: "Expired",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<InvitationDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);

  // Tab state - "received" or "sent"
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<CreateInvitationRequestDto>({
    email: "",
    roleId: null,
    workspaceIds: null,
    message: null,
  });

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      // Get roles from the current workspace
      // You might need to adjust this based on your workspace context
      const result = await apiGet<any[]>("/api/workspaces");
      if (result.success && result.data) {
        const workspacesData = Array.isArray(result.data) ? result.data : [];
        if (workspacesData.length > 0) {
          const workspaceId = workspacesData[0].workspaceId;
          const rolesResult = await apiGet<WorkspaceRole[]>(
            `/api/workspaces/${workspaceId}/roles`
          );
          if (rolesResult.success && rolesResult.data) {
            const rolesData = Array.isArray(rolesResult.data)
              ? rolesResult.data
              : [];
            setRoles(rolesData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    try {
      const result = await getWorkspaces({ includeInactive: false });
      if (result.success && result.data) {
        // Handle both array and paginated response
        let workspacesList: Workspace[] = [];
        if (Array.isArray(result.data)) {
          workspacesList = result.data;
        } else if (result.data.items) {
          workspacesList = result.data.items;
        }
        setWorkspaces(workspacesList);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const loadInvitations = useCallback(
    async (
      status?: InvitationStatus | "all",
      email?: string,
      page?: number
    ) => {
      setIsLoading(true);
      try {
        if (activeTab === "received") {
          // Load invitations addressed to me
          const result = await getMyInvitations();

          if (result.success && result.data) {
            let invitationsList = Array.isArray(result.data)
              ? result.data
              : [result.data];

            // Apply filters client-side for received invitations
            if (status && status !== "all") {
              invitationsList = invitationsList.filter(
                (inv) => inv.status === status
              );
            }

            if (email) {
              invitationsList = invitationsList.filter((inv) =>
                inv.email?.toLowerCase().includes(email.toLowerCase())
              );
            }

            // Apply pagination
            const startIndex =
              ((page !== undefined ? page : currentPage) - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedInvitations = invitationsList.slice(
              startIndex,
              endIndex
            );

            setInvitations(paginatedInvitations);
            setTotalCount(invitationsList.length);
          } else {
            toast.error(result.error?.message || "Failed to load invitations");
            setInvitations([]);
            setTotalCount(0);
          }
        } else {
          // Load invitations I've sent out
          const filters: {
            status?: InvitationStatus;
            email?: string;
            pageNumber?: number;
            pageSize?: number;
          } = {
            pageNumber: page !== undefined ? page : currentPage,
            pageSize,
          };

          if (status && status !== "all") {
            filters.status = status;
          }

          if (email) {
            filters.email = email;
          }

          const result = await getInvitations(filters);

          if (result.success && result.data) {
            setInvitations(result.data.items || []);
            setTotalCount(result.data.totalCount || 0);
          } else {
            toast.error(result.error?.message || "Failed to load invitations");
            setInvitations([]);
            setTotalCount(0);
          }
        }
      } catch (error) {
        console.error("Error loading invitations:", error);
        toast.error("Failed to load invitations");
        setInvitations([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, currentPage, pageSize]
  );

  useEffect(() => {
    loadRoles();
    loadWorkspaces();
    // Reset to page 1 when tab changes
    setCurrentPage(1);
    loadInvitations(statusFilter, searchQuery, 1);
  }, [activeTab]); // Reload when tab changes

  useEffect(() => {
    loadInvitations(statusFilter, searchQuery, currentPage);
  }, [currentPage, statusFilter, searchQuery, loadInvitations]);

  const handleCreate = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Include selected workspace IDs in the request
      const invitationData: CreateInvitationRequestDto = {
        ...formData,
        workspaceIds: selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : null,
      };
      
      const result = await createInvitation(invitationData);

      if (result.success && result.data) {
        toast.success("Invitation sent successfully");
        setIsCreateOpen(false);
        resetForm();
        loadInvitations(statusFilter, searchQuery, currentPage);
      } else {
        toast.error(
          result.error?.message ||
            "Failed to send invitation. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedInvitation) return;

    if (!selectedInvitation.invitationToken) {
      toast.error("Invitation token is missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await acceptInvitation({
        invitationToken: selectedInvitation.invitationToken,
      });

      if (result.success) {
        toast.success("Invitation accepted successfully");
        setIsAcceptOpen(false);
        setSelectedInvitation(null);
        loadInvitations(statusFilter, searchQuery, currentPage);

        // Dispatch event to refresh tenant list in header
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tenantListRefresh"));
        }

        // Optionally reload the page to refresh tenant context
        router.refresh();
      } else {
        toast.error(
          result.error?.message ||
            "Failed to accept invitation. Please try again."
        );
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedInvitation) return;

    setIsSubmitting(true);
    try {
      const result = await declineInvitation(selectedInvitation.invitationId);

      if (result.success) {
        toast.success("Invitation declined");
        setIsDeclineOpen(false);
        setSelectedInvitation(null);
        loadInvitations(statusFilter, searchQuery, currentPage);
      } else {
        toast.error(
          result.error?.message ||
            "Failed to decline invitation. Please try again."
        );
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvitation) return;

    setIsSubmitting(true);
    try {
      const result = await deleteInvitation(selectedInvitation.invitationId);

      if (result.success) {
        toast.success("Invitation deleted successfully");
        setIsDeleteOpen(false);
        setSelectedInvitation(null);
        loadInvitations(statusFilter, searchQuery, currentPage);
      } else {
        toast.error(
          result.error?.message ||
            "Failed to delete invitation. Please try again."
        );
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      roleId: null,
      workspaceIds: null,
      message: null,
    });
    setSelectedWorkspaceIds([]);
  };

  const handleWorkspaceToggle = (workspaceId: string) => {
    setSelectedWorkspaceIds((prev) => {
      if (prev.includes(workspaceId)) {
        return prev.filter((id) => id !== workspaceId);
      } else {
        return [...prev, workspaceId];
      }
    });
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const columns: DataTableColumn<InvitationDto>[] = useMemo(() => [
    {
      id: "email",
      header: "Email",
      cell: (invitation) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{invitation.email}</p>
            {invitation.tenantName && (
              <p className="text-sm text-muted-foreground">
                {invitation.tenantName}
              </p>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "role",
      header: "Role",
      cell: (invitation) => (
        <span className="text-sm">{invitation.roleName || "Default Role"}</span>
      ),
    },
    {
      id: "workspaces",
      header: "Workspaces",
      cell: (invitation) => {
        if (!invitation.workspaceIds || invitation.workspaceIds.length === 0) {
          return <span className="text-sm text-muted-foreground">All workspaces</span>;
        }
        // Find workspace names by IDs
        const workspaceNames = invitation.workspaceIds
          .map((id) => {
            const workspace = workspaces.find((w) => w.workspaceId === id);
            return workspace?.name || id.substring(0, 8) + "...";
          })
          .join(", ");
        
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {invitation.workspaceIds.length} workspace{invitation.workspaceIds.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={workspaceNames}>
              {workspaceNames}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (invitation) => getStatusBadge(invitation.status),
    },
    {
      id: "invitedBy",
      header: "Invited By",
      cell: (invitation) => (
        <span className="text-sm">{invitation.invitedByName || "N/A"}</span>
      ),
    },
    {
      id: "expiresAt",
      header: "Expires",
      cell: (invitation) => (
        <span className="text-sm">{formatDate(invitation.expiresAt)}</span>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (invitation) => {
        // Show different actions based on tab
        if (activeTab === "received") {
          // Received invitations: Accept/Decline
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {invitation.status === InvitationStatus.Pending && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedInvitation(invitation);
                        setIsAcceptOpen(true);
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedInvitation(invitation);
                        setIsDeclineOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </DropdownMenuItem>
                  </>
                )}
                {invitation.invitationLink && (
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(invitation.invitationLink!);
                      toast.success("Invitation link copied to clipboard");
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        } else {
          // Sent invitations: Delete
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedInvitation(invitation);
                    setIsDeleteOpen(true);
                  }}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
                {invitation.invitationLink && (
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(invitation.invitationLink!);
                      toast.success("Invitation link copied to clipboard");
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      },
      className: "w-12",
    },
  ], [workspaces]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Manage user invitations to your organization"
        actions={
          activeTab === "sent" ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          ) : null
        }
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "received" | "sent")}
      >
        <TabsList>
          <TabsTrigger value="received">
            <Mail className="mr-2 h-4 w-4" />
            Received Invitations
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Mail className="mr-2 h-4 w-4" />
            Sent Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadInvitations(statusFilter, searchQuery, 1);
                    setCurrentPage(1);
                  }
                }}
                className="max-w-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InvitationStatus | "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={InvitationStatus.Pending}>
                  Pending
                </SelectItem>
                <SelectItem value={InvitationStatus.Accepted}>
                  Accepted
                </SelectItem>
                <SelectItem value={InvitationStatus.Declined}>
                  Declined
                </SelectItem>
                <SelectItem value={InvitationStatus.Expired}>
                  Expired
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={invitations}
            isLoading={isLoading}
            emptyMessage="No invitations received"
            emptyDescription="You don't have any pending invitations."
            getRowId={(row) => row.invitationId}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadInvitations(statusFilter, searchQuery, 1);
                    setCurrentPage(1);
                  }
                }}
                className="max-w-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InvitationStatus | "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={InvitationStatus.Pending}>
                  Pending
                </SelectItem>
                <SelectItem value={InvitationStatus.Accepted}>
                  Accepted
                </SelectItem>
                <SelectItem value={InvitationStatus.Declined}>
                  Declined
                </SelectItem>
                <SelectItem value={InvitationStatus.Expired}>
                  Expired
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={invitations}
            isLoading={isLoading}
            emptyMessage="No invitations sent"
            emptyDescription="Get started by inviting your first user."
            getRowId={(row) => row.invitationId}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (open) {
            // Load workspaces when dialog opens
            loadWorkspaces();
          } else {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They will receive an
              email with instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaces">Workspaces (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Select workspaces to grant access to. If none selected, user will have access to all workspaces.
              </p>
              {isLoadingWorkspaces ? (
                <LoadingSpinner size="sm" />
              ) : (
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  {workspaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No workspaces available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {workspaces.map((workspace) => (
                        <div
                          key={workspace.workspaceId}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`workspace-${workspace.workspaceId}`}
                            checked={selectedWorkspaceIds.includes(workspace.workspaceId)}
                            onCheckedChange={() =>
                              handleWorkspaceToggle(workspace.workspaceId)
                            }
                          />
                          <label
                            htmlFor={`workspace-${workspace.workspaceId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex flex-col">
                              <span>{workspace.name}</span>
                              {workspace.description && (
                                <span className="text-xs text-muted-foreground">
                                  {workspace.description}
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
              {selectedWorkspaceIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedWorkspaceIds.length} workspace{selectedWorkspaceIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Default Role (Optional)</Label>
              {isLoadingRoles ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Select
                  value={formData.roleId || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      roleId: value === "none" ? null : value || null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default role</SelectItem>
                    {roles.map((role) => (
                      <SelectItem
                        key={role.workspaceRoleId}
                        value={role.workspaceRoleId}
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={formData.message || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    message: e.target.value || null,
                  })
                }
                rows={3}
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
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation */}
      <ConfirmDialog
        open={isAcceptOpen}
        onOpenChange={setIsAcceptOpen}
        title="Accept Invitation"
        description={`Are you sure you want to accept the invitation to join "${selectedInvitation?.tenantName}"?`}
        confirmLabel="Accept"
        variant="default"
        isLoading={isSubmitting}
        onConfirm={handleAccept}
      />

      {/* Decline Confirmation */}
      <ConfirmDialog
        open={isDeclineOpen}
        onOpenChange={setIsDeclineOpen}
        title="Decline Invitation"
        description={`Are you sure you want to decline the invitation from "${selectedInvitation?.tenantName}"?`}
        confirmLabel="Decline"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDecline}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Invitation"
        description={`Are you sure you want to delete the invitation sent to "${selectedInvitation?.email}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}


