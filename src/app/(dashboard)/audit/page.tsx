"use client";

import { useState, useEffect } from "react";
import { History, Filter, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, DataTable, DataTableColumn } from "@/components/shared";
import { AuditLog } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { mockDataStore } from "@/lib/mock-data";

const actionColors: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "info"
> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "destructive",
  ASSIGN: "info",
  LOGIN: "default",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLogs(mockDataStore.auditLogs);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction && filterAction !== "all" && log.action !== filterAction)
      return false;
    if (
      filterEntity &&
      filterEntity !== "all" &&
      log.entityType !== filterEntity
    )
      return false;
    return true;
  });

  const entityTypes = [...new Set(logs.map((log) => log.entityType))];
  const actionTypes = [...new Set(logs.map((log) => log.action))];

  const columns: DataTableColumn<AuditLog>[] = [
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
      id: "entity",
      header: "Entity",
      cell: (log) => (
        <div>
          <p className="font-medium">{log.entityType}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {log.entityId}
          </p>
        </div>
      ),
    },
    {
      id: "changes",
      header: "Changes",
      cell: (log) => (
        <div className="max-w-[300px]">
          {log.changes ? (
            <code className="text-xs bg-muted p-1 rounded block truncate">
              {JSON.stringify(log.changes)}
            </code>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      id: "ipAddress",
      header: "IP Address",
      cell: (log) => <span className="font-mono text-sm">{log.ipAddress}</span>,
    },
    {
      id: "timestamp",
      header: "Timestamp",
      cell: (log) => formatDateTime(log.createdAt),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all actions and changes in the system"
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterAction || filterEntity) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterAction("");
              setFilterEntity("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        emptyMessage="No audit logs found"
        emptyDescription="System activity will appear here once actions are performed."
        searchPlaceholder="Search logs..."
        getRowId={(row) => row.auditLogId}
      />
    </div>
  );
}







