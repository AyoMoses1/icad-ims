# Backend Tenancy Requirements Document

## IMS (Identity Management System) - Backend Adjustments

**Document Version:** 1.0  
**Date:** January 2025  
**Status:** Requirements Specification  
**Target:** Backend Development Team

---

## Executive Summary

This document outlines critical backend adjustments required to transform the IMS system into a **highly tenant-aware, multi-tenant architecture**. The changes will ensure proper data isolation, role management, and user onboarding workflows across different tenants.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Requirements](#core-requirements)
3. [Detailed Specifications](#detailed-specifications)
4. [API Endpoint Modifications](#api-endpoint-modifications)
5. [Data Model Changes](#data-model-changes)
6. [Workflow Specifications](#workflow-specifications)
7. [Implementation Priority](#implementation-priority)
8. [Testing Requirements](#testing-requirements)

---

## 1. Overview

### Current State

- The system currently has basic tenant support (TenantId = User.Id on registration)
- Endpoints may not consistently enforce tenant isolation
- Role and permission management may not be fully tenant-scoped
- User invitation flow may not handle tenant context properly

### Target State

- **All endpoints must be tenant-aware** and enforce tenant isolation
- **Automatic owner role creation** with full permissions on tenant creation
- **Streamlined member invitation** with account creation or tenant addition
- **Tenant-scoped permissions** that can be extended per tenant

---

## 2. Core Requirements

### 2.1 Tenant-Based Architecture (CRITICAL)

**Requirement:** All API endpoints must operate within a tenant context.

**Specification:**

- Every authenticated request must include a tenant identifier
- All data operations (CRUD) must be scoped to the current tenant
- Cross-tenant data access must be explicitly prevented
- Tenant context should be extracted from:
  1. JWT token claims (preferred)
  2. HTTP header (`X-Tenant-Id`)
  3. Query parameter (fallback, not recommended for sensitive operations)

**Impact Areas:**

- All existing endpoints must be reviewed and updated
- Database queries must include tenant filtering
- Authorization middleware must validate tenant access

---

### 2.2 Default Owner Role Creation (HIGH PRIORITY)

**Requirement:** Upon tenant creation (user registration/onboarding), automatically create a default "Owner" role with all available permissions.

**Specification:**

#### 2.2.1 Role Creation

- **Role Name:** "Owner" (or configurable default name)
- **Role Code:** "OWNER" (or configurable default code)
- **Tenant Scope:** Created under the new tenant
- **Is System Role:** `true` (cannot be deleted, can be modified with restrictions)

#### 2.2.2 Permission Assignment

- **All Workspaces:** Owner role should have access to all workspaces within the tenant
- **All Resources:** Owner role should have access to all resources within the tenant
- **Default Permissions:** Assign all default permissions available in the system
- **Permission Level:** Full access (Create, Read, Update, Delete) for all operations

#### 2.2.3 User Assignment

- The user who created the tenant (onboarded) must be automatically assigned the Owner role
- This assignment should happen atomically with tenant creation
- The user should have immediate access to all tenant resources

**Implementation Flow:**

```
1. User Registration/Onboarding
   ↓
2. Create Tenant
   ↓
3. Create "Owner" Role (under tenant)
   ↓
4. Fetch All Workspaces (for tenant)
   ↓
5. Fetch All Resources (for tenant)
   ↓
6. Fetch Default Permissions (system-wide or tenant-specific)
   ↓
7. Assign All Workspaces to Owner Role
   ↓
8. Assign All Resources to Owner Role
   ↓
9. Assign All Default Permissions to Owner Role
   ↓
10. Assign Owner Role to User
   ↓
11. Return Success Response
```

**Error Handling:**

- If any step fails, rollback the entire operation
- Return clear error messages indicating which step failed
- Log all failures for debugging

---

### 2.3 Member Invitation Workflow (HIGH PRIORITY)

**Requirement:** When inviting a member to a tenant, handle both new and existing users appropriately.

#### 2.3.1 Invitation for New Users (No Account)

**Workflow:**

1. Tenant admin/owner invites user by email
2. System checks if email exists in database
3. If email does NOT exist:
   - Create invitation record with:
     - Email address
     - Tenant ID
     - Invited by (user ID)
     - Invitation token (unique, time-limited)
     - Status: "Pending"
     - Expiration date (e.g., 7 days)
   - Send invitation email containing:
     - Welcome message
     - Tenant name/organization name
     - Invitation link with token
     - Instructions to create account
     - Expiration notice
4. User clicks invitation link
5. User is redirected to registration page with:
   - Pre-filled email (from invitation)
   - Invitation token in URL/state
   - Tenant context
6. User completes registration
7. System:
   - Creates user account
   - Associates user with tenant (via invitation)
   - Assigns default role (if specified in invitation) or basic member role
   - Marks invitation as "Accepted"
   - Sends welcome email

**Email Template Requirements:**

- Subject: "You've been invited to join [Tenant Name]"
- Content should include:
  - Inviter's name
  - Tenant/organization name
  - Clear call-to-action button/link
  - Expiration date
  - Support contact information

#### 2.3.2 Invitation for Existing Users (Has Account)

**Workflow:**

1. Tenant admin/owner invites user by email
2. System checks if email exists in database
3. If email EXISTS:
   - Create invitation record with:
     - Email address
     - Tenant ID
     - User ID (if found)
     - Invited by (user ID)
     - Invitation token (unique, time-limited)
     - Status: "Pending"
     - Expiration date
   - Send notification email containing:
     - Notification that they've been invited
     - Tenant name/organization name
     - Accept/Decline buttons/links
     - Link to view invitation in dashboard
4. User receives notification (email + in-app if logged in)
5. User accepts invitation:
   - System associates user with tenant
   - Assigns default role (if specified) or basic member role
   - Marks invitation as "Accepted"
   - Tenant appears in user's tenant list/selector
6. User can now switch to the new tenant and access its resources

**Important:**

- Existing users should see a notification badge/indicator for pending invitations
- Users should be able to accept/decline invitations from their dashboard
- Users should be able to see all tenants they belong to
- Tenant switching should be seamless

---

### 2.4 Tenant-Scoped Permissions (MEDIUM PRIORITY)

**Requirement:** Allow creation and management of custom permissions specific to a tenant.

**Specification:**

#### 2.4.1 Permission Types

- **System Permissions:** Global permissions available to all tenants (read-only, managed by system)
- **Tenant Permissions:** Custom permissions created and managed within a tenant scope

#### 2.4.2 Permission Management

- Tenant admins/owners should be able to:
  - Create new permissions under their tenant
  - Edit tenant-specific permissions (not system permissions)
  - Delete tenant-specific permissions (with validation: ensure no roles are using it)
  - View all permissions (system + tenant-specific)
  - Assign tenant permissions to roles

#### 2.4.3 Permission Structure

```json
{
  "id": "guid",
  "name": "Custom Permission Name",
  "code": "CUSTOM_PERMISSION_CODE",
  "description": "Description of what this permission allows",
  "tenantId": "guid",
  "isSystemPermission": false,
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "createdBy": "user-id"
}
```

**Validation Rules:**

- Permission codes must be unique within a tenant
- Permission codes should follow naming conventions (e.g., UPPER_SNAKE_CASE)
- Cannot delete permissions that are assigned to active roles
- System permissions cannot be modified or deleted

---

## 3. Detailed Specifications

### 3.1 Tenant Context in JWT Token

**Requirement:** JWT tokens must include tenant information.

**Token Claims:**

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenant_id": "tenant-guid",
  "tenant_name": "Tenant Name",
  "roles": ["OWNER", "ADMIN"],
  "permissions": ["permission1", "permission2"],
  "exp": 1234567890
}
```

**Implementation:**

- Include `tenant_id` in token claims during login
- Support multiple tenants (if user belongs to multiple):
  - Primary tenant in `tenant_id`
  - All tenants in `tenant_ids` array
- Token refresh should maintain tenant context

---

### 3.2 API Endpoint Tenant Enforcement

**Middleware Pattern:**

```csharp
// Pseudo-code example
[TenantRequired]
public class TenantAwareController : ControllerBase
{
    // All endpoints automatically have tenant context
    // Tenant ID extracted from token/header
    // All queries filtered by tenant
}
```

**Query Filtering:**

- All database queries must include `WHERE TenantId = @tenantId`
- Use repository pattern with tenant-aware base repository
- Prevent accidental cross-tenant data access

---

### 3.3 Default Permissions Configuration

**Requirement:** Define a set of default permissions that should be assigned to the Owner role.

**Suggested Default Permissions:**

- `WORKSPACE:*` - All workspace operations
- `RESOURCE:*` - All resource operations
- `ROLE:*` - All role management operations
- `USER:*` - All user management operations
- `PERMISSION:*` - All permission management operations
- `TENANT:*` - All tenant management operations (if applicable)
- `INVITATION:*` - All invitation management operations

**Configuration:**

- Store default permissions in configuration file or database
- Allow system administrators to modify default permissions
- Ensure backward compatibility when adding new default permissions

---

## 4. API Endpoint Modifications

### 4.1 Endpoints Requiring Tenant Context

**All endpoints must include tenant context. Examples:**

#### 4.1.1 User Management

```
GET    /api/users                    → GET /api/tenants/{tenantId}/users
POST   /api/users                    → POST /api/tenants/{tenantId}/users
GET    /api/users/{userId}           → GET /api/tenants/{tenantId}/users/{userId}
PUT    /api/users/{userId}           → PUT /api/tenants/{tenantId}/users/{userId}
DELETE /api/users/{userId}           → DELETE /api/tenants/{tenantId}/users/{userId}
```

#### 4.1.2 Role Management

```
GET    /api/roles                    → GET /api/tenants/{tenantId}/roles
POST   /api/roles                    → POST /api/tenants/{tenantId}/roles
GET    /api/roles/{roleId}           → GET /api/tenants/{tenantId}/roles/{roleId}
PUT    /api/roles/{roleId}           → PUT /api/tenants/{tenantId}/roles/{roleId}
DELETE /api/roles/{roleId}           → DELETE /api/tenants/{tenantId}/roles/{roleId}
```

#### 4.1.3 Permission Management

```
GET    /api/permissions              → GET /api/tenants/{tenantId}/permissions
POST   /api/permissions              → POST /api/tenants/{tenantId}/permissions (tenant-specific)
GET    /api/permissions/{permId}     → GET /api/tenants/{tenantId}/permissions/{permId}
PUT    /api/permissions/{permId}     → PUT /api/tenants/{tenantId}/permissions/{permId} (if tenant-specific)
DELETE /api/permissions/{permId}     → DELETE /api/tenants/{tenantId}/permissions/{permId} (if tenant-specific)
```

#### 4.1.4 Workspace Management

```
GET    /api/workspaces               → GET /api/tenants/{tenantId}/workspaces
POST   /api/workspaces               → POST /api/tenants/{tenantId}/workspaces
GET    /api/workspaces/{wsId}        → GET /api/tenants/{tenantId}/workspaces/{wsId}
PUT    /api/workspaces/{wsId}        → PUT /api/tenants/{tenantId}/workspaces/{wsId}
DELETE /api/workspaces/{wsId}        → DELETE /api/tenants/{tenantId}/workspaces/{wsId}
```

#### 4.1.5 Resource Management

```
GET    /api/resources                → GET /api/tenants/{tenantId}/resources
POST   /api/resources                → POST /api/tenants/{tenantId}/resources
GET    /api/resources/{resId}        → GET /api/tenants/{tenantId}/resources/{resId}
PUT    /api/resources/{resId}       → PUT /api/tenants/{tenantId}/resources/{resId}
DELETE /api/resources/{resId}        → DELETE /api/tenants/{tenantId}/resources/{resId}
```

**Note:** Tenant ID can be extracted from JWT token, so explicit `{tenantId}` in URL may be optional if middleware handles it.

---

### 4.2 New Endpoints Required

#### 4.2.1 Invitation Management

```
POST   /api/tenants/{tenantId}/invitations
       Body: { email, roleId (optional), message (optional) }

GET    /api/tenants/{tenantId}/invitations
       Query: status (Pending/Accepted/Declined/Expired)

GET    /api/tenants/{tenantId}/invitations/{invitationId}

PUT    /api/tenants/{tenantId}/invitations/{invitationId}/accept

PUT    /api/tenants/{tenantId}/invitations/{invitationId}/decline

DELETE /api/tenants/{tenantId}/invitations/{invitationId}

GET    /api/users/me/invitations
       (Get all invitations for current user across all tenants)
```

#### 4.2.2 Tenant Management

```
GET    /api/users/me/tenants
       (Get all tenants current user belongs to)

POST   /api/users/me/tenants/{tenantId}/switch
       (Switch active tenant context - updates token)

GET    /api/tenants/{tenantId}
       (Get tenant details)

PUT    /api/tenants/{tenantId}
       (Update tenant - owner only)
```

#### 4.2.3 Registration with Invitation

```
POST   /api/auth/register
       Body: { email, password, firstName, lastName, invitationToken }
       (If invitationToken provided, associate user with tenant from invitation)
```

---

## 5. Data Model Changes

### 5.1 Database Schema Updates

#### 5.1.1 Invitation Table

```sql
CREATE TABLE Invitations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId UNIQUEIDENTIFIER NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    UserId UNIQUEIDENTIFIER NULL, -- NULL if user doesn't exist yet
    InvitedByUserId UNIQUEIDENTIFIER NOT NULL,
    RoleId UNIQUEIDENTIFIER NULL, -- Default role to assign
    InvitationToken NVARCHAR(500) NOT NULL UNIQUE,
    Status NVARCHAR(50) NOT NULL, -- Pending, Accepted, Declined, Expired
    ExpiresAt DATETIME2 NOT NULL,
    AcceptedAt DATETIME2 NULL,
    DeclinedAt DATETIME2 NULL,
    Message NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,

    FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (InvitedByUserId) REFERENCES Users(Id),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id),

    INDEX IX_Invitations_TenantId (TenantId),
    INDEX IX_Invitations_Email (Email),
    INDEX IX_Invitations_Token (InvitationToken),
    INDEX IX_Invitations_Status (Status)
);
```

#### 5.1.2 UserTenant Junction Table

```sql
CREATE TABLE UserTenants (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    TenantId UNIQUEIDENTIFIER NOT NULL,
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,

    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (TenantId) REFERENCES Tenants(Id),

    UNIQUE (UserId, TenantId),
    INDEX IX_UserTenants_UserId (UserId),
    INDEX IX_UserTenants_TenantId (TenantId)
);
```

#### 5.1.3 Permissions Table Update

```sql
ALTER TABLE Permissions
ADD TenantId UNIQUEIDENTIFIER NULL,
    IsSystemPermission BIT NOT NULL DEFAULT 0;

-- System permissions have TenantId = NULL
-- Tenant permissions have TenantId = Tenant GUID

CREATE INDEX IX_Permissions_TenantId ON Permissions(TenantId);
```

#### 5.1.4 Roles Table Update

```sql
-- Ensure Roles table has TenantId (should already exist)
ALTER TABLE Roles
ADD IsSystemRole BIT NOT NULL DEFAULT 0;

-- System roles (like Owner) have IsSystemRole = 1
-- Cannot be deleted, but can be modified with restrictions
```

#### 5.1.5 All Entity Tables

```sql
-- Ensure ALL entity tables have TenantId column
-- Examples:
ALTER TABLE Workspaces ADD TenantId UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE Resources ADD TenantId UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE UserRoles ADD TenantId UNIQUEIDENTIFIER NOT NULL;

-- Add indexes for performance
CREATE INDEX IX_Workspaces_TenantId ON Workspaces(TenantId);
CREATE INDEX IX_Resources_TenantId ON Resources(TenantId);
CREATE INDEX IX_UserRoles_TenantId ON UserRoles(TenantId);
```

---

### 5.2 Entity Model Updates

#### 5.2.1 Invitation Entity

```csharp
public class Invitation
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; }
    public Guid? UserId { get; set; } // Null if user doesn't exist
    public Guid InvitedByUserId { get; set; }
    public Guid? RoleId { get; set; } // Default role to assign
    public string InvitationToken { get; set; }
    public InvitationStatus Status { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
    public string Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; }
    public User User { get; set; }
    public User InvitedBy { get; set; }
    public Role Role { get; set; }
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined,
    Expired
}
```

#### 5.2.2 UserTenant Entity

```csharp
public class UserTenant
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }

    // Navigation properties
    public User User { get; set; }
    public Tenant Tenant { get; set; }
}
```

#### 5.2.3 Permission Entity Update

```csharp
public class Permission
{
    // ... existing properties ...
    public Guid? TenantId { get; set; } // Null for system permissions
    public bool IsSystemPermission { get; set; }

