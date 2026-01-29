# Admin Roles API – Request, Response, URL & Description

This document describes the **Admin Roles** API: URLs, request/response shapes, and descriptions for each endpoint. Admin roles are workspace roles where **IsAdmin** is true and **IsSystemRole** is false (custom admin roles, e.g. "Declarations Verifier", "Onboarding Approver").

**Base path:** `api/admin-roles`  
**Base URL:** `{iam-api-host}/api/admin-roles` (prepend your IAM API host).

All endpoints that take a workspace or role require **`workspaceId`** as a query parameter (GUID). Authentication: **Bearer** token in **Authorization** header.

---

## 1. Get admin roles (list – roleId and roleName only)

**Description:** Returns a list of admin roles for the given workspace. Only **role ID** and **role name** are returned. Data is read directly from **WorkspaceRoles** where **IsAdmin** = true, **IsSystemRole** = false, and the record is not deleted. No tenant or permission checks are performed.

| Item | Value |
|------|--------|
| **Method** | GET |
| **URL** | `api/admin-roles?workspaceId={workspaceId}` |
| **Query** | **workspaceId** (required) – GUID of the workspace |

**Request example**

```http
GET /api/admin-roles?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "workspaceRoleId": "f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1",
      "roleName": "Declarations Verifier"
    },
    {
      "workspaceRoleId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "roleName": "Onboarding Approver"
    }
  ],
  "error": null
}
```

**Error (400):** Missing or invalid `workspaceId` – "WorkspaceId is required" or "Invalid workspace ID format".

---

## 2. Get admin role by ID (full details)

**Description:** Returns a single admin role by ID for the given workspace, including full details and permissions. The role must have **IsAdmin** = true and **IsSystemRole** = false.

| Item | Value |
|------|--------|
| **Method** | GET |
| **URL** | `api/admin-roles/{id}?workspaceId={workspaceId}` |
| **Path** | **id** – GUID of the admin role (WorkspaceRoleId) |
| **Query** | **workspaceId** (required) – GUID of the workspace |

**Request example**

```http
GET /api/admin-roles/f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": null,
  "data": {
    "workspaceRoleId": "f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1",
    "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
    "userWorkspaceId": "tenant-workspace-id",
    "roleName": "Declarations Verifier",
    "roleCode": "DECL_VERIFIER",
    "roleDescription": "Can verify declarations",
    "isSystemRole": false,
    "isAdmin": true,
    "permissions": [
      {
        "resourceId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4",
        "resourceName": "Declarations",
        "canCreate": false,
        "canRead": true,
        "canUpdate": false,
        "canDelete": false,
        "canImport": false,
        "canExport": false,
        "canApprove": false,
        "canManage": false,
        "canReject": false
      }
    ]
  },
  "error": null
}
```

**Error (404):** "Admin role not found" when the ID does not exist or the role is not an admin role in that workspace.

---

## 3. Create admin role

**Description:** Creates a new admin role in the workspace. The role is stored as a **WorkspaceRole** with **IsAdmin** = true and **IsSystemRole** = false. No workspace-owner check is required; SuperAdmin or users with an admin role in the workspace can create. **RoleName** is required.

| Item | Value |
|------|--------|
| **Method** | POST |
| **URL** | `api/admin-roles?workspaceId={workspaceId}` |
| **Query** | **workspaceId** (required) – GUID of the workspace |
| **Body** | JSON – CreateWorkspaceRoleRequestDto |

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roleName | string | Yes | Display name of the role (e.g. "Declarations Verifier"). |
| roleCode | string | No | Code (e.g. "DECL_VERIFIER"). |
| roleDescription | string | No | Description of the role. |
| isAdmin | bool | No | Ignored for this API; created roles are always admin. |

**Request example**

```http
POST /api/admin-roles?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "roleName": "Declarations Verifier",
  "roleCode": "DECL_VERIFIER",
  "roleDescription": "Can verify waste declarations"
}
```

**Response (200 OK)** – `data` is **WorkspaceRoleDto** (same shape as Get by ID above, including permissions array).

---

## 4. Update admin role

**Description:** Updates an existing admin role (IsAdmin = true, IsSystemRole = false) in the workspace. No owner check; SuperAdmin or workspace admins can update. Request body can update **roleName**, **roleCode**, and **roleDescription**.

| Item | Value |
|------|--------|
| **Method** | PUT |
| **URL** | `api/admin-roles/{id}?workspaceId={workspaceId}` |
| **Path** | **id** – GUID of the admin role |
| **Query** | **workspaceId** (required) |
| **Body** | JSON – CreateWorkspaceRoleRequestDto (same as create) |

