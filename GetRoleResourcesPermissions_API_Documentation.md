# Get Role Resources and Permissions API Documentation

## Description

This endpoint retrieves a specific role's resources and permissions within a workspace. It returns detailed information about which resources the role has access to and what actions (Create, Read, Update, Delete, Import, Export, Approve, Manage, Reject) are permitted for each resource.

The endpoint:
- Returns a single role identified by `workspaceId` and `roleId`
- Filters based on the current user's tenant context
- Groups permissions by resource for easy understanding
- Returns all resources and their permission flags for the specified role

---

## URL

```
GET /api/workspaces/{workspaceId}/roles/{roleId}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string (GUID) | Yes | The unique identifier of the workspace |
| `roleId` | string (GUID) | Yes | The unique identifier of the role |

### Example URL

```
GET /api/workspaces/550e8400-e29b-41d4-a716-446655440000/roles/660e8400-e29b-41d4-a716-446655440000
```

---

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token for authentication. Format: `Bearer {access_token}` |
| `Content-Type` | string | No | `application/json` |

### Request Body

This endpoint does not require a request body. Both workspace ID and role ID are provided as path parameters.

### Example Request

```http
GET /api/workspaces/550e8400-e29b-41d4-a716-446655440000/roles/660e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Response

### Success Response (200 OK)

Returns an `ApiResponse<WorkspaceRoleDto>` containing the role with its resources and permissions.

#### Response Structure

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "SUCCESSFUL",
  "message": "SUCCESSFUL",
  "requestId": "string (optional)",
  "data": {
    "workspaceRoleId": "660e8400-e29b-41d4-a716-446655440000",
    "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
    "userWorkspaceId": "770e8400-e29b-41d4-a716-446655440000",
    "roleName": "Owner",
    "roleCode": "OWNER",
    "roleDescription": "Owner role with full permissions for all resources",
    "isSystemRole": true,
    "isAdmin": true,
    "permissions": [
      {
        "resourceId": "880e8400-e29b-41d4-a716-446655440000",
        "resourceName": "WasteRequest",
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": true,
        "canImport": true,
        "canExport": true,
        "canApprove": true,
        "canManage": true,
        "canReject": true
      },
      {
        "resourceId": "990e8400-e29b-41d4-a716-446655440000",
        "resourceName": "Workspaces",
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": true,
        "canImport": false,
        "canExport": false,
        "canApprove": false,
        "canManage": true,
        "canReject": false
      },
      {
        "resourceId": "aa0e8400-e29b-41d4-a716-446655440000",
        "resourceName": "Users",
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": false,
        "canImport": false,
        "canExport": true,
        "canApprove": false,
        "canManage": true,
        "canReject": false
      }
    ]
  },
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
| `data` | WorkspaceRoleDto | The role with its resources and permissions |
| `error` | object (optional) | Error details if the request failed |

#### WorkspaceRoleDto Structure

| Field | Type | Description |
|-------|------|-------------|
| `workspaceRoleId` | GUID | The unique identifier of the role |
| `workspaceId` | GUID | The unique identifier of the workspace this role belongs to |
| `userWorkspaceId` | string | The tenant workspace identifier associated with this role |
| `roleName` | string (optional) | The display name of the role (e.g., "Owner", "Manager") |
| `roleCode` | string (optional) | The code identifier of the role (e.g., "OWNER", "MANAGER") |
| `roleDescription` | string (optional) | Description of the role's purpose and permissions |
| `isSystemRole` | boolean | Indicates if this is a system role (cannot be deleted). System roles like "Owner" are typically `true` |
| `isAdmin` | boolean | Indicates if this is an admin role. Admin roles typically have elevated permissions |
| `permissions` | array of ResourcePermissionDto | List of resources and their associated permissions for this role |

#### ResourcePermissionDto Structure

| Field | Type | Description |
|-------|------|-------------|
| `resourceId` | GUID | The unique identifier of the resource |
| `resourceName` | string | The name of the resource (e.g., "WasteRequest", "Workspaces", "Users") |
| `canCreate` | boolean | Permission to create new records in this resource |
| `canRead` | boolean | Permission to view/read records in this resource |
| `canUpdate` | boolean | Permission to modify/update records in this resource |
| `canDelete` | boolean | Permission to delete records in this resource |
| `canImport` | boolean | Permission to import data into this resource |
| `canExport` | boolean | Permission to export data from this resource |
| `canApprove` | boolean | Permission to approve records/requests in this resource |
| `canManage` | boolean | Permission to manage settings and configurations for this resource |
| `canReject` | boolean | Permission to reject records/requests in this resource |

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

#### 400 Bad Request - Invalid Role ID Format

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Invalid role ID format",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INVALID_MODEL",
    "message": "Invalid role ID format"
  }
}
```

#### 400 Bad Request - Missing Tenant Context

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Tenant context is required",
  "requestId": null,
  "data": null,
  "error": {
    "code": "INVALID_MODEL",
    "message": "Tenant context is required"
  }
}
```

