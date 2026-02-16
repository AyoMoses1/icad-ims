"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, Download, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, DataTable, DataTableColumn } from "@/components/shared";
import { AuditLogDto } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { getAuditLogs } from "@/lib/services/audit-log-service";

const actionColors: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "info"
> = {
  Create: "success",
  Update: "warning",
  Delete: "destructive",
  Login: "info",
  Logout: "default",
  Assign: "info",
};

const AUDIT_TYPES = [
  { value: "", label: "All types" },
  { value: "SecurityEvent", label: "Security Event" },
  { value: "EntityChange", label: "Entity Change" },
];

const ENTITY_TYPES = [
  { value: "", label: "All entities" },
  { value: "User", label: "User" },
  { value: "Role", label: "Role" },
  { value: "Permission", label: "Permission" },
  { value: "Workspace", label: "Workspace" },
];

const ACTION_TYPES = [
  { value: "", label: "All actions" },
  { value: "Login", label: "Login" },
  { value: "Logout", label: "Logout" },
  { value: "Create", label: "Create" },
  { value: "Update", label: "Update" },
  { value: "Delete", label: "Delete" },
  { value: "Assign", label: "Assign" },
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filterAuditType, setFilterAuditType] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const toISOOptional = (localDatetime: string) =>
    localDatetime ? new Date(localDatetime).toISOString() : undefined;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof getAuditLogs>[0] = {
        pageNumber,
        pageSize,
      };
      if (filterAuditType) params.auditType = filterAuditType;
      if (filterEntityType) params.entityType = filterEntityType;
      if (filterAction) params.action = filterAction;
      const startIso = toISOOptional(filterStartDate);
      const endIso = toISOOptional(filterEndDate);
      if (startIso) params.startDate = startIso;
      if (endIso) params.endDate = endIso;

      const result = await getAuditLogs(params);

      if (result.success && result.data) {
        setLogs(result.data.items);
        setTotalCount(result.data.totalCount);
      } else {
        setLogs([]);
        setTotalCount(0);
        const msg = result.message || result.error?.message;
        if (msg) toast.error(msg);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load audit logs"
      );
      setLogs([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    pageNumber,
    pageSize,
    filterAuditType,
    filterEntityType,
    filterAction,
    filterStartDate,
    filterEndDate,
  ]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const hasActiveFilters =
    filterAuditType ||
    filterEntityType ||
    filterAction ||
    filterStartDate ||
    filterEndDate;

  const clearFilters = () => {
    setFilterAuditType("");
    setFilterEntityType("");
    setFilterAction("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPageNumber(1);
  };

  const columns: DataTableColumn<AuditLogDto>[] = [
    {
      id: "timestamp",
      header: "Time",
      cell: (log) => (
        <span className="text-sm whitespace-nowrap">
          {log.timestamp ? formatDateTime(log.timestamp) : "—"}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      cell: (log) => (
        <div>
          <p className="font-medium text-sm">
            {log.userName || log.userEmail || "—"}
          </p>
          {log.userEmail && log.userName !== log.userEmail && (
            <p className="text-xs text-muted-foreground">{log.userEmail}</p>
          )}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (log) => (
        <Badge variant={actionColors[log.action] || "default"}>
          {log.action}
        </Badge>
      ),
    },
    {
      id: "auditType",
      header: "Type",
      cell: (log) => (
        <span className="text-sm">
          {log.auditType ?? "—"}
        </span>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      cell: (log) => (
        <div>
          {log.entityType ? (
            <>
              <p className="font-medium text-sm">{log.entityType}</p>
              {log.entityId && (
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                  {log.entityId}
                </p>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: (log) => (
        <div className="max-w-[240px]">
          {log.details ? (
            <p className="text-xs truncate" title={log.details}>
              {log.details}
            </p>
          ) : log.resource ? (
            <span className="text-xs text-muted-foreground">{log.resource}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: "ipAddress",
      header: "IP",
      cell: (log) => (
        <span className="font-mono text-xs">
          {log.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      id: "success",
      header: "Status",
      cell: (log) =>
        log.success === true ? (
          <Badge variant="success">Success</Badge>
        ) : log.success === false ? (
          <Badge variant="destructive">Failed</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all actions and changes in the system. Results are ordered by most recent first."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showFilters ? <X className="ml-2 h-4 w-4" /> : null}
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-2">
            <Label className="text-xs">Audit type</Label>
            <Select
              value={filterAuditType || "all"}
              onValueChange={(v) => {
                setFilterAuditType(v === "all" ? "" : v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_TYPES.map((opt) => (
                  <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Entity type</Label>
            <Select
              value={filterEntityType || "all"}
              onValueChange={(v) => {
                setFilterEntityType(v === "all" ? "" : v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((opt) => (
                  <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Action</Label>
            <Select
              value={filterAction || "all"}
              onValueChange={(v) => {
                setFilterAction(v === "all" ? "" : v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((opt) => (
                  <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">From date</Label>
            <Input
              type="datetime-local"
              className="w-[180px]"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPageNumber(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">To date</Label>
            <Input
              type="datetime-local"
              className="w-[180px]"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPageNumber(1);
              }}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      <DataTable<AuditLogDto>
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No audit logs found"
        emptyDescription="System activity will appear here once actions are performed. Try adjusting filters."
        getRowId={(row) => row.auditLogId}
        pageSize={pageSize}
        totalCount={totalCount}
        currentPage={pageNumber}
        onPageChange={setPageNumber}
      />
    </div>
  );
}
