import { NextRequest, NextResponse } from "next/server";
import { apiGet } from "@/lib/api-client";
import { WorkspaceResource } from "@/types";

// GET /api/workspaces/[workspaceId]/roles/[roleId]/resources - Get resources assigned to role
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; roleId: string } }
) {
  try {
    // First, get the role's permissions to extract resource IDs
    const permissionsResult = await apiGet<{
      permissionIds?: string[];
      permissions?: Array<{
        permissionId: string;
        resourceId?: string;
        resourceName?: string;
        [key: string]: unknown;
      }>;
    }>(`/api/workspaces/${params.workspaceId}/roles/${params.roleId}`);

    if (!permissionsResult.success || !permissionsResult.data) {
      return NextResponse.json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Role permissions not found",
        },
      });
    }

    // Extract unique resource IDs from permissions
    const resourceIds = new Set<string>();
    const resourceMap = new Map<string, { resourceId: string; resourceName?: string }>();

    const permissions = permissionsResult.data.permissions || [];
    
    // If permissions array exists, extract resourceId from each permission
    if (Array.isArray(permissions)) {
      permissions.forEach((perm: any) => {
        if (perm.resourceId) {
          resourceIds.add(perm.resourceId);
          if (!resourceMap.has(perm.resourceId)) {
            resourceMap.set(perm.resourceId, {
              resourceId: perm.resourceId,
              resourceName: perm.resourceName,
            });
          }
        }
      });
    }

    // If no resources found in permissions, return empty array
    if (resourceIds.size === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No resources assigned to this role",
      });
    }

    // Get all workspace resources to enrich with full resource details
    const allResourcesResult = await apiGet<WorkspaceResource[]>(
      `/api/workspaces/${params.workspaceId}/resources`
    );

    let resources: WorkspaceResource[] = [];

    if (allResourcesResult.success && allResourcesResult.data) {
      const allResources = Array.isArray(allResourcesResult.data)
        ? allResourcesResult.data
        : [];

      // Filter to only include resources that the role has permissions for
      resources = allResources.filter((resource) =>
        resourceIds.has(resource.resourceId)
      );

      // If some resources weren't found in the full list, create minimal resource objects
      // from the permission data
      resourceIds.forEach((resourceId) => {
        const found = resources.find((r) => r.resourceId === resourceId);
        if (!found) {
          const permData = resourceMap.get(resourceId);
          if (permData) {
            resources.push({
              resourceId: permData.resourceId,
              resourceName: permData.resourceName || "Unknown Resource",
              workspaceId: params.workspaceId,
              description: null,
              url: null,
              icon: null,
              parentId: null,
              order: 0,
              isActive: true,
              createdBy: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as WorkspaceResource);
          }
        }
      });
    } else {
      // Fallback: create resources from permission data only
      resources = Array.from(resourceIds).map((resourceId) => {
        const permData = resourceMap.get(resourceId);
        return {
          resourceId: permData?.resourceId || resourceId,
          resourceName: permData?.resourceName || "Unknown Resource",
          workspaceId: params.workspaceId,
          description: null,
          url: null,
          icon: null,
          parentId: null,
          order: 0,
          isActive: true,
          createdBy: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as WorkspaceResource;
      });
    }

    return NextResponse.json({
      success: true,
      data: resources,
      message: "Resources retrieved successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch role resources",
        },
      },
      { status: 500 }
    );
  }
}
