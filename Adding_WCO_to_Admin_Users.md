# Adding WCO to Admin Users

This document describes how to add **WCO (Waste Collection Operator)** users via the admin API: when assigning the WCO role, the admin **must also select the company (WCO)** the user belongs to. It covers the request/response shapes and the end-to-end flow.

---

## 1. Overview

- **WCO** = Waste Collection Operator (company). A **WCO_EMPLOYEE** is a user who works for a specific WCO company.
- When an admin creates or updates a user and assigns the **WCO_EMPLOYEE** role in the **Waste Management** workspace, they **must** provide **`wcoId`** – the ID of the Waste Collection Operator (company) that the user belongs to.
- The IAM API then:
  1. Creates/updates the user and assigns the workspace roles (including WCO_EMPLOYEE).
  2. Calls the Waste Management module to create/update an onboarding record linked to that **WcoId**, so the user is tied to the correct company.

**Rule:** If the request includes the **Waste Management** workspace with a **WCO_EMPLOYEE** (or WCO) role, then **`wcoId` is required** in the request body. The company selection is mandatory for WCO users.

---

## 2. Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Create admin user with roles (including WCO) | `POST` | `iam/api/v1/admin/users/with-role` |
| Update admin user workspace/role assignments | `PUT` | `iam/api/v1/admin/users/{userId}/workspaces` |

---

## 3. Create Admin User with WCO – Request & Response

### 3.1 Request

**Endpoint:** `POST iam/api/v1/admin/users/with-role`  
**Headers:** `Authorization: Bearer {access_token}`, `Content-Type: application/json`

**Body (JSON):**

```json
{
  "email": "wco.employee@company.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "workspaceRoles": [
    {
      "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
      "roleIds": [
        "f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1"
      ]
    }
  ],
  "wcoId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4"
}
```

**Field rules:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email (unique). |
| `firstName` | string | Yes | First name. |
| `lastName` | string | Yes | Last name. |
| `phoneNumber` | string | No | Phone number. |
| `workspaceRoles` | array | Yes | At least one workspace with at least one role. |
| `workspaceRoles[].workspaceId` | GUID | Yes | Workspace ID (e.g. Waste Management workspace). |
| `workspaceRoles[].roleIds` | GUID[] | Yes | Role IDs to assign (e.g. WCO_EMPLOYEE role ID). |
| **`wcoId`** | **GUID?** | **Yes when WCO role** | **Waste Collection Operator (company) ID. Required when assigning WCO_EMPLOYEE in Waste Management workspace.** |

- For **WCO users**: include the **Waste Management** workspace in `workspaceRoles` with the **WCO_EMPLOYEE** role ID, and set **`wcoId`** to the company the user belongs to.
- `wcoId` must be a valid, active WCO ID from the Waste Management module (e.g. from a WCO list/dropdown).

### 3.2 Response (success)

**HTTP status:** `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "ea91180e-460e-4328-944e-96d551c35702",
    "userName": "wco.employee@company.com",
    "email": "wco.employee@company.com",
    "firstName": "Jane",
    "middleName": null,
    "lastName": "Doe",
    "dateOfBirth": null,
    "country": null,
    "status": "Active",
    "emailVerified": false,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": false,
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z",
    "fullName": "Jane Doe",
    "tenantId": "2063961b-f160-4512-b216-28bc112a8a43"
  },
  "error": null
}
```

- The user is created in IAM, roles are assigned, and (when WCO role + `wcoId` are present) Waste Management onboarding is created/updated for that company.
- The user receives an email with a generated password (handled by the existing admin user creation flow).

### 3.3 Response (validation / errors)

| Scenario | HTTP | Message / Code |
|----------|------|-----------------|
| No workspace/roles | 400 | "At least one workspace with roles must be specified" |
| Email already exists | 400 | "User with this email already exists" |
| Missing tenant context | 400 | "Admin tenant context is required to create users" |
| WCO role assigned but no `wcoId` | (recommended) 400 | "WcoId is required when assigning WCO_EMPLOYEE role in Waste Management workspace" |

