# Backend Endpoint Required: GET Role Permissions

## Summary

The frontend needs a GET endpoint to retrieve existing permissions assigned to a workspace role. Currently, only the POST endpoint exists for assigning permissions, but there's no way to retrieve what permissions are already assigned.

## Required Endpoint

### GET `/api/workspaces/{workspaceId}/roles/{roleId}/permissions`

**Purpose:** Retrieve all permissions currently assigned to a specific role within a workspace.

**Path Parameters:**

- `workspaceId` (string, required): The ID of the workspace
- `roleId` (string, required): The ID of the role

**Query Parameters (optional):**

- `resourceId` (string, optional): If provided, filter permissions by a specific resource

**Response Format:**

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Permissions retrieved successfully",
  "data": {
    "permissionIds": ["perm-id-1", "perm-id-2", "perm-id-3"]
  }
}
```

**Alternative Response Format (if full permission objects are preferred):**

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "permissionId": "perm-id-1",
        "permissionName": "View Reports",
        "permissionCode": "VIEW_REPORTS",
        "resourceId": "resource-id-1"
      },
      {
        "permissionId": "perm-id-2",
        "permissionName": "Edit Reports",
        "permissionCode": "EDIT_REPORTS",
        "resourceId": "resource-id-1"
      }
    ]
  }
}
```

**If `resourceId` query parameter is provided:**

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Permissions retrieved successfully",
  "data": {
    "permissionIds": ["perm-id-1", "perm-id-2"],
    "resourceId": "resource-id-1"
  }
}
```

## Use Case

When a user clicks "Assign Permissions" on a role in the workspace management UI:

1. Frontend needs to fetch existing permissions for that role
2. Pre-check checkboxes in the permissions dialog to show what's already assigned
3. Allow user to add/remove permissions and save changes

## Implementation Notes

- The endpoint should respect tenant context (automatically filtered by tenant from JWT token)
- If `resourceId` is provided, return only permissions assigned for that specific resource
- If `resourceId` is not provided, return all permissions assigned to the role across all resources
- The frontend code can handle both response formats (permissionIds array or permissions array)

## Related Endpoints

- **POST** `/api/workspaces/{workspaceId}/roles/{roleId}/permissions` - Already exists, used to assign/update permissions
- The GET endpoint should return the same data structure that would be sent to the POST endpoint (for consistency)




