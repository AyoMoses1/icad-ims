# Email Verification Flow Documentation

## Overview

This document describes the complete email verification flow for normal user registration in the MEMS IAM system. When a user registers, they receive an email with a verification link. Clicking the link verifies their email address and activates their account.

---

## Flow Diagram

```
1. User Registration
   ↓
2. Generate Verification Token
   ↓
3. Send Verification Email
   ↓
4. User Clicks Link
   ↓
5. Verify Email Token
   ↓
6. Update User Status
   ↓
7. Redirect to Frontend
```

---

## Step-by-Step Process

### Step 1: User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "phoneNumber": "+2348012345678",
  "dateOfBirth": "1990-01-01",
  "country": "Nigeria",
  "address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria"
  },
  "invitationToken": null
}
```

**Response:**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Michael",
    "status": "PendingVerification",
    "emailVerified": false,
    "phoneVerified": false,
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z",
    "fullName": "John Michael Doe",
    "tenantId": "tenant-guid-here"
  },
  "error": null
}
```

**What Happens:**
1. User account is created with `EmailConfirmed = false` and `EmailVerified = false`
2. User status is set to `PendingVerification`
3. Tenant is created for the user
4. User is assigned as OWNER to all existing workspaces
5. Email verification token is generated using ASP.NET Core Identity's `GenerateEmailConfirmationTokenAsync`
6. Verification email is sent to the user's email address

---

### Step 2: Email Generation and Sending

**Service:** `NotifierService.SendEmailVerification`

**Email Template:** `01-email-verification.html`

**Verification Link Structure:**
```
{FrontendBaseUrl}/verify-email?userId={userId}&token={verificationToken}
```

**Example Link:**
```
https://icad-ims.netlify.app/verify-email?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&token=CfDJ8N%2Bexample%2Btoken%2Bstring
```

**Email Content:**
- Subject: "Verify Your Email Address - MEMS"
- Body: HTML email with verification button and link
- Expiration: Token expires in 24 hours (Identity default)

**Email Metadata:**
- `name`: User's full name
- `actionUrl`: Complete verification URL with userId and token
- `year`: Current year

---

### Step 3: User Clicks Verification Link

When the user clicks the verification link in their email, they are redirected to:

**Frontend URL:**
```
https://icad-ims.netlify.app/verify-email?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&token=CfDJ8N%2Bexample%2Btoken%2Bstring
```

**Frontend Action:**
The frontend should extract the `userId` and `token` from the URL query parameters and make a request to the verification endpoint.

---

### Step 4: Email Verification (GET Endpoint - Redirect)

**Endpoint:** `GET /api/auth/verify-email`

**Query Parameters:**
- `userId` (required): The user's unique identifier (GUID)
- `token` (required): The email verification token

**Example Request:**
```
GET /api/auth/verify-email?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&token=CfDJ8N%2Bexample%2Btoken%2Bstring
```

**Response:**
- **Success:** HTTP 302 Redirect to `{FrontendBaseUrl}/verify-email?success=true`
- **Error:** HTTP 302 Redirect to `{FrontendBaseUrl}/verify-email?error={errorMessage}`

**What Happens:**
1. System validates `userId` and `token` parameters
2. Retrieves user from database
3. Checks if email is already verified (returns success if already verified)
4. Verifies token using Identity's `ConfirmEmailAsync`
5. Updates user:
   - Sets `EmailVerified = true`
   - Sets `EmailConfirmed = true`
   - Changes `Status` from `PendingVerification` to `Active`
6. Creates audit log entry
7. Redirects to frontend with success/error status

---

### Step 5: Email Verification (POST Endpoint - JSON API)

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token": "CfDJ8N+example+token+string"
}
```

**Success Response:**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": true,
  "error": null
}
```

**Error Response (Invalid Token):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "Email verification failed: Invalid token",
    "code": "400"
  }
}
```

**Error Response (User Not Found):**
```json
{
  "apiVersion": "v1",
  "success": false,
  "code": "400",
  "message": "Unsuccessful",
  "requestId": null,
  "data": null,
  "error": {
    "message": "User not found",
    "code": "400"
  }
}
```

**Error Response (Already Verified):**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Successful",
  "requestId": null,
  "data": true,
  "error": null
}
```
*Note: If email is already verified, the endpoint returns success with a message indicating it's already verified.*

---

## Configuration

### Required AppSettings

The following configuration must be set in `appsettings.json`:

```json
{
  "AppSettings": {
    "FrontendBaseUrl": "https://icad-ims.netlify.app"
  }
}
```

Or:

```json
{
  "FrontendBaseUrl": "https://icad-ims.netlify.app"
}
```

**Purpose:** Used to construct the verification link in the email and for redirects after verification.

---

## Frontend Integration

### Option 1: Using GET Endpoint (Recommended for Email Links)

