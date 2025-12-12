import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";
import { WorkspaceRolePermission } from "@/types";

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
