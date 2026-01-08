# MEMS IAM Frontend API Reference Guide

## 📋 Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [User Management Endpoints](#user-management-endpoints)
4. [Workspace Endpoints](#workspace-endpoints)
5. [Workspace Roles Endpoints](#workspace-roles-endpoints)
6. [Workspace Members Endpoints](#workspace-members-endpoints)
7. [Workspace Resources Endpoints](#workspace-resources-endpoints)
8. [Permission Endpoints](#permission-endpoints)
9. [Invitation Endpoints](#invitation-endpoints)
10. [Tenant Endpoints](#tenant-endpoints)
11. [Menu Endpoints](#menu-endpoints)
12. [Audit Log Endpoints](#audit-log-endpoints)

---

## 🔧 Setup & Configuration

### Base URL
```
https://your-api-domain.com
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### Response Format
All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## 🔐 Authentication Endpoints

### Step 1: User Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user. Creates a tenant automatically. If `invitationToken` is provided, user joins the tenant from the invitation.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "country": "Nigeria",
  "invitationToken": "optional-invitation-token",
  "address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Lagos",
    "state": "Lagos State",
    "postalCode": "100001",
    "country": "Nigeria"
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid-here",
    "userName": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "middleName": "Michael",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "country": "Nigeria",
    "status": "PendingVerification",
    "emailVerified": false,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z",
    "updatedAt": "2024-12-22T10:00:00Z",
    "dateCreated": "2024-12-22T10:00:00Z",
    "dateModified": "2024-12-22T10:00:00Z",
    "fullName": "John Michael Doe",
    "tenantId": "tenant-guid-here"
  },
  "message": "User registered successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### Step 2: Login (Get Access Token)

**Endpoint:** `POST /connect/token`

**Description:** Authenticate user and get access token. Use this token for all subsequent API calls.

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body (Form Data):**
```
grant_type=password
&username=user@example.com
&password=SecurePass123!
&client_id=mems-wastemanagement-api
&client_secret=service-worker
&scope=openid profile email
```

**Response (Success - 200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "CfDJ8Nk5m3xY2zQ...",
  "scope": "openid profile email"
}
```

**Token Claims (Decoded JWT):**
```json
{
  "sub": "user-guid",
  "user_id": "user-guid",
  "tenant_id": "tenant-guid",
  "workspace_id": "workspace-guid",
  "workspace_name": "Waste Management",
  "workspaces": "[{\"workspaceId\":\"guid-1\",\"workspaceName\":\"Sea Farer\",\"workspaceCode\":\"SEA_FARER\"},{\"workspaceId\":\"guid-2\",\"workspaceName\":\"Waste Management\",\"workspaceCode\":\"WASTE_MGMT\"}]",
  "exp": 1734876000,
  "iat": 1734789600
}
```

**Response (Error - 400):**
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid username or password"
}
```

---

### Step 3: Refresh Access Token

**Endpoint:** `POST /connect/token`

**Description:** Get a new access token using refresh token. Use when access token expires (24 hours).

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body (Form Data):**
```
grant_type=refresh_token
&refresh_token=your_refresh_token_here
&client_id=mems-wastemanagement-api
&client_secret=service-worker
```

**Response (Success - 200):**
```json
{
  "access_token": "new-access-token-here",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "new-refresh-token-here"
}
```

---

### Step 4: Get User Info

**Endpoint:** `GET /connect/userinfo`

**Description:** Get current user's profile information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "sub": "user-guid",
  "name": "John Doe",
  "email": "user@example.com",
  "email_verified": true,
  "given_name": "John",
  "family_name": "Doe",
  "middle_name": "Michael",
  "phone_number": "+1234567890",
  "phone_number_verified": false,
  "date_of_birth": "1990-01-15",
  "country": "Nigeria",
  "status": "Active",
  "created_at": "2024-12-22T10:00:00Z",
  "updated_at": "2024-12-22T10:00:00Z",
  "workspace_id": "workspace-guid",
  "workspace_name": "Waste Management",
  "workspaces": [
    {
      "workspaceId": "guid-1",
      "workspaceName": "Sea Farer",
      "workspaceCode": "SEA_FARER"
    },
    {
      "workspaceId": "guid-2",
      "workspaceName": "Waste Management",
      "workspaceCode": "WASTE_MGMT"
    }
  ]
}
```

---

### Step 5: Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout current user (invalidates session).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

## 👥 User Management Endpoints

### Get All Users

**Endpoint:** `GET /api/users`

**Description:** Get paginated list of users in current workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?page=1&pageSize=10&search=john&status=Active
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user-guid-1",
        "userName": "user1@example.com",
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "Active",
        "isActive": true,
        "createdAt": "2024-12-22T10:00:00Z"
      }
    ],
    "totalCount": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

### Get User by ID

**Endpoint:** `GET /api/users/{id}`

**Description:** Get user details by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid",
    "userName": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "middleName": "Michael",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "country": "Nigeria",
    "status": "Active",
    "emailVerified": true,
    "phoneVerified": false,
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z",
    "updatedAt": "2024-12-22T10:00:00Z",
    "fullName": "John Michael Doe",
    "tenantId": "tenant-guid"
  }
}
```

---

### Create User (Admin)

**Endpoint:** `POST /api/users`

**Description:** Create a new user (admin only).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "country": "Nigeria"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "new-user-guid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "PendingVerification",
    "isActive": true
  },
  "message": "User created successfully"
}
```

---

### Update User

**Endpoint:** `PUT /api/users/{id}`

**Description:** Update user information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phoneNumber": "+9876543210",
  "country": "Ghana"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid",
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "phoneNumber": "+9876543210",
    "country": "Ghana",
    "updatedAt": "2024-12-22T11:00:00Z"
  },
  "message": "User updated successfully"
}
```

---

### Delete User

**Endpoint:** `DELETE /api/users/{id}`

**Description:** Soft delete a user (sets IsDeleted = true).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid",
    "isDeleted": true
  },
  "message": "User deleted successfully"
}
```

---

### Activate User

**Endpoint:** `PATCH /api/users/{id}/activate`

**Description:** Activate a user account.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid",
    "isActive": true,
    "status": "Active"
  },
  "message": "User activated successfully"
}
```

---

### Deactivate User

**Endpoint:** `PATCH /api/users/{id}/deactivate`

**Description:** Deactivate a user account.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user-guid",
    "isActive": false,
    "status": "Inactive"
  },
  "message": "User deactivated successfully"
}
```