    // Navigation property
    public Tenant Tenant { get; set; }
}
```

---

## 6. Workflow Specifications

### 6.1 User Registration/Onboarding Workflow

```
1. User submits registration form
   ↓
2. Validate input data
   ↓
3. Check if email already exists
   - If exists: Return error "Email already registered"
   ↓
4. Create User record
   ↓
5. Create Tenant record (TenantId = User.Id or new GUID)
   ↓
6. Create UserTenant record (associate user with tenant)
   ↓
7. Fetch all default permissions (system permissions)
   ↓
8. Create "Owner" Role:
   - Name: "Owner"
   - Code: "OWNER"
   - TenantId: [new tenant ID]
   - IsSystemRole: true
   ↓
9. Fetch all workspaces (for tenant - initially empty or default)
   ↓
10. Fetch all resources (for tenant - initially empty or default)
   ↓
11. Assign all workspaces to Owner role
   ↓
12. Assign all resources to Owner role
   ↓
13. Assign all default permissions to Owner role
   ↓
14. Create UserRole record (assign Owner role to user)
   ↓
15. Generate JWT token with tenant context
   ↓
16. Send welcome email
   ↓
17. Return success response with token
```

**Error Handling:**

- Use database transactions to ensure atomicity
- If any step fails, rollback all changes
- Return specific error messages
- Log all errors for debugging

---

### 6.2 Member Invitation Workflow (New User)

```
1. Tenant admin/owner initiates invitation
   - Input: email, optional role, optional message
   ↓
