// ============================================================================
// Core Enums
// ============================================================================

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum IdType {
  PASSPORT = "PASSPORT",
  NATIONAL_ID = "NATIONAL_ID",
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  VOTER_ID = "VOTER_ID",
  OTHER = "OTHER",
}

export enum MemberType {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  OWNER = "OWNER",
}

export enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ASSIGN = "ASSIGN",
  MANAGE = "MANAGE",
}

// ============================================================================
// User & Profile Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  country: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export interface UserWithFullName extends User {
  fullName: string;
}

export interface UsersListResponse {
  apiVersion: string;
  success: boolean;
  code: string;
  message: string;
  requestId: string;
  data: {
    items: [
      {
        id: string;
        userName: string;
        email: string;
        firstName: string;
        middleName: string;
        lastName: string;
        dateOfBirth: string;
        country: string;
        status: UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
        twoFactorEnabled: boolean;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        dateCreated: string;
        dateModified: string;
        fullName: string;
        tenantId: string;
      },
    ];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  error: {
    message: string;
    code: string;
  };
}

export interface Address {
  id: string;
  userId: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdBy: string;
}

export interface IdentificationDocument {
  id: string;
  userId: string;
  type: IdType;
  number: string;
  issuedDate?: string;
  expiryDate?: string;
  issuingCountry?: string;
  createdBy: string;
}

// ============================================================================
// Tenant & Workspace Types
// ============================================================================

export interface Tenant {
  tenantId: string;
  userId: string;
  name?: string | null;
  createdAt: string;
  isActive?: boolean;
  createdBy?: string;
  role?: string | null;
  joinedAt?: string | null;
}

export interface Workspace {
  workspaceId: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  workspaceUrl?: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWorkspace {
  tenantWorkspaceId: string;
  tenantId: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// Workspace Member Types
// ============================================================================

export interface WorkspaceMember {
  workspaceMemberId: string;
  tenantId: string;
  workspaceId: string;
  status: boolean;
  type: MemberType;
  createdBy: string;
  createdAt: string;
  user?: User;
  // Tenant-specific roles from API (Issue #1 & #2 fix)
  workspaceRoles?: string[];
  // Additional fields from API response
  tenantName?: string;
  workspaceName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userFullName?: string;
}

export interface WorkspaceMembersRole {
  workspaceMembersRoleId: string;
  workspaceMemberId: string;
  workspaceRoleId: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// Role Types
// ============================================================================

// Resource Permission DTO (from API)
export interface ResourcePermissionDto {
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

export interface WorkspaceRole {
  workspaceRoleId: string;
  userWorkspaceId: string;
  workspaceId: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystemRole: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Optional: Permissions array from API (Issue #3 fix)
  permissions?: ResourcePermissionDto[];
  // Backend may also return these fields directly
  roleName?: string;
  roleCode?: string | null;
  roleDescription?: string;
}

export interface RoleResources {
  roleResourcesId: string;
  workspaceRoleId: string;
  resourceId: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface WorkspaceResource {
  resourceId: string;
  workspaceId: string;
  resourceName: string;
  description?: string;
  url?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  children?: WorkspaceResource[];
}

// ============================================================================
// Permission Types
// ============================================================================

export interface Permission {
  permissionId: string;
  permissionName: string;
  permissionCode: string;
  description?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string | null;
  isSystemPermission?: boolean;
}

export interface WorkspaceRolePermission {
  workspaceRolePermissionId: string;
  workspaceRoleId: string;
  resourceId: string;
  permissionId: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// Effective Permissions (Computed)
// ============================================================================

export interface EffectivePermission {
  resourceId: string;
  resourceName: string;
  permissions: {
    permissionId: string;
    permissionName: string;
    permissionCode: string;
  }[];
}

export interface UserEffectivePermissions {
  userId: string;
  workspaceId: string;
  roles: {
    roleId: string;
    roleName: string;
  }[];
  effectivePermissions: EffectivePermission[];
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  auditLogId: string;
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthSession {
  user: UserWithFullName;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  address: RegisterAddress;
}

export interface RegisterResponseData {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dateCreated: string;
  dateModified: string;
  fullName: string;
  tenantId: string;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

// OAuth Token Response (matches API response format)
export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// User Info Response from /connect/userinfo
export interface UserInfo {
  sub?: string; // Subject (user ID)
  id?: string;
  username?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string; // First name
  family_name?: string; // Last name
  name?: string; // Full name
  middleName?: string;
  firstName?: string; // Alternative field name
  lastName?: string; // Alternative field name
  fullName?: string; // Alternative field name
  phoneNumber?: string;
  phone_verified?: boolean;
  dateOfBirth?: string;
  country?: string;
  status?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;
  permissions?: string[];
  roles?: string[];
  // Admin fields
  isAdmin?: boolean;
  isOwner?: boolean;
  adminDetails?: {
    isSystemAdmin: boolean;
    isWorkspaceAdmin: boolean;
    adminWorkspaces: Array<{
      workspaceId: string;
      workspaceName: string;
      adminRole: string;
      permissions: string[];
    }>;
    adminModules: Array<{
      module: string;
      role: string;
      permissions: string[];
    }>;
  };
  ownerDetails?: Record<string, unknown>;
  // Tenant switching fields (assist mode)
  isSwitched?: boolean;
  isInOwnTenant?: boolean;
  switchedTenantId?: string;
  switchedUserId?: string;
  switchedUserName?: string;
  switchedUserEmail?: string;
  [key: string]: unknown; // Allow additional properties
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// UI State Types
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  children?: SidebarItem[];
  badge?: number | string;
  requiredPermission?: string;
}

export interface TableColumn<T> {
  id: keyof T | string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export type FormMode = "create" | "edit" | "view";

// ============================================================================
// Invitation Types
// ============================================================================

export enum InvitationStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Declined = "Declined",
  Expired = "Expired",
}

export interface InvitationDto {
  invitationId: string;
  tenantId?: string | null;
  tenantName?: string | null;
  email?: string | null;
  userId?: string | null;
  invitedByUserId: string;
  invitedByName?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  invitationToken?: string | null;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  message?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  invitationLink?: string | null;
  workspaceIds?: string[] | null;
}

export interface CreateInvitationRequestDto {
  email: string;
  roleId?: string | null;
  workspaceIds?: string[] | null;
  message?: string | null;
}

export interface AcceptInvitationRequestDto {
  invitationToken: string;
  [key: string]: unknown;
}

// ============================================================================
// Tenant Management Types
// ============================================================================

export interface TenantDto {
  tenantId?: string | null;
  userId: string;
  name?: string | null;
  createdAt: string;
  role?: string | null;
  joinedAt?: string | null;
}

export interface SwitchTenantRequestDto {
  tenantId: string;
}

// Switch Tenant Response (LoginResponseDto format)
export interface SwitchTenantResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    tenantId: string;
  };
}

// ============================================================================
// Domain Roles Types (Simple workspace roles for lookups)
// ============================================================================

export interface SimpleDomainRoleDto {
  workspaceRoleId: string;
  roleName: string;
}

// ============================================================================
// WCO (Waste Collection Operator) Types – for admin user creation
// ============================================================================

/** WCO company item from Waste Management MasterData (for dropdown) */
export interface WcoCompanyDto {
  id: string;
  name: string;
  description?: string;
  code?: string;
}

// ============================================================================
// Admin Role Types
// ============================================================================

/**
 * AdminRoleListItemDto - Returned by GET /api/admin-roles?workspaceId=...
 * List endpoint only returns roleId and roleName (minimal response)
 */
export interface AdminRoleListItemDto {
  workspaceRoleId: string;
  roleName: string;
}

/**
 * AdminRoleDto - Full admin role details
 * Returned by GET /api/admin-roles/{id}?workspaceId=...
 * Also returned by POST (create) and PUT (update) operations
 */
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

/**
 * Permission details within an admin role
 */
export interface AdminRolePermissionDto {
  resourceId: string;
  resourceName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
  canApprove: boolean;
  canManage: boolean;
  canReject: boolean;
}

export interface CreateAdminRoleRequestDto {
  roleName: string;
  roleCode?: string | null;
  roleDescription?: string | null;
}

export interface UpdateAdminRoleRequestDto {
  roleName: string;
  roleCode?: string | null;
  roleDescription?: string | null;
}

/**
 * Request body for assigning/unassigning permissions to an admin role
 * Used by POST/DELETE /api/admin-roles/{id}/permissions
 */
export interface AssignPermissionsToRoleRequestDto {
  resourceId: string;
  permissionIds: string[];
}

// ============================================================================
// Workspace Resource Types
// ============================================================================

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
  resourceName?: string | null;
  description?: string | null;
  url?: string | null;
  parentId?: string | null;
  order?: number | null;
  isActive?: boolean | null;
}
