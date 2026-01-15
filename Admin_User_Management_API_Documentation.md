# Admin User Management API Documentation

## Overview

This document describes the API endpoints for managing admin users in the MEMS IAM system. SuperAdmins can create, update, and delete admin users with multiple workspace and role assignments. All operations support multi-workspace and multi-role assignments in a single request.

**Base URL:** `https://your-iam-api-url/iam/api/v1/admin/users`

**Authentication:** All endpoints require a valid JWT token with appropriate admin permissions.

---

## Table of Contents

1. [Create Admin User with Roles](#1-create-admin-user-with-roles)
2. [Update Admin User Workspaces and Roles](#2-update-admin-user-workspaces-and-roles)
3. [Delete Admin User Workspaces/Roles](#3-delete-admin-user-workspacesroles)
4. [Additional Admin User Endpoints](#4-additional-admin-user-endpoints)

---

## 1. Create Admin User with Roles

Creates a new admin user account with multiple workspace and role assignments. A temporary password is automatically generated and sent via email.

### Endpoint

**POST** `/iam/api/v1/admin/users/with-role`

### URL

```
POST https://your-iam-api-url/iam/api/v1/admin/users/with-role
```

### Request Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "email": "admin.user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
      "workspaceRoles": [
        {
          "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
          "roleIds": [
            "eb7396b5-1d7e-40f9-8f1c-a4d3df551a04",
            "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          ]
        },
        {
          "workspaceId": "432b0876-c0d8-4a56-b9b4-9f8142c7889c",
          "roleIds": [
            "f9e8d7c6-b5a4-3210-9876-543210fedcba"
          ]
        }
      ],
  "wcoId": "12345678-1234-1234-1234-123456789012"
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address (must be unique) |
| `firstName` | string | Yes | User's first name |
| `lastName` | string | Yes | User's last name |
| `phoneNumber` | string | No | User's phone number |
| `workspaceRoles` | array | Yes | List of workspace-role assignments |
| `workspaceRoles[].workspaceId` | Guid | Yes | The workspace ID |
| `workspaceRoles[].roleIds` | array[Guid] | Yes | List of role IDs to assign in this workspace |
| `wcoId` | Guid | No | WCO Company ID (required if assigning WCO_EMPLOYEE role in Waste Management) |

### Success Response (200 OK)

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "admin.user@example.com",
    "email": "admin.user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": null,
    "status": "Active",
    "emailVerified": false,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": false,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z",
    "fullName": "John Doe",
    "tenantId": "tenant-guid-here"
  },
  "error": null
}
```

### Error Response (400 Bad Request)

**Example: User Already Exists**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "User with this email already exists",
    "code": "400"
  }
}
```

**Example: Invalid Workspace**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Workspace not found or is inactive",
    "code": "400"
  }
}
```

**Example: Missing Workspace Roles**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "At least one workspace with roles must be specified",
    "code": "400"
  }
}
```

### What Happens

1. User account is created in `AspNetUsers` table
2. Temporary password is generated (meets Identity requirements)
3. User is assigned to admin's tenant
4. For each workspace in `workspaceRoles`:
   - `UserWorkspace` record is created
   - `WorkspaceMember` record is created
   - Each role in `roleIds` is assigned via `WorkspaceMembersRole`
5. If WCO role is assigned in Waste Management workspace:
   - HTTP POST request is sent to Waste Management API
   - `UserWasteManagementOnboarding` record is created and auto-approved
6. Email is sent to user with:
   - Temporary password
   - Login instructions
   - Login URL

### Special Case: WCO Role

When assigning a `WCO_EMPLOYEE` role in the Waste Management workspace:

- `wcoId` **must** be provided
- The system automatically creates an onboarding record in Waste Management
- The onboarding is automatically approved (no manual approval needed)
- The user can immediately access Waste Management features

**Example Request with WCO:**
```json
{
  "email": "wco.employee@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+2348098765432",
  "workspaceRoles": [
    {
      "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
      "roleIds": [
        "wco-role-id-here"
      ]
    }
  ],
  "wcoId": "12345678-1234-1234-1234-123456789012"
}
```

---

## 2. Update Admin User Workspaces and Roles

Updates an admin user's basic information and workspace-role assignments. **This replaces all existing workspace-role assignments** with the provided ones.

### Endpoint

**PUT** `/iam/api/v1/admin/users/{userId}/workspaces`

### URL

```
PUT https://your-iam-api-url/iam/api/v1/admin/users/{userId}/workspaces
```

**Path Parameters:**
- `userId` (string, required): The user's unique identifier (GUID)

### Request Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "phoneNumber": "+2348012345678",
      "workspaceRoles": [
        {
          "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
          "roleIds": [
            "eb7396b5-1d7e-40f9-8f1c-a4d3df551a04"
          ]
        },
        {
          "workspaceId": "432b0876-c0d8-4a56-b9b4-9f8142c7889c",
          "roleIds": [
            "f9e8d7c6-b5a4-3210-9876-543210fedcba",
            "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          ]
        }
      ],
  "wcoId": "12345678-1234-1234-1234-123456789012"
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | No | User's first name |
| `lastName` | string | No | User's last name |
| `phoneNumber` | string | No | User's phone number |
| `workspaceRoles` | array | No | List of workspace-role assignments (replaces all existing) |
| `workspaceRoles[].workspaceId` | Guid | Yes | The workspace ID |
| `workspaceRoles[].roleIds` | array[Guid] | Yes | List of role IDs to assign in this workspace |
| `wcoId` | Guid | No | WCO Company ID (required if assigning WCO_EMPLOYEE role) |

### Success Response (200 OK)

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "admin.user@example.com",
    "email": "admin.user@example.com",
    "firstName": "John",
    "lastName": "Doe Updated",
    "middleName": null,
    "status": "Active",
    "emailVerified": false,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": false,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T11:45:00Z",
    "fullName": "John Doe Updated",
    "tenantId": "tenant-guid-here"
  },
  "error": null
}
```

### Error Response (400 Bad Request)

**Example: User Not Found**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "User not found",
    "code": "400"
  }
}
```

