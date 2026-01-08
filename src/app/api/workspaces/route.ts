import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiPost } from "@/lib/api-client";
import { Workspace } from "@/types";

// GET /api/workspaces - List all workspaces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    const includeInactive = searchParams.get("includeInactive");

    // Build query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (page) queryParams.append("page", page);
    if (pageSize) queryParams.append("pageSize", pageSize);
    if (includeInactive) queryParams.append("includeInactive", includeInactive);

    const queryString = queryParams.toString();
    const endpoint = `/api/workspaces${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient<Workspace[]>(endpoint);
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
              : "Failed to fetch workspaces",
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
    const { name, description, icon, color, isActive } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Name is required" },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<Workspace>("/api/workspaces", {
      name,
      description: description || "",
      icon: icon || "Boxes",
      color: color || "#6366F1",
      isActive: isActive !== undefined ? isActive : true,
    });

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
              : "Failed to create workspace",
        },
      },
      { status: 500 }
    );
  }
}
