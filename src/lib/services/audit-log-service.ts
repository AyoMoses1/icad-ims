/**
 * Audit Log Service - API integration for GET /api/audit-logs (MEMS.IAM).
 * @see Get_Audit_Logs_API.md
 */

import { apiGet, type ApiResponse } from "@/lib/api-client";
import type {
  AuditLogDto,
  GetAuditLogsParams,
  PagedAuditLogsResult,
} from "@/types";

const API_BASE = "/api/audit-logs";

/**
 * Get paginated audit logs with optional filters.
 * GET /api/audit-logs
 * Requires: Bearer token, permission AuditLogs:View
 */
export async function getAuditLogs(
  params?: GetAuditLogsParams
): Promise<ApiResponse<PagedAuditLogsResult>> {
  const searchParams = new URLSearchParams();

  if (params?.pageNumber != null) {
    searchParams.set("pageNumber", String(params.pageNumber));
  }
  if (params?.pageSize != null) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (params?.userId) {
    searchParams.set("userId", params.userId);
  }
  if (params?.tenantId) {
    searchParams.set("tenantId", params.tenantId);
  }
  if (params?.workspaceId) {
    searchParams.set("workspaceId", params.workspaceId);
  }
  if (params?.auditType) {
    searchParams.set("auditType", params.auditType);
  }
  if (params?.entityType) {
    searchParams.set("entityType", params.entityType);
  }
  if (params?.action) {
    searchParams.set("action", params.action);
  }
  if (params?.startDate) {
    searchParams.set("startDate", params.startDate);
  }
  if (params?.endDate) {
    searchParams.set("endDate", params.endDate);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await apiGet<PagedAuditLogsResult>(url);

  if (response.success && response.data) {
    const raw = response.data as PagedAuditLogsResult & {
      data?: PagedAuditLogsResult;
    };
    if (raw.data) {
      return { success: true, data: raw.data };
    }
    return { success: true, data: response.data as PagedAuditLogsResult };
  }

  return response as ApiResponse<PagedAuditLogsResult>;
}
