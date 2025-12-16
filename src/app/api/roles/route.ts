import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, generateId } from "@/lib/mock-data";
import { WorkspaceRole } from "@/types";

// GET /api/roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    let roles = mockDataStore.workspaceRoles;

    // Filter by workspace
    if (workspaceId) {
      roles = roles.filter((r) => r.workspaceId === workspaceId);
    }

    // Filter by search
    if (search) {
      roles = roles.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search)
      );
    }

    // Paginate
    const totalCount = roles.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedRoles = roles.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data: paginatedRoles,
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
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch roles" },
      },
      { status: 500 }
    );
  }
}

// POST /api/roles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, workspaceId } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and workspaceId are required",
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate name in same workspace
    const existing = mockDataStore.workspaceRoles.find(
      (r) =>
        r.name.toLowerCase() === name.toLowerCase() &&
        r.workspaceId === workspaceId
    );
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_NAME",
            message: "A role with this name already exists in this workspace",
          },
        },
        { status: 409 }
      );
    }

    const newRole: WorkspaceRole = {
      workspaceRoleId: generateId("role"),
      userWorkspaceId: "uws-001",
      workspaceId,
      name,
      description: description || "",
      isActive: true,
      isSystemRole: false,
      createdBy: "user-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addRole(newRole);

    return NextResponse.json(
      {
        success: true,
        data: newRole,
        message: "Role created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create role" },
      },
      { status: 500 }
    );
  }
}