2. Validate email format
   ↓
3. Check if email exists in Users table
   ↓
4. If email does NOT exist:
   ↓
5. Generate unique invitation token (cryptographically secure)
   ↓
6. Create Invitation record:
   - Email: [provided email]
   - TenantId: [current tenant]
   - InvitedByUserId: [current user]
   - RoleId: [optional default role]
   - InvitationToken: [generated token]
   - Status: "Pending"
   - ExpiresAt: [current time + 7 days]
   - Message: [optional message]
   ↓
7. Send invitation email:
   - To: [email]
   - Subject: "You've been invited to join [Tenant Name]"
   - Body: Include invitation link with token
   - Link format: /auth/register?invitationToken={token}
   ↓
8. Return success response
   ↓
9. [User receives email and clicks link]
   ↓
10. User is redirected to registration page
    - Email pre-filled
    - Invitation token in state
    ↓
11. User completes registration form
    ↓
12. Validate registration data
    ↓
13. Create User record
    ↓
14. Find invitation by token
    ↓
15. Validate invitation:
    - Token matches
    - Status is "Pending"
    - Not expired
    ↓
16. Create UserTenant record (associate user with tenant)
    ↓
17. If RoleId specified in invitation:
    - Create UserRole record (assign role to user)
    Else:
    - Assign default "Member" role
    ↓
