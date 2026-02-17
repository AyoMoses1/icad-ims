# Get Audit Logs – MEMS.IAM API

This document describes the endpoint to retrieve audit logs from **MEMS.IAM** with filtering and pagination.

---

## Endpoint

**GET**  
`/api/audit-logs`

Returns paginated audit logs based on filter criteria. Results are ordered by timestamp (most recent first).

---

## Description

Retrieves audit log entries from the IAM system. Supports filtering by user, tenant, workspace, audit type, entity type, action, and date range. Results are paginated and include user details (name, email) for each log entry.

**Use cases:**
- View activity logs for a specific user
- Filter logs by tenant or workspace
- Search logs by action type (e.g., "Login", "Create", "Update")
- View logs within a date range
- Monitor security events (login/logout, permission changes)

---

## Authentication

**Required:** Bearer token in `Authorization` header

```http
Authorization: Bearer {accessToken}
```

**Permission required:** `AuditLogs:View`

---

## Request

### URL

```
GET {iamBaseUrl}/api/audit-logs
```

**Example (local development):**
```
GET https://localhost:49933/api/audit-logs
```

### Query Parameters

All parameters are optional. Filters are combined with AND logic.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pageNumber` | integer | No | 1 | Page number (1-based) |
| `pageSize` | integer | No | 50 | Items per page (1-100, max 100) |
| `userId` | GUID | No | - | Filter by user ID |
| `tenantId` | string | No | - | Filter by tenant ID |
| `workspaceId` | GUID | No | - | Filter by workspace ID |
| `auditType` | string | No | - | Filter by audit type (e.g., "SecurityEvent", "EntityChange") |
| `entityType` | string | No | - | Filter by entity type (e.g., "User", "Role", "Permission") |
| `action` | string | No | - | Filter by action (e.g., "Login", "Create", "Update", "Delete") |
| `startDate` | datetime (ISO) | No | - | Filter logs from this date (inclusive) |
| `endDate` | datetime (ISO) | No | - | Filter logs up to this date (inclusive) |

**Date format:** ISO 8601 (e.g., `2025-02-15T10:00:00Z`)

### Example Requests

**Get all audit logs (first page, default page size):**
```http
GET /api/audit-logs
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get logs for a specific user:**
```http
GET /api/audit-logs?userId=E1717820-98E3-4A21-BBBB-044FE6A37761&pageNumber=1&pageSize=20
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get login events in a date range:**
```http
GET /api/audit-logs?auditType=SecurityEvent&action=Login&startDate=2025-02-01T00:00:00Z&endDate=2025-02-15T23:59:59Z
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get entity changes for a specific entity type:**
```http
GET /api/audit-logs?entityType=User&action=Create&pageNumber=1&pageSize=50
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response

### Success Response (200 OK)

**Response type:** `ApiResponse<PagedResultDto<AuditLogDto>>`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "auditLogId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "timestamp": "2025-02-15T10:30:00Z",
        "auditType": "SecurityEvent",
        "entityType": null,
        "entityId": null,
        "userId": "E1717820-98E3-4A21-BBBB-044FE6A37761",
        "userName": "john.doe",
        "userEmail": "john.doe@example.com",
        "tenantId": "tenant-123",
        "workspaceId": "f983ccb6-e88a-473c-987d-863746058ed0",
        "action": "Login",
        "resource": null,
        "details": "User logged in successfully",
        "success": true,
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "requestPath": "/api/auth/login",
        "httpMethod": "POST"
      },
      {
        "auditLogId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "timestamp": "2025-02-15T09:15:00Z",
        "auditType": "EntityChange",
        "entityType": "User",
        "entityId": "9AA815CB-DDC2-423D-8517-2CD1EE4A7866",
        "userId": "E1717820-98E3-4A21-BBBB-044FE6A37761",
        "userName": "john.doe",
        "userEmail": "john.doe@example.com",
        "tenantId": "tenant-123",
        "workspaceId": null,
        "action": "Update",
        "resource": "Users",
        "details": "Updated user profile",
        "success": true,
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "requestPath": "/iam/api/v1/Users/9AA815CB-DDC2-423D-8517-2CD1EE4A7866",
        "httpMethod": "PUT"
      }
    ],
    "totalCount": 150,
    "pageNumber": 1,
    "pageSize": 50,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "message": null,
  "errorCode": null
}
```

