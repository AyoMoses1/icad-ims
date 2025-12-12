import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiPut, apiDelete } from "@/lib/api-client";
import { Workspace } from "@/types";

// GET /api/workspaces/[workspaceId]
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const response = await apiClient<Workspace>(
      `/api/workspaces/${params.workspaceId}`
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
              : "Failed to fetch workspace",
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const { name, description, icon, color, isActive } = body;

    const response = await apiPut<Workspace>(
      `/api/workspaces/${params.workspaceId}`,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(isActive !== undefined && { isActive }),
      }
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
              : "Failed to update workspace",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const response = await apiDelete(`/api/workspaces/${params.workspaceId}`);
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
              : "Failed to delete workspace",
        },
      },
      { status: 500 }
    );
  }
}
