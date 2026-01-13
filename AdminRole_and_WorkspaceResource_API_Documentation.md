# AdminRole and WorkspaceResource API Documentation

## Overview
This document provides complete API documentation for:
1. **AdminRole CRUD operations** - Managing admin roles
2. **WorkspaceResource Update and Delete operations** - Updating and soft deleting workspace resources

---

## Base URLs

**IAM API Base URL:**
```
{iam-api-base-url}/api
```

**Example:**
```
https://iam-api.example.com/api
```

---

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {access_token}
```

**Note:** Only **SuperAdmin** users (email contains `@rdlc.com`) can perform create, update, and delete operations.

---

# Part 1: AdminRole API Endpoints

## Base Route
```
/api/admin-roles
```

---

## 1. Get All Admin Roles

**Description:** Retrieves all active admin roles. Only returns roles where `IsActive = true` and `IsDeleted = false`.

**Endpoint:** `GET /api/admin-roles`

**URL:** `{base-url}/api/admin-roles`

**Request Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Admin roles retrieved successfully",
  "requestId": null,
  "data": [
    {
      "adminRoleId": "123e4567-e89b-12d3-a456-426614174000",
      "roleName": "System Administrator",
      "roleCode": "SYSTEM_ADMIN",
      "description": "Full system access with all permissions",
      "isSystemRole": true,
      "isActive": true,
      "isDeleted": false,
      "createdBy": "789e4567-e89b-12d3-a456-426614174001",
      "dateCreated": "2024-01-15T10:30:00Z",
      "dateModified": "2024-01-15T10:30:00Z",
      "modifiedBy": null
    },
    {
      "adminRoleId": "223e4567-e89b-12d3-a456-426614174002",
      "roleName": "Workspace Administrator",
      "roleCode": "WORKSPACE_ADMIN",
      "description": "Administrator for specific workspace",
      "isSystemRole": false,
      "isActive": true,
      "isDeleted": false,
      "createdBy": "789e4567-e89b-12d3-a456-426614174001",
      "dateCreated": "2024-01-16T09:00:00Z",
      "dateModified": "2024-01-16T09:00:00Z",
      "modifiedBy": null
    }
  ],
  "error": null
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "401",
  "message": "Unauthorized",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

---

## 2. Get Admin Role by ID

**Description:** Retrieves a specific admin role by its ID.

**Endpoint:** `GET /api/admin-roles/{id}`

**URL:** `{base-url}/api/admin-roles/{id}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `Guid` | ✅ Yes | The admin role ID |

**Request Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Admin role retrieved successfully",
  "requestId": null,
  "data": {
    "adminRoleId": "123e4567-e89b-12d3-a456-426614174000",
    "roleName": "System Administrator",
    "roleCode": "SYSTEM_ADMIN",
    "description": "Full system access with all permissions",
    "isSystemRole": true,
    "isActive": true,
    "isDeleted": false,
    "createdBy": "789e4567-e89b-12d3-a456-426614174001",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T10:30:00Z",
    "modifiedBy": null
  },
  "error": null
}
```

**Response (Error - 404 Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "404",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Admin role not found",
    "code": "NOT_FOUND"
  }
}
```

---

## 3. Create Admin Role

**Description:** Creates a new admin role. Only SuperAdmin can create admin roles.

**Endpoint:** `POST /api/admin-roles`

**URL:** `{base-url}/api/admin-roles`

