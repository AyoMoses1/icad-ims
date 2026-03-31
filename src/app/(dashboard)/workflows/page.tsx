"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  GitBranch,
  ListTodo,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  ConfirmDialog,
  LoadingSpinner,
} from "@/components/shared";
import { useWorkspaceStore, useAuthStore } from "@/store";
import type {
  WorkflowTypeDto,
  WorkflowTypeDetailDto,
  WorkflowDto,
  WorkflowDetailDto,
  WorkflowActivityDto,
  WorkflowStageDto,
  WorkflowStageAssigneeDto,
  AdminRoleListItemDto,
  UserInfo,
} from "@/types";
import { apiGetAuth } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import {
  getWorkflowTypes,
  getWorkflowTypeById,
  createWorkflowType,
  updateWorkflowType,
  deleteWorkflowType,
  addStage,
  updateStage,
  addStageAssignee,
  removeStageAssignee,
  getWorkflows,
  getWorkflowsAssignableToMe,
  getWorkflowById,
  approveWorkflow,
  rejectWorkflow,
  returnWorkflow,
  cancelWorkflow,
  claimWorkflow,
  unclaimWorkflow,
  getWorkflowActivities,
} from "@/lib/services/workflow-service";
import { getAllAdminRoles } from "@/lib/services/admin-role-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Layers } from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "destructive",
  Cancelled: "secondary",
};

function isSuperAdmin(userInfo: UserInfo | null): boolean {
  return (
    userInfo?.isAdmin === true &&
    userInfo?.isInOwnTenant === true &&
    userInfo?.adminDetails?.isSystemAdmin === true
  );
}

