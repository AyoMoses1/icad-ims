import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { WorkspaceResource } from "@/types";

// GET /api/workspaces/[workspaceId]/menu - Get workspace menu
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const response = await apiClient<WorkspaceResource[]>(
      `/api/workspaces/${params.workspaceId}/menu`
    );
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
              : "Failed to fetch workspace menu",
        },
      },
      { status: 500 }
    );
  }
}