**Request Headers:**
```http
Authorization: Bearer {superadmin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleName": "Workspace Administrator",
  "roleCode": "WORKSPACE_ADMIN",
  "description": "Administrator for specific workspace with limited permissions",
  "isSystemRole": false
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleName` | `string` | ✅ Yes | Name of the admin role (e.g., "Workspace Administrator") |
| `roleCode` | `string?` | Optional | Unique code for the role (e.g., "WORKSPACE_ADMIN") |
| `description` | `string?` | Optional | Description of the role's purpose and permissions |
| `isSystemRole` | `bool` | Optional | Whether this is a system role (default: `false`). System roles cannot be deleted. |

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Admin role created successfully",
  "requestId": null,
  "data": {
    "adminRoleId": "223e4567-e89b-12d3-a456-426614174002",
    "roleName": "Workspace Administrator",
    "roleCode": "WORKSPACE_ADMIN",
    "description": "Administrator for specific workspace with limited permissions",
    "isSystemRole": false,
    "isActive": true,
    "isDeleted": false,
    "createdBy": "789e4567-e89b-12d3-a456-426614174001",
    "dateCreated": "2024-01-16T09:00:00Z",
    "dateModified": "2024-01-16T09:00:00Z",
    "modifiedBy": null
  },
  "error": null
}
```

**Response (Error - 400 Bad Request - Missing RoleName):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "RoleName is required",
    "code": "VALIDATION_ERROR"
  }
}
```

**Response (Error - 400 Bad Request - Duplicate Role):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Admin role with name 'Workspace Administrator' already exists",
    "code": "DUPLICATE_ROLE"
  }
}
```

**Response (Error - 403 Forbidden - Not SuperAdmin):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "403",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Only SuperAdmin can create admin roles",
    "code": "PERMISSION_DENIED"
  }
}
```

---

## 4. Update Admin Role

**Description:** Updates an existing admin role. Only SuperAdmin can update admin roles.

**Endpoint:** `PUT /api/admin-roles/{id}`

**URL:** `{base-url}/api/admin-roles/{id}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `Guid` | ✅ Yes | The admin role ID |

**Request Headers:**
```http
Authorization: Bearer {superadmin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleName": "Updated Workspace Administrator",
  "roleCode": "UPDATED_WORKSPACE_ADMIN",
  "description": "Updated description for workspace administrator",
  "isActive": true
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleName` | `string?` | Optional | Updated name of the admin role |
| `roleCode` | `string?` | Optional | Updated code for the role (can be set to `null` to clear) |
| `description` | `string?` | Optional | Updated description |
| `isActive` | `bool?` | Optional | Whether the role is active (can be used to deactivate without deleting) |

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Admin role updated successfully",
  "requestId": null,
  "data": {
    "adminRoleId": "223e4567-e89b-12d3-a456-426614174002",
    "roleName": "Updated Workspace Administrator",
    "roleCode": "UPDATED_WORKSPACE_ADMIN",
    "description": "Updated description for workspace administrator",
    "isSystemRole": false,
    "isActive": true,
    "isDeleted": false,
    "createdBy": "789e4567-e89b-12d3-a456-426614174001",
    "dateCreated": "2024-01-16T09:00:00Z",
    "dateModified": "2024-01-16T10:30:00Z",
    "modifiedBy": "789e4567-e89b-12d3-a456-426614174001"
  },
  "error": null
}
```

**Response (Error - 400 Bad Request - Duplicate Name):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Admin role with name 'Updated Workspace Administrator' already exists",
    "code": "DUPLICATE_ROLE"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "404",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Admin role not found",
    "code": "NOT_FOUND"
  }
}
```

---

## 5. Delete Admin Role (Soft Delete)

**Description:** Soft deletes an admin role by setting `IsDeleted = true` and `IsActive = false`. Only SuperAdmin can delete admin roles. System roles cannot be deleted.

**Endpoint:** `DELETE /api/admin-roles/{id}`

**URL:** `{base-url}/api/admin-roles/{id}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `Guid` | ✅ Yes | The admin role ID |

**Request Headers:**
```http
Authorization: Bearer {superadmin_token}
```

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Admin role deleted successfully",
  "requestId": null,
  "data": true,
  "error": null
}
```

**Response (Error - 400 Bad Request - System Role):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Cannot delete system admin role",
    "code": "SYSTEM_ROLE_PROTECTED"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "404",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Admin role not found",
    "code": "NOT_FOUND"
  }
}
```

---

# Part 2: WorkspaceResource Update and Delete Endpoints

## Base Route
```
/api/workspaces/{workspaceId}/resources
```

---

## 1. Update Workspace Resource

