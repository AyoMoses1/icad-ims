import {
  User,
  UserStatus,
  Workspace,
  WorkspaceRole,
  WorkspaceResource,
  Permission,
  WorkspaceMember,
  MemberType,
  WorkspaceRolePermission,
  AuditLog,
  RoleResources,
  WorkspaceMembersRole,
} from "@/types";

// ============================================================================
// Users Seed Data
// ============================================================================

export const users: User[] = [
  {
    id: "user-001",
    username: "admin",
    email: "admin@mems.io",
    phoneNumber: "+2348012345678",
    firstName: "System",
    middleName: "",
    lastName: "Administrator",
    dateOfBirth: "1985-01-15",
    country: "Nigeria",
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    avatarUrl: "",
  },
  {
    id: "user-002",
    username: "johndoe",
    email: "john.doe@mems.io",
    phoneNumber: "+2348023456789",
    firstName: "John",
    middleName: "O.",
    lastName: "Doe",
    dateOfBirth: "1990-05-20",
    country: "Nigeria",
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-02-20T14:45:00Z",
    avatarUrl: "",
  },
  {
    id: "user-003",
    username: "janesmith",
    email: "jane.smith@mems.io",
    phoneNumber: "+2348034567890",
    firstName: "Jane",
    middleName: "A.",
    lastName: "Smith",
    dateOfBirth: "1988-08-10",
    country: "Nigeria",
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: true,
    createdAt: "2024-01-20T08:00:00Z",
    updatedAt: "2024-03-01T09:15:00Z",
    avatarUrl: "",
  },
  {
    id: "user-004",
    username: "mikebrown",
    email: "mike.brown@mems.io",
    phoneNumber: "+2348045678901",
    firstName: "Michael",
    middleName: "",
    lastName: "Brown",
    dateOfBirth: "1992-12-05",
    country: "Nigeria",
    status: UserStatus.PENDING,
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: "2024-03-10T16:20:00Z",
    updatedAt: "2024-03-10T16:20:00Z",
    avatarUrl: "",
  },
  {
    id: "user-005",
    username: "sarahwilson",
    email: "sarah.wilson@mems.io",
    phoneNumber: "+2348056789012",
    firstName: "Sarah",
    middleName: "K.",
    lastName: "Wilson",
    dateOfBirth: "1995-03-25",
    country: "Nigeria",
    status: UserStatus.INACTIVE,
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: false,
    createdAt: "2024-02-01T11:00:00Z",
    updatedAt: "2024-03-15T10:00:00Z",
    avatarUrl: "",
  },
];

// ============================================================================
// Workspaces Seed Data
// ============================================================================

export const workspaces: Workspace[] = [
  {
    workspaceId: "ws-001",
    name: "NIMASA Admin",
    description:
      "Nigerian Maritime Administration and Safety Agency Administration Portal",
    icon: "Ship",
    color: "#0066CC",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceId: "ws-002",
    name: "Payment Gateway",
    description: "Payment processing and reconciliation module",
    icon: "CreditCard",
    color: "#10B981",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceId: "ws-003",
    name: "Vessel Registration",
    description: "Ship and vessel registration management system",
    icon: "Anchor",
    color: "#6366F1",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-05T09:00:00Z",
  },
  {
    workspaceId: "ws-004",
    name: "Seafarer Certification",
    description: "Seafarer training and certification management",
    icon: "Award",
    color: "#F59E0B",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-02-15T11:20:00Z",
  },
  {
    workspaceId: "ws-005",
    name: "Analytics Dashboard",
    description: "Business intelligence and reporting module",
    icon: "BarChart3",
    color: "#8B5CF6",
    isActive: false,
    createdBy: "user-001",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-01T16:45:00Z",
  },
];

// ============================================================================
// Permissions Seed Data
// ============================================================================

