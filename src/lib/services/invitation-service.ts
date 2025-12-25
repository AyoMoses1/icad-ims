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
  AcceptInvitationRequestDto,
  PaginatedResponse,
  InvitationStatus,
} from "@/types";

const API_BASE = "/iam/api/v1/invitations";

/**
 * Get paginated list of invitations with optional filtering
 */
export async function getInvitations(
  filters: {
    status?: InvitationStatus;
    email?: string;
    pageNumber?: number;
    pageSize?: number;
    skip?: number;
  } = {}
): Promise<ApiResponse<PaginatedResponse<InvitationDto>>> {
  const { status, email, pageNumber = 1, pageSize = 20, skip } = filters;

  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (status) params.append("Status", status);
  if (email) params.append("Email", email);
  if (skip !== undefined) params.append("Skip", skip.toString());

  const query = params.toString();
  const response = await apiGet<{ data?: PaginatedResponse<InvitationDto> }>(
    `${API_BASE}${query ? `?${query}` : ""}`
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as PaginatedResponse<InvitationDto>,
    };
  }

  return response as ApiResponse<PaginatedResponse<InvitationDto>>;
}

/**
 * Get current user's invitations
 */
export async function getMyInvitations(): Promise<
  ApiResponse<InvitationDto[]>
> {
  const response = await apiGet<{ data?: InvitationDto[] }>(`${API_BASE}/me`);

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: Array.isArray(response.data)
        ? response.data
        : [response.data as InvitationDto],
    };
  }

  return response as ApiResponse<InvitationDto[]>;
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiGet<{ data?: InvitationDto }>(
    `${API_BASE}/token/${token}`
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as InvitationDto,
    };
  }

  return response as ApiResponse<InvitationDto>;
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(
  invitationId: string
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiGet<{ data?: InvitationDto }>(
    `${API_BASE}/${invitationId}`
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as InvitationDto,
    };
  }

  return response as ApiResponse<InvitationDto>;
}

/**
 * Create a new invitation
 */
export async function createInvitation(
  invitationData: CreateInvitationRequestDto
): Promise<ApiResponse<InvitationDto>> {
  const response = await apiPost<{ data?: InvitationDto }>(
    API_BASE,
    invitationData
  );

  // Handle nested response structure
  if (response.success && response.data) {
    if ((response.data as any).data) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as InvitationDto,
    };
  }

  return response as ApiResponse<InvitationDto>;
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  acceptData: AcceptInvitationRequestDto
): Promise<ApiResponse<boolean>> {
  const response = await apiPut<{ data?: boolean }>(
    `${API_BASE}/accept`,
    acceptData
  );

  // Handle nested response structure
  if (response.success && response.data !== undefined) {
    if ((response.data as any).data !== undefined) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as boolean,
    };
  }

  return response as ApiResponse<boolean>;
}

/**
 * Decline an invitation
 */
export async function declineInvitation(
  invitationId: string
): Promise<ApiResponse<boolean>> {
  const response = await apiPut<{ data?: boolean }>(
    `${API_BASE}/${invitationId}/decline`,
    {}
  );

  // Handle nested response structure
  if (response.success && response.data !== undefined) {
    if ((response.data as any).data !== undefined) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as boolean,
    };
  }

  return response as ApiResponse<boolean>;
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(
  invitationId: string
): Promise<ApiResponse<boolean>> {
  const response = await apiDelete<{ data?: boolean }>(
    `${API_BASE}/${invitationId}`
  );

  // Handle nested response structure
  if (response.success && response.data !== undefined) {
    if ((response.data as any).data !== undefined) {
      return {
        success: true,
        data: (response.data as any).data,
      };
    }
    return {
      success: true,
      data: response.data as boolean,
    };
  }

  return response as ApiResponse<boolean>;
}