**Description:** Updates an existing workspace resource. Only SuperAdmin can update resources. All fields are optional - only provided fields will be updated.

**Endpoint:** `PUT /api/workspaces/{workspaceId}/resources/{resourceId}`

**URL:** `{base-url}/api/workspaces/{workspaceId}/resources/{resourceId}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | `Guid` | ✅ Yes | The workspace ID |
| `resourceId` | `Guid` | ✅ Yes | The resource ID to update |

**Request Headers:**
```http
Authorization: Bearer {superadmin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "resourceName": "Updated Resource Name",
  "url": "/updated/path",
  "parentId": "550e8400-e29b-41d4-a716-446655440000",
  "isActive": true
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resourceName` | `string?` | Optional | Updated name of the resource |
| `url` | `string?` | Optional | Updated URL path for the resource |
| `parentId` | `string?` | Optional | Updated parent resource ID (can be set to `null` or empty string to remove parent) |
| `isActive` | `bool?` | Optional | Whether the resource is active (can be used to deactivate without deleting) |

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Resource updated successfully",
  "requestId": null,
  "data": {
    "resourceId": "123e4567-e89b-12d3-a456-426614174000",
    "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
    "resourceName": "Updated Resource Name",
    "url": "/updated/path",
    "parentId": "550e8400-e29b-41d4-a716-446655440000",
    "children": []
  },
  "error": null
}
```

**Response (Error - 400 Bad Request - Invalid ParentId):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Invalid ParentId format",
    "code": "VALIDATION_ERROR"
  }
}
```

**Response (Error - 400 Bad Request - Parent Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Parent resource not found in workspace",
    "code": "PARENT_NOT_FOUND"
  }
}
```

**Response (Error - 400 Bad Request - Self Parent):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Resource cannot be its own parent",
    "code": "INVALID_PARENT"
  }
}
```

**Response (Error - 403 Forbidden - Not SuperAdmin):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "403",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Only SuperAdmin can update resources",
    "code": "PERMISSION_DENIED"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "404",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

---

## 2. Delete Workspace Resource (Soft Delete)

**Description:** Soft deletes a workspace resource by setting `IsDeleted = true` and `IsActive = false`. Only SuperAdmin can delete resources. Resources with child resources cannot be deleted - you must delete or reassign children first.

**Endpoint:** `DELETE /api/workspaces/{workspaceId}/resources/{resourceId}`

**URL:** `{base-url}/api/workspaces/{workspaceId}/resources/{resourceId}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | `Guid` | ✅ Yes | The workspace ID |
| `resourceId` | `Guid` | ✅ Yes | The resource ID to delete |

**Request Headers:**
```http
Authorization: Bearer {superadmin_token}
```

**Response (Success - 200 OK):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Resource deleted successfully",
  "requestId": null,
  "data": true,
  "error": null
}
```

**Response (Error - 400 Bad Request - Has Children):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Cannot delete resource with child resources. Please delete or reassign children first.",
    "code": "HAS_CHILDREN"
  }
}
```

**Response (Error - 403 Forbidden - Not SuperAdmin):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "403",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Only SuperAdmin can delete resources",
    "code": "PERMISSION_DENIED"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "404",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

---

## Complete Example Workflows

### Example 1: Create and Manage Admin Role

**Step 1: Create Admin Role**
```http
POST /api/admin-roles HTTP/1.1
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "roleName": "Workspace Administrator",
  "roleCode": "WORKSPACE_ADMIN",
  "description": "Administrator for specific workspace",
  "isSystemRole": false
}
```

**Step 2: Get All Admin Roles**
```http
GET /api/admin-roles HTTP/1.1
Authorization: Bearer {token}
```

**Step 3: Update Admin Role**
```http
PUT /api/admin-roles/223e4567-e89b-12d3-a456-426614174002 HTTP/1.1
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "roleName": "Updated Workspace Administrator",
  "description": "Updated description"
}
```

**Step 4: Delete Admin Role (if not system role)**
```http
DELETE /api/admin-roles/223e4567-e89b-12d3-a456-426614174002 HTTP/1.1
Authorization: Bearer {superadmin_token}
```

