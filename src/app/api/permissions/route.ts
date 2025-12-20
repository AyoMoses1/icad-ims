import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, generateId } from "@/lib/mock-data";
import { Permission } from "@/types";

// GET /api/permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    let permissions = mockDataStore.permissions;

    // Filter by search
    if (search) {
      permissions = permissions.filter(
        (p) =>
          p.permissionName.toLowerCase().includes(search) ||
          p.permissionCode.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    // Paginate
    const totalCount = permissions.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedPermissions = permissions.slice(
      startIndex,
      startIndex + pageSize
    );

    return NextResponse.json({
      success: true,
      data: paginatedPermissions,
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
          message: "Failed to fetch permissions",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/permissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { permissionName, permissionCode, description } = body;

    if (!permissionName || !permissionCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Permission name and code are required",
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = mockDataStore.permissions.find(
      (p) => p.permissionCode.toUpperCase() === permissionCode.toUpperCase()
    );
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_CODE",
            message: "A permission with this code already exists",
          },
        },
        { status: 409 }
      );
    }

    const newPermission: Permission = {
      permissionId: generateId("perm"),
      permissionName,
      permissionCode: permissionCode.toUpperCase(),
      description: description || "",
      isActive: true,
      createdBy: "user-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addPermission(newPermission);

    return NextResponse.json(
      {
        success: true,
        data: newPermission,
        message: "Permission created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create permission",
        },
      },
      { status: 500 }
    );
  }
}
