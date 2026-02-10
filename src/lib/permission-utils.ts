import { Permission, WorkspaceResource } from "@/types";

export interface PermissionSummary {
  permissionId: string;
  permissionName?: string;
  permissionCode?: string;
}

export interface RolePermissionGroup {
  resourceId: string;
  resourceName: string;
  permissions: PermissionSummary[];
}

export interface PermissionAssignment {
  resourceId: string;
  permissionId?: string;
  permissionCode?: string;
}

const ACTION_PROPERTY_MAP: Record<string, string> = {
  canCreate: "CREATE",
  canRead: "READ",
  canUpdate: "UPDATE",
  canDelete: "DELETE",
  canImport: "IMPORT",
  canExport: "EXPORT",
  canApprove: "APPROVE",
  canManage: "MANAGE",
  canReject: "REJECT",
};

const normalizeToString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return null;
};

const pushAssignment = (
  assignments: PermissionAssignment[],
  resourceIdValue: unknown,
  permissionIdValue?: unknown,
  permissionCodeValue?: unknown
) => {
  const resourceId = normalizeToString(resourceIdValue);
  const permissionId = normalizeToString(permissionIdValue);
  const permissionCode =
    typeof permissionCodeValue === "string"
      ? permissionCodeValue
      : normalizeToString(permissionCodeValue);

  if (!resourceId || (!permissionId && !permissionCode)) {
    return;
  }

  assignments.push({
    resourceId,
    ...(permissionId ? { permissionId } : {}),
    ...(permissionCode ? { permissionCode } : {}),
  });
};

const handleResourcePermissionDto = (
  item: Record<string, unknown>,
  assignments: PermissionAssignment[]
) => {
  const resourceId =
    normalizeToString(item.resourceId) ||
    normalizeToString((item.resource as any)?.resourceId);
  if (!resourceId) {
    return;
  }

  Object.entries(ACTION_PROPERTY_MAP).forEach(([prop, code]) => {
    if (item[prop] === true) {
      pushAssignment(assignments, resourceId, undefined, code);
    }
  });
};

const handlePermissionItem = (
  item: unknown,
  assignments: PermissionAssignment[]
) => {
  if (!item || typeof item !== "object") {
    return;
  }

  const payload = item as Record<string, unknown>;

  const resourceId =
    normalizeToString(payload.resourceId) ||
    normalizeToString((payload.resource as any)?.resourceId) ||
    normalizeToString(payload.resource);
  const permissionId =
    normalizeToString(payload.permissionId) ||
    normalizeToString((payload.permission as any)?.permissionId) ||
    normalizeToString(payload.permission);
  const permissionCode =
    typeof payload.permissionCode === "string"
      ? payload.permissionCode
      : typeof (payload.permission as any)?.permissionCode === "string"
        ? ((payload.permission as any).permissionCode as string)
        : undefined;

  if (resourceId && (permissionId || permissionCode)) {
    pushAssignment(assignments, resourceId, permissionId, permissionCode);
    return;
  }

  const hasBooleanActions = Object.keys(ACTION_PROPERTY_MAP).some(
    (prop) => typeof payload[prop] === "boolean"
  );

  if (hasBooleanActions) {
    handleResourcePermissionDto(payload, assignments);
  }
};

export function extractPermissionAssignments(
  data: unknown
): PermissionAssignment[] {
  const assignments: PermissionAssignment[] = [];

  if (Array.isArray(data)) {
    data.forEach((item) => handlePermissionItem(item, assignments));
    return assignments;
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;

    if (Array.isArray(payload.items)) {
      payload.items.forEach((item) => handlePermissionItem(item, assignments));
      return assignments;
    }

    if (Array.isArray(payload.permissions)) {
      payload.permissions.forEach((item) =>
        handlePermissionItem(item, assignments)
      );
      return assignments;
    }

    if (
      Array.isArray(payload.permissionIds) &&
      (payload.resourceId || (payload.resource as any)?.resourceId)
    ) {
      const resourceId =
        payload.resourceId || (payload.resource as any)?.resourceId;
      (payload.permissionIds as unknown[]).forEach((permissionId) =>
        pushAssignment(assignments, resourceId, permissionId)
      );
      return assignments;
    }

    handlePermissionItem(payload, assignments);
  }

  return assignments;
}

