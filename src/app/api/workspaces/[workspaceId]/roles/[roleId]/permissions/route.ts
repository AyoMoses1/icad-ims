import { NextRequest, NextResponse } from "next/server";
import { apiPost, apiGet, apiDeleteWithBody } from "@/lib/api-client";
import { WorkspaceRolePermission, WorkspaceRole } from "@/types";

// GET /api/workspaces/[workspaceId]/roles/[roleId]/permissions - Get permissions assigned to role
// Backend view endpoint is GET .../roles/{roleId} (no /permissions). We proxy to that and return the role (which includes permissions).
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    const endpoint = `/api/workspaces/${params.workspaceId}/roles/${params.roleId}`;

    const response = await apiGet<WorkspaceRole>(endpoint);

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
              : "Failed to fetch role permissions",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/roles/[roleId]/permissions - Assign permissions to role
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    const body = await request.json();
    const { resourceId, permissionIds } = body;

    if (!resourceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Resource ID is required",
          },
        },
        { status: 400 }
      );
    }

    if (
      !permissionIds ||
      !Array.isArray(permissionIds) ||
      permissionIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one permission ID is required",
          },
        },
        { status: 400 }
      );
    }

    const response = await apiPost<WorkspaceRolePermission>(
      `/api/workspaces/${params.workspaceId}/roles/${params.roleId}/permissions`,
      {
        resourceId,
        permissionIds,
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
              : "Failed to assign permissions to role",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/roles/[roleId]/permissions - Unassign permissions from role for a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    // Read body; support both PascalCase and camelCase for robustness,
    // but forward PascalCase (ResourceId, PermissionIds) to the backend.
    let resourceId: string | null = null;
    let permissionIds: string[] | undefined;

    try {
      const body = await request.json();
      if (body && typeof body === "object") {
        const candidateResourceId =
          (body as any).ResourceId ?? (body as any).resourceId;
        if (typeof candidateResourceId === "string") {
          resourceId = candidateResourceId;
        }

        const candidatePermissionIds =
          (body as any).PermissionIds ?? (body as any).permissionIds;
        if (Array.isArray(candidatePermissionIds)) {
          permissionIds = candidatePermissionIds.filter(
            (id: unknown): id is string => typeof id === "string" && !!id
          );
        }
      }
    } catch {
      // No / invalid JSON body
    }

    if (!resourceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Resource ID is required",
          },
        },
        { status: 400 }
      );
    }

    // Backend endpoint without query string; resource and permissions in body
    const endpoint = `/api/workspaces/${params.workspaceId}/roles/${params.roleId}/permissions`;

    // Forward body using PascalCase to match the contract:
    // {
    //   "ResourceId": "...",
    //   "PermissionIds": ["..."]
    // }
    const response = await apiDeleteWithBody(endpoint, {
      ResourceId: resourceId,
      PermissionIds: permissionIds,
    });

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
              : "Failed to unassign permissions from role",
        },
      },
      { status: 500 }
    );
  }
}