### What Happens

1. User's basic information is updated (firstName, lastName, phoneNumber)
2. **All existing workspace-role assignments are soft-deleted** (if not in new request)
3. **All existing workspace memberships are soft-deleted** (if workspace not in new request)
4. New workspace-role assignments are created:
   - If workspace member was soft-deleted, it's reactivated
   - If role assignment was soft-deleted, it's reactivated
   - New assignments are created for new workspaces/roles
5. If WCO role is updated:
   - Waste Management onboarding is updated accordingly

### Important Notes

- **Replacement Behavior:** This endpoint **replaces** all existing workspace-role assignments. Any workspace or role not included in the request will be soft-deleted.
- **Soft Delete:** Deleted assignments are marked as `IsDeleted = true` and `IsActive = false`, not permanently removed.
- **Reactivation:** If a previously deleted assignment is included in the update, it will be reactivated automatically.

---

## 3. Delete Admin User Workspaces/Roles

Deletes (soft deletes) admin user workspace memberships or specific role assignments. Supports multiple deletion modes.

### Endpoint

**DELETE** `/iam/api/v1/admin/users/{userId}/workspaces`

### URL

```
DELETE https://your-iam-api-url/iam/api/v1/admin/users/{userId}/workspaces
```

**Path Parameters:**
- `userId` (string, required): The user's unique identifier (GUID)

### Request Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body Options

#### Option 1: Delete Entire Workspaces

Remove user from one or more workspaces (all roles in those workspaces are removed).

```json
{
  "workspaceIds": [
    "16931b8f-0b71-44da-a4bf-6e9ce404333b",
    "432b0876-c0d8-4a56-b9b4-9f8142c7889c"
  ],
  "removeRolesOnly": false
}
```

**To remove from ALL workspaces:**
```json
{
  "workspaceIds": null,
  "removeRolesOnly": false
}
```

