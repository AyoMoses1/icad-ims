/**
 * Invitation Service - API integration for invitation operations
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  type ApiResponse,
} from "@/lib/api-client";
import type {
  InvitationDto,
  CreateInvitationRequestDto,
  PaginatedResponse,
} from "@/types";

const API_BASE = "/iam/api/v1/invitations";

/**
 * Get paginated list of invitations
 */
export async function getInvitations(filters?: {
  pageNumber?: number;
  pageSize?: number;
  skip?: number;
  query?: string;
}): Promise<ApiResponse<PaginatedResponse<InvitationDto> | InvitationDto[]>> {
  const params = new URLSearchParams();

  if (filters?.pageNumber) {
    params.append("PageNumber", filters.pageNumber.toString());
  }
  if (filters?.pageSize) {
    params.append("PageSize", filters.pageSize.toString());
  }
  if (filters?.skip !== undefined) {
    params.append("Skip", filters.skip.toString());
  }
  if (filters?.query) {
    params.append("Query", filters.query);
  }

  const queryString = params.toString();
  const response = await apiGet<
    InvitationDto[] | PaginatedResponse<InvitationDto>
  >(`${API_BASE}${queryString ? `?${queryString}` : ""}`);

  return response;
}

/**
 * Get current user's invitations
 */
export async function getMyInvitations(): Promise<
  ApiResponse<InvitationDto[] | PaginatedResponse<InvitationDto>>
> {
  const response = await apiGet<
    InvitationDto[] | PaginatedResponse<InvitationDto>
  >(`${API_BASE}/me`);

  return response;
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(
  invitationId: string
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiGet<InvitationDto>(`${API_BASE}/${invitationId}`);

  return response;
}

/**
 * Create a new invitation
 */
export async function createInvitation(
  data: CreateInvitationRequestDto
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiPost<InvitationDto>(API_BASE, data);

  return response;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  invitationId: string,
  workspaceId?: string
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiPut<InvitationDto>(`${API_BASE}/accept`, {
    invitationId,
    workspaceId,
  });

  return response;
}

/**
 * Decline an invitation
 */
export async function declineInvitation(
  invitationId: string
): Promise<ApiResponse<void>> {
  const response = await apiPut<void>(
    `${API_BASE}/${invitationId}/decline`,
    {}
  );

  return response;
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(
  invitationId: string
): Promise<ApiResponse<void>> {
  const response = await apiDelete<void>(`${API_BASE}/${invitationId}`);

  return response;
}