---

## 🏢 Workspace Endpoints

### Get All Workspaces

**Endpoint:** `GET /api/workspaces`

**Description:** Get all workspaces accessible to current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?page=1&pageSize=10&search=waste
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "workspaceId": "workspace-guid-1",
        "name": "Sea Farer",
        "code": "SEA_FARER",
        "description": "Sea Farer Management Workspace",
        "isActive": true,
        "isDeleted": false,
        "createdAt": "2024-12-22T10:00:00Z"
      },
      {
        "workspaceId": "workspace-guid-2",
        "name": "Waste Management",
        "code": "WASTE_MGMT",
        "description": "Waste Management Workspace",
        "isActive": true,
        "isDeleted": false,
        "createdAt": "2024-12-22T10:00:00Z"
      }
    ],
    "totalCount": 2,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### Get Workspace by ID

**Endpoint:** `GET /api/workspaces/{id}`

**Description:** Get workspace details by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceId": "workspace-guid",
    "name": "Waste Management",
    "code": "WASTE_MGMT",
    "description": "Waste Management Workspace",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-12-22T10:00:00Z",
    "updatedAt": "2024-12-22T10:00:00Z"
  }
}
```

---

### Create Workspace (RDLC Only)

**Endpoint:** `POST /api/workspaces`

**Description:** Create a new workspace. **Only RDLC administrators can create workspaces.**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "name": "New Workspace",
  "code": "NEW_WS",
  "description": "Description of the new workspace"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceId": "new-workspace-guid",
    "name": "New Workspace",
    "code": "NEW_WS",
    "description": "Description of the new workspace",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Workspace created successfully"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Only RDLC administrators can create workspaces. Please contact your system administrator."
}
```

