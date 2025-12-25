# Invitation Workspace Selection - Implementation Guide

## Overview

The invitation system now supports **selecting multiple workspaces** when inviting users. When the user accepts the invitation, they are automatically assigned to all selected workspaces in the `UserWorkspaces` table.

---

## How It Works

### **1. Creating Invitation with Workspace Selection**

**Request:**
```http
POST /iam/api/v1/invitations
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "email": "user@example.com",
  "workspaceIds": [
    "workspace-guid-1",
    "workspace-guid-2",
    "workspace-guid-3"
  ],
  "roleId": "optional-role-guid",
  "message": "Welcome to our team!"
}
```

**What Happens:**
1. ✅ Validates all workspace IDs belong to the current tenant
2. ✅ Validates workspaces are not deleted
3. ✅ Stores workspace IDs as JSON in `Invitation.WorkspaceIdsJson`
4. ✅ Creates invitation record
5. ✅ Sends invitation email

**Response:**
```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "200",
  "message": "Invitation created successfully",
  "data": {
    "invitationId": "...",
    "email": "user@example.com",
    "workspaceIds": [
      "workspace-guid-1",
      "workspace-guid-2",
      "workspace-guid-3"
    ],
    "status": "Pending",
    "expiresAt": "2025-01-30T12:00:00Z"
  }
}
```

---

### **2. Accepting Invitation**

**Request:**
```http
POST /iam/api/v1/invitations/accept
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "invitationToken": "invitation-token-here"
}
```

**What Happens:**
1. ✅ Validates invitation token
2. ✅ Gets workspace IDs from `Invitation.WorkspaceIdsJson`
3. ✅ Verifies workspaces still exist and belong to tenant
4. ✅ Creates `UserWorkspace` record for **EACH** selected workspace
5. ✅ Assigns role if `RoleId` was specified
6. ✅ Updates invitation status to `Accepted`

**Result:**
- User is assigned to **ALL** selected workspaces
- `UserWorkspaces` table has multiple records (one per workspace)
- When user switches to this tenant, they'll have access to all assigned workspaces ✅

---

## Workspace Assignment Priority

When accepting an invitation, workspace assignment follows this priority:

### **Priority 1: Explicit Workspace Selection** ✅ (NEW)
```
If invitation.WorkspaceIdsJson is provided:
  → Use workspace IDs from invitation
  → Assign user to ALL selected workspaces
```

### **Priority 2: Role's Workspace**
```
If invitation.RoleId is provided (and no WorkspaceIdsJson):
  → Get workspace from role
  → Assign user to role's workspace
```

### **Priority 3: Legacy Fallback**
```
If neither WorkspaceIdsJson nor RoleId:
  → Get all workspaces tenant has access to (via WorkspaceMembers)
  → Assign user to all tenant workspaces
```

---

## Database Changes

### **Invitation Entity**

Added new field:
```csharp
public class Invitation
{
    // ... existing fields ...
    
    /// <summary>
    /// JSON array of workspace IDs to assign the user to when they accept the invitation.
    /// Stored as JSON string: ["guid1", "guid2", ...]
    /// </summary>
    [StringLength(2000)]
    public string? WorkspaceIdsJson { get; set; }
}
```

**Database Migration Required:**
```sql
ALTER TABLE Invitations
ADD WorkspaceIdsJson NVARCHAR(2000) NULL;
```

---

## API Changes

### **CreateInvitationRequestDto**

**Before:**
```csharp
public class CreateInvitationRequestDto
{
    public string Email { get; set; }
    public Guid? RoleId { get; set; }
    public string? Message { get; set; }
}
```

**After:**
```csharp
public class CreateInvitationRequestDto
{
    public string Email { get; set; }
    public Guid? RoleId { get; set; }
    
    /// <summary>
    /// List of workspace IDs to assign the user to when they accept the invitation.
    /// </summary>
    public List<Guid>? WorkspaceIds { get; set; }
    
    public string? Message { get; set; }
}
```

### **InvitationDto**

**Added:**
```csharp
public class InvitationDto
{
    // ... existing fields ...
    
    /// <summary>
    /// List of workspace IDs that the user will be assigned to when they accept the invitation.
    /// </summary>
    public List<Guid>? WorkspaceIds { get; set; }
}
```

---

## Example Flows

### **Example 1: Invite User to Multiple Workspaces**

**Step 1: Create Invitation**
```json
POST /iam/api/v1/invitations
{
  "email": "john@example.com",
  "workspaceIds": [
    "workspace-1-guid",
    "workspace-2-guid",
    "workspace-3-guid"
  ],
  "message": "You've been invited to join our workspaces"
}
```

**Step 2: User Accepts Invitation**
```json
POST /iam/api/v1/invitations/accept
{
  "invitationToken": "token-here"
}
```

**Result:**
- ✅ `UserWorkspaces` table has 3 records:
  - UserId + TenantId + Workspace-1
  - UserId + TenantId + Workspace-2
  - UserId + TenantId + Workspace-3

