import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiPost } from "@/lib/api-client";
import { WorkspaceMember } from "@/types";

// GET /api/workspaces/[workspaceId]/members - Get workspace members
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
    const endpoint = `/api/workspaces/${params.workspaceId}/members${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient<WorkspaceMember[]>(endpoint);
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
              : "Failed to fetch workspace members",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/members - Add member to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const { userId, type, status } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceMember>(
      `/api/workspaces/${params.workspaceId}/members`,
      {
        userId,
        type: type || "MEMBER",
        status: status !== undefined ? status : true,
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
              : "Failed to add workspace member",
        },
      },
      { status: 500 }
    );
  }
}