---

### Update Workspace

**Endpoint:** `PUT /api/workspaces/{id}`

**Description:** Update workspace information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceId": "workspace-guid",
    "name": "Updated Workspace Name",
    "code": "WASTE_MGMT",
    "description": "Updated description",
    "updatedAt": "2024-12-22T11:00:00Z"
  },
  "message": "Workspace updated successfully"
}
```

---

### Delete Workspace

**Endpoint:** `DELETE /api/workspaces/{id}`

**Description:** Soft delete a workspace (sets IsDeleted = true).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceId": "workspace-guid",
    "isDeleted": true
  },
  "message": "Workspace deleted successfully"
}
```

---

### Get My Permissions in Workspace

**Endpoint:** `GET /api/workspaces/{id}/permissions/my`

**Description:** Get current user's permissions in a specific workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    "Workspaces:view",
    "Workspaces:create",
    "Users:view",
    "Users:create",
    "WorkspaceRoles:view",
    "WorkspaceRoles:create"
  ]
}
```

**Permission Format:** `{Resource}:{Action}`
- Resources: `Workspaces`, `Users`, `WorkspaceRoles`, `WorkspaceMembers`, etc.
- Actions: `view`, `create`, `update`, `delete`

---

### Switch Workspace

**Endpoint:** `POST /api/workspaces/{workspaceId}/switch`

**Description:** Switch to a different workspace. Returns a new token with updated workspace context.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new-token-with-workspace-context",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_token": "new-refresh-token",
    "workspace_id": "switched-workspace-guid",
    "workspace_name": "Waste Management"
  },
  "message": "Workspace switched successfully"
}
```

**Note:** Store the new token and use it for subsequent API calls.

---

## 👔 Workspace Roles Endpoints

### Get All Roles in Workspace

**Endpoint:** `GET /api/workspaces/{workspaceId}/roles`

**Description:** Get all roles in a workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "workspaceRoleId": "role-guid-1",
      "workspaceId": "workspace-guid",
      "roleName": "Owner",
      "roleCode": "OWNER",
      "roleDescription": "Owner role with full permissions",
      "isSystemRole": true,
      "createdAt": "2024-12-22T10:00:00Z"
    },
    {
      "workspaceRoleId": "role-guid-2",
      "workspaceId": "workspace-guid",
      "roleName": "Manager",
      "roleCode": "MANAGER",
      "roleDescription": "Manager role with limited permissions",
      "isSystemRole": false,
      "createdAt": "2024-12-22T10:00:00Z"
    }
  ]
}
```

---

### Create Role in Workspace

**Endpoint:** `POST /api/workspaces/{workspaceId}/roles`

**Description:** Create a new role in a workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "roleName": "Editor",
  "roleCode": "EDITOR",
  "roleDescription": "Editor role with edit permissions"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceRoleId": "new-role-guid",
    "workspaceId": "workspace-guid",
    "roleName": "Editor",
    "roleCode": "EDITOR",
    "roleDescription": "Editor role with edit permissions",
    "isSystemRole": false,
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Role created successfully"
}
```

---

### Assign Permissions to Role

**Endpoint:** `POST /api/workspaces/{workspaceId}/roles/{roleId}/permissions`

**Description:** Assign permissions to a role. Permissions are scoped to resources.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "resourceId": "resource-guid",
  "permissionIds": [
    "permission-guid-1",
    "permission-guid-2",
    "permission-guid-3"
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Permissions assigned successfully"
}
```

---

## 👥 Workspace Members Endpoints

### Get All Members in Workspace

**Endpoint:** `GET /api/workspaces/{workspaceId}/members`

**Description:** Get all members in a workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "workspaceMemberId": "member-guid-1",
      "workspaceId": "workspace-guid",
      "tenantId": "tenant-guid",
      "userId": "user-guid-1",
      "type": "Member",
      "status": true,
      "user": {
        "id": "user-guid-1",
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "roles": [
        {
          "workspaceRoleId": "role-guid",
          "roleName": "Owner",
          "roleCode": "OWNER"
        }
      ]
    }
  ]
}
```

