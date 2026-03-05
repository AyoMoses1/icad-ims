/**
 * Workflow Service – API integration for workspace workflows (MEMS.IAM).
 * Base path: api/workspaces/{workspaceId}/workflows
 * @see Workflow-API-Reference.md
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from "@/lib/api-client";
import type {
  WorkflowTypeDto,
  WorkflowTypeDetailDto,
  WorkflowStageDto,
  WorkflowStageAssigneeDto,
  WorkflowDto,
  WorkflowDetailDto,
  WorkflowActivityDto,
  CreateWorkflowTypeRequestDto,
  UpdateWorkflowTypeRequestDto,
  CreateWorkflowStageRequestDto,
  UpdateWorkflowStageRequestDto,
  AddWorkflowStageAssigneeRequestDto,
  SubmitWorkflowRequestDto,
  GetWorkflowTypesParams,
  GetWorkflowsParams,
  PagedWorkflowTypesResult,
  PagedWorkflowsResult,
  PagedWorkflowActivitiesResult,
  ApproveWorkflowRequestDto,
  RejectWorkflowRequestDto,
  ReturnWorkflowRequestDto,
  CancelWorkflowRequestDto,
} from "@/types";

function basePath(workspaceId: string) {
  return `/api/workspaces/${workspaceId}/workflows`;
}

// ----- Workflow types -----

export async function getWorkflowTypes(
  workspaceId: string,
  params?: GetWorkflowTypesParams
): Promise<ApiResponse<PagedWorkflowTypesResult>> {
  const search = new URLSearchParams();
  if (params?.pageNumber != null) search.set("PageNumber", String(params.pageNumber));
  if (params?.pageSize != null) search.set("PageSize", String(params.pageSize));
  if (params?.isActive !== undefined) search.set("IsActive", String(params.isActive));
  const qs = search.toString();
  const url = `${basePath(workspaceId)}/workflow-types${qs ? `?${qs}` : ""}`;
  return apiGet<PagedWorkflowTypesResult>(url);
}

export async function getWorkflowTypeById(
  workspaceId: string,
  workflowTypeId: string
): Promise<ApiResponse<WorkflowTypeDetailDto>> {
  return apiGet<WorkflowTypeDetailDto>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}`
  );
}

export async function createWorkflowType(
  workspaceId: string,
  body: CreateWorkflowTypeRequestDto
): Promise<ApiResponse<WorkflowTypeDto>> {
  return apiPost<WorkflowTypeDto>(
    `${basePath(workspaceId)}/workflow-types`,
    body
  );
}

export async function updateWorkflowType(
  workspaceId: string,
  workflowTypeId: string,
  body: UpdateWorkflowTypeRequestDto
): Promise<ApiResponse<WorkflowTypeDto>> {
  return apiPut<WorkflowTypeDto>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}`,
    body
  );
}

export async function deleteWorkflowType(
  workspaceId: string,
  workflowTypeId: string
): Promise<ApiResponse<boolean>> {
  return apiDelete<boolean>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}`
  );
}

// ----- Stages -----

export async function addStage(
  workspaceId: string,
  workflowTypeId: string,
  body: CreateWorkflowStageRequestDto
): Promise<ApiResponse<WorkflowStageDto>> {
  return apiPost<WorkflowStageDto>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}/stages`,
    body
  );
}

export async function updateStage(
  workspaceId: string,
  workflowTypeId: string,
  workflowStageId: string,
  body: UpdateWorkflowStageRequestDto
): Promise<ApiResponse<WorkflowStageDto>> {
  return apiPut<WorkflowStageDto>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}/stages/${workflowStageId}`,
    body
  );
}

export async function addStageAssignee(
  workspaceId: string,
  workflowTypeId: string,
  workflowStageId: string,
  body: AddWorkflowStageAssigneeRequestDto
): Promise<ApiResponse<WorkflowStageAssigneeDto>> {
  return apiPost<WorkflowStageAssigneeDto>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}/stages/${workflowStageId}/assignees`,
    body
  );
}

export async function removeStageAssignee(
  workspaceId: string,
  workflowTypeId: string,
  workflowStageId: string,
  workflowStageAssigneeId: string
): Promise<ApiResponse<boolean>> {
  return apiDelete<boolean>(
    `${basePath(workspaceId)}/workflow-types/${workflowTypeId}/stages/${workflowStageId}/assignees/${workflowStageAssigneeId}`
  );
}

// ----- Workflow instances -----

export async function submitWorkflow(
  workspaceId: string,
  body: SubmitWorkflowRequestDto
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(`${basePath(workspaceId)}`, body);
}

export async function getWorkflows(
  workspaceId: string,
  params?: GetWorkflowsParams
): Promise<ApiResponse<PagedWorkflowsResult>> {
  const search = new URLSearchParams();
  if (params?.pageNumber != null) search.set("PageNumber", String(params.pageNumber));
  if (params?.pageSize != null) search.set("PageSize", String(params.pageSize));
  if (params?.workflowTypeId) search.set("WorkflowTypeId", params.workflowTypeId);
  if (params?.status) search.set("Status", params.status);
  if (params?.referenceType) search.set("ReferenceType", params.referenceType);
  if (params?.referenceId) search.set("ReferenceId", params.referenceId);
  if (params?.createdBy) search.set("CreatedBy", params.createdBy);
  const qs = search.toString();
  const url = `${basePath(workspaceId)}${qs ? `?${qs}` : ""}`;
  return apiGet<PagedWorkflowsResult>(url);
}

export async function getWorkflowsAssignableToMe(
  workspaceId: string,
  params?: GetWorkflowsParams
): Promise<ApiResponse<PagedWorkflowsResult>> {
  const search = new URLSearchParams();
  if (params?.pageNumber != null) search.set("PageNumber", String(params.pageNumber));
  if (params?.pageSize != null) search.set("PageSize", String(params.pageSize));
  if (params?.workflowTypeId) search.set("WorkflowTypeId", params.workflowTypeId);
  if (params?.status) search.set("Status", params.status);
  if (params?.referenceType) search.set("ReferenceType", params.referenceType);
  if (params?.referenceId) search.set("ReferenceId", params.referenceId);
  if (params?.createdBy) search.set("CreatedBy", params.createdBy);
  const qs = search.toString();
  const url = `${basePath(workspaceId)}/assignable-to-me${qs ? `?${qs}` : ""}`;
  return apiGet<PagedWorkflowsResult>(url);
}

export async function getWorkflowById(
  workspaceId: string,
  workflowId: string
): Promise<ApiResponse<WorkflowDetailDto>> {
  return apiGet<WorkflowDetailDto>(
    `${basePath(workspaceId)}/${workflowId}`
  );
}

// ----- Actions -----

export async function approveWorkflow(
  workspaceId: string,
  workflowId: string,
  body?: ApproveWorkflowRequestDto
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/approve`,
    body ?? {}
  );
}

export async function rejectWorkflow(
  workspaceId: string,
  workflowId: string,
  body?: RejectWorkflowRequestDto
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/reject`,
    body ?? {}
  );
}

export async function returnWorkflow(
  workspaceId: string,
  workflowId: string,
  body: ReturnWorkflowRequestDto
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/return`,
    body
  );
}

export async function cancelWorkflow(
  workspaceId: string,
  workflowId: string,
  body?: CancelWorkflowRequestDto
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/cancel`,
    body ?? {}
  );
}

export async function claimWorkflow(
  workspaceId: string,
  workflowId: string
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/claim`,
    {}
  );
}

export async function unclaimWorkflow(
  workspaceId: string,
  workflowId: string
): Promise<ApiResponse<WorkflowDto>> {
  return apiPost<WorkflowDto>(
    `${basePath(workspaceId)}/${workflowId}/unclaim`,
    {}
  );
}

// ----- Activities -----

export async function getWorkflowActivities(
  workspaceId: string,
  workflowId: string,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<ApiResponse<PagedWorkflowActivitiesResult>> {
  const search = new URLSearchParams();
  if (params?.pageNumber != null) search.set("pageNumber", String(params.pageNumber));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  const url = `${basePath(workspaceId)}/${workflowId}/activities${qs ? `?${qs}` : ""}`;
  return apiGet<PagedWorkflowActivitiesResult>(url);
}