#### Option 2: Delete Specific Roles from Workspaces

Remove only specific roles from specific workspaces (user remains in the workspace with other roles).

```json
{
  "removeRolesOnly": true,
  "workspaceRoleAssignments": [
    {
      "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
      "roleIds": [
        "eb7396b5-1d7e-40f9-8f1c-a4d3df551a04",
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      ]
    },
    {
      "workspaceId": "432b0876-c0d8-4a56-b9b4-9f8142c7889c",
      "roleIds": [
        "f9e8d7c6-b5a4-3210-9876-543210fedcba"
      ]
    }
  ]
}
```

### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspaceIds` | array[Guid] | No | List of workspace IDs to remove (null/empty = all workspaces) |
| `removeRolesOnly` | boolean | No | If true, only remove specific roles; if false, remove entire workspaces (default: false) |
| `workspaceRoleAssignments` | array | No | List of workspace-role assignments to remove (required if `removeRolesOnly = true`) |
| `workspaceRoleAssignments[].workspaceId` | Guid | Yes | The workspace ID |
| `workspaceRoleAssignments[].roleIds` | array[Guid] | Yes | List of role IDs to remove from this workspace |

### Success Response (200 OK)

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": true,
  "error": null
}
```

### Error Response (400 Bad Request)

**Example: User Not Found**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "User not found",
    "code": "400"
  }
}
```

**Example: Invalid Request (removeRolesOnly without assignments)**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "WorkspaceRoleAssignments must be provided when RemoveRolesOnly is true",
    "code": "400"
  }
}
```

### What Happens

#### When `removeRolesOnly = false` (Delete Workspaces):

1. All `WorkspaceMembersRole` entries for specified workspaces are soft-deleted
2. All `WorkspaceMember` entries for specified workspaces are soft-deleted
3. If `workspaceIds` is null/empty, user is removed from **all** workspaces

#### When `removeRolesOnly = true` (Delete Specific Roles):

1. Only specified `WorkspaceMembersRole` entries are soft-deleted
2. `WorkspaceMember` entries remain active (user stays in workspace)
3. User retains other roles in the same workspaces

### Important Notes

- **Soft Delete:** All deletions are soft deletes (`IsDeleted = true`, `IsActive = false`)
- **Reversible:** Soft-deleted assignments can be reactivated by using the Update endpoint
- **Cascading:** When a workspace is deleted, all role assignments in that workspace are also soft-deleted

---

## 4. Additional Admin User Endpoints

### 4.1 Get All Users

**GET** `/iam/api/v1/admin/users`

**Description:** Retrieves a paginated list of all users in the system.

**Query Parameters:**
- `pageNumber` (int, optional): Page number (default: 1)
- `pageSize` (int, optional): Items per page (default: 10)
- `searchTerm` (string, optional): Search by name or email
- `status` (string, optional): Filter by user status
- `isActive` (bool, optional): Filter by active status

**Example Request:**
```
GET /iam/api/v1/admin/users?pageNumber=1&pageSize=20&searchTerm=john
```

### 4.2 Get User by ID

**GET** `/iam/api/v1/admin/users/{userId}`

**Description:** Retrieves a specific user by their ID.

**Example Request:**
```
GET /iam/api/v1/admin/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 4.3 Activate User

**POST** `/iam/api/v1/admin/users/{userId}/activate`

**Description:** Activates a deactivated user account.

**Example Request:**
```
POST /iam/api/v1/admin/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/activate
```

### 4.4 Deactivate User

**POST** `/iam/api/v1/admin/users/{userId}/deactivate`

**Description:** Deactivates an active user account.

**Example Request:**
```
POST /iam/api/v1/admin/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/deactivate
```

### 4.5 Delete User (Hard Delete)

**DELETE** `/iam/api/v1/admin/users/{userId}`

**Description:** Permanently deletes a user account (hard delete).