export default function WorkflowsPage() {
  const searchParams = useSearchParams();
  const queryWorkspaceId = searchParams?.get("workspaceId") ?? null;
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { token } = useAuthStore();
  const [workspaceId, setWorkspaceId] = useState(() =>
    queryWorkspaceId ||
    currentWorkspace?.workspaceId ||
    workspaces[0]?.workspaceId ||
    ""
  );

  const [activeTab, setActiveTab] = useState<"types" | "all" | "mine">("types");

  // Workflow types state
  const [workflowTypes, setWorkflowTypes] = useState<WorkflowTypeDto[]>([]);
  const [typesPage, setTypesPage] = useState(1);
  const [typesTotal, setTypesTotal] = useState(0);
  const [typesLoading, setTypesLoading] = useState(false);
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false);
  const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkflowTypeDetailDto | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "", updateUrl: "" });
  const [isTypeSubmitting, setIsTypeSubmitting] = useState(false);
  const [isDeleteTypeOpen, setIsDeleteTypeOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<WorkflowTypeDto | null>(null);

  // Stage / assignee management (in Edit type dialog)
  const [stageForm, setStageForm] = useState({ stageOrder: 1, stageName: "", description: "", viewDetailUrl: "" });
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageForm, setEditStageForm] = useState({ stageName: "", description: "", viewDetailUrl: "" });
  // Local cache of stage viewDetailUrls (backend may not return it on the list endpoint yet)
  const [stageViewUrls, setStageViewUrls] = useState<Record<string, string>>({});
  const [addingAssigneeForStageId, setAddingAssigneeForStageId] = useState<string | null>(null);
  const [assigneeForm, setAssigneeForm] = useState<{
    assigneeValue: string;
    canApprove: boolean;
    canReject: boolean;
  }>({ assigneeValue: "", canApprove: true, canReject: true });
  const [isStageActionLoading, setIsStageActionLoading] = useState(false);
  const [adminRoles, setAdminRoles] = useState<AdminRoleListItemDto[]>([]);

  // Workflows (all) state
  const [workflows, setWorkflows] = useState<WorkflowDto[]>([]);
  const [workflowsPage, setWorkflowsPage] = useState(1);
  const [workflowsTotal, setWorkflowsTotal] = useState(0);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [workflowFilterStatus, setWorkflowFilterStatus] = useState<string>("all");
  const [workflowFilterTypeId, setWorkflowFilterTypeId] = useState<string>("all");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  // My tasks state
  const [myTasks, setMyTasks] = useState<WorkflowDto[]>([]);
  const [myTasksPage, setMyTasksPage] = useState(1);
  const [myTasksTotal, setMyTasksTotal] = useState(0);
  const [myTasksLoading, setMyTasksLoading] = useState(false);

  // Workflow detail (view / actions)
  const [detailWorkflow, setDetailWorkflow] = useState<WorkflowDetailDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activities, setActivities] = useState<WorkflowActivityDto[]>([]);
  const [actionRemark, setActionRemark] = useState("");
  const [returnStageId, setReturnStageId] = useState("");
  const [isActioning, setIsActioning] = useState(false);
  const [detailWorkflowType, setDetailWorkflowType] = useState<WorkflowTypeDetailDto | null>(null);
  const [showIframe, setShowIframe] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    const id = queryWorkspaceId || currentWorkspace?.workspaceId || workspaces[0]?.workspaceId || "";
    if (id) setWorkspaceId(id);
  }, [queryWorkspaceId, currentWorkspace?.workspaceId, workspaces]);

  useEffect(() => {
    if (queryWorkspaceId && queryWorkspaceId !== workspaceId) {
      setWorkspaceId(queryWorkspaceId);
      const ws = workspaces.find((w) => w.workspaceId === queryWorkspaceId);
      if (ws) setCurrentWorkspace(ws);
    }
  }, [queryWorkspaceId, workspaceId, workspaces, setCurrentWorkspace]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchUserInfo = async () => {
      try {
        const info = await apiGetAuth<UserInfo>("/connect/userinfo");
        setUserInfo(info);
      } catch {
        setUserInfo(null);
      }
    };
    fetchUserInfo();
  }, [mounted]);

  useEffect(() => {
    if (userInfo !== null && !isSuperAdmin(userInfo) && activeTab === "all") {
      setActiveTab("types");
    }
  }, [userInfo, activeTab]);

  const loadWorkflowTypes = useCallback(async () => {
    if (!workspaceId) return;
    setTypesLoading(true);
    try {
      const res = await getWorkflowTypes(workspaceId, {
        pageNumber: typesPage,
        pageSize,
      });
      if (res.success && res.data) {
        setWorkflowTypes(res.data.items ?? []);
        setTypesTotal(res.data.totalCount ?? 0);
      } else {
        setWorkflowTypes([]);
        setTypesTotal(0);
      }
    } catch {
      toast.error("Failed to load workflow types");
      setWorkflowTypes([]);
    } finally {
      setTypesLoading(false);
    }
  }, [workspaceId, typesPage]);

  const loadWorkflows = useCallback(async () => {
    if (!workspaceId) return;
    setWorkflowsLoading(true);
    try {
      const res = await getWorkflows(workspaceId, {
        pageNumber: workflowsPage,
        pageSize,
        status: workflowFilterStatus && workflowFilterStatus !== "all"
        ? (["Pending", "Approved", "Rejected", "Cancelled"].includes(workflowFilterStatus)
            ? (workflowFilterStatus as "Pending" | "Approved" | "Rejected" | "Cancelled")
            : undefined)
        : undefined,
        workflowTypeId: workflowFilterTypeId && workflowFilterTypeId !== "all" ? workflowFilterTypeId : undefined,
      });
      if (res.success && res.data) {
        setWorkflows(res.data.items ?? []);
        setWorkflowsTotal(res.data.totalCount ?? 0);
      } else {
        setWorkflows([]);
        setWorkflowsTotal(0);
      }
    } catch {
      toast.error("Failed to load workflows");
      setWorkflows([]);
    } finally {
      setWorkflowsLoading(false);
    }
  }, [workspaceId, workflowsPage, workflowFilterStatus, workflowFilterTypeId]);

  const loadMyTasks = useCallback(async () => {
    if (!workspaceId) return;
    setMyTasksLoading(true);
    try {
      const res = await getWorkflowsAssignableToMe(workspaceId, {
        pageNumber: myTasksPage,
        pageSize,
      });
      if (res.success && res.data) {
        setMyTasks(res.data.items ?? []);
        setMyTasksTotal(res.data.totalCount ?? 0);
      } else {
        setMyTasks([]);
        setMyTasksTotal(0);
      }
    } catch {
      toast.error("Failed to load my tasks");
      setMyTasks([]);
    } finally {
      setMyTasksLoading(false);
    }
  }, [workspaceId, myTasksPage]);

  useEffect(() => {
    if (activeTab === "types") loadWorkflowTypes();
  }, [activeTab, loadWorkflowTypes]);

  useEffect(() => {
    if (activeTab === "all") loadWorkflows();
  }, [activeTab, loadWorkflows]);

  useEffect(() => {
    if (activeTab === "mine") loadMyTasks();
  }, [activeTab, loadMyTasks]);

  const handleWorkspaceChange = (newId: string) => {
    setWorkspaceId(newId);
    const ws = workspaces.find((w) => w.workspaceId === newId);
    if (ws) setCurrentWorkspace(ws);
  };

  const handleCreateType = async () => {
    if (!typeForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!workspaceId) {
      toast.error("Select a workspace");
      return;
    }
    setIsTypeSubmitting(true);
    try {
      const res = await createWorkflowType(workspaceId, {
        name: typeForm.name.trim(),
        description: typeForm.description.trim() || undefined,
        updateUrl: typeForm.updateUrl?.trim() || undefined,
      });
      if (res.success && res.data) {
        toast.success("Workflow type created");
        setIsCreateTypeOpen(false);
        setTypeForm({ name: "", description: "", updateUrl: "" });
        loadWorkflowTypes();
      } else {
        toast.error(res.message || res.error?.message || "Failed to create");
      }
    } catch {
      toast.error("Failed to create workflow type");
    } finally {
      setIsTypeSubmitting(false);
    }
  };

  const openEditType = async (row: WorkflowTypeDto) => {
    if (!workspaceId) return;
    setDetailLoading(true);
    setIsEditTypeOpen(true);
    setIsAddingStage(false);
    setAddingAssigneeForStageId(null);
    setStageForm({ stageOrder: 1, stageName: "", description: "", viewDetailUrl: "" });
    setAssigneeForm({ assigneeValue: "", canApprove: true, canReject: true });
    setAdminRoles([]);
    try {
      const [typeRes, rolesRes] = await Promise.all([
        getWorkflowTypeById(workspaceId, row.workflowTypeId),
        getAllAdminRoles(workspaceId),
      ]);
      if (typeRes.success && typeRes.data) {
        setSelectedType(typeRes.data);
        setTypeForm({
          name: typeRes.data.name,
          description: typeRes.data.description ?? "",
          updateUrl: typeRes.data.updateUrl ?? "",
        });
        setStageForm((f) => ({ ...f, stageOrder: (typeRes.data!.stages?.length ?? 0) + 1 }));
      } else {
        toast.error("Failed to load workflow type");
      }
      if (rolesRes.success && rolesRes.data) {
        const list = Array.isArray(rolesRes.data) ? rolesRes.data : [];
        setAdminRoles(list);
      }
    } catch {
      toast.error("Failed to load workflow type");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateType = async () => {
    if (!selectedType || !workspaceId) return;
    setIsTypeSubmitting(true);
    try {
      const res = await updateWorkflowType(workspaceId, selectedType.workflowTypeId, {
        name: typeForm.name.trim(),
        description: typeForm.description.trim() || undefined,
        updateUrl: typeForm.updateUrl?.trim() || undefined,
      });
      if (res.success) {
        toast.success("Workflow type updated");
        setIsEditTypeOpen(false);
        setSelectedType(null);
        loadWorkflowTypes();
      } else {
        toast.error(res.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update workflow type");
    } finally {
      setIsTypeSubmitting(false);
    }
  };

  const refreshSelectedType = useCallback(
    async (typeId?: string) => {
      const id = typeId ?? selectedType?.workflowTypeId;
      if (!id || !workspaceId) return;
      const res = await getWorkflowTypeById(workspaceId, id);
      if (res.success && res.data) setSelectedType(res.data);
    },
    [workspaceId, selectedType?.workflowTypeId]
  );

  const handleAddStage = async () => {
    if (!selectedType || !workspaceId || !stageForm.stageName.trim()) {
      toast.error("Stage name is required");
      return;
    }
    setIsStageActionLoading(true);
    try {
      const res = await addStage(workspaceId, selectedType.workflowTypeId, {
        stageOrder: stageForm.stageOrder,
        stageName: stageForm.stageName.trim(),
        description: stageForm.description.trim() || undefined,
        viewDetailUrl: stageForm.viewDetailUrl.trim() || undefined,
      });
      if (res.success && res.data) {
        toast.success("Stage added");
        if (stageForm.viewDetailUrl.trim()) {
          setStageViewUrls((prev) => ({ ...prev, [res.data!.workflowStageId]: stageForm.viewDetailUrl.trim() }));
        }
        const nextOrder = (selectedType.stages?.length ?? 0) + 1;
        setStageForm({ stageOrder: nextOrder, stageName: "", description: "", viewDetailUrl: "" });
        await refreshSelectedType();
        loadWorkflowTypes();
      } else {
        toast.error(res.message || res.error?.message || "Failed to add stage");
      }
    } catch {
      toast.error("Failed to add stage");
    } finally {
      setIsStageActionLoading(false);
    }
  };

  const handleUpdateStage = async (workflowStageId: string) => {
    if (!selectedType || !workspaceId || !editStageForm.stageName.trim()) {
      toast.error("Stage name is required");
      return;
    }
    setIsStageActionLoading(true);
    try {
      const res = await updateStage(workspaceId, selectedType.workflowTypeId, workflowStageId, {
        stageName: editStageForm.stageName.trim(),
        description: editStageForm.description.trim() || undefined,
        viewDetailUrl: editStageForm.viewDetailUrl.trim() || undefined,
      });
      if (res.success) {
        toast.success("Stage updated");
        const url = editStageForm.viewDetailUrl.trim();
        setStageViewUrls((prev) => {
          const next = { ...prev };
          if (url) next[workflowStageId] = url;
          else delete next[workflowStageId];
          return next;
        });
        setEditingStageId(null);
        await refreshSelectedType();
        loadWorkflowTypes();
      } else {
        toast.error(res.message || res.error?.message || "Failed to update stage");
      }
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setIsStageActionLoading(false);
    }
  };

  const handleAddAssignee = async (workflowStageId: string) => {
    if (!selectedType || !workspaceId || !assigneeForm.assigneeValue.trim()) {
      toast.error("Select a role");
      return;
    }
    // assigneeValue must be the WorkspaceRoleId GUID (from admin-roles dropdown)
    const workspaceRoleId = assigneeForm.assigneeValue.trim();
    setIsStageActionLoading(true);
    try {
      const res = await addStageAssignee(workspaceId, selectedType.workflowTypeId, workflowStageId, {
        assigneeType: "Role",
        assigneeValue: workspaceRoleId,
        canApprove: assigneeForm.canApprove,
        canReject: assigneeForm.canReject,
      });
      if (res.success) {
        toast.success("Assignee added");
        setAddingAssigneeForStageId(null);
        setAssigneeForm({ assigneeValue: "", canApprove: true, canReject: true });
        await refreshSelectedType();
      } else {
        toast.error(res.message || res.error?.message || "Failed to add assignee");
      }
    } catch {
      toast.error("Failed to add assignee");
    } finally {
      setIsStageActionLoading(false);
    }
  };

  const handleRemoveAssignee = async (workflowStageId: string, workflowStageAssigneeId: string) => {
    if (!selectedType || !workspaceId) return;
    setIsStageActionLoading(true);
    try {
      const res = await removeStageAssignee(
        workspaceId,
        selectedType.workflowTypeId,
        workflowStageId,
        workflowStageAssigneeId
      );
      if (res.success) {
        toast.success("Assignee removed");
        await refreshSelectedType();
      } else {
        toast.error(res.message || "Failed to remove assignee");
      }
    } catch {
      toast.error("Failed to remove assignee");
    } finally {
      setIsStageActionLoading(false);
    }
  };

  const handleDeleteType = async () => {
    if (!typeToDelete || !workspaceId) return;
    try {
      const res = await deleteWorkflowType(workspaceId, typeToDelete.workflowTypeId);
      if (res.success) {
        toast.success("Workflow type deleted");
        setIsDeleteTypeOpen(false);
        setTypeToDelete(null);
        loadWorkflowTypes();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete workflow type");
    }
  };

  const openWorkflowDetail = async (workflow: WorkflowDto) => {
    if (!workspaceId) return;
    setDetailLoading(true);
    setIsDetailOpen(true);
    setDetailWorkflow(null);
    setDetailWorkflowType(null);
    setActivities([]);
    setActionRemark("");
    setReturnStageId("");
    setShowIframe(false);
    try {
      const [detailRes, activitiesRes, typeRes] = await Promise.all([
        getWorkflowById(workspaceId, workflow.workflowId),
        getWorkflowActivities(workspaceId, workflow.workflowId, { pageNumber: 1, pageSize: 50 }),
        getWorkflowTypeById(workspaceId, workflow.workflowTypeId),
      ]);
      if (detailRes.success && detailRes.data) setDetailWorkflow(detailRes.data);
      if (activitiesRes.success && activitiesRes.data) setActivities(activitiesRes.data.items ?? []);
      if (typeRes.success && typeRes.data) setDetailWorkflowType(typeRes.data);
    } catch {
      toast.error("Failed to load workflow details");
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = useCallback(
    async (
      action: () => Promise<{ success: boolean; data?: WorkflowDto; message?: string }>
    ) => {
      if (!workspaceId || !detailWorkflow) return;
      setIsActioning(true);
      try {
        const res = await action();
        if (res.success && res.data) {
          setDetailWorkflow((prev) => (prev ? { ...prev, ...res.data! } : null));
          toast.success("Action completed");
          const actRes = await getWorkflowActivities(workspaceId, detailWorkflow.workflowId, {
            pageNumber: 1,
            pageSize: 50,
          });
          if (actRes.success && actRes.data) setActivities(actRes.data.items ?? []);
          loadWorkflows();
          loadMyTasks();
        } else {
          toast.error(res.message || "Action failed");
        }
      } catch {
        toast.error("Action failed");
      } finally {
        setIsActioning(false);
      }
    },
    [workspaceId, detailWorkflow, loadWorkflows, loadMyTasks]
  );

  const handleApprove = () =>
    runAction(() =>
      approveWorkflow(workspaceId!, detailWorkflow!.workflowId, {
        remark: actionRemark.trim() || undefined,
      })
    );
  const handleReject = () =>
    runAction(() =>
      rejectWorkflow(workspaceId!, detailWorkflow!.workflowId, {
        remark: actionRemark.trim() || undefined,
      })
    );
  const handleReturn = () => {
    if (!returnStageId) {
      toast.error("Select a stage to return to");
      return;
    }
    runAction(() =>
      returnWorkflow(workspaceId!, detailWorkflow!.workflowId, {
        targetWorkflowStageId: returnStageId,
        remark: actionRemark.trim() || undefined,
      })
    );
  };
  const handleCancel = () =>
    runAction(() =>
      cancelWorkflow(workspaceId!, detailWorkflow!.workflowId, {
        remark: actionRemark.trim() || undefined,
      })
    );
  const handleClaim = () => runAction(() => claimWorkflow(workspaceId!, detailWorkflow!.workflowId));
  const handleUnclaim = () => runAction(() => unclaimWorkflow(workspaceId!, detailWorkflow!.workflowId));

  const typeColumns: DataTableColumn<WorkflowTypeDto>[] = [
    { id: "name", header: "Name", accessorKey: "name" as keyof WorkflowTypeDto },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-muted-foreground text-sm max-w-[200px] truncate block">
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "stageCount",
      header: "Stages",
      cell: (row) => row.stageCount,
    },
    {
      id: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "dateCreated",
      header: "Created",
      cell: (row) => formatDate(row.dateCreated),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditType(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTypeToDelete(row);
                setIsDeleteTypeOpen(true);
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

  const workflowColumns: DataTableColumn<WorkflowDto>[] = [
    { id: "workflowTypeName", header: "Type", accessorKey: "workflowTypeName" as keyof WorkflowDto },
    { id: "referenceType", header: "Reference type", accessorKey: "referenceType" as keyof WorkflowDto },
    { id: "referenceId", header: "Reference ID", accessorKey: "referenceId" as keyof WorkflowDto },
    {
      id: "currentStageName",
      header: "Current stage",
      cell: (row) => row.currentStageName ?? "—",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? "default"}>{row.status}</Badge>
      ),
    },
    { id: "dateCreated", header: "Created", cell: (row) => formatDate(row.dateCreated) },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openWorkflowDetail(row)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
      className: "w-24",
    },
  ];

  const previousStages: WorkflowStageDto[] = detailWorkflow?.currentWorkflowStageId && detailWorkflowType
    ? (detailWorkflowType.stages ?? []).filter((s) => {
        const current = detailWorkflowType.stages?.find((st) => st.workflowStageId === detailWorkflow.currentWorkflowStageId);
        return current && s.stageOrder < current.stageOrder;
      })
    : [];

  if (!workspaceId && workspaces.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Workflows"
          description="Select a workspace to manage workflow types and instances."
        />
        <div className="flex gap-2 items-center">
          <Label>Workspace</Label>
          <Select value={workspaceId || " "} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="w-[280px]">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Manage workflow types and act on tasks assignable to you."
        actions={
          <div className="flex items-center gap-2">
            <Select value={workspaceId || " "} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === "types" && (
              <Button onClick={() => setIsCreateTypeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create type
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "types" | "all" | "mine")}>
        <TabsList>
          <TabsTrigger value="types">
            <GitBranch className="mr-2 h-4 w-4" />
            Workflow types
          </TabsTrigger>
          {mounted && isSuperAdmin(userInfo) && (
            <TabsTrigger value="all">
              <ListTodo className="mr-2 h-4 w-4" />
              All workflows
            </TabsTrigger>
          )}
          <TabsTrigger value="mine">
            <UserCheck className="mr-2 h-4 w-4" />
            My tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-4">
          <DataTable
            columns={typeColumns}
            data={workflowTypes}
            isLoading={typesLoading}
            emptyMessage="No workflow types"
            emptyDescription="Create a workflow type to define approval flows."
            getRowId={(row) => row.workflowTypeId}
            searchable={false}
            pageSize={pageSize}
            totalCount={typesTotal}
            currentPage={typesPage}
            onPageChange={setTypesPage}
          />
        </TabsContent>

        {mounted && isSuperAdmin(userInfo) && (
          <TabsContent value="all" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={workflowFilterStatus} onValueChange={setWorkflowFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={workflowFilterTypeId} onValueChange={setWorkflowFilterTypeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Workflow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {workflowTypes.map((t) => (
                    <SelectItem key={t.workflowTypeId} value={t.workflowTypeId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DataTable
              columns={workflowColumns}
              data={workflows}
              isLoading={workflowsLoading}
              emptyMessage="No workflows"
              getRowId={(row) => row.workflowId}
              searchable={false}
              pageSize={pageSize}
              totalCount={workflowsTotal}
              currentPage={workflowsPage}
              onPageChange={setWorkflowsPage}
            />
          </TabsContent>
        )}

        <TabsContent value="mine" className="mt-4">
          <DataTable
            columns={workflowColumns}
            data={myTasks}
            isLoading={myTasksLoading}
            emptyMessage="No tasks assignable to you"
            emptyDescription="Workflows pending your action will appear here."
            getRowId={(row) => row.workflowId}
            searchable={false}
            pageSize={pageSize}
            totalCount={myTasksTotal}
            currentPage={myTasksPage}
            onPageChange={setMyTasksPage}
          />
        </TabsContent>
      </Tabs>

      {/* Create workflow type */}
      <Dialog open={isCreateTypeOpen} onOpenChange={setIsCreateTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workflow type</DialogTitle>
            <DialogDescription>Define a new workflow (e.g. Registration Approval). Add stages and assignees after creation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Registration Approval"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={typeForm.description}
                onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Update URL (optional)</Label>
              <Input
                value={typeForm.updateUrl}
                onChange={(e) => setTypeForm((f) => ({ ...f, updateUrl: e.target.value }))}
                placeholder="e.g. https://service/module/update/{ReferenceId}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTypeOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateType} disabled={isTypeSubmitting}>
              {isTypeSubmitting ? <LoadingSpinner className="h-4 w-4" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit workflow type – name/URL + stages & assignees */}
      <Dialog open={isEditTypeOpen} onOpenChange={setIsEditTypeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit workflow type</DialogTitle>
            <DialogDescription>Update name and URLs, then add stages and assignees so workflows can be submitted and appear in My tasks.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <LoadingSpinner />
          ) : selectedType ? (
            <>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={typeForm.name}
                      onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Update URL</Label>
                    <Input
                      value={typeForm.updateUrl}
                      onChange={(e) => setTypeForm((f) => ({ ...f, updateUrl: e.target.value }))}
                      placeholder="https://service/module/update/{ReferenceId}"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={typeForm.description}
                    onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <h4 className="font-medium">Stages & assignees</h4>
                  </div>
                  {(selectedType.stages?.length ?? 0) === 0 && !isAddingStage && (
                    <p className="text-sm text-muted-foreground">Add at least one stage before submitting workflows. Each stage can have assignees (role or user) who can approve/reject.</p>
                  )}
                  {selectedType.stages
                    ?.slice()
                    .sort((a, b) => a.stageOrder - b.stageOrder)
                    .map((stage) => (
                      <div key={stage.workflowStageId} className="rounded-lg border p-3 space-y-2">
                        {editingStageId === stage.workflowStageId ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="space-y-1 flex-1 min-w-[160px]">
                                <span className="text-xs text-muted-foreground">Name *</span>
                                <Input
                                  value={editStageForm.stageName}
                                  onChange={(e) => setEditStageForm((f) => ({ ...f, stageName: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-1 flex-1 min-w-[160px]">
                                <span className="text-xs text-muted-foreground">Description</span>
                                <Input
                                  value={editStageForm.description}
                                  onChange={(e) => setEditStageForm((f) => ({ ...f, description: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">View detail URL</span>
                              <Input
                                value={editStageForm.viewDetailUrl}
                                onChange={(e) => setEditStageForm((f) => ({ ...f, viewDetailUrl: e.target.value }))}
                                placeholder="e.g. /registrations/{ReferenceId}"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStage(stage.workflowStageId)}
                                disabled={isStageActionLoading || !editStageForm.stageName.trim()}
                              >
                                {isStageActionLoading ? <LoadingSpinner className="h-4 w-4" /> : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStageId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Stage {stage.stageOrder}: {stage.stageName}
                              </span>
                              <div className="flex items-center gap-2">
                                {stage.description && (
                                  <span className="text-sm text-muted-foreground">{stage.description}</span>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => {
                                    setEditingStageId(stage.workflowStageId);
                                    setEditStageForm({
                                      stageName: stage.stageName,
                                      description: stage.description ?? "",
                                      viewDetailUrl: stage.viewDetailUrl ?? stageViewUrls[stage.workflowStageId] ?? "",
                                    });
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {(stage.viewDetailUrl || stageViewUrls[stage.workflowStageId]) && (
                              <p className="text-xs text-muted-foreground pl-1">
                                View URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">{stage.viewDetailUrl || stageViewUrls[stage.workflowStageId]}</code>
                              </p>
                            )}
                          </>
                        )}
                        <div className="pl-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            Assignees:
                          </div>
                          {(stage.assignees?.length ?? 0) > 0 ? (
                            <ul className="list-disc list-inside text-sm space-y-0.5">
                              {stage.assignees?.map((a: WorkflowStageAssigneeDto) => {
                                const displayName =
                                  a.assigneeType === "Role"
                                    ? adminRoles.find((r) => r.workspaceRoleId === a.assigneeValue)?.roleName ?? a.assigneeValue
                                    : a.assigneeValue;
                                return (
                                <li key={a.workflowStageAssigneeId} className="flex items-center gap-2">
                                  <span>
                                    {a.assigneeType}: {displayName}
                                    {a.canApprove && " (approve)"}
                                    {a.canReject && " (reject)"}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1 text-destructive"
                                    onClick={() => handleRemoveAssignee(stage.workflowStageId, a.workflowStageAssigneeId)}
                                    disabled={isStageActionLoading}
                                  >
                                    Remove
                                  </Button>
                                </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                          {addingAssigneeForStageId === stage.workflowStageId ? (
                            <div className="mt-2 p-2 rounded border bg-muted/30 space-y-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Role</Label>
                                <Select
                                  value={assigneeForm.assigneeValue || "none"}
                                  onValueChange={(v) =>
                                    setAssigneeForm((f) => ({ ...f, assigneeValue: v === "none" ? "" : v }))
                                  }
                                >
                                  <SelectTrigger className="w-full max-w-[280px]">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select role</SelectItem>
                                    {adminRoles.map((role) => (
                                      <SelectItem key={role.workspaceRoleId} value={role.workspaceRoleId}>
                                        {role.roleName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {adminRoles.length === 0 && !detailLoading && (
                                  <p className="text-xs text-muted-foreground">No roles in this workspace. Add roles via Admin Roles.</p>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={assigneeForm.canApprove}
                                    onCheckedChange={(c) =>
                                      setAssigneeForm((f) => ({ ...f, canApprove: !!c }))
                                    }
                                  />
                                  Can approve
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={assigneeForm.canReject}
                                    onCheckedChange={(c) =>
                                      setAssigneeForm((f) => ({ ...f, canReject: !!c }))
                                    }
                                  />
                                  Can reject
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddAssignee(stage.workflowStageId)}
                                  disabled={isStageActionLoading || !assigneeForm.assigneeValue.trim()}
                                >
                                  {isStageActionLoading ? <LoadingSpinner className="h-4 w-4" /> : "Add"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingAssigneeForStageId(null);
                                    setAssigneeForm({ assigneeValue: "", canApprove: true, canReject: true });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAddingAssigneeForStageId(stage.workflowStageId)}
                              disabled={!!addingAssigneeForStageId}
                            >
                              Add assignee
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                  {isAddingStage ? (
                    <div className="rounded-lg border border-dashed p-3 space-y-2 bg-muted/20">
                      <Label>New stage</Label>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Order</span>
                          <Input
                            type="number"
                            min={1}
                            value={stageForm.stageOrder}
                            onChange={(e) =>
                              setStageForm((f) => ({
                                ...f,
                                stageOrder: parseInt(e.target.value, 10) || 1,
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="space-y-1 flex-1 min-w-[160px]">
                          <span className="text-xs text-muted-foreground">Name *</span>
                          <Input
                            value={stageForm.stageName}
                            onChange={(e) => setStageForm((f) => ({ ...f, stageName: e.target.value }))}
                            placeholder="e.g. Initial Review"
                          />
                        </div>
                        <div className="space-y-1 flex-1 min-w-[160px]">
                          <span className="text-xs text-muted-foreground">Description</span>
                          <Input
                            value={stageForm.description}
                            onChange={(e) => setStageForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">View detail URL</span>
                        <Input
                          value={stageForm.viewDetailUrl}
                          onChange={(e) => setStageForm((f) => ({ ...f, viewDetailUrl: e.target.value }))}
                          placeholder="e.g. https://service/module/update/"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddStage}
                          disabled={isStageActionLoading || !stageForm.stageName.trim()}
                        >
                          {isStageActionLoading ? <LoadingSpinner className="h-4 w-4" /> : "Add stage"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingStage(false);
                            setStageForm({
                              stageOrder: (selectedType.stages?.length ?? 0) + 1,
                              stageName: "",
                              description: "",
                              viewDetailUrl: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingStage(true);
                        setStageForm({
                          stageOrder: (selectedType.stages?.length ?? 0) + 1,
                          stageName: "",
                          description: "",
                          viewDetailUrl: "",
                        });
                      }}
                    >
                      Add stage
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditTypeOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateType} disabled={isTypeSubmitting}>
                  {isTypeSubmitting ? <LoadingSpinner className="h-4 w-4" /> : "Save"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete workflow type confirm */}
      <ConfirmDialog
        open={isDeleteTypeOpen}
        onOpenChange={setIsDeleteTypeOpen}
        title="Delete workflow type"
        description={
          typeToDelete
            ? `Delete "${typeToDelete.name}"? This will soft-delete the type; it will no longer appear in lists.`
            : ""
        }
        onConfirm={handleDeleteType}
      />

      {/* Workflow detail + actions */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => { setIsDetailOpen(open); if (!open) setShowIframe(false); }}>
        <DialogContent className={`${showIframe ? "max-w-5xl" : "max-w-2xl"} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Workflow details</DialogTitle>
            <DialogDescription>View info and perform actions (approve, reject, return, cancel, claim, unclaim).</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <LoadingSpinner />
          ) : detailWorkflow ? (
            <>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Type:</span> {detailWorkflow.workflowTypeName}</p>
                <p><span className="font-medium">Reference:</span> {detailWorkflow.referenceType} / {detailWorkflow.referenceId}</p>
                <p><span className="font-medium">Current stage:</span> {detailWorkflow.currentStageName ?? "—"}</p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant={STATUS_VARIANTS[detailWorkflow.status]}>{detailWorkflow.status}</Badge>
                </p>
                {(detailWorkflow.currentStageViewDetailUrl || detailWorkflow.viewDetailUrl) && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowIframe((prev) => !prev)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showIframe ? "Hide Details" : "View Details"}
                    </Button>
                  </div>
                )}
              </div>

              {showIframe && (detailWorkflow.currentStageViewDetailUrl) && (
                <div className="border rounded-lg overflow-hidden mt-2">
                  <iframe
                    src={`${detailWorkflow.currentStageViewDetailUrl}?token=${token}`}
                    className="w-full border-0"
                    style={{ height: "500px" }}
                    title="Workflow reference detail"
                  />
                </div>
              )}

             {/* {detailWorkflow.status === "Pending" && (
                <div className="space-y-3 border-t pt-4">
                  <Label>Remark (optional, for actions)</Label>
                  <Textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="Comment for approve/reject/return/cancel"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={handleApprove} disabled={isActioning}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleReject} disabled={isActioning}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={isActioning}>
                      <Ban className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClaim} disabled={isActioning}>
                      <UserCheck className="mr-1 h-4 w-4" /> Claim
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleUnclaim} disabled={isActioning}>
                      <UserX className="mr-1 h-4 w-4" /> Unclaim
                    </Button>
                    {previousStages.length > 0 && (
                      <>
                        <Select value={returnStageId} onValueChange={setReturnStageId}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Return to stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {previousStages.map((s) => (
                              <SelectItem key={s.workflowStageId} value={s.workflowStageId}>
                                {s.stageName} (order {s.stageOrder})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={handleReturn} disabled={isActioning || !returnStageId}>
                          <RotateCcw className="mr-1 h-4 w-4" /> Return
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}  */}

              {/* <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Recent activities</h4>
                <ul className="space-y-1 text-sm">
                  {activities.slice(0, 15).map((a) => (
                    <li key={a.workflowActivityId}>
                      <span className="font-medium">{a.action}</span>
                      {a.oldStageName && a.newStageName && `: ${a.oldStageName} → ${a.newStageName}`}
                      {a.remark && ` — ${a.remark}`}
                      <span className="text-muted-foreground ml-1">
                        {formatDate(a.dateCreated)}
                      </span>
                    </li>
                  ))}
                  {activities.length === 0 && <li className="text-muted-foreground">No activities yet.</li>}
                </ul>
              </div> */}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
