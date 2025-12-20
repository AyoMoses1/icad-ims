# Step-by-Step Testing Guide

## ✅ Step 1: Registration (COMPLETED)
**Endpoint:** `POST /api/auth/register`

**What you tested:**
- ✅ User creation
- ✅ Tenant creation (TenantId = User.Id)
- ✅ Address creation (if provided)
- ✅ Identification document creation (if provided)

**Result:** User and Tenant are created successfully.

---

## 🔐 Step 2: Login (Get Access Token)
**Endpoint:** `POST /connect/token` (OpenIddict OAuth2 endpoint)

**Why this is next:** You need an access token to test protected endpoints.

**Request (Form Data):**
```
grant_type=password
username=ezekielpatrick962@gmail.com
password=Password@123
client_id=mems-wastemanagement-api
client_secret=service-worker
scope=openid profile email offline_access
```

**cURL:**
```bash
curl -X POST http://localhost:5000/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=ezekielpatrick962@gmail.com&password=Password@123&client_id=mems-wastemanagement-api&client_secret=service-worker&scope=openid profile email offline_access"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Save the `access_token` for next steps!**

---

## 🏢 Step 3: Create a Workspace
**Endpoint:** `POST /api/workspaces`

**Why this is next:** Workspaces are the foundation for organizing resources, members, and roles. You need at least one workspace to proceed.

**Headers:**
```
Authorization: Bearer {your-access-token}
```

**Request:**
```json
{
  "name": "My First Workspace",
  "code": "WS-001",
  "description": "My test workspace"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workspace",
    "code": "WS-001",
    "description": "My test workspace"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "workspaceId": "guid-here",
    "name": "My First Workspace",
    "code": "WS-001",
    ...
  }
}
```

**Save the `workspaceId` for next steps!**

---

## 📁 Step 4: Create Workspace Resources (Menu Items)
**Endpoint:** `POST /api/workspaces/{workspaceId}/resources`

**Why this is next:** Resources define what menu items exist. You need resources before you can assign permissions to them.

**Request:**
```json
{
  "resourceName": "Dashboard",
  "url": "/dashboard",
  "parentId": null
}
```

**Create a few resources:**
```json
// Resource 1: Dashboard
{
  "resourceName": "Dashboard",
  "url": "/dashboard"
}

// Resource 2: Users
{
  "resourceName": "Users",
  "url": "/users"
}

// Resource 3: Settings (child of Dashboard)
{
  "resourceName": "Settings",
  "url": "/settings",
  "parentId": "dashboard-resource-id"  // Use parent resource ID if creating hierarchy
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces/{workspaceId}/resources \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceName": "Dashboard",
    "url": "/dashboard"
  }'
```

**Save the `resourceId` values for later steps!**

---

## 🔑 Step 5: Create Permissions
**Endpoint:** `POST /api/permissions`

**Why this is next:** Permissions define what actions can be performed. You need permissions before assigning them to roles.

**Request:**
```json
{
  "permissionName": "Users:view",
  "permissionCode": "users:view",
  "description": "View users"
}
```

**Create common permissions:**
```json
// Permission 1
{
  "permissionName": "Users:view",
  "permissionCode": "users:view",
  "description": "View users"
}

// Permission 2
{
  "permissionName": "Users:create",
  "permissionCode": "users:create",
  "description": "Create users"
}

// Permission 3
{
  "permissionName": "WorkspaceResources:view",
  "permissionCode": "WorkspaceResources:view",
  "description": "View workspace resources"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionName": "Users:view",
    "permissionCode": "users:view",
    "description": "View users"
  }'
```

**Save the `permissionId` values for later steps!**

---

## 👥 Step 6: Create a Workspace Role
**Endpoint:** `POST /api/workspaces/{workspaceId}/roles`

**Why this is next:** Roles group permissions together. You need a role before you can assign permissions to it.

**Request:**
```json
{
  "roleDescription": "Administrator"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces/{workspaceId}/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleDescription": "Administrator"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "workspaceRoleId": "role-guid-here",
    "roleDescription": "Administrator",
    ...
  }
}
```

**Save the `workspaceRoleId` for next step!**

---

## 🔗 Step 7: Assign Permissions to Role
**Endpoint:** `POST /api/workspaces/{workspaceId}/roles/{workspaceRoleId}/permissions`

**Why this is next:** This connects permissions to resources, enabling authorization checks.

**Request:**
```json
{
  "resourceId": "resource-guid-from-step-4",
  "permissionIds": ["permission-guid-1", "permission-guid-2"]
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces/{workspaceId}/roles/{workspaceRoleId}/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "RESOURCE_GUID",
    "permissionIds": ["PERMISSION_GUID_1", "PERMISSION_GUID_2"]
  }'