---

### Add Member to Workspace

**Endpoint:** `POST /api/workspaces/{workspaceId}/members`

**Description:** Add a user or tenant as a member to a workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "userId": "user-guid",
  "tenantId": "tenant-guid",
  "type": "Member"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "workspaceMemberId": "new-member-guid",
    "workspaceId": "workspace-guid",
    "tenantId": "tenant-guid",
    "userId": "user-guid",
    "type": "Member",
    "status": true,
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Member added successfully"
}
```

---

### Assign Role to Member

**Endpoint:** `POST /api/workspaces/{workspaceId}/members/{memberId}/roles`

**Description:** Assign a role to a workspace member.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "workspaceRoleId": "role-guid"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Role assigned successfully"
}
```

---

## 📦 Workspace Resources Endpoints

### Get All Resources in Workspace

**Endpoint:** `GET /api/workspaces/{workspaceId}/resources`

**Description:** Get all resources in a workspace (tree structure).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "resourceId": "resource-guid-1",
      "workspaceId": "workspace-guid",
      "resourceName": "Workspaces",
      "url": "/api/workspaces",
      "parentId": null,
      "isActive": true,
      "children": []
    },
    {
      "resourceId": "resource-guid-2",
      "workspaceId": "workspace-guid",
      "resourceName": "Users",
      "url": "/api/users",
      "parentId": null,
      "isActive": true,
      "children": []
    }
  ]
}
```

---

### Create Resource in Workspace

**Endpoint:** `POST /api/workspaces/{workspaceId}/resources`

**Description:** Create a new resource in a workspace.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "resourceName": "Reports",
  "url": "/api/reports",
  "parentId": null
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "resourceId": "new-resource-guid",
    "workspaceId": "workspace-guid",
    "resourceName": "Reports",
    "url": "/api/reports",
    "parentId": null,
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Resource created successfully"
}
```

---

## 🔐 Permission Endpoints

### Get All Permissions

**Endpoint:** `GET /api/permissions`

**Description:** Get all system permissions (view, create, update, delete, etc.).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?page=1&pageSize=10&isSystemPermission=true
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "permissionId": "permission-guid-1",
        "permissionName": "view",
        "description": "View permission",
        "isSystemPermission": true,
        "isActive": true,
        "createdAt": "2024-12-22T10:00:00Z"
      },
      {
        "permissionId": "permission-guid-2",
        "permissionName": "create",
        "description": "Create permission",
        "isSystemPermission": true,
        "isActive": true,
        "createdAt": "2024-12-22T10:00:00Z"
      }
    ],
    "totalCount": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### Get Permission by ID

**Endpoint:** `GET /api/permissions/{id}`

**Description:** Get permission details by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "permissionId": "permission-guid",
    "permissionName": "view",
    "description": "View permission",
    "isSystemPermission": true,
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z"
  }
}
```

---

### Create Permission

**Endpoint:** `POST /api/permissions`

**Description:** Create a new permission (tenant-specific).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "permissionName": "approve",
  "description": "Approve action permission"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "permissionId": "new-permission-guid",
    "permissionName": "approve",
    "description": "Approve action permission",
    "isSystemPermission": false,
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Permission created successfully"
}
```

---

### Update Permission

**Endpoint:** `PUT /api/permissions/{id}`

**Description:** Update permission details.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "permissionId": "permission-guid",
    "permissionName": "approve",
    "description": "Updated description",
    "updatedAt": "2024-12-22T11:00:00Z"
  },
  "message": "Permission updated successfully"
}
```

---

### Delete Permission

**Endpoint:** `DELETE /api/permissions/{id}`

**Description:** Delete a permission (only tenant-specific permissions can be deleted).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Permission deleted successfully"
}
```

---

## ✉️ Invitation Endpoints

### Create Invitation

**Endpoint:** `POST /iam/api/v1/invitations`