#### 404 Not Found - Role Not Found

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Role not found or you don't have access to it",
  "requestId": null,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Role not found or you don't have access to it"
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

#### 403 Forbidden - Insufficient Permissions

```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "UNSUCCESSFUL",
  "message": "Forbidden",
  "requestId": null,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view workspace roles"
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
curl -X GET "https://api.example.com/api/workspaces/550e8400-e29b-41d4-a716-446655440000/roles/660e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### JavaScript (Fetch) Example

```javascript
const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
const roleId = '660e8400-e29b-41d4-a716-446655440000';
const accessToken = 'your-access-token';

fetch(`/api/workspaces/${workspaceId}/roles/${roleId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const role = data.data;
      console.log(`Role: ${role.roleName} (${role.roleCode})`);
      console.log(`Resources: ${role.permissions.length}`);
      
      // Iterate through each resource and its permissions
      role.permissions.forEach(perm => {
        console.log(`\nResource: ${perm.resourceName} (ID: ${perm.resourceId})`);
        console.log(`  Can Create: ${perm.canCreate}`);
        console.log(`  Can Read: ${perm.canRead}`);
        console.log(`  Can Update: ${perm.canUpdate}`);
        console.log(`  Can Delete: ${perm.canDelete}`);
        console.log(`  Can Import: ${perm.canImport}`);
        console.log(`  Can Export: ${perm.canExport}`);
        console.log(`  Can Approve: ${perm.canApprove}`);
        console.log(`  Can Manage: ${perm.canManage}`);
        console.log(`  Can Reject: ${perm.canReject}`);
      });
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

public class WorkspaceRoleDto
{
    public Guid WorkspaceRoleId { get; set; }
    public Guid WorkspaceId { get; set; }
    public string UserWorkspaceId { get; set; } = null!;
    public string? RoleName { get; set; }
    public string? RoleCode { get; set; }
    public string? RoleDescription { get; set; }
    public bool IsSystemRole { get; set; }
    public bool IsAdmin { get; set; }
    public List<ResourcePermissionDto> Permissions { get; set; } = new();
}

public class ResourcePermissionDto
{
    public Guid ResourceId { get; set; }
    public string ResourceName { get; set; } = null!;
    public bool CanCreate { get; set; }
    public bool CanRead { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool CanImport { get; set; }
    public bool CanExport { get; set; }
    public bool CanApprove { get; set; }
    public bool CanManage { get; set; }
    public bool CanReject { get; set; }
}

public async Task<WorkspaceRoleDto> GetRoleResourcesAndPermissionsAsync(
    string workspaceId, 
    string roleId, 
    string accessToken)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", accessToken);
    
    var response = await client.GetAsync(
        $"https://api.example.com/api/workspaces/{workspaceId}/roles/{roleId}");
    
    response.EnsureSuccessStatusCode();
    
    var json = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonConvert.DeserializeObject<ApiResponse<WorkspaceRoleDto>>(json);
    
    if (apiResponse.Success && apiResponse.Data != null)
    {
        return apiResponse.Data;
    }
    
    throw new Exception($"Failed to get role resources and permissions: {apiResponse.Error?.Message}");
}
```

---

## Notes

1. **Authentication Required**: This endpoint requires a valid Bearer token in the Authorization header.

2. **Permission Required**: The user must have the `WorkspaceRoles.View` permission to access this endpoint.

3. **Tenant Context**: The endpoint filters roles based on the current user's tenant context from the authentication token. Only roles associated with the user's tenant are returned.

4. **Role Access**: The endpoint will return a 404 error if:
   - The role doesn't exist
   - The role exists but belongs to a different tenant
   - The user doesn't have access to the role

5. **Permission Flags**: Each resource in the `permissions` array has boolean flags indicating what actions are allowed:
   - `canCreate`, `canRead`, `canUpdate`, `canDelete` - Basic CRUD operations
   - `canImport`, `canExport` - Data import/export operations
   - `canApprove`, `canReject` - Approval workflow operations
   - `canManage` - Administrative management operations

6. **Empty Permissions**: If a role has no permissions assigned, the `permissions` array will be empty `[]`.

7. **Resource Grouping**: Permissions are grouped by resource, so each resource appears once with all its permission flags set accordingly.

8. **Use Cases**: This endpoint is ideal for:
   - Displaying role details in a role management UI
   - Showing what resources and permissions a specific role has
   - Validating role permissions before performing actions
   - Building permission matrices for specific roles

---

## Related Endpoints

- `GET /api/workspaces/{workspaceId}/roles` - Get all roles in a workspace
- `GET /api/workspaces/{workspaceId}/permissions/my` - Get current user's permissions for a workspace
- `GET /api/menu?workspaceId={workspaceId}` - Get workspace menu items
- `POST /api/workspaces/{workspaceId}/roles/{roleId}/permissions` - Assign permissions to a role

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-23 | Initial documentation |
