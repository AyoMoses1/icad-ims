import { NextRequest, NextResponse } from "next/server";
import { apiGet } from "@/lib/api-client";
import { WorkspaceRole } from "@/types";

// GET /api/workspaces/[workspaceId]/roles/[roleId] - Get role with resources and permissions
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    const endpoint = `/api/workspaces/${params.workspaceId}/roles/${params.roleId}`;

    const response = await apiGet<WorkspaceRole & {
      permissions?: Array<{
        resourceId: string;
        resourceName: string;
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
        canImport?: boolean;
        canExport?: boolean;
        canApprove?: boolean;
        canManage?: boolean;
        canReject?: boolean;
      }>;
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
              : "Failed to fetch role resources and permissions",
        },
      },
      { status: 500 }
    );
  }
}
