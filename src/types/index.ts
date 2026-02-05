/**
 * IMS shared types - used across app, store, services, and API routes.
 * Restored/consolidated so @/types resolves correctly.
 */

// ============================================================================
// User & Auth
// ============================================================================

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  status: UserStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export interface UserWithFullName extends User {
  fullName?: string;
}

export interface AuthSession {
  user: UserWithFullName;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface RegisterResponseData {
  userId?: string;
  email?: string;
  [key: string]: unknown;
}

export interface UsersListResponse {
  items?: User[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

// ============================================================================
// UserInfo (from /connect/userinfo)
// ============================================================================

export interface UserInfo {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  adminDetails?: {
    adminWorkspaces?: Array<{
      workspaceId: string;
      workspaceName: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ============================================================================
// Workspace
// ============================================================================

export interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  code?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  workspaceUrl?: string;
  dateCreated?: string;
  dateModified?: string;
  modifiedBy?: string | null;
}

// ============================================================================
// Workspace Resource
// ============================================================================

export interface WorkspaceResource {
  resourceId: string;
  workspaceId: string;
  resourceName?: string;
  description?: string;
  url?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceResourceTreeDto {
  resourceId: string;
  workspaceId: string;
  resourceName?: string | null;
  description?: string | null;
  url?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive?: boolean;
  children?: WorkspaceResourceTreeDto[] | null;
}

export interface CreateWorkspaceResourceRequestDto {
  resourceName: string;
  description?: string | null;
  url?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive?: boolean;
}

export interface UpdateWorkspaceResourceRequestDto {
  resourceName?: string;
  description?: string | null;
  url?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive?: boolean;
}

// ============================================================================
// Permission
// ============================================================================

export interface Permission {
  permissionId: string;
  permissionName?: string;
  permissionCode?: string;
  description?: string;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Workspace Role
// ============================================================================

export type MemberType = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceRole {
  workspaceRoleId: string;
  userWorkspaceId?: string;
  workspaceId?: string;
  name?: string;
  roleName?: string;
  description?: string;
  roleDescription?: string;
  isActive?: boolean;
  isSystemRole?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: unknown[];
}

export interface SimpleDomainRoleDto {
  workspaceRoleId: string;
  roleName: string;
}

// ============================================================================
// Workspace Member & Role Assignment
// ============================================================================

export interface WorkspaceMember {
  workspaceMemberId: string;
  tenantId?: string;
  workspaceId: string;
  userId?: string | null;
  type: MemberType;
  status: boolean;
  createdBy?: string;
  createdAt?: string;
  user?: User;
}

export interface WorkspaceMembersRole {
  workspaceMembersRoleId: string;
  workspaceMemberId: string;
  workspaceRoleId: string;
  createdBy?: string;
  createdAt?: string;
}

export interface WorkspaceRolePermission {
  workspaceRolePermissionId: string;
  workspaceRoleId: string;
  resourceId?: string;
  permissionId?: string;
  createdBy?: string;
  createdAt?: string;
}

// ============================================================================
// Role Resources (legacy / mock)
// ============================================================================

export interface RoleResources {
  roleResourcesId: string;
  workspaceRoleId: string;
  resourceId: string;
  createdBy?: string;
  createdAt?: string;
}

// ============================================================================
// Effective Permissions
// ============================================================================

export interface EffectivePermission {
  resourceId: string;
  resourceName?: string;
  permissionCode?: string;
  permissionName?: string;
}

export interface UserEffectivePermissions {
  userId: string;
  workspaceId: string;
  permissions: EffectivePermission[];
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

// ============================================================================
// Audit
// ============================================================================

export interface AuditLog {
  auditLogId: string;
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// Tenant
// ============================================================================

export interface TenantDto {
  tenantId: string;
  name?: string;
  [key: string]: unknown;
}

export interface SwitchTenantResponseDto {
  success?: boolean;
  token?: string;
  [key: string]: unknown;
}

// ============================================================================
// Invitations
// ============================================================================

export enum InvitationStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Declined = "Declined",
  Expired = "Expired",
}

export interface InvitationDto {
  invitationId: string;
  email: string;
  status?: InvitationStatus | string;
  workspaceIds?: string[];
  expiresAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateInvitationRequestDto {
  email: string;
  workspaceIds?: string[];
  roleIds?: string[];
  expiresInDays?: number;
  [key: string]: unknown;
}

// ============================================================================
// Admin Roles (POST /api/admin-roles, etc.)
// ============================================================================

export interface AdminRoleListItemDto {
  workspaceRoleId: string;
  roleName: string;
  isAdmin?: boolean;
}

export interface AdminRoleDto {
  workspaceRoleId: string;
  workspaceId: string;
  userWorkspaceId?: string;
  roleName: string;
  roleCode?: string | null;
  roleDescription?: string | null;
  isSystemRole: boolean;
  isAdmin: boolean;
  permissions?: AdminRolePermissionDto[];
}

export interface AdminRolePermissionDto {
  resourceId: string;
  resourceName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canImport?: boolean;
  canExport?: boolean;
  canApprove?: boolean;
  canManage?: boolean;
  canReject?: boolean;
}

export interface CreateAdminRoleRequestDto {
  roleName: string;
  roleCode?: string | null;
  roleDescription?: string | null;
  isAdmin: boolean;
}

export interface UpdateAdminRoleRequestDto {
  roleName: string;
  roleCode?: string | null;
  roleDescription?: string | null;
}

export interface AssignPermissionsToRoleRequestDto {
  resourceId: string;
  permissionIds: string[];
}

// ============================================================================
// WCO (Waste Collection Operator)
// ============================================================================

export interface WcoCompanyDto {
  id: string;
  name: string;
  description?: string;
  code?: string;
  [key: string]: unknown;
}

// ============================================================================
// UI
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
