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
  name: string;
  createdAt: string;
  isActive: boolean;
  createdBy: string;
}

export interface Workspace {
  workspaceId: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
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
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