### Response Fields

**PagedResultDto<AuditLogDto>:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | List of audit log entries (see below) |
| `totalCount` | integer | Total number of records matching filters (across all pages) |
| `pageNumber` | integer | Current page number |
| `pageSize` | integer | Items per page |
| `totalPages` | integer | Total number of pages (calculated) |
| `hasPreviousPage` | boolean | Whether a previous page exists |
| `hasNextPage` | boolean | Whether a next page exists |

**AuditLogDto (each item):**

| Field | Type | Description |
|-------|------|-------------|
| `auditLogId` | GUID | Unique audit log ID |
| `timestamp` | datetime | When the action occurred |
| `auditType` | string | Type of audit (e.g., "SecurityEvent", "EntityChange") |
| `entityType` | string / null | Entity type if applicable (e.g., "User", "Role") |
| `entityId` | GUID / null | ID of the entity if applicable |
| `userId` | GUID | ID of the user who performed the action |
| `userName` | string / null | Username of the user |
| `userEmail` | string / null | Email of the user |
| `tenantId` | string / null | Tenant ID |
| `workspaceId` | GUID / null | Workspace ID |
| `action` | string | Action performed (e.g., "Login", "Create", "Update", "Delete") |
| `resource` | string / null | Resource or API endpoint |
| `details` | string / null | Additional details about the action |
| `success` | boolean / null | Whether the action succeeded |
| `ipAddress` | string / null | IP address of the client |
| `userAgent` | string / null | User agent string |
| `requestPath` | string / null | HTTP request path |
| `httpMethod` | string / null | HTTP method (GET, POST, PUT, DELETE) |

### Error Response (400 Bad Request)

When the request is invalid or authorization fails:

```json
{
  "success": false,
  "data": null,
  "message": "Unauthorized access or invalid request.",
  "errorCode": "UNAUTHORIZED"
}
```

**Common error codes:**
- `UNAUTHORIZED` – Missing or invalid token, or insufficient permissions
- `INVALID_REQUEST` – Invalid query parameter values

---

## Examples

### Example 1: Get recent audit logs (first page)

**Request:**
```http
GET https://localhost:49933/api/audit-logs?pageNumber=1&pageSize=20
Authorization: Bearer {token}
```

**Response:** Returns the 20 most recent audit logs (page 1 of results).

---

### Example 2: Get login events for a user

**Request:**
```http
GET https://localhost:49933/api/audit-logs?userId=E1717820-98E3-4A21-BBBB-044FE6A37761&auditType=SecurityEvent&action=Login&pageNumber=1&pageSize=50
Authorization: Bearer {token}
```

**Response:** Returns login events for the specified user.

---

### Example 3: Get entity changes in a date range

**Request:**
```http
GET https://localhost:49933/api/audit-logs?entityType=User&startDate=2025-02-01T00:00:00Z&endDate=2025-02-28T23:59:59Z&pageNumber=1&pageSize=100
Authorization: Bearer {token}
```

**Response:** Returns all user entity changes in February 2025.

---

## Notes

- Results are **ordered by timestamp descending** (most recent first).
- **Pagination:** Use `pageNumber` and `pageSize` to navigate through results. Default page size is 50 (overridden from the base default of 10).
- **Filtering:** All filters are optional and combined with AND logic. If multiple filters are provided, only logs matching all criteria are returned.
- **Date range:** Use `startDate` and `endDate` together to filter logs within a specific time period. Both are inclusive.
- **User details:** The response includes `userName` and `userEmail` from the User entity (via join), so you don't need to make separate calls to resolve user information.