export function groupPermissionAssignments(
  assignments: PermissionAssignment[],
  resources: WorkspaceResource[],
  permissions: Permission[]
): RolePermissionGroup[] {
  if (assignments.length === 0) {
    return [];
  }

  const resourceLookup = new Map(
    resources.map((resource) => [resource.resourceId, resource])
  );
  const permissionById = new Map(
    permissions.map((permission) => [permission.permissionId, permission])
  );
  const permissionByCode = new Map(
    permissions
      .filter((permission) => permission.permissionCode)
      .map((permission) => [
        permission.permissionCode!.toUpperCase(),
        permission,
      ])
  );

  const grouped = new Map<string, Map<string, PermissionSummary>>();

  assignments.forEach((assignment) => {
    const resourceId = assignment.resourceId;
    if (!resourceId) {
      return;
    }

    let resolvedPermission = assignment.permissionId
      ? permissionById.get(assignment.permissionId)
      : undefined;

    if (!resolvedPermission && assignment.permissionCode) {
      resolvedPermission = permissionByCode.get(
        assignment.permissionCode.toUpperCase()
      );
    }

    if (!grouped.has(resourceId)) {
      grouped.set(resourceId, new Map());
    }

    const fallbackIdBase =
      assignment.permissionId ||
      assignment.permissionCode ||
      `custom-${resourceId}-${grouped.get(resourceId)!.size}`;

    const summary: PermissionSummary = resolvedPermission
      ? {
          permissionId: resolvedPermission.permissionId,
          permissionName: resolvedPermission.permissionName,
          permissionCode: resolvedPermission.permissionCode,
        }
      : {
          permissionId: fallbackIdBase,
          permissionName:
            assignment.permissionCode ||
            assignment.permissionId ||
            "Custom Permission",
          permissionCode: assignment.permissionCode,
        };

    const permissionMap = grouped.get(resourceId)!;
    permissionMap.set(summary.permissionId, summary);
  });

  return Array.from(grouped.entries())
    .map(([resourceId, permissionMap]) => {
      const resource = resourceLookup.get(resourceId);
      return {
        resourceId,
        resourceName: resource?.resourceName || resourceId,
        permissions: Array.from(permissionMap.values()).sort((a, b) =>
          (
            a.permissionName ||
            a.permissionCode ||
            a.permissionId
          ).localeCompare(
            b.permissionName || b.permissionCode || b.permissionId
          )
        ),
      };
    })
    .sort((a, b) => a.resourceName.localeCompare(b.resourceName));
}

export function getPermissionIdsForResource(
  resourceId: string,
  groups: RolePermissionGroup[]
): string[] {
  const group = groups.find((g) => g.resourceId === resourceId);
  if (!group) {
    return [];
  }
  return group.permissions.map((permission) => permission.permissionId);
}

/** Map role resource permission flags (canCreate, canRead, etc.) to permission IDs using the full permission list */
export function resourcePermissionDtoToPermissionIds(
  rolePermission:
    | {
        resourceId?: string;
        canCreate?: boolean;
        canRead?: boolean;
        canUpdate?: boolean;
        canDelete?: boolean;
        canImport?: boolean;
        canExport?: boolean;
        canApprove?: boolean;
        canManage?: boolean;
        canReject?: boolean;
      }
    | undefined,
  allPermissions: Permission[]
): string[] {
  if (!rolePermission) return [];

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
    const isAssigned = rolePermission[flag as keyof typeof rolePermission];
    if (!isAssigned || typeof isAssigned !== "boolean") continue;

    for (const perm of allPermissions) {
      const codeLower = (perm.permissionCode || "").toLowerCase();
      const matches = codes.some(
        (c) =>
          codeLower === c ||
          codeLower.endsWith(`.${c}`) ||
          codeLower.endsWith(`_${c}`)
      );
      if (matches && !assignedIds.includes(perm.permissionId)) {
        assignedIds.push(perm.permissionId);
      }
    }
  }
  return assignedIds;
}
