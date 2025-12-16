import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";
import { WorkspaceMembersRole } from "@/types";

// POST /api/workspaces/[workspaceId]/members/[memberId]/roles - Assign role to member
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const body = await request.json();
    const { workspaceRoleId } = body;

    if (!workspaceRoleId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "workspaceRoleId is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceMembersRole>(
      `/api/workspaces/${params.workspaceId}/members/${params.memberId}/roles`,
      {
        workspaceRoleId,
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
              : "Failed to assign roles to member",
        },
      },
      { status: 500 }
    );
  }
}