**Example Request:**
```
DELETE /iam/api/v1/admin/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Warning:** This is a permanent deletion. Use with caution.

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "401",
  "message": "Unauthorized",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Invalid or expired token",
    "code": "401"
  }
}
```

### 403 Forbidden

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "403",
  "message": "Forbidden",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Insufficient permissions",
    "code": "403"
  }
}
```

### 500 Internal Server Error

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "500",
  "message": "Internal Server Error",
  "requestId": null,
  "data": null,
  "error": {
    "message": "An error occurred while processing your request",
    "code": "500"
  }
}
```

---

## Best Practices

### 1. Workspace and Role IDs

- Always use valid GUIDs for `workspaceId` and `roleIds`
- Verify workspace and role existence before making requests
- Use the GET endpoints to retrieve valid IDs
- **Note:** To update workspace URL, use the workspace update endpoint (`PUT /api/workspaces/{workspaceId}`), not the admin user management endpoints

### 2. WCO Role Assignment

- Only provide `wcoId` when assigning WCO_EMPLOYEE role in Waste Management workspace
- Ensure the WCO company exists in Waste Management before assignment
- The onboarding is auto-approved, so user can access immediately

### 3. Update Operations

- Remember that Update **replaces** all existing assignments
- Include all desired workspaces and roles in the update request
- Use Delete endpoint if you only want to remove specific items

### 4. Soft Delete Behavior

- Deleted assignments can be reactivated via Update endpoint
- Soft-deleted items are filtered out of queries automatically
- Use GET endpoints to verify current active assignments

### 5. Email Notifications

- Users receive email with temporary password upon creation
- Email includes login URL: `https://icad-ims.netlify.app/login`
- Users should change password on first login

---

## Example Workflows

### Workflow 1: Create Admin User with Multiple Workspaces

```json
POST /iam/api/v1/admin/users/with-role

{
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "workspaceRoles": [
    {
      "workspaceId": "workspace-1-guid",
      "roleIds": ["admin-role-1", "viewer-role-1"]
    },
    {
      "workspaceId": "workspace-2-guid",
      "roleIds": ["admin-role-2"]
    }
  ]
}
```

### Workflow 2: Update User to Add New Workspace

```json
PUT /iam/api/v1/admin/users/{userId}/workspaces

{
  "workspaceRoles": [
    {
      "workspaceId": "workspace-1-guid",
      "roleIds": ["admin-role-1", "viewer-role-1"]
    },
    {
      "workspaceId": "workspace-2-guid",
      "roleIds": ["admin-role-2"]
    },
    {
      "workspaceId": "workspace-3-guid",
      "roleIds": ["viewer-role-3"]
    }
  ]
}
```

### Workflow 3: Remove Specific Role from Workspace

```json
DELETE /iam/api/v1/admin/users/{userId}/workspaces

{
  "removeRolesOnly": true,
  "workspaceRoleAssignments": [
    {
      "workspaceId": "workspace-1-guid",
      "roleIds": ["viewer-role-1"]
    }
  ]
}
```

### Workflow 4: Remove User from All Workspaces

```json
DELETE /iam/api/v1/admin/users/{userId}/workspaces

{
  "workspaceIds": null,
  "removeRolesOnly": false
}
```

---

## Related Documentation

- [Email Verification Flow](./Email_Verification_Flow_Documentation.md)
- [Workspace Role Management](./Workspace_Role_Management.md) (if exists)
- [Waste Management Onboarding](./Waste_Management_Onboarding.md) (if exists)

---

## Support

For issues or questions:
1. Check error messages in API responses
2. Verify workspace and role IDs are correct
3. Ensure user has appropriate admin permissions
4. Contact system administrator for access issues

---

## Notes

- All timestamps are in UTC
- All GUIDs should be in standard UUID format
- Email addresses must be unique across the system
- Temporary passwords meet Identity framework requirements (uppercase, lowercase, digit, special character)
- Soft-deleted records are automatically excluded from queries
- WCO onboarding requires Waste Management API to be accessible