---

### Example 2: Update and Delete Workspace Resource

**Step 1: Get All Resources (to find resource ID)**
```http
GET /api/workspaces/550e8400-e29b-41d4-a716-446655440000/resources HTTP/1.1
Authorization: Bearer {token}
```

**Step 2: Update Resource**
```http
PUT /api/workspaces/550e8400-e29b-41d4-a716-446655440000/resources/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "resourceName": "Updated Resource Name",
  "url": "/updated/path",
  "isActive": true
}
```

**Step 3: Delete Resource (if no children)**
```http
DELETE /api/workspaces/550e8400-e29b-41d4-a716-446655440000/resources/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Authorization: Bearer {superadmin_token}
```

---

## Important Notes

### AdminRole

1. **SuperAdmin Only:** Only users with email containing `@rdlc.com` can create, update, or delete admin roles
2. **System Roles:** Roles with `isSystemRole = true` cannot be deleted
3. **Soft Delete:** Deletion is soft delete - sets `IsDeleted = true` and `IsActive = false`
4. **Unique Constraints:** Role name and role code must be unique (if provided)
5. **Filtering:** All GET operations only return roles where `IsActive = true` and `IsDeleted = false`

### WorkspaceResource

1. **SuperAdmin Only:** Only users with email containing `@rdlc.com` can update or delete resources
2. **IsActive Filter:** All GET operations filter by `IsActive = true` and `IsDeleted = false`
3. **Child Resources:** Resources with children cannot be deleted - must delete or reassign children first
4. **Self Parent:** A resource cannot be its own parent
5. **Parent Validation:** Parent resource must exist in the same workspace and be active
6. **Soft Delete:** Deletion is soft delete - sets `IsDeleted = true` and `IsActive = false`
7. **Cache Invalidation:** Permission cache is invalidated after update/delete operations

---

## Error Codes

### AdminRole Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Required field missing or invalid format |
| `DUPLICATE_ROLE` | 400 | Role name or code already exists |
| `PERMISSION_DENIED` | 403 | User is not SuperAdmin |
| `NOT_FOUND` | 404 | Admin role not found |
| `SYSTEM_ROLE_PROTECTED` | 400 | Cannot delete system role |

### WorkspaceResource Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid format (e.g., invalid ParentId) |
| `PARENT_NOT_FOUND` | 400 | Parent resource not found in workspace |
| `INVALID_PARENT` | 400 | Resource cannot be its own parent |
| `HAS_CHILDREN` | 400 | Resource has child resources and cannot be deleted |
| `PERMISSION_DENIED` | 403 | User is not SuperAdmin |
| `NOT_FOUND` | 404 | Resource not found |
| `MISSING_TENANT_OR_USER` | 400 | Missing tenant or user context |

---

## Summary

### AdminRole Endpoints

| Method | Endpoint | Description | Who Can Use |
|--------|----------|-------------|-------------|
| `GET` | `/api/admin-roles` | Get all admin roles | All authenticated users |
| `GET` | `/api/admin-roles/{id}` | Get admin role by ID | All authenticated users |
| `POST` | `/api/admin-roles` | Create admin role | SuperAdmin only |
| `PUT` | `/api/admin-roles/{id}` | Update admin role | SuperAdmin only |
| `DELETE` | `/api/admin-roles/{id}` | Delete admin role | SuperAdmin only (system roles protected) |

### WorkspaceResource Endpoints

| Method | Endpoint | Description | Who Can Use |
|--------|----------|-------------|-------------|
| `GET` | `/api/workspaces/{workspaceId}/resources` | Get all resources | All authenticated users (filters by IsActive) |
| `POST` | `/api/workspaces/{workspaceId}/resources` | Create resource | SuperAdmin only |
| `PUT` | `/api/workspaces/{workspaceId}/resources/{resourceId}` | Update resource | SuperAdmin only |
| `DELETE` | `/api/workspaces/{workspaceId}/resources/{resourceId}` | Delete resource | SuperAdmin only (cannot delete if has children) |

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-16

