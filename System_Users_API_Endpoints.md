# System Users API – Endpoints Documentation

This document describes the four API endpoints for managing **system users** (non-admin users) in the IAM API. These endpoints operate only on users who are **not** admins. Admin users (SuperAdmin / `@rdlc.com` emails and users with any workspace role where `IsAdmin == true`) are excluded from listing and cannot be accessed or activated/deactivated via these endpoints.

**Base URL (example):** `https://localhost:49933`

---

## 1. Get All System Users

Returns a paginated list of all system users, excluding admin users.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/all-system` |
| **Description** | Returns all non-admin users in the system with optional filtering and pagination. Excludes users who are system admins (e.g. SuperAdmin, `@rdlc.com`) or have any workspace role with `IsAdmin == true`. |

### Request

**Query parameters**

| Parameter   | Type   | Required | Description |
|------------|--------|----------|-------------|
| `PageNumber` | int    | No       | 1-based page number. Default: `1`. |
| `PageSize`   | int    | No       | Items per page (max 100). Default: `10`. |
| `Query`      | string | No       | Search in FirstName, LastName, or Email (case-sensitive contains). |
| `IsActive`   | bool   | No       | Filter by active status: `true` or `false`. |

**Example URL**

```
GET https://localhost:49933/api/users/all-system?PageNumber=1&PageSize=10
GET https://localhost:49933/api/users/all-system?PageNumber=1&PageSize=20&Query=john&IsActive=true
```

### Response

**Success (200 OK)**

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "00",
  "message": "Successful",
  "requestId": null,
  "data": {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "userName": "john.doe@example.com",
        "email": "john.doe@example.com",
        "firstName": "John",
        "middleName": null,
        "lastName": "Doe",
        "dateOfBirth": "1990-01-15T00:00:00",
        "country": "Nigeria",
        "status": 1,
        "emailVerified": true,
        "phoneVerified": false,
        "twoFactorEnabled": false,
        "isActive": true,
        "isOnboardingComplete": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "dateCreated": null,
        "dateModified": null,
        "fullName": "John Doe",
        "tenantId": null
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 10
  },
  "error": null
}
```

**Note:** `status` values: `1` = Active, `2` = Inactive, `3` = Suspended, `4` = PendingVerification, `5` = Locked.

**Error (400 Bad Request)** – e.g. invalid or failed request

```json
{
  "success": false,
  "code": "99",
  "message": "Unsuccessful",
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## 2. Get System User By Id

Returns a single system user by ID. Returns an error if the user is an admin.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/all-system/{id}` |
| **Description** | Returns the user with the given ID only if they are a non-admin. If the user is an admin (system or workspace), the API returns an error instead of the user. |

### Request

**Path parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | Yes      | User GUID (e.g. `3fa85f64-5717-4562-b3fc-2c963f66afa6`). |

**Example URL**

```
GET https://localhost:49933/api/users/all-system/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### Response

**Success (200 OK)**

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "00",
  "message": "Successful",
  "requestId": null,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userName": "john.doe@example.com",
    "email": "john.doe@example.com",
    "firstName": "John",
    "middleName": null,
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15T00:00:00",
    "country": "Nigeria",
    "status": 1,
    "emailVerified": true,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "dateCreated": null,
    "dateModified": null,
    "fullName": "John Doe",
    "tenantId": null
  },
  "error": null
}
```

**Error (400 Bad Request)** – user not found or user is admin

```json
{
  "success": false,
  "message": "Admin users are not accessible via system user endpoints.",
  "data": null,
  "error": { "message": "...", "code": "..." }
}
```

```json
{
  "success": false,
  "message": "Record not found",
  "data": null,
  "error": { "message": "...", "code": "..." }
}
```

**Error (400)** – invalid ID format

```json
{
  "success": false,
  "message": "Invalid user ID format",
  "data": null,
  "error": { "message": "...", "code": "..." }
}
```

---

## 3. Activate System User