**Description:** Create an invitation for a user to join a workspace/tenant.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "roleId": "optional-role-guid",
  "message": "You are invited to join our workspace"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "invitationId": "invitation-guid",
    "tenantId": "tenant-guid",
    "email": "newuser@example.com",
    "userId": null,
    "status": "Pending",
    "invitationToken": "unique-token-here",
    "expiresAt": "2024-12-29T10:00:00Z",
    "message": "You are invited to join our workspace",
    "createdAt": "2024-12-22T10:00:00Z"
  },
  "message": "Invitation created successfully"
}
```

---

### Get All Invitations

**Endpoint:** `GET /iam/api/v1/invitations`

**Description:** Get all invitations (filtered by current tenant).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?page=1&pageSize=10&status=Pending&email=newuser@example.com
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "invitationId": "invitation-guid",
        "email": "newuser@example.com",
        "status": "Pending",
        "expiresAt": "2024-12-29T10:00:00Z",
        "createdAt": "2024-12-22T10:00:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### Get Invitation by ID

**Endpoint:** `GET /iam/api/v1/invitations/{invitationId}`

**Description:** Get invitation details by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "invitationId": "invitation-guid",
    "tenantId": "tenant-guid",
    "email": "newuser@example.com",
    "status": "Pending",
    "invitationToken": "unique-token-here",
    "expiresAt": "2024-12-29T10:00:00Z",
    "message": "You are invited to join our workspace",
    "createdAt": "2024-12-22T10:00:00Z"
  }
}
```

---

### Get Invitation by Token (Public)

**Endpoint:** `GET /iam/api/v1/invitations/token/{token}`

**Description:** Get invitation details by token. **No authentication required** (for registration page).

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "invitationId": "invitation-guid",
    "email": "newuser@example.com",
    "status": "Pending",
    "expiresAt": "2024-12-29T10:00:00Z",
    "message": "You are invited to join our workspace"
  }
}
```

---

### Accept Invitation

**Endpoint:** `PUT /iam/api/v1/invitations/accept`

**Description:** Accept an invitation (for existing users).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "invitationToken": "token-from-invitation-email"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Invitation accepted successfully"
}
```

**Note:** For new users, use registration endpoint with `invitationToken` instead.

---

### Decline Invitation

**Endpoint:** `PUT /iam/api/v1/invitations/{invitationId}/decline`

**Description:** Decline an invitation.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Invitation declined successfully"
}
```

---

### Delete Invitation

**Endpoint:** `DELETE /iam/api/v1/invitations/{invitationId}`

**Description:** Delete/cancel an invitation.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": true,
  "message": "Invitation deleted successfully"
}
```

---

### Get My Invitations

**Endpoint:** `GET /iam/api/v1/invitations/me`

**Description:** Get all invitations for current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "invitationId": "invitation-guid",
      "email": "user@example.com",
      "status": "Pending",
      "expiresAt": "2024-12-29T10:00:00Z",
      "message": "You are invited to join our workspace",
      "createdAt": "2024-12-22T10:00:00Z"
    }
  ]
}
```

---

## 🏢 Tenant Endpoints

### Get User's Tenants

**Endpoint:** `GET /iam/api/v1/users/me/tenants`

**Description:** Get all tenants the current user belongs to.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "tenantId": "tenant-guid-1",
      "name": "My Organization",
      "isActive": true,
      "createdAt": "2024-12-22T10:00:00Z"
    },
    {
      "tenantId": "tenant-guid-2",
      "name": "Client Organization",
      "isActive": true,
      "createdAt": "2024-12-22T10:00:00Z"
    }
  ]
}
```

---

### Get Tenant by ID

**Endpoint:** `GET /iam/api/v1/tenants/{tenantId}`

**Description:** Get tenant details by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "tenantId": "tenant-guid",
    "name": "My Organization",
    "isActive": true,
    "createdAt": "2024-12-22T10:00:00Z",
    "updatedAt": "2024-12-22T10:00:00Z"
  }
}
```

---

### Switch Tenant

**Endpoint:** `POST /iam/api/v1/users/me/tenants/{tenantId}/switch`

**Description:** Switch to a different tenant. Returns a new token with updated tenant context.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new-token-with-tenant-context",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_token": "new-refresh-token",
    "tenant_id": "switched-tenant-guid",
    "workspace_id": "default-workspace-guid"
  },
  "message": "Tenant switched successfully"
}
```

