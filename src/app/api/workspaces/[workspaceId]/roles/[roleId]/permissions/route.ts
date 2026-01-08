import { NextRequest, NextResponse } from "next/server";
import { apiPost, apiGet } from "@/lib/api-client";
import { WorkspaceRolePermission } from "@/types";

// GET /api/workspaces/[workspaceId]/roles/[roleId]/permissions - Get permissions assigned to role
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");

    // Build query string
    const queryParams = new URLSearchParams();
    if (resourceId) {
      queryParams.append("resourceId", resourceId);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/workspaces/${params.workspaceId}/roles/${params.roleId}/permissions${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiGet<{
      permissionIds?: string[];
      permissions?: Array<{ permissionId: string; [key: string]: unknown }>;
    }>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch role permissions",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/roles/[roleId]/permissions - Assign permissions to role
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    const body = await request.json();
    const { resourceId, permissionIds } = body;

    if (!resourceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Resource ID is required",
          },
        },
        { status: 400 }
      );
    }

    if (
      !permissionIds ||
      !Array.isArray(permissionIds) ||
      permissionIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one permission ID is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceRolePermission>(
      `/api/workspaces/${params.workspaceId}/roles/${params.roleId}/permissions`,
      {
        resourceId,
        permissionIds,
      }
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to assign permissions to role",
        },
      },
      { status: 500 }
    );
  }
}