*Note: The API currently treats `wcoId` as optional. For correct WCO behaviour, clients must always send `wcoId` when assigning WCO_EMPLOYEE, and the API can be updated to return the error above when WCO role is present but `wcoId` is missing.*

---

## 4. Update Admin User (including WCO) – Request & Response

### 4.1 Request

**Endpoint:** `PUT iam/api/v1/admin/users/{userId}/workspaces`  
**Headers:** `Authorization: Bearer {access_token}`, `Content-Type: application/json`

**Body (JSON):**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "workspaceRoles": [
    {
      "workspaceId": "16931b8f-0b71-44da-a4bf-6e9ce404333b",
      "roleIds": [
        "f2ca73cd-5d16-4d9a-801b-36e8f1ba6aa1"
      ]
    }
  ],
  "wcoId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4"
}
```

**Field rules:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | No | Update first name. |
| `lastName` | string | No | Update last name. |
| `phoneNumber` | string | No | Update phone. |
| `workspaceRoles` | array | No | If present, **replaces** all workspace-role assignments for the user. |
| `workspaceRoles[].workspaceId` | GUID | Yes | Workspace ID. |
| `workspaceRoles[].roleIds` | GUID[] | Yes | Role IDs for that workspace. |
| **`wcoId`** | **GUID?** | **Yes when WCO role** | **Required when Waste Management workspace includes WCO_EMPLOYEE.** |

- To **add or keep WCO**: include Waste Management in `workspaceRoles` with WCO_EMPLOYEE role and set **`wcoId`** to the company.
- To **remove WCO**: omit Waste Management from `workspaceRoles` or remove the WCO_EMPLOYEE role; `wcoId` can be omitted or set to `null` when no WCO role is assigned.

### 4.2 Response (success)

**HTTP status:** `200 OK`

Same shape as create: `success`, `data` (UserDto with `id`, `userName`, `email`, `firstName`, `lastName`, `status`, `isActive`, etc.), and `error` null.

---

## 5. Flow

### 5.1 Create admin user with WCO

```
[Client]  -->  POST /admin/users/with-role  { email, workspaceRoles, wcoId }
[IAM API] -->  Create user, assign roles, call Waste Management admin-create onboarding with WcoId
[Client]  <--  200 OK + UserDto
```

### 5.2 Update admin user workspace/roles (including WCO)

```
[Client]  -->  PUT /admin/users/{id}/workspaces  { workspaceRoles, wcoId? }
[IAM API] -->  Replace workspace-role assignments; if WCO + wcoId, call Waste Management admin-create
[Client]  <--  200 OK + UserDto
```

### 5.3 Summary

1. Admin selects **Waste Management** workspace and **WCO_EMPLOYEE** role (and optionally other workspaces/roles).
2. Admin **must select the company**: `wcoId` = the Waste Collection Operator (company) the user belongs to.
3. Client sends **Create** or **Update** with `workspaceRoles` and **`wcoId`**.
4. IAM creates/updates the user and role assignments, then calls Waste Management with **WcoId** to create/update onboarding for that company.
5. User can then use Waste Management in the context of that WCO company.

---

## 6. Fetching WCO companies (for company selection)

The list of valid **WCO companies** (for the dropdown that sets `wcoId`) comes from the **Waste Management** API. Use one of the endpoints below; then send the chosen **`Id`** or **`wcoId`** as **`wcoId`** in the IAM create/update payloads.

IAM does not validate that `wcoId` exists in Waste Management; validation (and list of valid IDs) lives in the Waste Management service.

### 6.1 Get WCO companies for dropdown (recommended)

**Endpoint:** `GET waste-management/api/v1/MasterData/waste-collection-operators`  
**Purpose:** Lightweight list for dropdowns (id + name + description + code). Returns only **active, non-deleted** WCOs.

**Request:**

```http
GET /waste-management/api/v1/MasterData/waste-collection-operators HTTP/1.1
Host: <waste-management-host>
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4",
      "name": "Green Waste Co",
      "description": "Green Waste Co (WCO-LIC-001)",
      "code": "WCO-LIC-001"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Ocean Collectors Ltd",
      "description": "Ocean Collectors Ltd (WCO-LIC-002)",
      "code": "WCO-LIC-002"
    }
  ],
  "error": null
}
```

**Use in admin UI:** Use `data[].id` as **`wcoId`** when creating/updating a user with WCO_EMPLOYEE. Display `name` or `description` in the dropdown.

---

### 6.2 Get all WCO companies (full details)

**Endpoint:** `GET waste-management/api/v1/Admin/waste-collection-operators`  
**Purpose:** Full list of WCOs with company details (for admin screens that need more than a lookup).

**Request:**

```http
GET /waste-management/api/v1/Admin/waste-collection-operators HTTP/1.1
Host: <waste-management-host>
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "wcoId": "7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4",
      "companyName": "Green Waste Co",
      "licenseNumber": "WCO-LIC-001",
      "licenseExpiryDate": "2026-12-31T00:00:00Z",
      "statusId": "...",
      "statusDescription": "Active",
      "contactEmail": "contact@greenwaste.com",
      "contactPhone": "+2348012345678",
      "dateCreated": "2025-01-15T10:00:00Z",
      "dateModified": "2026-01-20T14:00:00Z",
      "terminalAssignments": []
    }
  ],
  "error": null
}
```

**Use in admin UI:** Use `data[].wcoId` as **`wcoId`** in the IAM request.

---

### 6.3 Get a single WCO company by ID

**Endpoint:** `GET waste-management/api/v1/Admin/waste-collection-operators/{id}`  
**Purpose:** Fetch one WCO when you already have the ID (e.g. to show company details after selection).

**Request:**

```http
GET /waste-management/api/v1/Admin/waste-collection-operators/7cfafe3f-6afb-4ecc-954e-81c7eebaf0c4 HTTP/1.1
Host: <waste-management-host>
Authorization: Bearer {access_token}
```

**Response (200 OK):** Same shape as one element of the list in **6.2** (single `WasteCollectionOperatorDto` in `data`).

---

### 6.4 Summary

| Use case | Method | Endpoint | Use for `wcoId` |
|----------|--------|----------|------------------|
| Dropdown (company selection) | GET | `waste-management/api/v1/MasterData/waste-collection-operators` | `data[].id` |
| Full list (admin) | GET | `waste-management/api/v1/Admin/waste-collection-operators` | `data[].wcoId` |
| Single WCO by ID | GET | `waste-management/api/v1/Admin/waste-collection-operators/{id}` | `data.wcoId` |

---

## 7. Request/response quick reference

**Create (WCO user):**

- **Request:** `POST iam/api/v1/admin/users/with-role`  
  Body: `email`, `firstName`, `lastName`, `phoneNumber` (optional), `workspaceRoles` (at least one workspace with roleIds including WCO_EMPLOYEE), **`wcoId`** (required when WCO role is assigned).
- **Response:** `200 OK` with `data` = UserDto; user created, roles assigned, Waste Management onboarding created when WCO + `wcoId` provided.

**Update (WCO user):**

- **Request:** `PUT iam/api/v1/admin/users/{userId}/workspaces`  
  Body: optional `firstName`, `lastName`, `phoneNumber`; `workspaceRoles` (replaces all assignments); **`wcoId`** when WCO_EMPLOYEE is in `workspaceRoles` for Waste Management.
- **Response:** `200 OK` with `data` = UserDto; workspace/role assignments and (when applicable) Waste Management onboarding updated.

**Fetch WCO companies (for dropdown):**

- **Request:** `GET waste-management/api/v1/MasterData/waste-collection-operators` with `Authorization: Bearer {access_token}`.
- **Response:** `200 OK` with `data` = array of `{ id, name, description, code }`; use `data[].id` as **`wcoId`** in IAM create/update.

**Rule:** When assigning the **WCO** role (WCO_EMPLOYEE in Waste Management workspace), the admin **must** also select the company via **`wcoId`** in the request body.