**Note:** Store the new token and use it for subsequent API calls.

---

## 📋 Menu Endpoints

### Get Workspace Menu

**Endpoint:** `GET /api/menu`

**Description:** Get menu items for current workspace based on user's permissions.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "menuId": "menu-guid-1",
      "title": "Dashboard",
      "url": "/dashboard",
      "icon": "dashboard",
      "order": 1,
      "children": []
    },
    {
      "menuId": "menu-guid-2",
      "title": "Users",
      "url": "/users",
      "icon": "users",
      "order": 2,
      "children": [
        {
          "menuId": "menu-guid-3",
          "title": "All Users",
          "url": "/users/all",
          "icon": "list",
          "order": 1
        }
      ]
    }
  ]
}
```

---

## 📊 Audit Log Endpoints

### Get Audit Logs

**Endpoint:** `GET /api/audit-logs`

**Description:** Get audit logs for current workspace/tenant.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```
?page=1&pageSize=10&auditType=Authorization&startDate=2024-12-01&endDate=2024-12-31
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "auditLogId": "log-guid-1",
        "userId": "user-guid",
        "tenantId": "tenant-guid",
        "workspaceId": "workspace-guid",
        "auditType": "Authorization",
        "action": "AccessGranted",
        "entityType": "Workspace",
        "entityId": "workspace-guid",
        "resource": "Workspaces",
        "details": "User accessed workspace",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-12-22T10:00:00Z"
      }
    ],
    "totalCount": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## 🔄 Complete Flow Examples

### Flow 1: New User Registration & Login

**Step 1:** Register
```
POST /api/auth/register
Body: { email, password, firstName, lastName }
Response: { user data with tenantId }
```

**Step 2:** Login
```
POST /connect/token
Body: grant_type=password&username=...&password=...
Response: { access_token, refresh_token }
```

**Step 3:** Get User Info
```
GET /connect/userinfo
Headers: Authorization: Bearer {token}
Response: { user profile with workspaces }
```

**Step 4:** Get Permissions
```
GET /api/workspaces/{workspaceId}/permissions/my
Headers: Authorization: Bearer {token}
Response: { permissions array }
```

---

### Flow 2: Invite User & Accept

**Step 1:** Create Invitation (as Owner)
```
POST /iam/api/v1/invitations
Body: { email, roleId, message }
Response: { invitation with token }
```

**Step 2:** Get Invitation by Token (Public)
```
GET /iam/api/v1/invitations/token/{token}
Response: { invitation details }
```

**Step 3:** Register with Invitation Token
```
POST /api/auth/register
Body: { email, password, firstName, lastName, invitationToken }
Response: { user data, automatically joins tenant }
```

**OR** Accept Invitation (Existing User)
```
PUT /iam/api/v1/invitations/accept
Body: { invitationToken }
Response: { success }
```

---

### Flow 3: Create Role & Assign Permissions

**Step 1:** Get All Resources
```
GET /api/workspaces/{workspaceId}/resources
Response: { resources array }
```

**Step 2:** Get All Permissions
```
GET /api/permissions
Response: { permissions array }
```

**Step 3:** Create Role
```
POST /api/workspaces/{workspaceId}/roles
Body: { roleName, roleCode, roleDescription }
Response: { role data }
```

**Step 4:** Assign Permissions to Role
```
POST /api/workspaces/{workspaceId}/roles/{roleId}/permissions
Body: { resourceId, permissionIds: [...] }
Response: { success }
```

**Step 5:** Add Member to Workspace
```
POST /api/workspaces/{workspaceId}/members
Body: { userId, tenantId }
Response: { member data }
```

**Step 6:** Assign Role to Member
```
POST /api/workspaces/{workspaceId}/members/{memberId}/roles
Body: { workspaceRoleId }
Response: { success }
```

