# Testing: Storage Clearing, WCO User Creation, and Domain Roles

## 1. Storage clearing (logout / login)

**What was fixed:** Local storage is cleared on logout and at the start of login so old tenant/workspace data is not reused.

**How to test:**

1. **Logout clears storage**
   - Sign in to the app.
   - Open DevTools → Application → Local Storage.
   - Confirm `auth-storage` and `workspace-storage` exist.
   - Click **Sign out** (sidebar).
   - Confirm both keys are removed from Local Storage.

2. **Login starts with a clean slate**
   - With a previous session still in storage (or after signing out), go to `/auth/signin`.
   - Sign in with valid credentials.
   - Storage is cleared at the start of the login request, then the new session is stored.
   - Confirm you see the correct workspace/tenant for the user (no stale cache).

3. **Switching users**
   - Sign in as User A, note workspace/tenant.
   - Sign out, then sign in as User B.
   - Confirm User B’s workspace/tenant; you should not see User A’s context.

---

## 2. WCO (Waste Collection Operator) user creation

**What was implemented:** When creating a user with the **WCO_EMPLOYEE** role in the Waste Management workspace, the admin must select the **WCO company** from a dropdown (or enter the WCO ID if the list fails to load). The dropdown is filled from the Waste Management API.

**Prerequisites:**

- Backend IAM and Waste Management APIs running.
- Gateway (or env) set so the app can call:
  - IAM: e.g. `POST .../iam/api/v1/admin/users/with-role`
  - Waste Management: `GET .../waste-management/api/v1/MasterData/waste-collection-operators`
- If Waste Management is on a different host, set `NEXT_PUBLIC_WASTE_MANAGEMENT_API_URL` in `.env.local` (optional).

**How to test:**

1. Go to **Admin → User Management**: `http://localhost:3001/admin/users`.
2. Click **Add User with Role**.
3. Fill in:
   - First name, Last name, Email, Phone (optional).
4. Under **Workspace-Role Assignments**:
   - Click **Add Workspace**.
   - Choose the **Waste Management** workspace.
   - In **Roles**, select **WCO_EMPLOYEE** (or the role that represents WCO).
5. **WCO Company** section:
   - If the Waste Management API is reachable: a **WCO Company** dropdown appears; select a company (e.g. "Green Waste Co (WCO-LIC-001)").
   - If the API fails or is not configured: you see "Loading WCO companies..." then an error and a text field; enter a valid WCO company ID (UUID).
6. Click **Create User**.
   - Expected: user is created, roles assigned, and (when `wcoId` is sent) Waste Management onboarding is created for that WCO company.
7. **Validation:** Leave WCO Company empty and click **Create User**.
   - Expected: validation error like "WCO ID is required when assigning WCO_EMPLOYEE role".

**API check (optional):**

- Call `GET /waste-management/api/v1/MasterData/waste-collection-operators` with a valid token.
- Response should be `{ "success": true, "data": [ { "id", "name", "description", "code" } ] }`.
- The app uses `data[].id` as `wcoId` in the create-user request.

---

## 3. Domain roles (what they are)

**Domain roles** are **custom, non-admin workspace roles** used for business functions. They are roles where:

- `IsAdmin = false`
- `IsSystemRole = false`

Examples: **WCO**, **WRF** (Waste Reception Facility), **MEMBER**, **VESSEL_OPERATOR**.

**Contrast:**

- **System roles:** e.g. OWNER (tenant owner).
- **Admin roles:** e.g. workspace ADMIN.
- **Domain roles:** everything else that is not system and not admin (WCO, WRF, MEMBER, etc.).

**In the app:**

- The **Get Domain Roles** API (`GET /api/workspaces/{workspaceId}/roles/domain`) returns only these domain roles (e.g. for dropdowns or lookups).
- They are used for onboarding, role assignment, and permission scoping in features like Waste Management.

---

## 4. Quick checklist

| Test                      | Steps                                              | Expected                                    |
| ------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Logout clears storage     | Sign in → Sign out → Check Local Storage           | `auth-storage`, `workspace-storage` removed |
| Login clears before store | Sign in (after another user or stale data)         | New session only; no old tenant/workspace   |
| WCO dropdown              | Add User → Waste Management + WCO_EMPLOYEE         | WCO Company dropdown with companies         |
| WCO required              | Add User → WCO_EMPLOYEE → leave WCO empty → Create | Validation error                            |
| WCO fallback              | Turn off Waste Management API                      | Error message + manual WCO ID input         |