18. Update Invitation:
    - Status: "Accepted"
    - AcceptedAt: [current time]
    - UserId: [new user ID]
    ↓
19. Generate JWT token with tenant context
    ↓
20. Send welcome email
    ↓
21. Return success response with token
```

---

### 6.3 Member Invitation Workflow (Existing User)

```
1. Tenant admin/owner initiates invitation
   - Input: email, optional role, optional message
   ↓
2. Validate email format
   ↓
3. Check if email exists in Users table
   ↓
4. If email EXISTS:
   ↓
5. Check if user already belongs to tenant:
   - Query UserTenants where UserId = [found user] AND TenantId = [current tenant]
   - If exists: Return error "User already belongs to this tenant"
   ↓
6. Generate unique invitation token
   ↓
7. Create Invitation record:
   - Email: [provided email]
   - TenantId: [current tenant]
   - UserId: [found user ID]
   - InvitedByUserId: [current user]
   - RoleId: [optional default role]
   - InvitationToken: [generated token]
   - Status: "Pending"
   - ExpiresAt: [current time + 7 days]
   - Message: [optional message]
   ↓
8. Send notification email:
   - To: [email]
   - Subject: "You've been invited to join [Tenant Name]"
   - Body: Include accept/decline links
   - Link format: /dashboard/invitations/{token}/accept
   ↓