---

### Flow 4: Switch Workspace

**Step 1:** Get All Workspaces
```
GET /api/workspaces
Response: { workspaces array }
```

**Step 2:** Switch Workspace
```
POST /api/workspaces/{workspaceId}/switch
Response: { new access_token with workspace context }
```

**Step 3:** Get Permissions for New Workspace
```
GET /api/workspaces/{workspaceId}/permissions/my
Response: { permissions array }
```

---

## 📝 Important Notes

### Permission Format
Permissions are returned as: `{Resource}:{Action}`
- Example: `Workspaces:view`, `Users:create`, `WorkspaceRoles:update`

### Workspace Creation Restriction
- **Only RDLC users** (emails with `@rdlc.com`) can create workspaces
- Regular users will receive 403 Forbidden error

### Token Management
- Access tokens expire in **24 hours**
- Refresh tokens expire in **7 days**
- Always check token expiration before API calls
- Store tokens securely (sessionStorage recommended)

### Error Handling
- **401 Unauthorized**: Token expired/invalid → Refresh token or re-login
- **403 Forbidden**: No permission → Check user's role and permissions
- **404 Not Found**: Resource doesn't exist → Verify ID/workspace access
- **400 Bad Request**: Invalid input → Check request body format

### Workspace Context
- Most endpoints require `workspaceId` in the route
- Token contains default `workspace_id` claim
- Use workspace switch endpoint to change context

---

## 🎯 Quick Reference

### Authentication
- Register: `POST /api/auth/register`
- Login: `POST /connect/token` (grant_type=password)
- Refresh: `POST /connect/token` (grant_type=refresh_token)
- UserInfo: `GET /connect/userinfo`
- Logout: `POST /api/auth/logout`

### Workspaces
- List: `GET /api/workspaces`
- Get: `GET /api/workspaces/{id}`
- Create: `POST /api/workspaces` (RDLC only)
- Update: `PUT /api/workspaces/{id}`
- Delete: `DELETE /api/workspaces/{id}`
- Switch: `POST /api/workspaces/{workspaceId}/switch`
- Permissions: `GET /api/workspaces/{id}/permissions/my`

### Roles
- List: `GET /api/workspaces/{workspaceId}/roles`
- Create: `POST /api/workspaces/{workspaceId}/roles`
- Assign Permissions: `POST /api/workspaces/{workspaceId}/roles/{roleId}/permissions`

### Members
- List: `GET /api/workspaces/{workspaceId}/members`
- Add: `POST /api/workspaces/{workspaceId}/members`
- Assign Role: `POST /api/workspaces/{workspaceId}/members/{memberId}/roles`

### Resources
- List: `GET /api/workspaces/{workspaceId}/resources`
- Create: `POST /api/workspaces/{workspaceId}/resources`

### Permissions
- List: `GET /api/permissions`
- Get: `GET /api/permissions/{id}`
- Create: `POST /api/permissions`
- Update: `PUT /api/permissions/{id}`
- Delete: `DELETE /api/permissions/{id}`

### Invitations
- Create: `POST /iam/api/v1/invitations`
- List: `GET /iam/api/v1/invitations`
- Get: `GET /iam/api/v1/invitations/{id}`
- Get by Token: `GET /iam/api/v1/invitations/token/{token}` (Public)
- Accept: `PUT /iam/api/v1/invitations/accept`
- Decline: `PUT /iam/api/v1/invitations/{id}/decline`
- Delete: `DELETE /iam/api/v1/invitations/{id}`
- My Invitations: `GET /iam/api/v1/invitations/me`

### Tenants
- My Tenants: `GET /iam/api/v1/users/me/tenants`
- Get: `GET /iam/api/v1/tenants/{tenantId}`
- Switch: `POST /iam/api/v1/users/me/tenants/{tenantId}/switch`

### Menu
- Get: `GET /api/menu`

### Audit Logs
- List: `GET /api/audit-logs`

---

**Last Updated:** December 2024  
**Version:** 1.0

