import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiPost } from "@/lib/api-client";
import { WorkspaceResource } from "@/types";

// GET /api/workspaces/[workspaceId]/resources - Get workspace resources
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    // Build query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (page) queryParams.append("page", page);
    if (pageSize) queryParams.append("pageSize", pageSize);

    const queryString = queryParams.toString();
    const endpoint = `/api/workspaces/${params.workspaceId}/resources${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient<WorkspaceResource[]>(endpoint);
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
              : "Failed to fetch workspace resources",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/resources - Create workspace resource
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const { resourceName, description, url, icon, parentId, order, isActive } =
      body;

    if (!resourceName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Resource name is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceResource>(
      `/api/workspaces/${params.workspaceId}/resources`,
      {
        resourceName,
        description: description || "",
        url: url || "",
        icon: icon || "FolderTree",
        parentId: parentId || undefined,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
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
              : "Failed to create workspace resource",
        },
      },
      { status: 500 }
    );
  }
}