When the user clicks the verification link from their email:

1. **Frontend receives the redirect:**
   ```
   https://icad-ims.netlify.app/verify-email?success=true
   ```
   or
   ```
   https://icad-ims.netlify.app/verify-email?error=Invalid%20token
   ```

2. **Frontend displays appropriate message:**
   - If `success=true`: Show success message "Your email has been verified successfully!"
   - If `error` is present: Show error message from the `error` query parameter

### Option 2: Using POST Endpoint (For Programmatic Verification)

If the frontend wants to handle verification programmatically:

```javascript
// Extract userId and token from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const token = urlParams.get('token');

// Call verification API
fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: userId,
    token: token
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    // Show success message
    console.log('Email verified successfully!');
  } else {
    // Show error message
    console.error('Verification failed:', data.error.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});
```

---

## Error Scenarios

### 1. Invalid User ID
- **Error:** "Invalid user ID"
- **HTTP Status:** 400
- **Action:** User should contact support

### 2. Missing Token
- **Error:** "Verification token is required"
- **HTTP Status:** 400
- **Action:** User should request a new verification email

### 3. User Not Found
- **Error:** "User not found"
- **HTTP Status:** 400
- **Action:** User may have been deleted or ID is incorrect

### 4. Invalid or Expired Token
- **Error:** "Email verification failed: Invalid token"
- **HTTP Status:** 400
- **Action:** User should request a new verification email

### 5. Token Already Used
- **Response:** Success (email already verified)
- **HTTP Status:** 200
- **Action:** User can proceed to login

---

## Token Expiration

- **Default Expiration:** 24 hours (ASP.NET Core Identity default)
- **Token Type:** ASP.NET Core Identity email confirmation token
- **Security:** Tokens are cryptographically signed and user-specific

---

## User Status Flow

```
Registration → PendingVerification → Active (after email verification)
```

1. **PendingVerification:** Initial status after registration, email not verified
2. **Active:** Status after successful email verification

---

## Database Changes

After successful verification, the following fields are updated in the `AspNetUsers` table:

- `EmailConfirmed`: `false` → `true`
- `EmailVerified`: `false` → `true`
- `Status`: `PendingVerification` → `Active`
- `UpdatedAt`: Updated to current timestamp

---

## Audit Logging

Every email verification attempt is logged in the audit log with:
- **Entity:** "User"
- **Action:** "Update"
- **Message:** "Email verified for user: {email}"
- **UserId:** The user being verified
- **CreatedBy:** The user being verified (self-verification)

---

## Security Considerations

1. **Token Security:**
   - Tokens are cryptographically signed
   - Tokens are user-specific and cannot be reused
   - Tokens expire after 24 hours

2. **URL Encoding:**
   - Tokens are URL-encoded in the verification link
   - Frontend must properly decode the token

3. **Idempotency:**
   - Verifying an already-verified email returns success (no error)
   - Prevents confusion if user clicks link multiple times

4. **No Authentication Required:**
   - Verification endpoints are `[AllowAnonymous]`
   - Users don't need to be logged in to verify their email

---

## Testing

### Test Scenarios

1. **Happy Path:**
   - Register user → Receive email → Click link → Email verified → Status changed to Active

2. **Already Verified:**
   - Click verification link again → Returns success (already verified)

3. **Invalid Token:**
   - Use expired or invalid token → Returns error

4. **Missing Parameters:**
   - Call endpoint without userId or token → Returns error

5. **User Not Found:**
   - Use non-existent userId → Returns error

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Authentication |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | Register new user | Anonymous |
| GET | `/api/auth/verify-email` | Verify email (redirect) | Anonymous |
| POST | `/api/auth/verify-email` | Verify email (JSON API) | Anonymous |

---

## Support

If users encounter issues with email verification:

1. **Email Not Received:**
   - Check spam folder
   - Verify email address is correct
   - Request new verification email (if feature implemented)

2. **Link Expired:**
   - Request new verification email (if feature implemented)
   - Contact support

3. **Link Not Working:**
   - Verify URL is complete and not truncated
   - Try copying and pasting the link directly into browser
   - Contact support if issue persists

---

## Related Files

- **Service:** `MEMS.IAM.Service.Implementations.AuthService`
- **Controller:** `MEMS.IAM.API.Controllers.AuthController`
- **Notification Service:** `MEMS.IAM.Service.Implementations.NotifierService`
- **Email Template:** `email-templates/01-email-verification.html`
- **DTO:** `MEMS.IAM.Models.Requests.VerifyEmailRequestDto`

---

## Notes

- Email verification is only for **normal user registration** (via `/api/auth/register`)
- Admin-created users receive a different email with temporary password (no verification required)
- The verification link includes both `userId` and `token` for security and validation
- Frontend should handle both success and error redirects gracefully

