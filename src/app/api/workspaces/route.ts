import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, generateId } from "@/lib/mock-data";
import { Workspace } from "@/types";

// GET /api/workspaces - List all workspaces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let workspaces = mockDataStore.workspaces;

    // Filter by active status
    if (!includeInactive) {
      workspaces = workspaces.filter((w) => w.isActive);
    }

    // Filter by search
    if (search) {
      workspaces = workspaces.filter(
        (w) =>
          w.name.toLowerCase().includes(search) ||
          w.description.toLowerCase().includes(search)
      );
    }

    // Paginate
    const totalCount = workspaces.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedWorkspaces = workspaces.slice(
      startIndex,
      startIndex + pageSize
    );

    return NextResponse.json({
      success: true,
      data: paginatedWorkspaces,
      pageNumber: page,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch workspaces",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Name is required" },
        },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = mockDataStore.workspaces.find(
      (w) => w.name.toLowerCase() === name.toLowerCase()
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

    const newWorkspace: Workspace = {
      workspaceId: generateId("ws"),
      name,
      description: description || "",
      icon: icon || "Boxes",
      color: color || "#6366F1",
      isActive: true,
      createdBy: "user-001", // Would come from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addWorkspace(newWorkspace);

    return NextResponse.json(
      {
        success: true,
        data: newWorkspace,
        message: "Workspace created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create workspace",
        },
      },
      { status: 500 }
    );
  }
}



