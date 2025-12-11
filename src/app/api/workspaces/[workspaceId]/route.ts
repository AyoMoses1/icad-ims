import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, getWorkspaceById } from "@/lib/mock-data";

// GET /api/workspaces/[workspaceId]
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const workspace = getWorkspaceById(params.workspaceId);

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Workspace not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch workspace" },
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
    const workspace = getWorkspaceById(params.workspaceId);

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Workspace not found" },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, icon, color, isActive } = body;

    // Check for duplicate name (excluding current workspace)
    if (name && name !== workspace.name) {
      const existing = mockDataStore.workspaces.find(
        (w) =>
          w.name.toLowerCase() === name.toLowerCase() &&
          w.workspaceId !== params.workspaceId
      );
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_NAME",
              message: "A workspace with this name already exists",
            },
          },
          { status: 409 }
        );
      }
    }

    mockDataStore.updateWorkspace(params.workspaceId, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString(),
    });

    const updatedWorkspace = getWorkspaceById(params.workspaceId);

    return NextResponse.json({
      success: true,
      data: updatedWorkspace,
      message: "Workspace updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update workspace",
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
    const workspace = getWorkspaceById(params.workspaceId);

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Workspace not found" },
        },
        { status: 404 }
      );
    }

    mockDataStore.deleteWorkspace(params.workspaceId);

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete workspace",
        },
      },
      { status: 500 }
    );
  }
}