9. [If user is logged in] Show in-app notification
   ↓
10. Return success response
    ↓
11. [User receives notification]
    ↓
12. User clicks accept link or accepts from dashboard
    ↓
13. Validate invitation:
    - Token matches
    - Status is "Pending"
    - Not expired
    - UserId matches current user
    ↓
14. Create UserTenant record (associate user with tenant)
    ↓
15. If RoleId specified in invitation:
    - Create UserRole record (assign role to user)
    Else:
    - Assign default "Member" role
    ↓
16. Update Invitation:
    - Status: "Accepted"
    - AcceptedAt: [current time]
    ↓
17. Tenant appears in user's tenant list
    ↓
18. Send confirmation email
    ↓
19. Return success response
```

---

### 6.4 Permission Creation Workflow (Tenant-Scoped)

```
1. Tenant admin/owner navigates to permissions page
   ↓
2. Clicks "Create New Permission"
   ↓
3. Fills form:
   - Name: [required]
   - Code: [required, unique within tenant]
   - Description: [optional]
   ↓
4. Validate input:
   - Name not empty
   - Code follows naming convention (UPPER_SNAKE_CASE)
   - Code is unique within tenant
   ↓
5. Create Permission record:
   - Name: [provided]
   - Code: [provided]
   - Description: [provided]
   - TenantId: [current tenant]
   - IsSystemPermission: false
   - CreatedBy: [current user]
   ↓
