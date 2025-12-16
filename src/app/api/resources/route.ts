import { NextRequest, NextResponse } from "next/server";
import {
  mockDataStore,
  generateId,
  getResourcesForWorkspace,
} from "@/lib/mock-data";
import { WorkspaceResource } from "@/types";

// GET /api/resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    let resources = mockDataStore.workspaceResources;

    // Filter by workspace
    if (workspaceId) {
      resources = getResourcesForWorkspace(workspaceId);
    }

    // Filter by search
    if (search) {
      resources = resources.filter(
        (r) =>
          r.resourceName.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search))
      );
    }

    // Paginate
    const totalCount = resources.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedResources = resources.slice(
      startIndex,
      startIndex + pageSize
    );

    return NextResponse.json({
      success: true,
      data: paginatedResources,
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
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch resources" },
      },
      { status: 500 }
    );
  }
}

// POST /api/resources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceName, description, url, icon, workspaceId, parentId } =
      body;

    if (!resourceName || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Resource name and workspaceId are required",
          },
        },
        { status: 400 }
      );
    }

    const newResource: WorkspaceResource = {
      resourceId: generateId("res"),
      workspaceId,
      resourceName,
      description: description || "",
      url: url || "",
      icon: icon || "FolderTree",
      parentId: parentId || undefined,
      order:
        mockDataStore.workspaceResources.filter(
          (r) => r.workspaceId === workspaceId
        ).length + 1,
      isActive: true,
      createdBy: "user-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addResource(newResource);

    return NextResponse.json(
      {
        success: true,
        data: newResource,
        message: "Resource created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create resource" },
      },
      { status: 500 }
    );
  }
}







