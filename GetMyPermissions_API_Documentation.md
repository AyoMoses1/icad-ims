# Workspace API Documentation

This document contains API documentation for workspace-related endpoints including permissions and menu items.

---

# Get My Permissions API Documentation

## Description

This endpoint retrieves the current authenticated user's permissions for a specific workspace. The permissions are returned as a list of composite permission strings in the format `ResourceName.PermissionName` (e.g., "WasteRequest.Create", "Workspaces.View"). 

The endpoint validates that:
- The workspace ID is in a valid GUID format
- The user is authenticated and has a valid tenant context
- The user is a member of the specified workspace

Permissions are aggregated from all roles assigned to the user's workspace membership, filtered by the workspace's active resources.

---

## URL

```
GET /api/workspaces/{workspaceId}/permissions/my
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string (GUID) | Yes | The unique identifier of the workspace for which to retrieve permissions |

### Example URL

```
GET /api/workspaces/550e8400-e29b-41d4-a716-446655440000/permissions/my
```

---

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token for authentication. Format: `Bearer {access_token}` |
| `Content-Type` | string | No | `application/json` |

### Request Body

This endpoint does not require a request body. The workspace ID is provided as a path parameter.

### Example Request

```http
GET /api/workspaces/550e8400-e29b-41d4-a716-446655440000/permissions/my HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Response

### Success Response (200 OK)

Returns an `ApiResponse<IEnumerable<string>>` containing the list of permission strings.

#### Response Structure

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "SUCCESSFUL",
  "message": "SUCCESSFUL",
  "requestId": "string (optional)",
  "data": [
    "WasteRequest.Create",
    "WasteRequest.View",
    "WasteRequest.Update",
    "WasteRequest.Delete",
    "Workspaces.View",
    "Workspaces.Create",
    "Users.View",
    "Users.Create"
  ],
  "error": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `apiVersion` | string | API version (default: "v1") |
| `success` | boolean | Indicates if the request was successful |
| `code` | string | Response code (e.g., "SUCCESSFUL", "UNSUCCESSFUL") |
| `message` | string | Response message |
| `requestId` | string (optional) | Unique request identifier for tracking |
| `data` | array of strings | List of permission strings in format `ResourceName.PermissionName` |
| `error` | object (optional) | Error details if the request failed |

#### Permission String Format

Each permission string follows the pattern: `{ResourceName}.{PermissionName}`

- **ResourceName**: The name of the resource (e.g., "WasteRequest", "Workspaces", "Users")
- **PermissionName**: The action/permission name (e.g., "Create", "View", "Update", "Delete")

### Error Responses

#### 400 Bad Request - Invalid Workspace ID Format

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Invalid workspace ID format",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INVALID_MODEL",
    "message": "Invalid workspace ID format"
  }
}
```

#### 400 Bad Request - Missing User or Tenant Context

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Missing user or tenant context",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INVALID_MODEL",
    "message": "Missing user or tenant context"
  }
}
```

#### 400 Bad Request - User Not a Member

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "User is not a member of this workspace",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INVALID_MODEL",
    "message": "User is not a member of this workspace"
  }
}
```

#### 401 Unauthorized

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Unauthorized",
  "requestId": null,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 500 Internal Server Error

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "An error occurred while processing your request",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

---

## Example Usage

### cURL Example

```bash
curl -X GET "https://api.example.com/api/workspaces/550e8400-e29b-41d4-a716-446655440000/permissions/my" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### JavaScript (Fetch) Example

```javascript
const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
const accessToken = 'your-access-token';

fetch(`/api/workspaces/${workspaceId}/permissions/my`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Permissions:', data.data);
      // data.data is an array: ["WasteRequest.Create", "WasteRequest.View", ...]
    } else {
      console.error('Error:', data.error);
    }
  })
  .catch(error => console.error('Request failed:', error));
```

### C# Example

```csharp
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;

public async Task<List<string>> GetMyPermissionsAsync(string workspaceId, string accessToken)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", accessToken);
    
    var response = await client.GetAsync(
        $"https://api.example.com/api/workspaces/{workspaceId}/permissions/my");
    
    response.EnsureSuccessStatusCode();
    
    var json = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonConvert.DeserializeObject<ApiResponse<List<string>>>(json);
    
    if (apiResponse.Success)
    {
        return apiResponse.Data ?? new List<string>();
    }
    
    throw new Exception($"Failed to get permissions: {apiResponse.Error?.Message}");
}
```

---

## Notes

1. **Authentication Required**: This endpoint requires a valid Bearer token in the Authorization header.

2. **Workspace Membership**: The user must be a member of the specified workspace. Membership is determined by the `WorkspaceMembers` table, which can be either user-based or tenant-based.

