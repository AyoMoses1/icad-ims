import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiPost } from "@/lib/api-client";
import { WorkspaceRole } from "@/types";

// GET /api/workspaces/[workspaceId]/roles - Get workspace roles
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
    const endpoint = `/api/workspaces/${params.workspaceId}/roles${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient<WorkspaceRole[]>(endpoint);
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
              : "Failed to fetch workspace roles",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/roles - Create workspace role
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Role name is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceRole>(
      `/api/workspaces/${params.workspaceId}/roles`,
      {
        name,
        roleDescription: description || "",
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
              : "Failed to create workspace role",
        },
      },
      { status: 500 }
    );
  }
}