6. Return success response
   ↓
7. Permission appears in tenant's permission list
   ↓
8. Can now be assigned to roles
```

**Validation Rules:**

- Permission code must be unique within tenant
- Cannot use reserved system permission codes
- Code must match pattern: `^[A-Z][A-Z0-9_]*$`

---

## 7. Implementation Priority

### Phase 1: Critical (Immediate)

1. ✅ **Tenant Context Enforcement**
   - Add tenant middleware to all endpoints
   - Update all database queries to include tenant filtering
   - Add tenant validation in authorization

2. ✅ **Default Owner Role Creation**
   - Implement automatic role creation on tenant creation
   - Assign all workspaces, resources, and permissions
   - Assign role to onboarding user

### Phase 2: High Priority (Week 1-2)

3. ✅ **Member Invitation - New Users**
   - Create invitation system
   - Email sending infrastructure
   - Registration with invitation token

4. ✅ **Member Invitation - Existing Users**
   - Invitation for existing users
   - Accept/decline workflow
   - Tenant switching functionality

### Phase 3: Medium Priority (Week 3-4)

5. ✅ **Tenant-Scoped Permissions**
   - Permission creation UI/API
   - Tenant permission management
   - Permission assignment to roles

6. ✅ **Multi-Tenant Support**
   - User tenant list
   - Tenant switching
   - Context management

---

## 8. Testing Requirements

### 8.1 Unit Tests

- Tenant context extraction from token
- Owner role creation logic
- Invitation token generation and validation
- Permission creation and validation
- Cross-tenant access prevention

### 8.2 Integration Tests

- Complete onboarding workflow
- Invitation workflow (new user)
- Invitation workflow (existing user)
- Permission assignment
- Tenant switching

### 8.3 Security Tests

- Verify tenant isolation (cannot access other tenant's data)
- Verify token validation
- Verify invitation token expiration
- Verify permission enforcement

### 8.4 Performance Tests

- Tenant filtering impact on query performance
- Index optimization
- Concurrent invitation handling

---

## 9. API Response Examples

### 9.1 Registration Response (with Owner Role)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-guid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tenant": {
      "id": "tenant-guid",
      "name": "John's Organization"
    },
    "role": {
      "id": "role-guid",
      "name": "Owner",
      "code": "OWNER"
    },
    "token": "jwt-token-here"
  }
}
```

