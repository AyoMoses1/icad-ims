import type { AdminRolePermissionDto, Permission } from "@/types";

/**
 * Maps role's resource permission flags (canCreate, canRead, etc.) to permission IDs.
 * Matches permission codes/names case-insensitively (e.g. "Create", "WorkspaceRoles.Create").
 */
export function getAssignedPermissionIdsForResource(
  rolePermission: AdminRolePermissionDto | undefined,
  allPermissions: Permission[]
): string[] {
  if (!rolePermission) return [];
  if (!allPermissions?.length) return [];

  const actionToCodes: Record<string, string[]> = {
    canCreate: ["create"],
    canRead: ["read"],
    canUpdate: ["update"],
    canDelete: ["delete"],
    canImport: ["import"],
    canExport: ["export"],
    canApprove: ["approve"],
    canManage: ["manage"],
    canReject: ["reject"],
  };

  const assignedIds: string[] = [];
  for (const [flag, codes] of Object.entries(actionToCodes)) {
    const isAssigned = rolePermission[flag as keyof AdminRolePermissionDto];
    if (!isAssigned || typeof isAssigned !== "boolean") continue;

    for (const perm of allPermissions) {
      const codeLower = (perm.permissionCode || "").toLowerCase();
      const nameLower = (perm.permissionName || "").toLowerCase();
      const matches = codes.some(
        (c) =>
          codeLower === c ||
          codeLower.endsWith(`.${c}`) ||
          codeLower.endsWith(`_${c}`) ||
          codeLower.includes(`.${c}.`) ||
          codeLower.includes(`_${c}_`) ||
          codeLower.startsWith(`${c}.`) ||
          codeLower.startsWith(`${c}_`) ||
          nameLower.includes(c)
      );
      if (matches && !assignedIds.includes(perm.permissionId)) {
        assignedIds.push(perm.permissionId);
      }
    }
  }
  return assignedIds;
}