3. **Permission Aggregation**: Permissions are collected from all roles assigned to the user's workspace membership. The endpoint:
   - Finds the user's workspace membership
   - Retrieves all roles assigned to that membership
   - Collects permissions from those roles
   - Filters by workspace-specific active resources
   - Returns unique composite permissions in the format `ResourceName.PermissionName`

4. **Empty Permissions**: If the user has no permissions or is not assigned to any roles, the endpoint will return an empty array `[]` rather than an error (assuming the user is a valid workspace member).

5. **Workspace Context**: The endpoint uses the current user's tenant context from the authentication token to determine workspace membership.

6. **Menu Integration**: This endpoint is commonly used in conjunction with the menu endpoint (`GET /api/menu?workspaceId={workspaceId}`) to filter menu items based on user permissions.

---

## Related Endpoints

- `GET /api/menu?workspaceId={workspaceId}` - Get workspace menu items (supports workspaceId filter)
- `GET /api/workspaces/{id}` - Get workspace details
- `GET /api/workspaces` - Get all workspaces

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-23 | Initial documentation |

---

# Get Workspace Menu API Documentation

## Description

This endpoint retrieves the menu structure for workspaces that the current authenticated user has access to. The menu is organized hierarchically with parent-child relationships between menu items. When a `workspaceId` query parameter is provided, the endpoint returns menu items only for that specific workspace. If no `workspaceId` is provided, it returns menu items for all workspaces the user is assigned to.

The endpoint:
- Filters workspaces based on user's `UserWorkspace` assignments
- Returns only active, non-deleted workspaces
- Builds a hierarchical menu tree structure from workspace resources
- Groups menu items by workspace
- Returns an empty array if the user has no workspace assignments or if a specific workspace is requested but the user is not a member

---

## URL