**Request example**

```http
PUT /api/admin-roles/f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "roleName": "Declarations Verifier (Updated)",
  "roleCode": "DECL_VERIFIER",
  "roleDescription": "Can verify and attest declarations"
}
```

**Response (200 OK)** – `data` is **WorkspaceRoleDto** (full role with permissions).

**Error (404):** "Admin role not found".

---

## 5. Delete admin role

**Description:** Soft-deletes an admin role by setting **IsAdmin** to false (and marking as deleted as per implementation). No owner check; SuperAdmin or workspace admins can delete. System admin roles cannot be deleted.

| Item | Value |
|------|--------|
| **Method** | DELETE |
| **URL** | `api/admin-roles/{id}?workspaceId={workspaceId}` |
| **Path** | **id** – GUID of the admin role |
| **Query** | **workspaceId** (required) |

**Request example**

```http
DELETE /api/admin-roles/f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": null,
  "data": true,
  "error": null
}
```

**Error (404):** "Admin role not found". **Error (400):** "Cannot delete system admin role" when the role is a system role.

---

## 6. Assign permissions to admin role

**Description:** Assigns one or more permissions (by permission ID) to an admin role for a given resource. Requires **resourceId** (GUID) and **permissionIds** (array of permission GUIDs) in the body.

| Item | Value |
|------|--------|
| **Method** | POST |
| **URL** | `api/admin-roles/{id}/permissions?workspaceId={workspaceId}` |
| **Path** | **id** – GUID of the admin role |
| **Query** | **workspaceId** (required) |
| **Body** | JSON – AssignPermissionsToRoleRequestDto |

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| resourceId | string (GUID) | Yes | Workspace resource ID. |
| permissionIds | string[] (GUIDs) | Yes | List of permission IDs to assign (can be empty; no-op). |

**Request example**

```http
POST /api/admin-roles/f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1/permissions?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "resourceId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4",
  "permissionIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

**Response (200 OK)** – `data`: `true` on success.

---

## 7. Unassign permissions from admin role

**Description:** Removes one or more permissions from an admin role for a given resource. Requires **resourceId** and **permissionIds** in the body (same shape as assign). Only the specified permission IDs for that resource are removed.

| Item | Value |
|------|--------|
| **Method** | DELETE |
| **URL** | `api/admin-roles/{id}/permissions?workspaceId={workspaceId}` |
| **Path** | **id** – GUID of the admin role |
| **Query** | **workspaceId** (required) |
| **Body** | JSON – AssignPermissionsToRoleRequestDto |

**Request body:** Same as assign – **resourceId** (string GUID), **permissionIds** (array of permission GUIDs to remove).

**Request example**

```http
DELETE /api/admin-roles/f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1/permissions?workspaceId=16931b8f-0b71-44da-a4bf-6e9ce404333b HTTP/1.1
Host: <iam-api-host>
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "resourceId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4",
  "permissionIds": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

**Response (200 OK)** – `data`: `true` on success. Returns success even if no matching permissions were found to remove.

---

## 8. Summary table

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 1 | GET | `api/admin-roles?workspaceId={guid}` | List admin roles (roleId + roleName only). |
| 2 | GET | `api/admin-roles/{id}?workspaceId={guid}` | Get one admin role (full details + permissions). |
| 3 | POST | `api/admin-roles?workspaceId={guid}` | Create admin role (body: roleName, roleCode, roleDescription). |
| 4 | PUT | `api/admin-roles/{id}?workspaceId={guid}` | Update admin role (body: same as create). |
| 5 | DELETE | `api/admin-roles/{id}?workspaceId={guid}` | Delete (soft) admin role. |
| 6 | POST | `api/admin-roles/{id}/permissions?workspaceId={guid}` | Assign permissions (body: resourceId, permissionIds). |
| 7 | DELETE | `api/admin-roles/{id}/permissions?workspaceId={guid}` | Unassign permissions (body: resourceId, permissionIds). |

**Notes**

- **workspaceId** is required as a query parameter on every endpoint.
- Admin roles are **WorkspaceRoles** with **IsAdmin** = true and **IsSystemRole** = false.
- The list endpoint (GET without `{id}`) does not perform tenant or permission checks; it reads only from **WorkspaceRoles** filtered by workspace, IsAdmin, IsSystemRole, and IsDeleted.