**Step 3: User Switches to Tenant**
- ✅ Token includes `workspace_id` claim (first workspace)
- ✅ Token includes `workspaces` JSON array with all 3 workspaces
- ✅ User can access all 3 workspaces ✅

---

### **Example 2: Invite User with Role (Backward Compatible)**

**Request:**
```json
POST /iam/api/v1/invitations
{
  "email": "jane@example.com",
  "roleId": "role-guid-here"
}
```

**Result:**
- ✅ User assigned to role's workspace (Priority 2)
- ✅ Backward compatible with existing flow

---

### **Example 3: Invite User Without Workspace Selection (Legacy)**

**Request:**
```json
POST /iam/api/v1/invitations
{
  "email": "bob@example.com"
}
```

**Result:**
- ✅ User assigned to all tenant workspaces (Priority 3)
- ✅ Legacy behavior maintained

---

## Validation

### **When Creating Invitation:**

1. ✅ **Workspace Validation:**
   - All workspace IDs must belong to the current tenant
   - All workspaces must not be deleted
   - Returns error if any workspace is invalid

2. ✅ **Error Response:**
   ```json
   {
     "success": false,
     "code": "400",
     "message": "Invalid workspace IDs: workspace-guid-1, workspace-guid-2. These workspaces do not belong to this tenant or are deleted."
   }
   ```

### **When Accepting Invitation:**

1. ✅ **Workspace Verification:**
   - Verifies workspaces still exist
   - Verifies workspaces still belong to tenant
   - Skips deleted workspaces
   - Logs warnings for invalid workspaces

2. ✅ **Duplicate Prevention:**
   - Checks if `UserWorkspace` already exists before creating
   - Skips if user already has access
   - Logs information for existing assignments

---

## Frontend Implementation

### **Create Invitation Form**

```typescript
interface CreateInvitationRequest {
  email: string;
  workspaceIds?: Guid[];  // NEW: Multi-select workspaces
  roleId?: Guid;          // Optional: Still supported
  message?: string;
}

// Example: Multi-select workspace picker
const [selectedWorkspaces, setSelectedWorkspaces] = useState<Guid[]>([]);

// When creating invitation:
const createInvitation = async () => {
  const response = await fetch('/iam/api/v1/invitations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      workspaceIds: selectedWorkspaces, // Send selected workspaces
      message: message
    })
  });
};
```

### **Display Invitation Details**

```typescript
interface InvitationDto {
  invitationId: Guid;
  email: string;
  workspaceIds?: Guid[];  // NEW: Shows selected workspaces
  roleId?: Guid;
  status: InvitationStatus;
  // ... other fields
}

// Display selected workspaces
{invitation.workspaceIds && invitation.workspaceIds.length > 0 && (
  <div>
    <h4>Selected Workspaces:</h4>
    <ul>
      {invitation.workspaceIds.map(workspaceId => (
        <li key={workspaceId}>{workspaceId}</li>
      ))}
    </ul>
  </div>
)}
```

---

## Benefits

### **Before (Old System):**
- ❌ Could only assign to one workspace (via role)
- ❌ Or assigned to ALL tenant workspaces (too broad)
- ❌ No control over which workspaces user gets access to
- ❌ User had to be manually assigned to additional workspaces later

### **After (New System):**
- ✅ **Select multiple workspaces** during invitation
- ✅ **Precise control** over workspace access
- ✅ **Automatic assignment** to all selected workspaces on acceptance
- ✅ **Workspace available immediately** when switching tenants
- ✅ **Backward compatible** with existing role-based invitations

---

## Migration Steps

### **1. Database Migration**

Create migration to add `WorkspaceIdsJson` column:

```sql
ALTER TABLE Invitations
ADD WorkspaceIdsJson NVARCHAR(2000) NULL;
```

### **2. Update Frontend**

- Add workspace multi-select component to invitation form
- Update invitation DTOs to include `WorkspaceIds`
- Display selected workspaces in invitation details

### **3. Test**

1. ✅ Create invitation with multiple workspaces
2. ✅ Accept invitation
3. ✅ Verify `UserWorkspaces` table has all workspace assignments
4. ✅ Switch tenant and verify `workspace_id` is present
5. ✅ Test backward compatibility (invitations without workspace selection)

---

## Summary

**What Changed:**
- ✅ `CreateInvitationRequestDto` now accepts `WorkspaceIds` list
- ✅ `Invitation` entity stores `WorkspaceIdsJson`
- ✅ `AcceptInvitationAsync` uses selected workspaces (Priority 1)
- ✅ `InvitationDto` includes `WorkspaceIds` for frontend display

**Result:**
- ✅ Users can be invited to **specific workspaces**
- ✅ On acceptance, user is **automatically assigned** to all selected workspaces
- ✅ When switching tenants, user has **immediate access** to assigned workspaces
- ✅ `workspace_id` is **always present** in token after tenant switch ✅

---

**Last Updated:** January 2025  
**Version:** 1.0