```
GET /api/menu
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string (GUID) | No | Optional workspace ID to filter menu items for a specific workspace. If omitted, returns menu items for all user's workspaces. |

### Example URLs

**Get menu for all workspaces:**
```
GET /api/menu
```

**Get menu for a specific workspace:**
```
GET /api/menu?workspaceId=550e8400-e29b-41d4-a716-446655440000
```

---

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token for authentication. Format: `Bearer {access_token}` |
| `Content-Type` | string | No | `application/json` |

### Request Body

This endpoint does not require a request body. The workspace ID is provided as an optional query parameter.

### Example Request

**Get menu for all workspaces:**
```http
GET /api/menu HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Get menu for a specific workspace:**
```http
GET /api/menu?workspaceId=550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Response

### Success Response (200 OK)

Returns an `ApiResponse<IEnumerable<WorkspaceMenuDto>>` containing the list of workspace menus with their hierarchical menu items.

#### Response Structure

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "SUCCESSFUL",
  "message": "SUCCESSFUL",
  "requestId": "string (optional)",
  "data": [
    {
      "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
      "workspaceName": "Waste Management",
      "workspaceCode": "WM",
      "resources": [
        {
          "resourceId": "660e8400-e29b-41d4-a716-446655440000",
          "name": "Dashboard",
          "url": "/dashboard",
          "parentId": null,
          "children": []
        },
        {
          "resourceId": "770e8400-e29b-41d4-a716-446655440000",
          "name": "Waste Requests",
          "url": "/waste-requests",
          "parentId": null,
          "children": [
            {
              "resourceId": "880e8400-e29b-41d4-a716-446655440000",
              "name": "Create Request",
              "url": "/waste-requests/create",
              "parentId": "770e8400-e29b-41d4-a716-446655440000",
              "children": []
            },
            {
              "resourceId": "990e8400-e29b-41d4-a716-446655440000",
              "name": "View Requests",
              "url": "/waste-requests/list",
              "parentId": "770e8400-e29b-41d4-a716-446655440000",
              "children": []
            }
          ]
        },
        {
          "resourceId": "aa0e8400-e29b-41d4-a716-446655440000",
          "name": "Settings",
          "url": "/settings",
          "parentId": null,
          "children": []
        }
      ]
    },
    {
      "workspaceId": "bb0e8400-e29b-41d4-a716-446655440000",
      "workspaceName": "Seafarer Management",
      "workspaceCode": "SM",
      "resources": [
        {
          "resourceId": "cc0e8400-e29b-41d4-a716-446655440000",
          "name": "Crew Management",
          "url": "/crew",
          "parentId": null,
          "children": []
        }
      ]
    }
  ],
  "error": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `apiVersion` | string | API version (default: "v1") |
| `success` | boolean | Indicates if the request was successful |
| `code` | string | Response code (e.g., "SUCCESSFUL", "UNSUCCESSFUL") |
| `message` | string | Response message |
| `requestId` | string (optional) | Unique request identifier for tracking |
| `data` | array of WorkspaceMenuDto | List of workspace menus with their menu items |
| `error` | object (optional) | Error details if the request failed |

#### WorkspaceMenuDto Structure

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | GUID | The unique identifier of the workspace |
| `workspaceName` | string (optional) | The name of the workspace |
| `workspaceCode` | string (optional) | The code of the workspace |
| `resources` | array of MenuItemDto | List of root-level menu items (hierarchical tree structure) |

#### MenuItemDto Structure

| Field | Type | Description |
|-------|------|-------------|
| `resourceId` | GUID | The unique identifier of the menu resource |
| `name` | string | The display name of the menu item |
| `url` | string (optional) | The URL or route path for the menu item |
| `parentId` | GUID (optional) | The resource ID of the parent menu item. `null` for root-level items |
| `children` | array of MenuItemDto | List of child menu items (nested hierarchy) |

### Empty Response (200 OK)

If the user has no workspace assignments or the specified workspace is not accessible, an empty array is returned:

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "SUCCESSFUL",
  "message": "SUCCESSFUL",
  "requestId": null,
  "data": [],
  "error": null
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Unauthorized",
  "requestId": null,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 500 Internal Server Error

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "An error occurred while processing your request",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

---

## Example Usage

### cURL Example

**Get menu for all workspaces:**
```bash
curl -X GET "https://api.example.com/api/menu" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Get menu for a specific workspace:**
```bash
curl -X GET "https://api.example.com/api/menu?workspaceId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### JavaScript (Fetch) Example

```javascript
// Get menu for all workspaces
async function getMenu(workspaceId = null) {
  const accessToken = 'your-access-token';
  const url = workspaceId 
    ? `/api/menu?workspaceId=${workspaceId}`
    : '/api/menu';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Menu items:', data.data);
      // data.data is an array of WorkspaceMenuDto objects
      data.data.forEach(workspaceMenu => {
        console.log(`Workspace: ${workspaceMenu.workspaceName}`);
        console.log('Menu items:', workspaceMenu.resources);
      });
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Get menu for all workspaces
getMenu();

// Get menu for a specific workspace
getMenu('550e8400-e29b-41d4-a716-446655440000');
```

### C# Example

```csharp
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using System.Collections.Generic;

public class WorkspaceMenuDto
{
    public Guid WorkspaceId { get; set; }
    public string? WorkspaceName { get; set; }
    public string? WorkspaceCode { get; set; }
    public List<MenuItemDto> Resources { get; set; } = new();
}

public class MenuItemDto
{
    public Guid ResourceId { get; set; }
    public string Name { get; set; } = null!;
    public string? Url { get; set; }
    public Guid? ParentId { get; set; }
    public List<MenuItemDto> Children { get; set; } = new();
}

public async Task<List<WorkspaceMenuDto>> GetMenuAsync(string? workspaceId, string accessToken)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", accessToken);
    
    var url = string.IsNullOrEmpty(workspaceId)
        ? "https://api.example.com/api/menu"
        : $"https://api.example.com/api/menu?workspaceId={workspaceId}";
    
    var response = await client.GetAsync(url);
    response.EnsureSuccessStatusCode();
    
    var json = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonConvert.DeserializeObject<ApiResponse<List<WorkspaceMenuDto>>>(json);
    
    if (apiResponse.Success)
    {
        return apiResponse.Data ?? new List<WorkspaceMenuDto>();
    }
    
    throw new Exception($"Failed to get menu: {apiResponse.Error?.Message}");
}
```

---

## Notes

1. **Authentication Required**: This endpoint requires a valid Bearer token in the Authorization header.

2. **Workspace Filtering**: 
   - If `workspaceId` is provided, only menu items for that specific workspace are returned
   - If `workspaceId` is omitted, menu items for all workspaces the user is assigned to are returned
   - The endpoint filters based on the user's `UserWorkspace` assignments

3. **Menu Hierarchy**: The menu structure is built as a hierarchical tree:
   - Root-level items have `parentId` set to `null`
   - Child items have `parentId` pointing to their parent's `resourceId`
   - The `children` array contains nested menu items

4. **Empty Results**: If the user has no workspace assignments or the specified workspace is not accessible, the endpoint returns an empty array `[]` rather than an error.

5. **Workspace Context**: The endpoint uses the current user's tenant context from the authentication token to determine workspace access.

6. **Resource Filtering**: Only active, non-deleted workspace resources are included in the menu.

7. **Integration with Permissions**: This endpoint is commonly used in conjunction with the Get My Permissions endpoint (`GET /api/workspaces/{workspaceId}/permissions/my`) to filter or display menu items based on user permissions.

---

## Related Endpoints

- `GET /api/workspaces/{workspaceId}/permissions/my` - Get user permissions for a workspace
- `GET /api/workspaces/{id}` - Get workspace details
- `GET /api/workspaces` - Get all workspaces

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-23 | Initial documentation |
