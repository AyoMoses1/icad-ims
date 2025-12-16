import { NextRequest, NextResponse } from "next/server";
import {
  mockDataStore,
  getUserById,
  getResourceById,
  getPermissionById,
} from "@/lib/mock-data";
import { EffectivePermission, UserEffectivePermissions } from "@/types";

// GET /api/users/[userId]/effective-permissions?workspaceId=...
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    const user = getUserById(params.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    // Find user's tenant (for now, we'll assume tenant-001 for admin user)
    const tenantId = `tenant-00${params.userId.split("-")[1] || "1"}`;

    // Find workspace members for this user's tenant
    let workspaceMembers = mockDataStore.workspaceMembers.filter(
      (wm) => wm.tenantId === tenantId && wm.status
    );

    // Filter by workspace if specified
    if (workspaceId) {
      workspaceMembers = workspaceMembers.filter(
        (wm) => wm.workspaceId === workspaceId
      );
    }

    // Get member roles
    const memberRoleIds = workspaceMembers.map((wm) => wm.workspaceMemberId);
    const memberRoles = mockDataStore.workspaceMembersRoles.filter((wmr) =>
      memberRoleIds.includes(wmr.workspaceMemberId)
    );

    // Get role IDs
    const roleIds = memberRoles.map((mr) => mr.workspaceRoleId);

    // Get roles
    const roles = mockDataStore.workspaceRoles.filter((r) =>
      roleIds.includes(r.workspaceRoleId)
    );

    // Get role permissions
    const rolePermissions = mockDataStore.workspaceRolePermissions.filter(
      (rp) => roleIds.includes(rp.workspaceRoleId)
    );

    // Build effective permissions map
    const permissionsByResource = new Map<string, Set<string>>();

    for (const rp of rolePermissions) {
      if (!permissionsByResource.has(rp.resourceId)) {
        permissionsByResource.set(rp.resourceId, new Set());
      }
      permissionsByResource.get(rp.resourceId)!.add(rp.permissionId);
    }

    // Convert to effective permissions format
    const effectivePermissions: EffectivePermission[] = [];

    for (const [resourceId, permissionIds] of permissionsByResource) {
      const resource = getResourceById(resourceId);
      if (!resource) continue;

      const permissions = Array.from(permissionIds)
        .map((pid) => {
          const perm = getPermissionById(pid);
          if (!perm) return null;
          return {
            permissionId: perm.permissionId,
            permissionName: perm.permissionName,
            permissionCode: perm.permissionCode,
          };
        })
        .filter(Boolean) as EffectivePermission["permissions"];

      effectivePermissions.push({
        resourceId,
        resourceName: resource.resourceName,
        permissions,
      });
    }

    const result: UserEffectivePermissions = {
      userId: params.userId,
      workspaceId: workspaceId || "all",
      roles: roles.map((r) => ({
        roleId: r.workspaceRoleId,
        roleName: r.name,
      })),
      effectivePermissions,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to compute effective permissions",
        },
      },
      { status: 500 }
    );
  }
}