```

---

## ➕ Step 8: Add Yourself as Workspace Member
**Endpoint:** `POST /api/workspaces/{workspaceId}/members`

**Why this is next:** You need to be a member of the workspace to have roles assigned.

**Request:**
```json
{
  "tenantId": "your-user-id-as-string",  // Your User.Id.ToString()
  "type": "Member",
  "status": true
}
```

**How to get your TenantId:**
- It's your `User.Id` (the GUID from registration response)
- Convert it to string: `user.Id.ToString()`

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces/{workspaceId}/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_USER_ID_AS_STRING",
    "type": "Member",
    "status": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "workspaceMemberId": "member-guid-here",
    ...
  }
}
```

**Save the `workspaceMemberId` for next step!**

---

## 🎭 Step 9: Assign Role to Yourself
**Endpoint:** `POST /api/workspaces/{workspaceId}/members/{workspaceMemberId}/roles`

**Why this is next:** This gives you the permissions you need to access protected endpoints.

**Request:**
```json
{
  "workspaceRoleId": "role-guid-from-step-6"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/workspaces/{workspaceId}/members/{workspaceMemberId}/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceRoleId": "ROLE_GUID"
  }'
```

---

## 📋 Step 10: Get Your Authorized Menu
**Endpoint:** `GET /api/workspaces/{workspaceId}/menu`

**Why this is next:** This verifies that your permissions are working and shows what menu items you can access.

**cURL:**
```bash
curl http://localhost:5000/api/workspaces/{workspaceId}/menu \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "resourceId": "guid",
      "name": "Dashboard",
      "url": "/dashboard",
      "parentId": null,
      "children": []
    },
    ...
  ]
}
```

---

## 🧪 Step 11: Test Protected Endpoints
**Now test endpoints that require permissions:**

### Test 1: List Users
**Endpoint:** `GET /api/users`

**cURL:**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Should return list of users if you have "Users:view" permission

### Test 2: List Workspaces
**Endpoint:** `GET /api/workspaces`

**cURL:**
```bash
curl http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Should return your workspace(s)

### Test 3: List Permissions
**Endpoint:** `GET /api/permissions`

**cURL:**
```bash
curl http://localhost:5000/api/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 Quick Reference: Testing Order

1. ✅ **Registration** - `POST /api/auth/register` (DONE)
2. 🔐 **Login** - `POST /connect/token` ← **START HERE**
3. 🏢 **Create Workspace** - `POST /api/workspaces`
4. 📁 **Create Resources** - `POST /api/workspaces/{id}/resources`
5. 🔑 **Create Permissions** - `POST /api/permissions`
6. 👥 **Create Role** - `POST /api/workspaces/{id}/roles`
7. 🔗 **Assign Permissions** - `POST /api/workspaces/{id}/roles/{id}/permissions`
8. ➕ **Add Member** - `POST /api/workspaces/{id}/members`
9. 🎭 **Assign Role** - `POST /api/workspaces/{id}/members/{id}/roles`
10. 📋 **Get Menu** - `GET /api/workspaces/{id}/menu`
11. 🧪 **Test Protected Endpoints** - Various GET endpoints

---

## 💡 Tips

1. **Save all IDs:** Keep track of:
   - `access_token`
   - `workspaceId`
   - `resourceId` (for each resource)
   - `permissionId` (for each permission)
   - `workspaceRoleId`
   - `workspaceMemberId`

2. **Use Swagger UI:** Open `http://localhost:5000` and click "Authorize" to set your token once, then test all endpoints easily.

3. **Check Responses:** Each response includes `success`, `data`, and `message` fields to help debug.

4. **Permission Names:** Make sure permission codes match what's in `[Permission]` attributes:
   - `"Users"` for user endpoints
   - `"Workspaces"` for workspace endpoints
   - `"WorkspaceResources"` for resource endpoints
   - `"WorkspaceMembers"` for member endpoints
   - `"WorkspaceRoles"` for role endpoints

---

## 🚨 Common Issues

- **401 Unauthorized:** Token expired or missing → Re-login
- **403 Forbidden:** Missing permission → Assign the required permission to your role
- **404 Not Found:** Wrong ID → Check you're using the correct `workspaceId`, `roleId`, etc.
- **400 Bad Request:** Missing required field → Check request body matches DTO structure


