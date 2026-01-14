# Admin User Creation API Documentation

## Overview

The Admin User Creation API allows administrators (SuperAdmin or workspace admins) to create user accounts with role assignments. The system automatically generates passwords, sends email notifications, and handles role-specific integrations (e.g., WCO role creates Waste Management onboarding).

---

## Endpoint

**URL:** `POST /iam/api/v1/admin/users/with-role`

**Description:** Create a new admin user with role assignment. This endpoint:
- Creates the user in the `AppUser` table
- Generates a random 12-character password
- Assigns the user to the admin's tenant (same tenant as the admin creating the user)
- Creates `UserWorkspace`, `WorkspaceMember`, and `WorkspaceMembersRole` entries
- Sends the generated password via email
- For WCO roles, automatically creates and approves Waste Management onboarding

**Authorization:** Requires admin permission (`users.create`)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Request Body

### CreateUserWithRoleRequestDto

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "roleCode": "string",
  "roleId": "string",
  "phoneNumber": "string",
  "wcoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Example Request

```json
{
  "email": "user@example.com",
  "password": null,
  "firstName": "John",
  "lastName": "Doe",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "roleCode": "WCO_EMPLOYEE",
  "roleId": null,
  "phoneNumber": "+2341234567890",
  "wcoId": "770e8400-e29b-41d4-a716-446655440000"
}
```

### Request Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `email` | `string` | Yes | User's email address (used as username) |
| `password` | `string` | No | Optional password (ignored for admin-created users - password is auto-generated) |
| `firstName` | `string` | Yes | User's first name |
| `lastName` | `string` | Yes | User's last name |
| `workspaceId` | `Guid` | Yes | Workspace ID where the user will be assigned (format: UUID) |
| `roleCode` | `string` | Yes | Role code to assign (e.g., "WCO_EMPLOYEE", "ADMIN", "VESSEL_OPERATOR") |
| `roleId` | `string` | No | Optional role ID (if not provided, role is found by `roleCode`) |
| `phoneNumber` | `string` | No | User's phone number |
| `wcoId` | `Guid?` | Conditional | Required if `roleCode` is "WCO_EMPLOYEE" or contains "WCO" (format: UUID) |

---

## Success Response (200 OK)

### Standard User Creation Response

```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "userName": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": null,
    "dateOfBirth": null,
    "country": null,
    "status": "Active",
    "emailVerified": false,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "isActive": true,
    "isOnboardingComplete": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T10:30:00Z",
    "fullName": "John Doe",
    "tenantId": "admin-tenant-id"
  },
  "message": null,
  "error": null
}
```

