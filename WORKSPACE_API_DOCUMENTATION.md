# Workspace API Documentation

Complete API documentation for Workspace management endpoints including request/response formats, URLs, and descriptions.

---

## Base URL
All endpoints are relative to the base API URL:
```
https://your-api-domain.com/api/workspaces
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {access_token}
```

---

## Table of Contents
1. [Get All Workspaces](#1-get-all-workspaces)
2. [Get Workspace by ID](#2-get-workspace-by-id)
3. [Create Workspace](#3-create-workspace)
4. [Update Workspace](#4-update-workspace)
5. [Delete Workspace](#5-delete-workspace)
6. [Get My Permissions](#6-get-my-permissions)
7. [Switch Workspace](#7-switch-workspace)

---

## 1. Get All Workspaces

Retrieves a paginated list of workspaces with optional filtering and search capabilities.

**Endpoint:** `GET /api/workspaces`

**Method:** `GET`

**Permissions Required:** `Workspaces.View`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pageNumber` | integer | No | 1 | Page number (1-based) |
| `pageSize` | integer | No | 10 | Number of items per page (max: 100) |
| `query` | string | No | - | Search query (searches in Name and Code) |
| `isActive` | boolean | No | - | Filter by active status (true/false) |

**Example Request:**
```http
GET /api/workspaces?pageNumber=1&pageSize=10&query=seafarer&isActive=true
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Seafarer Management",
        "code": "SEAFARER",
        "description": "Workspace for managing seafarer-related operations",
        "workspaceUrl": "https://seafarer.example.com",
        "isActive": true,
        "isDeleted": false,
        "createdBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "createdAt": "2024-01-15T10:30:00Z",
        "dateCreated": "2024-01-15T10:30:00Z",
        "dateModified": "2024-01-15T10:30:00Z",
        "modifiedBy": null
      },
      {
        "workspaceId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
        "name": "Waste Management",
        "code": "WASTE_MGMT",
        "description": "Workspace for waste management operations",
        "workspaceUrl": "https://waste.example.com",
        "isActive": true,
        "isDeleted": false,
        "createdBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "createdAt": "2024-01-15T11:00:00Z",
        "dateCreated": "2024-01-15T11:00:00Z",
        "dateModified": "2024-01-15T11:00:00Z",
        "modifiedBy": null
      }
    ],
    "totalCount": 25,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid page size. Maximum is 100.",
  "errors": []
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You do not have permission to view workspaces",
  "errors": []
}
```

---

## 2. Get Workspace by ID

Retrieves detailed information about a specific workspace by its ID.

**Endpoint:** `GET /api/workspaces/{id}`

**Method:** `GET`

**Permissions Required:** `Workspaces.View`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Guid (string) | Yes | Workspace unique identifier |

**Example Request:**
```http
GET /api/workspaces/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Seafarer Management",
    "code": "SEAFARER",
    "description": "Workspace for managing seafarer-related operations",
    "workspaceUrl": "https://seafarer.example.com",
    "isActive": true,
    "isDeleted": false,
    "createdBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "createdAt": "2024-01-15T10:30:00Z",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T10:30:00Z",
    "modifiedBy": null
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid workspace ID format",
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Record not found",
  "errors": []
}
```

---

## 3. Create Workspace

Creates a new workspace. **Only RDLC administrators can create workspaces.**

**Endpoint:** `POST /api/workspaces`

**Method:** `POST`

**Permissions Required:** `Workspaces.Create`

**Request Body:**
```json
{
  "name": "New Workspace",
  "code": "NEW_WS",
  "description": "Description of the new workspace",
  "workspaceUrl": "https://new-workspace.example.com"
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | Min: 3, Max: 255 | Workspace display name |
| `code` | string | Yes | Min: 2, Max: 50, Pattern: `^[A-Z0-9_-]+$` | Unique workspace code (uppercase letters, numbers, underscores, hyphens only) |
| `description` | string | No | Max: 1000 | Workspace description |
| `workspaceUrl` | string | No | Max: 500 | URL associated with the workspace |

**Example Request:**
```http
POST /api/workspaces
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Environmental Management",
  "code": "ENV_MGMT",
  "description": "Workspace for environmental management and sustainability",
  "workspaceUrl": "https://env.example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "workspaceId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
    "name": "Environmental Management",
    "code": "ENV_MGMT",
    "description": "Workspace for environmental management and sustainability",
    "workspaceUrl": "https://env.example.com",
    "isActive": true,
    "isDeleted": false,
    "createdBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "createdAt": "2024-01-15T12:00:00Z",
    "dateCreated": "2024-01-15T12:00:00Z",
    "dateModified": "2024-01-15T12:00:00Z",
    "modifiedBy": null
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Workspace name must be at least 3 characters"
    },
    {
      "field": "code",
      "message": "Workspace code must contain only uppercase letters, numbers, underscores, and hyphens"
    }
  ]
}
```

**Error Response (403 Forbidden - Not RDLC Admin):**
```json
{
  "success": false,
  "message": "Only RDLC administrators can create workspaces. Please contact your system administrator.",
  "errors": []
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Workspace with this name or code already exists",
  "errors": []
}
```

**Notes:**
- When a workspace is created, an "Owner" role is automatically created with full permissions
- The creator must be an RDLC administrator (email contains @rdlc.com or is superadmin@rdlc.com)
- Workspace code must be unique and follow the pattern: uppercase letters, numbers, underscores, and hyphens only

---

## 4. Update Workspace

Updates an existing workspace's name and description.

**Endpoint:** `PUT /api/workspaces/{id}`

**Method:** `PUT`

**Permissions Required:** `Workspaces.Update`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Guid (string) | Yes | Workspace unique identifier |

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | Min: 3, Max: 255 | Updated workspace display name |
| `description` | string | No | Max: 1000 | Updated workspace description |

**Example Request:**
```http
PUT /api/workspaces/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Seafarer Management System",
  "description": "Updated description for seafarer workspace"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Workspace updated successfully",
  "data": {
    "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Seafarer Management System",
    "code": "SEAFARER",
    "description": "Updated description for seafarer workspace",
    "workspaceUrl": "https://seafarer.example.com",
    "isActive": true,
    "isDeleted": false,
    "createdBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "createdAt": "2024-01-15T10:30:00Z",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T14:00:00Z",
    "modifiedBy": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid workspace ID format",
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Record not found",
  "errors": []
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Workspace name already exists",
  "errors": []
}
```

**Notes:**
- Only `name` and `description` can be updated
- Workspace `code` cannot be changed after creation
- Workspace `workspaceUrl` cannot be updated via this endpoint (update separately if needed)

---

## 5. Delete Workspace

Soft deletes a workspace (marks as deleted, does not permanently remove).

**Endpoint:** `DELETE /api/workspaces/{id}`

**Method:** `DELETE`

**Permissions Required:** `Workspaces.Delete`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Guid (string) | Yes | Workspace unique identifier |

**Example Request:**
```http
DELETE /api/workspaces/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Workspace deleted successfully",
  "data": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid workspace ID format",
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Record not found",
  "errors": []
}
```

**Notes:**
- This is a soft delete operation - the workspace is marked as `isDeleted: true`
- Deleted workspaces are not returned in the "Get All Workspaces" endpoint
- The workspace data remains in the database for audit purposes

---

## 6. Get My Permissions

Retrieves all permissions for the current user in a specific workspace.

**Endpoint:** `GET /api/workspaces/{id}/permissions/my`

**Method:** `GET`

**Permissions Required:** None (user must be a member of the workspace)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Guid (string) | Yes | Workspace unique identifier |

**Example Request:**
```http
GET /api/workspaces/3fa85f64-5717-4562-b3fc-2c963f66afa6/permissions/my
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    "WasteRequest.Create",
    "WasteRequest.Read",
    "WasteRequest.Update",
    "WasteRequest.Delete",
    "WasteRequest.Approve",
    "CollectionRequest.Create",
    "CollectionRequest.Read",
    "CollectionRequest.Update",
    "UserManagement.View",
    "UserManagement.Create"
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid workspace ID format",
  "errors": []
}
```

**Error Response (400 Bad Request - Not a Member):**
```json
{
  "success": false,
  "message": "User is not a member of this workspace",
  "errors": []
}
```

**Error Response (400 Bad Request - Missing Context):**
```json
{
  "success": false,
  "message": "Missing user or tenant context",
  "errors": []
}
```

**Notes:**
- Returns permissions in the format: `{ResourceName}.{PermissionName}` (e.g., "WasteRequest.Create")
- Permissions are collected from all roles assigned to the user in this workspace
- User must be a member of the workspace (either directly or through tenant membership)
- Permissions are workspace-specific and filtered to only include resources in the specified workspace

---

## 7. Switch Workspace

Switches the current user's active workspace context. Returns a signal that the frontend should refresh the token.

**Endpoint:** `POST /api/workspaces/{workspaceId}/switch`

**Method:** `POST`

**Permissions Required:** `Workspaces.View`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | Guid | Yes | Workspace unique identifier to switch to |

**Example Request:**
```http
POST /api/workspaces/3fa85f64-5717-4562-b3fc-2c963f66afa6/switch
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Workspace switched to Seafarer Management. Please refresh your token to get updated workspace context.",
  "data": {
    "accessToken": "SWITCH_WORKSPACE",
    "refreshToken": "",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "userName": "john.doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "middleName": null,
      "lastName": "Doe",
      "tenantId": "tenant-123"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing user or tenant context",
  "errors": []
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You don't have access to this workspace",
  "errors": []
}
```

**Notes:**
- The `accessToken` field will contain "SWITCH_WORKSPACE" as a signal to the frontend
- Frontend should refresh the authentication token after switching workspaces
- User must have access to the workspace through their tenant (`UserWorkspace` record must exist)
- This endpoint validates that the user has the necessary `UserWorkspace` relationship before allowing the switch

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```
**Cause:** Missing or invalid authentication token

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "errors": []
}
```
**Cause:** User lacks the required permission for the requested operation

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred while processing your request",
  "errors": []
}
```
**Cause:** Unexpected server error. Check server logs for details.

---

## Data Models

### WorkspaceDto
| Property | Type | Description |
|----------|------|-------------|
| `workspaceId` | Guid | Unique workspace identifier |
| `name` | string? | Workspace display name |
| `code` | string? | Unique workspace code |
| `description` | string? | Workspace description |
| `workspaceUrl` | string? | URL associated with the workspace (max 500 characters) |
| `isActive` | boolean | Whether the workspace is active |
| `isDeleted` | boolean | Whether the workspace is soft-deleted |
| `createdBy` | Guid? | User ID who created the workspace |
| `createdAt` | DateTime | Timestamp when workspace was created |
| `dateCreated` | DateTime? | Alternative creation timestamp |
| `dateModified` | DateTime? | Last modification timestamp |
| `modifiedBy` | Guid? | User ID who last modified the workspace |

### PagedResultDto<T>
| Property | Type | Description |
|----------|------|-------------|
| `items` | IEnumerable<T> | Array of items for the current page |
| `totalCount` | integer | Total number of items across all pages |
| `pageNumber` | integer | Current page number (1-based) |
| `pageSize` | integer | Number of items per page |
| `totalPages` | integer | Total number of pages (calculated) |
| `hasPreviousPage` | boolean | Whether there is a previous page |
| `hasNextPage` | boolean | Whether there is a next page |

---

## Best Practices

1. **Pagination**: Always use pagination for list endpoints to avoid performance issues
2. **Filtering**: Use query parameters to filter results and reduce payload size
3. **Error Handling**: Implement proper error handling for all response codes
4. **Token Refresh**: Always refresh tokens after workspace switch operations
5. **Validation**: Validate all input before sending requests (especially workspace codes)
6. **Rate Limiting**: Be mindful of API rate limits when making multiple requests
7. **Caching**: Consider caching workspace lists for better performance

---

## Notes

- All timestamps are in UTC format (ISO 8601)
- All GUIDs are in standard UUID format
- Workspace codes must be unique across the system
- Only RDLC administrators can create new workspaces
- Workspace deletion is soft delete (data is preserved)
- Workspace URL is optional and can be set during creation or updated separately
- Permissions are workspace-scoped and resource-specific

---

**Last Updated:** January 2025
**API Version:** 1.0