Sets a system user’s account to active (`IsActive = true`). Inactive users cannot sign in until activated.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/users/all-system/{id}/activate` |
| **Description** | Activates the user with the given ID. Succeeds only for non-admin users. Admin users cannot be activated via this endpoint. After activation, the user can sign in (subject to other auth rules). |

### Request

**Path parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | Yes      | User GUID. |

**Example URL**

```
PATCH https://localhost:49933/api/users/all-system/3fa85f64-5717-4562-b3fc-2c963f66afa6/activate
```

**Headers**

- `Content-Type: application/json` (optional for PATCH with no body)
- `Authorization: Bearer {token}` (if the API requires authentication)

**Body**

None.

### Response

**Success (200 OK)**

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "00",
  "message": "Successful",
  "requestId": null,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userName": "john.doe@example.com",
    "email": "john.doe@example.com",
    "firstName": "John",
    "middleName": null,
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15T00:00:00",
    "country": "Nigeria",
    "status": 1,
    "emailVerified": true,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "dateCreated": null,
    "dateModified": null,
    "fullName": "John Doe",
    "tenantId": null
  },
  "error": null
}
```

**Error (400)** – user is admin or not found

```json
{
  "success": false,
  "message": "Admin users cannot be activated or deactivated via system user endpoints.",
  "data": null,
  "error": { "message": "...", "code": "..." }
}
```

```json
{
  "success": false,
  "message": "Record not found",
  "data": null,
  "error": { "message": "...", "code": "..." }
}
```

---

## 4. Deactivate System User

Sets a system user’s account to inactive (`IsActive = false`). Deactivated users cannot sign in.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/users/all-system/{id}/deactivate` |
| **Description** | Deactivates the user with the given ID. Succeeds only for non-admin users. Admin users cannot be deactivated via this endpoint. After deactivation, sign-in attempts return: *"Your account is inactive. You cannot sign in. Please contact your administrator."* |

### Request

**Path parameters**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `id`      | string | Yes      | User GUID. |

**Example URL**

```
PATCH https://localhost:49933/api/users/all-system/3fa85f64-5717-4562-b3fc-2c963f66afa6/deactivate
```

**Headers**

- `Content-Type: application/json` (optional for PATCH with no body)
- `Authorization: Bearer {token}` (if the API requires authentication)

**Body**

None.

### Response

**Success (200 OK)**

Same structure as **Activate System User** success response; `data.isActive` will be `false`.

**Error (400)** – user is admin or not found

Same error payloads as **Activate System User** (admin not allowed, record not found, invalid ID).

---

## Summary Table

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 1 | GET    | `/api/users/all-system` | List all system users (paginated, optional filters). |
| 2 | GET    | `/api/users/all-system/{id}` | Get one system user by ID (fails for admin users). |
| 3 | PATCH  | `/api/users/all-system/{id}/activate` | Activate a system user. |
| 4 | PATCH  | `/api/users/all-system/{id}/deactivate` | Deactivate a system user (blocks sign-in). |

---

## Common Response Wrapper

All endpoints return an `ApiResponse<T>` envelope:

| Field       | Type         | Description |
|------------|--------------|-------------|
| `apiVersion` | string       | API version (e.g. `"v1"`). |
| `success`    | bool         | Whether the request succeeded. |
| `code`       | string       | Response code (e.g. `"00"` success). |
| `message`    | string       | Human-readable message. |
| `requestId`  | string       | Optional request identifier. |
| `data`       | object/array | Payload (user, paged list, etc.). |
| `error`      | object       | Present on failure; has `message` and `code`. |

---

## User Object (UserDto)

| Property              | Type     | Description |
|-----------------------|----------|-------------|
| `id`                  | Guid     | User ID. |
| `userName`            | string   | Username (often same as email). |
| `email`               | string   | Email address. |
| `firstName`           | string   | First name. |
| `middleName`          | string?  | Middle name. |
| `lastName`            | string   | Last name. |
| `dateOfBirth`         | DateTime?| Date of birth. |
| `country`             | string?  | Country. |
| `status`              | int      | UserStatus enum (1=Active, 2=Inactive, 3=Suspended, 4=PendingVerification, 5=Locked). |
| `emailVerified`       | bool     | Email verified. |
| `phoneVerified`       | bool     | Phone verified. |
| `twoFactorEnabled`    | bool     | 2FA enabled. |
| `isActive`            | bool     | Account active (can sign in). |
| `isOnboardingComplete`| bool     | Onboarding completed. |
| `createdAt`           | DateTime | Created timestamp. |
| `updatedAt`           | DateTime | Last updated timestamp. |
| `dateCreated`         | DateTime?| Legacy created date. |
| `dateModified`        | DateTime?| Legacy modified date. |
| `fullName`            | string?  | Display full name. |
| `tenantId`            | string?  | Tenant ID if set. |