### Response Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Guid` | User's unique identifier |
| `userName` | `string` | Username (same as email) |
| `email` | `string` | User's email address |
| `firstName` | `string` | User's first name |
| `lastName` | `string` | User's last name |
| `status` | `string` | User status (e.g., "Active") |
| `isActive` | `boolean` | Whether the user account is active |
| `emailVerified` | `boolean` | Whether email is verified |
| `isOnboardingComplete` | `boolean` | Whether user has completed onboarding |
| `fullName` | `string` | User's full name |
| `tenantId` | `string` | Tenant ID (same as admin's tenant) |

---

## Error Responses

### Error: User Already Exists (400 Bad Request)

```json
{
  "success": false,
  "data": null,
  "message": "User with this email already exists",
  "error": {
    "code": "INVALID_MODEL",
    "message": "User with this email already exists"
  }
}
```

### Error: User ID Not Found (400 Bad Request)

```json
{
  "success": false,
  "data": null,
  "message": "User ID not found in token",
  "error": {
    "code": "INVALID_MODEL",
    "message": "User ID not found in token"
  }
}
```

### Error: Tenant Context Required (400 Bad Request)

```json
{
  "success": false,
  "data": null,
  "message": "Admin tenant context is required to create users",
  "error": {
    "code": "INVALID_MODEL",
    "message": "Admin tenant context is required to create users"
  }
}
```

### Error: Role Not Found (400 Bad Request)

```json
{
  "success": false,
  "data": null,
  "message": "Role 'WCO_EMPLOYEE' not found in this workspace",
  "error": {
    "code": "INVALID_MODEL",
    "message": "Role 'WCO_EMPLOYEE' not found in this workspace"
  }
}
```

### Error: Unauthorized (403 Forbidden)

```json
{
  "success": false,
  "data": null,
  "message": "You do not have permission to perform this action",
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

---

## WCO Role Special Handling

When creating a user with `roleCode = "WCO_EMPLOYEE"` (or any role containing "WCO"), the system automatically:

1. **Creates the user** in IAM (AppUser, UserWorkspace, WorkspaceMember, WorkspaceMembersRole)
2. **Calls Waste Management API** to create an auto-approved onboarding record
3. **Links the user** to the specified WCO company

### WCO User Creation Flow

#### Step 1: Create User in IAM

**Request:**
```json
{
  "email": "wco.employee@wco-company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "roleCode": "WCO_EMPLOYEE",
  "phoneNumber": "+2341234567890",
  "wcoId": "770e8400-e29b-41d4-a716-446655440000"
}
```

**What Happens:**
- User account created in `AppUser` table
- Password generated (12 characters, random)
- User added to admin's tenant
- User assigned to workspace
- `WCO_EMPLOYEE` role assigned

#### Step 2: Automatic Waste Management Onboarding Creation

**Internal Call (IAM → Waste Management):**

**Endpoint:** `POST {WasteManagementApi:BaseUrl}/waste-management/api/v1/onboarding/admin-create`

**Note:** This is an internal HTTP call made by IAM, not directly accessible by clients.

**Request Headers:**
```
Authorization: Bearer {admin_access_token}
Content-Type: application/json
```

**Request Body (Internal - IAM → Waste Management):**
```json
{
  "userId": "880e8400-e29b-41d4-a716-446655440000",
  "email": "wco.employee@wco-company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "wcoId": "770e8400-e29b-41d4-a716-446655440000",
  "notes": "Auto-created onboarding for user 880e8400-e29b-41d4-a716-446655440000 via admin user creation"
}
```

**Note:** This is an internal API call made by IAM to Waste Management. Clients should not call this endpoint directly.

**Waste Management Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userWasteManagementOnboardingId": "990e8400-e29b-41d4-a716-446655440000",
    "userId": "880e8400-e29b-41d4-a716-446655440000",
    "role": "WCO_EMPLOYEE",
    "roleDescription": "WCO EMPLOYEE",
    "wcoId": "770e8400-e29b-41d4-a716-446655440000",
    "wcoCompanyName": "ABC Waste Collection Ltd",
    "status": "APPROVED",
    "statusDescription": "APPROVED",
    "approvedDate": "2024-01-15T10:30:00Z",
    "approvedBy": "admin-user-guid",
    "notes": "Auto-created onboarding for user 880e8400-e29b-41d4-a716-446655440000 via admin user creation",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T10:30:00Z",
    "isActive": true
  },
  "message": null,
  "error": null
}
```

**What Happens in Waste Management:**
- Validates WCO company exists and is active
- Creates `UserWasteManagementOnboarding` record with:
  - `Role = WCO_EMPLOYEE`
  - `Status = APPROVED` (auto-approved)
  - `ApprovedBy = admin user ID`
  - `ApprovedDate = current timestamp`
  - `WcoId = provided WCO company ID`
- Returns onboarding DTO

#### Step 3: Email Notification

The new user receives an email with:
- Welcome message
- Generated password
- Login instructions

**Email Content:**
```
Subject: Your Account Has Been Created

Dear Jane Smith,

Your account has been created on the MEMS platform.

Email: wco.employee@wco-company.com
Password: [Generated 12-character password]

Please log in and change your password after first login.

Best regards,
MEMS Team
```

---

## Example Requests

### Example 1: Create WCO Employee User

**Request:**
```http
POST /iam/api/v1/admin/users/with-role
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "email": "wco.employee@wco-company.com",
  "password": null,
  "firstName": "Jane",
  "lastName": "Smith",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "roleCode": "WCO_EMPLOYEE",
  "roleId": null,
  "phoneNumber": "+2341234567890",
  "wcoId": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "userName": "wco.employee@wco-company.com",
    "email": "wco.employee@wco-company.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "Active",
    "isActive": true,
    "emailVerified": false,
    "isOnboardingComplete": false,
    "fullName": "Jane Smith"
  }
}
```

**What Happens Behind the Scenes:**
1. User created in IAM with generated password
2. IAM calls Waste Management API: `POST /waste-management/api/v1/onboarding/admin-create`
3. Waste Management creates auto-approved onboarding:
   ```json
   {
     "userWasteManagementOnboardingId": "990e8400-e29b-41d4-a716-446655440000",
     "userId": "880e8400-e29b-41d4-a716-446655440000",
     "role": "WCO_EMPLOYEE",
     "wcoId": "770e8400-e29b-41d4-a716-446655440000",
     "wcoCompanyName": "ABC Waste Collection Ltd",
     "status": "APPROVED",
     "approvedDate": "2024-01-15T10:30:00Z"
   }
   ```
4. Email sent to user with password

### Example 2: Create Regular Admin User

**Request:**
```http
POST /iam/api/v1/admin/users/with-role
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "email": "admin.user@example.com",
  "password": null,
  "firstName": "Admin",
  "lastName": "User",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "roleCode": "ADMIN",
  "roleId": null,
  "phoneNumber": "+2341234567890",
  "wcoId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "userName": "admin.user@example.com",
    "email": "admin.user@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "status": "Active",
    "isActive": true,
    "emailVerified": false,
    "isOnboardingComplete": false,
    "fullName": "Admin User"
  }
}
```

**What Happens:**
- User created in IAM
- Password generated and sent via email
- No Waste Management onboarding (not a WCO role)

### Example 3: Create VESSEL_OPERATOR User

**Request:**
```http
POST /iam/api/v1/admin/users/with-role
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "email": "vessel.operator@example.com",
  "password": null,
  "firstName": "Captain",
  "lastName": "Johnson",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "roleCode": "VESSEL_OPERATOR",
  "roleId": null,
  "phoneNumber": "+2341234567890",
  "wcoId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "userName": "vessel.operator@example.com",
    "email": "vessel.operator@example.com",
    "firstName": "Captain",
    "lastName": "Johnson",
    "status": "Active",
    "isActive": true,
    "emailVerified": false,
    "isOnboardingComplete": false,
    "fullName": "Captain Johnson"
  }
}
```

---

## Process Flow

### Standard User Creation Flow

```
1. Admin calls POST /iam/api/v1/admin/users/with-role
   ↓
2. IAM validates request and admin permissions
   ↓
3. Check if user already exists (by email)
   ↓
4. Generate random 12-character password
   ↓
5. Create AppUser record
   ↓
6. Create UserWorkspace record (using admin's tenant)
   ↓
7. Create WorkspaceMember record
   ↓
8. Find role by roleCode
   ↓
9. Create WorkspaceMembersRole record
   ↓
10. If roleCode contains "WCO":
    → Call Waste Management API /onboarding/admin-create
    → Create auto-approved UserWasteManagementOnboarding
   ↓
11. Send email with generated password
   ↓
12. Return UserDto response
```

### WCO User Creation Flow (Extended)

```
1. Admin calls POST /iam/api/v1/admin/users/with-role
   with roleCode = "WCO_EMPLOYEE" and wcoId
   ↓
2. IAM creates user (steps 2-9 from standard flow)
   ↓
3. IAM detects WCO role and wcoId
   ↓
4. IAM makes HTTP POST to Waste Management:
   POST /waste-management/api/v1/onboarding/admin-create
   Headers: Authorization: Bearer {admin_token}
   Body: {
     userId, email, firstName, lastName, wcoId, notes
   }
   ↓
5. Waste Management validates:
   - WCO company exists and is active
   - UserId is valid
   ↓
6. Waste Management creates UserWasteManagementOnboarding:
   - Role = WCO_EMPLOYEE
   - Status = APPROVED (auto-approved)
   - WcoId = provided WCO company ID
   - ApprovedBy = admin user ID
   - ApprovedDate = current timestamp
   ↓
7. Waste Management returns onboarding DTO
   ↓
8. IAM sends email with password to new user
   ↓
9. IAM returns UserDto response
```

---

## Important Notes

### Tenant Management
- **Admin-created users belong to the same tenant as the admin creating them**
- The tenant is determined from the admin's JWT token (`tenant_id` claim)
- No separate tenant is created for admin-created users

### Password Generation
- Passwords are automatically generated (12 characters, random)
- Passwords are sent via email to the new user
- Users can change their password after first login
- Password is NOT included in the API response (security)

### WCO Role Requirements
- **WcoId is required** when creating a user with `WCO_EMPLOYEE` role
- The WCO company must exist and be active in Waste Management
- Onboarding is automatically approved (no manual approval needed)
- User can immediately access Waste Management features after creation

### Error Handling
- If Waste Management onboarding creation fails, the user is still created in IAM
- Errors are logged but do not fail the user creation process
- Email failures also do not fail user creation
- The system is designed to be resilient - partial failures don't break the entire flow

### Security Considerations
- Only users with `users.create` permission can create admin users
- Admin users are created in the same tenant as the admin (organizational structure)
- Access tokens are passed through for Waste Management API calls
- All operations are logged for audit purposes
- Generated passwords are never returned in API responses

---

## Configuration

### Waste Management API Base URL

The base URL for Waste Management API calls is configured in IAM's `appsettings.json`:

```json
{
  "WasteManagementApi": {
    "BaseUrl": "https://localhost:5003"
  }
}
```

**Note:** The full endpoint URL will be: `{BaseUrl}/waste-management/api/v1/onboarding/admin-create`

---

## Troubleshooting

### Common Issues

1. **"User with this email already exists"**
   - **Cause:** A user with the same email already exists in the system
   - **Solution:** Use a different email address or update the existing user

2. **"Admin tenant context is required to create users"**
   - **Cause:** Admin's JWT token doesn't contain a valid `tenant_id` claim
   - **Solution:** Ensure the admin is properly assigned to a tenant and has a valid token

3. **"Role '{roleCode}' not found in this workspace"**
   - **Cause:** The specified role doesn't exist in the workspace
   - **Solution:** Verify the role exists in the workspace or create it first

4. **"WCO with ID {wcoId} does not exist or is inactive"**
   - **Cause:** The WCO company doesn't exist in Waste Management or is inactive
   - **Solution:** Verify the WCO company exists and is active in Waste Management

5. **Waste Management onboarding creation fails**
   - **Cause:** Waste Management API is not accessible or returns an error
   - **Solution:** 
     - Check Waste Management API is running
     - Verify network connectivity between IAM and Waste Management
     - Check Waste Management API logs for errors
     - Note: User is still created in IAM even if onboarding fails

6. **Email not sent**
   - **Cause:** Email service is not configured or fails
   - **Solution:** 
     - Check email service configuration
     - Verify SMTP settings
     - Check email service logs
     - Note: User is still created even if email fails

---

## Summary

The Admin User Creation endpoint provides a streamlined way to create users with role assignments:

1. **Standard Flow:** Creates user, generates password, sends email
2. **WCO Flow:** Additionally creates auto-approved Waste Management onboarding
3. **Tenant Management:** Users belong to the same tenant as the admin
4. **Security:** Requires admin permissions, logs all operations
5. **Resilience:** Partial failures don't break the entire flow

The endpoint is designed to be simple for admins while handling complex integrations behind the scenes.