export const permissions: Permission[] = [
  {
    permissionId: "perm-001",
    permissionName: "Create",
    permissionCode: "CREATE",
    description: "Ability to create new records",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-002",
    permissionName: "Read",
    permissionCode: "READ",
    description: "Ability to view records",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-003",
    permissionName: "Update",
    permissionCode: "UPDATE",
    description: "Ability to modify existing records",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-004",
    permissionName: "Delete",
    permissionCode: "DELETE",
    description: "Ability to remove records",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-005",
    permissionName: "Assign",
    permissionCode: "ASSIGN",
    description: "Ability to assign roles and permissions to users",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-006",
    permissionName: "Manage",
    permissionCode: "MANAGE",
    description: "Full management capabilities including all other permissions",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-007",
    permissionName: "Export",
    permissionCode: "EXPORT",
    description: "Ability to export data",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    permissionId: "perm-008",
    permissionName: "Approve",
    permissionCode: "APPROVE",
    description: "Ability to approve pending items",
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// Workspace Resources Seed Data
// ============================================================================

export const workspaceResources: WorkspaceResource[] = [
  // NIMASA Admin Resources
  {
    resourceId: "res-001",
    workspaceId: "ws-001",
    resourceName: "Dashboard",
    description: "Main dashboard overview",
    url: "/dashboard",
    icon: "LayoutDashboard",
    order: 1,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-002",
    workspaceId: "ws-001",
    resourceName: "User Management",
    description: "Manage system users",
    url: "/users",
    icon: "Users",
    order: 2,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-003",
    workspaceId: "ws-001",
    resourceName: "Role Management",
    description: "Manage roles and their permissions",
    url: "/roles",
    icon: "Shield",
    order: 3,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-004",
    workspaceId: "ws-001",
    resourceName: "Reports",
    description: "View and generate reports",
    url: "/reports",
    icon: "FileText",
    order: 4,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-005",
    workspaceId: "ws-001",
    resourceName: "Audit Logs",
    description: "View system audit logs",
    url: "/audit",
    icon: "History",
    order: 5,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Payment Gateway Resources
  {
    resourceId: "res-006",
    workspaceId: "ws-002",
    resourceName: "Payment Dashboard",
    description: "Payment overview and stats",
    url: "/payments/dashboard",
    icon: "LayoutDashboard",
    order: 1,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-007",
    workspaceId: "ws-002",
    resourceName: "Transactions",
    description: "View and manage transactions",
    url: "/payments/transactions",
    icon: "Receipt",
    order: 2,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    resourceId: "res-008",
    workspaceId: "ws-002",
    resourceName: "Reconciliation",
    description: "Payment reconciliation management",
    url: "/payments/reconciliation",
    icon: "CheckCircle",
    order: 3,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Vessel Registration Resources
  {
    resourceId: "res-009",
    workspaceId: "ws-003",
    resourceName: "Vessel Registry",
    description: "Manage registered vessels",
    url: "/vessels",
    icon: "Ship",
    order: 1,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-05T09:00:00Z",
  },
  {
    resourceId: "res-010",
    workspaceId: "ws-003",
    resourceName: "Applications",
    description: "Registration applications",
    url: "/vessels/applications",
    icon: "FileCheck",
    order: 2,
    isActive: true,
    createdBy: "user-001",
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-05T09:00:00Z",
  },
];

// ============================================================================
// Workspace Roles Seed Data
// ============================================================================

export const workspaceRoles: WorkspaceRole[] = [
  {
    workspaceRoleId: "role-001",
    userWorkspaceId: "uws-001",
    workspaceId: "ws-001",
    name: "Super Admin",
    description: "Full access to all features in NIMASA Admin",
    isActive: true,
    isSystemRole: true,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-002",
    userWorkspaceId: "uws-001",
    workspaceId: "ws-001",
    name: "Admin",
    description: "Administrative access to NIMASA Admin",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-003",
    userWorkspaceId: "uws-001",
    workspaceId: "ws-001",
    name: "User Manager",
    description: "Can manage users in NIMASA Admin",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-004",
    userWorkspaceId: "uws-001",
    workspaceId: "ws-001",
    name: "Viewer",
    description: "Read-only access to NIMASA Admin",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-005",
    userWorkspaceId: "uws-002",
    workspaceId: "ws-002",
    name: "Payment Admin",
    description: "Full access to Payment Gateway",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-006",
    userWorkspaceId: "uws-002",
    workspaceId: "ws-002",
    name: "Reconciliation Officer",
    description: "Can perform reconciliation tasks",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRoleId: "role-007",
    userWorkspaceId: "uws-003",
    workspaceId: "ws-003",
    name: "Vessel Registrar",
    description: "Can register and manage vessels",
    isActive: true,
    isSystemRole: false,
    createdBy: "user-001",
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-05T09:00:00Z",
  },
];

// ============================================================================
// Workspace Members Seed Data
// ============================================================================

export const workspaceMembers: WorkspaceMember[] = [
  {
    workspaceMemberId: "wm-001",
    tenantId: "tenant-001",
    workspaceId: "ws-001",
    status: true,
    type: MemberType.OWNER,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceMemberId: "wm-002",
    tenantId: "tenant-002",
    workspaceId: "ws-001",
    status: true,
    type: MemberType.ADMIN,
    createdBy: "user-001",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    workspaceMemberId: "wm-003",
    tenantId: "tenant-003",
    workspaceId: "ws-001",
    status: true,
    type: MemberType.MEMBER,
    createdBy: "user-001",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    workspaceMemberId: "wm-004",
    tenantId: "tenant-001",
    workspaceId: "ws-002",
    status: true,
    type: MemberType.OWNER,
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceMemberId: "wm-005",
    tenantId: "tenant-002",
    workspaceId: "ws-002",
    status: true,
    type: MemberType.MEMBER,
    createdBy: "user-001",
    createdAt: "2024-01-15T10:30:00Z",
  },
];

// ============================================================================
// Workspace Members Roles Seed Data
// ============================================================================

export const workspaceMembersRoles: WorkspaceMembersRole[] = [
  {
    workspaceMembersRoleId: "wmr-001",
    workspaceMemberId: "wm-001",
    workspaceRoleId: "role-001",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceMembersRoleId: "wmr-002",
    workspaceMemberId: "wm-002",
    workspaceRoleId: "role-002",
    createdBy: "user-001",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    workspaceMembersRoleId: "wmr-003",
    workspaceMemberId: "wm-003",
    workspaceRoleId: "role-004",
    createdBy: "user-001",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    workspaceMembersRoleId: "wmr-004",
    workspaceMemberId: "wm-004",
    workspaceRoleId: "role-005",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceMembersRoleId: "wmr-005",
    workspaceMemberId: "wm-005",
    workspaceRoleId: "role-006",
    createdBy: "user-001",
    createdAt: "2024-01-15T10:30:00Z",
  },
];

// ============================================================================
// Role Resources Seed Data
// ============================================================================

export const roleResources: RoleResources[] = [
  // Super Admin has access to all NIMASA Admin resources
  {
    roleResourcesId: "rr-001",
    workspaceRoleId: "role-001",
    resourceId: "res-001",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-002",
    workspaceRoleId: "role-001",
    resourceId: "res-002",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-003",
    workspaceRoleId: "role-001",
    resourceId: "res-003",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-004",
    workspaceRoleId: "role-001",
    resourceId: "res-004",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-005",
    workspaceRoleId: "role-001",
    resourceId: "res-005",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  // User Manager has access to User Management
  {
    roleResourcesId: "rr-006",
    workspaceRoleId: "role-003",
    resourceId: "res-001",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-007",
    workspaceRoleId: "role-003",
    resourceId: "res-002",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  // Viewer has read access to Dashboard and Reports
  {
    roleResourcesId: "rr-008",
    workspaceRoleId: "role-004",
    resourceId: "res-001",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    roleResourcesId: "rr-009",
    workspaceRoleId: "role-004",
    resourceId: "res-004",
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// Workspace Role Permissions Seed Data
// ============================================================================

export const workspaceRolePermissions: WorkspaceRolePermission[] = [
  // Super Admin has all permissions on all resources
  {
    workspaceRolePermissionId: "wrp-001",
    workspaceRoleId: "role-001",
    resourceId: "res-001",
    permissionId: "perm-006", // MANAGE
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRolePermissionId: "wrp-002",
    workspaceRoleId: "role-001",
    resourceId: "res-002",
    permissionId: "perm-006", // MANAGE
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRolePermissionId: "wrp-003",
    workspaceRoleId: "role-001",
    resourceId: "res-003",
    permissionId: "perm-006", // MANAGE
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  // User Manager permissions
  {
    workspaceRolePermissionId: "wrp-004",
    workspaceRoleId: "role-003",
    resourceId: "res-002",
    permissionId: "perm-001", // CREATE
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRolePermissionId: "wrp-005",
    workspaceRoleId: "role-003",
    resourceId: "res-002",
    permissionId: "perm-002", // READ
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRolePermissionId: "wrp-006",
    workspaceRoleId: "role-003",
    resourceId: "res-002",
    permissionId: "perm-003", // UPDATE
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  // Viewer permissions (read only)
  {
    workspaceRolePermissionId: "wrp-007",
    workspaceRoleId: "role-004",
    resourceId: "res-001",
    permissionId: "perm-002", // READ
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    workspaceRolePermissionId: "wrp-008",
    workspaceRoleId: "role-004",
    resourceId: "res-004",
    permissionId: "perm-002", // READ
    createdBy: "user-001",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ============================================================================
// Audit Logs Seed Data
// ============================================================================

export const auditLogs: AuditLog[] = [
  {
    auditLogId: "log-001",
    workspaceId: "ws-001",
    userId: "user-001",
    action: "CREATE",
    entityType: "User",
    entityId: "user-002",
    changes: { email: "john.doe@mems.io", firstName: "John", lastName: "Doe" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    auditLogId: "log-002",
    workspaceId: "ws-001",
    userId: "user-001",
    action: "UPDATE",
    entityType: "Role",
    entityId: "role-002",
    changes: { description: "Updated admin role description" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-01-20T14:00:00Z",
  },
  {
    auditLogId: "log-003",
    workspaceId: "ws-002",
    userId: "user-002",
    action: "CREATE",
    entityType: "Transaction",
    entityId: "txn-001",
    changes: { amount: 50000, currency: "NGN" },
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-02-01T09:15:00Z",
  },
  {
    auditLogId: "log-004",
    workspaceId: "ws-001",
    userId: "user-001",
    action: "ASSIGN",
    entityType: "UserRole",
    entityId: "wmr-003",
    changes: { userId: "user-003", roleId: "role-004" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    auditLogId: "log-005",
    workspaceId: "ws-001",
    userId: "user-002",
    action: "LOGIN",
    entityType: "Session",
    entityId: "session-002",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-03-15T08:30:00Z",
  },
];

// ============================================================================
// Mock Data Store (for mutations)
// ============================================================================

class MockDataStore {
  private _users: User[] = [...users];
  private _workspaces: Workspace[] = [...workspaces];
  private _permissions: Permission[] = [...permissions];
  private _workspaceResources: WorkspaceResource[] = [...workspaceResources];
  private _workspaceRoles: WorkspaceRole[] = [...workspaceRoles];
  private _workspaceMembers: WorkspaceMember[] = [...workspaceMembers];
  private _workspaceMembersRoles: WorkspaceMembersRole[] = [
    ...workspaceMembersRoles,
  ];
  private _roleResources: RoleResources[] = [...roleResources];
  private _workspaceRolePermissions: WorkspaceRolePermission[] = [
    ...workspaceRolePermissions,
  ];
  private _auditLogs: AuditLog[] = [...auditLogs];

  // Users
  get users() {
    return this._users;
  }
  addUser(user: User) {
    this._users.push(user);
  }
  updateUser(id: string, data: Partial<User>) {
    const index = this._users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this._users[index] = { ...this._users[index], ...data };
    }
  }
  deleteUser(id: string) {
    this._users = this._users.filter((u) => u.id !== id);
  }

  // Workspaces
  get workspaces() {
    return this._workspaces;
  }
  addWorkspace(workspace: Workspace) {
    this._workspaces.push(workspace);
  }
  updateWorkspace(id: string, data: Partial<Workspace>) {
    const index = this._workspaces.findIndex((w) => w.workspaceId === id);
    if (index !== -1) {
      this._workspaces[index] = { ...this._workspaces[index], ...data };
    }
  }
  deleteWorkspace(id: string) {
    this._workspaces = this._workspaces.filter((w) => w.workspaceId !== id);
  }

  // Permissions
  get permissions() {
    return this._permissions;
  }
  addPermission(permission: Permission) {
    this._permissions.push(permission);
  }
  updatePermission(id: string, data: Partial<Permission>) {
    const index = this._permissions.findIndex((p) => p.permissionId === id);
    if (index !== -1) {
      this._permissions[index] = { ...this._permissions[index], ...data };
    }
  }
  deletePermission(id: string) {
    this._permissions = this._permissions.filter((p) => p.permissionId !== id);
  }

  // Resources
  get workspaceResources() {
    return this._workspaceResources;
  }
  addResource(resource: WorkspaceResource) {
    this._workspaceResources.push(resource);
  }
  updateResource(id: string, data: Partial<WorkspaceResource>) {
    const index = this._workspaceResources.findIndex(
      (r) => r.resourceId === id
    );
    if (index !== -1) {
      this._workspaceResources[index] = {
        ...this._workspaceResources[index],
        ...data,
      };
    }
  }
  deleteResource(id: string) {
    this._workspaceResources = this._workspaceResources.filter(
      (r) => r.resourceId !== id
    );
  }

  // Roles
  get workspaceRoles() {
    return this._workspaceRoles;
  }
  addRole(role: WorkspaceRole) {
    this._workspaceRoles.push(role);
  }
  updateRole(id: string, data: Partial<WorkspaceRole>) {
    const index = this._workspaceRoles.findIndex(
      (r) => r.workspaceRoleId === id
    );
    if (index !== -1) {
      this._workspaceRoles[index] = { ...this._workspaceRoles[index], ...data };
    }
  }
  deleteRole(id: string) {
    this._workspaceRoles = this._workspaceRoles.filter(
      (r) => r.workspaceRoleId !== id
    );
  }

  // Workspace Members
  get workspaceMembers() {
    return this._workspaceMembers;
  }
  addWorkspaceMember(member: WorkspaceMember) {
    this._workspaceMembers.push(member);
  }

  // Workspace Members Roles
  get workspaceMembersRoles() {
    return this._workspaceMembersRoles;
  }
  addMemberRole(memberRole: WorkspaceMembersRole) {
    this._workspaceMembersRoles.push(memberRole);
  }
  deleteMemberRole(id: string) {
    this._workspaceMembersRoles = this._workspaceMembersRoles.filter(
      (r) => r.workspaceMembersRoleId !== id
    );
  }

  // Role Resources
  get roleResources() {
    return this._roleResources;
  }
  addRoleResource(roleResource: RoleResources) {
    this._roleResources.push(roleResource);
  }
  deleteRoleResource(id: string) {
    this._roleResources = this._roleResources.filter(
      (r) => r.roleResourcesId !== id
    );
  }

  // Workspace Role Permissions
  get workspaceRolePermissions() {
    return this._workspaceRolePermissions;
  }
  addRolePermission(rolePermission: WorkspaceRolePermission) {
    this._workspaceRolePermissions.push(rolePermission);
  }
  deleteRolePermission(id: string) {
    this._workspaceRolePermissions = this._workspaceRolePermissions.filter(
      (r) => r.workspaceRolePermissionId !== id
    );
  }

  // Audit Logs
  get auditLogs() {
    return this._auditLogs;
  }
  addAuditLog(log: AuditLog) {
    this._auditLogs.push(log);
  }

  // Reset to initial state
  reset() {
    this._users = [...users];
    this._workspaces = [...workspaces];
    this._permissions = [...permissions];
    this._workspaceResources = [...workspaceResources];
    this._workspaceRoles = [...workspaceRoles];
    this._workspaceMembers = [...workspaceMembers];
    this._workspaceMembersRoles = [...workspaceMembersRoles];
    this._roleResources = [...roleResources];
    this._workspaceRolePermissions = [...workspaceRolePermissions];
    this._auditLogs = [...auditLogs];
  }
}

export const mockDataStore = new MockDataStore();

// ============================================================================
// Helper Functions
// ============================================================================

export function getUserFullName(user: User): string {
  const parts = [user.firstName, user.middleName, user.lastName].filter(
    Boolean
  );
  return parts.join(" ");
}

export function getUserById(id: string): User | undefined {
  return mockDataStore.users.find((u) => u.id === id);
}

export function getWorkspaceById(id: string): Workspace | undefined {
  return mockDataStore.workspaces.find((w) => w.workspaceId === id);
}

export function getRoleById(id: string): WorkspaceRole | undefined {
  return mockDataStore.workspaceRoles.find((r) => r.workspaceRoleId === id);
}

export function getResourceById(id: string): WorkspaceResource | undefined {
  return mockDataStore.workspaceResources.find((r) => r.resourceId === id);
}

export function getPermissionById(id: string): Permission | undefined {
  return mockDataStore.permissions.find((p) => p.permissionId === id);
}

export function getResourcesForWorkspace(
  workspaceId: string
): WorkspaceResource[] {
  return mockDataStore.workspaceResources.filter(
    (r) => r.workspaceId === workspaceId && r.isActive
  );
}

export function getRolesForWorkspace(workspaceId: string): WorkspaceRole[] {
  return mockDataStore.workspaceRoles.filter(
    (r) => r.workspaceId === workspaceId && r.isActive
  );
}

export function getMembersForWorkspace(workspaceId: string): WorkspaceMember[] {
  return mockDataStore.workspaceMembers.filter(
    (m) => m.workspaceId === workspaceId && m.status
  );
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