### 9.2 Invitation Response

```json
{
  "success": true,
  "data": {
    "id": "invitation-guid",
    "email": "invitee@example.com",
    "tenantId": "tenant-guid",
    "status": "Pending",
    "expiresAt": "2025-01-15T00:00:00Z",
    "invitationLink": "https://app.example.com/auth/register?token=invitation-token"
  },
  "message": "Invitation sent successfully"
}
```

### 9.3 User Tenants Response

```json
{
  "success": true,
  "data": [
    {
      "id": "tenant-guid-1",
      "name": "Organization 1",
      "role": "Owner",
      "joinedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tenant-guid-2",
      "name": "Organization 2",
      "role": "Member",
      "joinedAt": "2025-01-10T00:00:00Z"
    }
  ]
}
```

---

## 10. Configuration

### 10.1 Default Role Configuration

```json
{
  "defaultRole": {
    "name": "Owner",
    "code": "OWNER",
    "isSystemRole": true
  },
  "defaultMemberRole": {
    "name": "Member",
    "code": "MEMBER",
    "isSystemRole": false
  },
  "invitation": {
    "expirationDays": 7,
    "tokenLength": 64
  }
}
```

### 10.2 Email Templates

- `invitation-new-user.html` - For users without accounts
- `invitation-existing-user.html` - For users with accounts
- `welcome.html` - Welcome email after registration/acceptance

---

## 11. Migration Strategy

### 11.1 Database Migration

1. Add `TenantId` columns to all entity tables
2. Create `Invitations` table
3. Create `UserTenants` junction table
4. Update `Permissions` table
5. Add indexes for performance
6. Migrate existing data (assign to default tenant if needed)

### 11.2 Code Migration

1. Update all repositories to include tenant filtering
2. Add tenant middleware
3. Update all controllers to use tenant context
4. Update authorization logic
5. Add invitation service
6. Update registration service

### 11.3 Rollout Plan

1. Deploy to staging environment
2. Run full test suite
3. Performance testing
4. Security audit
5. Deploy to production with feature flags
6. Monitor for issues
7. Gradually enable features

---

## 12. Open Questions / Clarifications Needed

1. **Tenant Naming:** Should tenants have display names separate from organization names?
2. **Role Hierarchy:** Should there be a role hierarchy (e.g., Owner > Admin > Member)?
3. **Permission Inheritance:** Should roles inherit permissions from parent roles?
4. **Invitation Limits:** Should there be limits on number of invitations per tenant?
5. **Tenant Deletion:** What happens when a tenant is deleted? (Soft delete vs hard delete)
6. **Data Export:** Should tenants be able to export their data?
7. **Audit Logging:** Should all tenant operations be logged for audit purposes?

---

## 13. Success Criteria

✅ **Tenant Isolation:**

- No user can access data from another tenant
- All queries are properly filtered by tenant
- Authorization middleware enforces tenant context

✅ **Owner Role:**

- Created automatically on tenant creation
- Has access to all workspaces, resources, and permissions
- Assigned to onboarding user

✅ **Invitations:**

- New users can register via invitation link
- Existing users can accept invitations
- Invitations expire after configured time
- Email notifications are sent correctly

✅ **Permissions:**

- Tenant admins can create custom permissions
- Permissions are scoped to tenants
- System permissions cannot be modified

---

## 14. Contact & Support

For questions or clarifications regarding this document, please contact:

- **Product Owner:** [Name/Email]
- **Technical Lead:** [Name/Email]
- **Backend Team:** [Team Email/Slack]

---

**Document Status:** Ready for Review  
**Next Steps:** Backend team review → Technical design → Implementation planning → Development

---

_This document is a living document and will be updated as requirements evolve._

