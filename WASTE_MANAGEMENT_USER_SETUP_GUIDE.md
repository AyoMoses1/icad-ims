# Waste Management User Setup Guide - Complete Breakdown

## 🎯 Overview

This guide explains how to set up users (WCO, WRF, Vessel Operator, NIMASA Officer) for the Waste Management system and assign resources/permissions to them.

---

## 📋 Table of Contents

1. [Who Can Create Resources?](#who-can-create-resources)
2. [Complete Setup Flow](#complete-setup-flow)
3. [Step-by-Step User Setup](#step-by-step-user-setup)
4. [Resource Assignment](#resource-assignment)
5. [Role-Based Access Control](#role-based-access-control)
6. [Common Scenarios](#common-scenarios)

---

## 🔐 Who Can Create Resources?

### **Answer: Only SuperAdmin (RDLC)**

**Current Restriction:**
- ✅ **Only SuperAdmin** can create resources in IAM
- ✅ SuperAdmin is identified by email: `superadmin@rdlc.com` or any email containing `@rdlc.com`
- ❌ **NIMASA Admin Portal CANNOT create resources** (unless they have SuperAdmin access)
- ❌ Regular users, workspace owners, and admins **CANNOT create resources**

**Code Reference:**
```csharp
// From WorkspaceResourceService.CreateResourceAsync
var isSuperAdmin = user.Email != null && 
    (user.Email.ToLower() == "superadmin@rdlc.com" || 
     user.Email.ToLower().Contains("@rdlc.com"));

if (!isSuperAdmin)
{
    return "Only SuperAdmin can create resources";
}
```

**Why This Restriction?**
- Resources define what actions users can perform (view, create, update, delete)
- Creating resources incorrectly could expose sensitive endpoints
- SuperAdmin ensures centralized control and security

---

## 🔄 Complete Setup Flow

### **High-Level Process:**

```
1. SuperAdmin creates resources in IAM workspace
   ↓
2. SuperAdmin creates roles in workspace
   ↓
3. SuperAdmin assigns resources/permissions to roles
   ↓
4. SuperAdmin invites users to workspace
   ↓
5. Users accept invitation → Assigned to workspace
   ↓
6. Users complete Waste Management onboarding
   ↓
7. Users can now access Waste Management features
```

---

## 📝 Step-by-Step User Setup

### **Step 1: SuperAdmin Creates Resources**

**Who:** SuperAdmin (`superadmin@rdlc.com` or `@rdlc.com` email)

**Endpoint:** `POST /iam/api/v1/workspaces/{workspaceId}/resources`

**Example:**
```http
POST /iam/api/v1/workspaces/{waste-management-workspace-id}/resources
Authorization: Bearer {superadmin-token}
Content-Type: application/json

{
  "resourceName": "WasteDeclarations",
  "url": "/waste-management/api/v1/WasteDeclarations",
  "parentId": null
}
```

**Required Resources for Waste Management:**
- `WasteDeclarations` - Create/view waste declarations
- `Collections` - Manage waste collection
- `Invoices` - View/generate invoices
- `Payments` - Process payments
- `Evacuations` - Create evacuations
- `Receipts` - Confirm receipts
- `Treatments` - Manage treatment lifecycle
- `Onboarding` - User onboarding
- `Vessels` - Manage vessels
- `WasteCollectionOperators` - Manage WCOs
- `WasteReceptionFacilities` - Manage WRFs
- `Reports` - Generate reports
- `Dashboard` - View dashboard

**What Happens:**
- ✅ Resource created in workspace
- ✅ **Automatically assigned to Owner role** with all permissions
- ✅ All system permissions (view, create, update, delete) assigned to Owner

---

### **Step 2: SuperAdmin Creates Roles**

**Who:** SuperAdmin or Workspace Owner

**Endpoint:** `POST /iam/api/v1/workspaces/{workspaceId}/roles`

**Example Roles:**

#### **Role 1: Vessel Operator Role**
```http
POST /iam/api/v1/workspaces/{workspace-id}/roles
Authorization: Bearer {superadmin-token}
Content-Type: application/json

{
  "roleName": "Vessel Operator",
  "roleCode": "VESSEL_OPERATOR",
  "roleDescription": "Vessel operators who can create waste declarations"
}
```

#### **Role 2: WCO Employee Role**
```http
POST /iam/api/v1/workspaces/{workspace-id}/roles
{
  "roleName": "WCO Employee",
  "roleCode": "WCO_EMPLOYEE",
  "roleDescription": "Waste Collection Operator employees"
}
```

#### **Role 3: WRF Employee Role**
```http
POST /iam/api/v1/workspaces/{workspace-id}/roles
{
  "roleName": "WRF Employee",
  "roleCode": "WRF_EMPLOYEE",
  "roleDescription": "Waste Reception Facility employees"
}
```

#### **Role 4: NIMASA Officer Role**
```http
POST /iam/api/v1/workspaces/{workspace-id}/roles
{
  "roleName": "NIMASA Officer",
  "roleCode": "NIMASA_OFFICER",
  "roleDescription": "NIMASA officers who attest waste declarations"
}
```

**What Happens:**
- ✅ Role created in workspace
- ✅ Role linked to current user's `UserWorkspace`
- ✅ Role can now be assigned to users

---

### **Step 3: SuperAdmin Assigns Resources to Roles**

**Who:** SuperAdmin

**Endpoint:** `POST /iam/api/v1/workspaces/{workspaceId}/roles/{roleId}/resources`

**Example: Assign WasteDeclarations to Vessel Operator Role**

```http
POST /iam/api/v1/workspaces/{workspace-id}/roles/{vessel-operator-role-id}/resources
Authorization: Bearer {superadmin-token}
Content-Type: application/json

{
  "resourceId": "{waste-declarations-resource-id}",
  "permissionIds": [
    "{view-permission-id}",
    "{create-permission-id}",
    "{update-permission-id}"
  ]
}
```

**Permission Matrix:**

| Role | WasteDeclarations | Collections | Invoices | Payments | Evacuations | Receipts | Treatments |
|------|------------------|-------------|----------|----------|-------------|----------|------------|
| **Vessel Operator** | View, Create, Update | View | View | View, Create | - | - | View |
| **WCO Employee** | View | View, Create, Update | View | View | View, Create | - | - |
| **WRF Employee** | View | View | View | View | View | View, Create, Update | View, Create, Update |
| **NIMASA Officer** | View | View | View, Create | - | - | - | - |

**What Happens:**
- ✅ Resource assigned to role
- ✅ Permissions (view, create, update, delete) assigned to role
- ✅ Users with this role can now access the resource

---

### **Step 4: SuperAdmin Invites Users**

**Who:** SuperAdmin or Workspace Owner

**Endpoint:** `POST /iam/api/v1/invitations`

**Example: Invite Vessel Operator**

```http
POST /iam/api/v1/invitations
Authorization: Bearer {superadmin-token}
Content-Type: application/json

{
  "email": "vessel.operator@shipping.com",
  "workspaceIds": [
    "{waste-management-workspace-id}"
  ],
  "roleId": "{vessel-operator-role-id}",
  "message": "Welcome to Waste Management System"
}
```

**Example: Invite WCO Employee**

```http
POST /iam/api/v1/invitations
{
  "email": "wco.employee@wastecollection.com",
  "workspaceIds": [
    "{waste-management-workspace-id}"
  ],
  "roleId": "{wco-employee-role-id}",
  "message": "You have been invited as a WCO Employee"
}
```

**Example: Invite WRF Employee**

```http
POST /iam/api/v1/invitations
{
  "email": "wrf.employee@wastereception.com",
  "workspaceIds": [
    "{waste-management-workspace-id}"
  ],
  "roleId": "{wrf-employee-role-id}",
  "message": "You have been invited as a WRF Employee"
}
```

**Example: Invite NIMASA Officer**

```http
POST /iam/api/v1/invitations
{
  "email": "nimasa.officer@nimasa.gov.ng",
  "workspaceIds": [
    "{waste-management-workspace-id}"
  ],
  "roleId": "{nimasa-officer-role-id}",
  "message": "You have been invited as a NIMASA Officer"
}
```

**What Happens:**
- ✅ Invitation email sent to user
- ✅ Invitation stored with selected workspaces and role
- ✅ User can accept invitation

---

### **Step 5: User Accepts Invitation**

**Who:** Invited User

**Endpoint:** `POST /iam/api/v1/invitations/accept`

**Request:**
```http
POST /iam/api/v1/invitations/accept
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "invitationToken": "{invitation-token-from-email}"
}
```

**What Happens:**
- ✅ `UserWorkspace` created (user assigned to workspace)
- ✅ `WorkspaceMember` created (for authorization)
- ✅ Role assigned to user via `WorkspaceMembersRole`
- ✅ User can now access workspace

---

### **Step 6: User Completes Waste Management Onboarding**

**Who:** Invited User

**Endpoint:** `POST /waste-management/api/v1/Onboarding`

**Example: Vessel Operator Onboarding**

```http
POST /waste-management/api/v1/Onboarding
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "role": 1,  // VESSEL_OPERATOR
  "roleSpecificIdentifier": "ABC Shipping Company Ltd",
  "jobTitle": "Vessel Captain",
  "department": "Operations"
}
```

**Example: WCO Employee Onboarding**

```http
POST /waste-management/api/v1/Onboarding
{
  "role": 2,  // WCO_EMPLOYEE
  "wcoId": "{waste-collection-operator-id}",
  "jobTitle": "Waste Collection Officer",
  "employeeId": "WCO-EMP-001",
  "department": "Operations"
}
```

**Example: WRF Employee Onboarding**

```http
POST /waste-management/api/v1/Onboarding
{
  "role": 3,  // WRF_EMPLOYEE
  "wasteReceptionFacilityId": "{waste-reception-facility-id}",
  "jobTitle": "Waste Reception Officer",
  "employeeId": "WRF-EMP-001",
  "department": "Operations"
}
```

**Example: NIMASA Officer Onboarding**

```http
POST /waste-management/api/v1/Onboarding
{
  "role": 4,  // NIMASA_OFFICER
  "roleSpecificIdentifier": "NIMASA-BADGE-12345",
  "jobTitle": "Marine Inspector",
  "department": "Marine Environment"
}
```

**What Happens:**
- ✅ `UserWasteManagementOnboarding` record created
- ✅ User linked to their role-specific entity (WCO, WRF, etc.)
- ✅ User can now use Waste Management features

---

## 🎯 Resource Assignment

### **How Resources Are Assigned:**

1. **Resources are assigned to ROLES, not directly to users**
2. **Users get permissions through their roles**
3. **Multiple users can have the same role**

**Flow:**
```
Resource → Role → User
```

**Example:**
```
WasteDeclarations Resource
  ↓
Vessel Operator Role (has view, create, update permissions)
  ↓
User: vessel.operator@shipping.com (assigned Vessel Operator Role)
  ↓
User can: View, Create, Update waste declarations
```

---

## 🔒 Role-Based Access Control

### **Permission Levels:**

| Permission | Description | Example |
|-----------|-------------|---------|
| **view** | Can view/list resources | View all waste declarations |
| **create** | Can create new resources | Create new waste declaration |
| **update** | Can update existing resources | Update waste declaration status |
| **delete** | Can delete resources | Delete waste declaration |
| **manage** | Full management access | All operations |

### **Role Permissions Summary:**

#### **Vessel Operator:**
- ✅ Create waste declarations
- ✅ View own waste declarations
- ✅ Update own waste declarations
- ✅ View invoices
- ✅ Make payments
- ✅ View treatment status

#### **WCO Employee:**
- ✅ View waste declarations
- ✅ Set pickup time
- ✅ Collect waste
- ✅ Create evacuations
- ✅ View invoices

#### **WRF Employee:**
- ✅ View waste declarations
- ✅ Confirm receipt
- ✅ Start treatment
- ✅ Mark treated
- ✅ Final disposal
- ✅ Complete treatment

#### **NIMASA Officer:**
- ✅ View waste declarations
- ✅ Attest collections
- ✅ Generate invoices
- ✅ View reports

---

## 📋 Common Scenarios

### **Scenario 1: Setting Up a New WCO Company**

**Steps:**
1. SuperAdmin creates WCO entity in Waste Management (if not exists)
2. SuperAdmin creates "WCO Employee" role in IAM workspace
3. SuperAdmin assigns resources to "WCO Employee" role:
   - Collections (view, create, update)
   - WasteDeclarations (view)
   - Evacuations (view, create)
   - Invoices (view)
4. SuperAdmin invites WCO employees:
   ```json
   {
     "email": "employee@wco-company.com",
     "workspaceIds": ["{workspace-id}"],
     "roleId": "{wco-employee-role-id}"
   }
   ```
5. WCO employees accept invitation
6. WCO employees complete onboarding with `wcoId`

---

### **Scenario 2: Setting Up a New WRF Facility**

**Steps:**
1. SuperAdmin creates WRF entity in Waste Management (if not exists)
2. SuperAdmin creates "WRF Employee" role in IAM workspace
3. SuperAdmin assigns resources to "WRF Employee" role:
   - Receipts (view, create, update)
   - Treatments (view, create, update)
   - WasteDeclarations (view)
4. SuperAdmin invites WRF employees
5. WRF employees accept invitation
6. WRF employees complete onboarding with `wasteReceptionFacilityId`

---

### **Scenario 3: Adding a New Vessel Operator**

**Steps:**
1. SuperAdmin invites vessel operator:
   ```json
   {
     "email": "captain@vessel.com",
     "workspaceIds": ["{workspace-id}"],
     "roleId": "{vessel-operator-role-id}"
   }
   ```
2. Vessel operator accepts invitation
3. Vessel operator completes onboarding:
   ```json
   {
     "role": 1,
     "roleSpecificIdentifier": "Shipping Company Name"
   }
   ```
4. Vessel operator can now create waste declarations

---

### **Scenario 4: NIMASA Admin Portal Access**

**Question: Can NIMASA Admin Portal create resources?**

**Answer: NO** (unless they have SuperAdmin access)

**What NIMASA Admin Portal CAN do:**
- ✅ Invite NIMASA officers
- ✅ Assign roles to users
- ✅ View/manage users
- ✅ View reports

**What NIMASA Admin Portal CANNOT do:**
- ❌ Create resources (only SuperAdmin can)
- ❌ Create new workspaces (only RDLC can)

**Workaround:**
- NIMASA Admin Portal should request SuperAdmin to create resources
- Or, NIMASA Admin Portal user should have SuperAdmin email (`@rdlc.com`)

---

## 🎯 Summary

### **Who Can Do What:**

| Action | SuperAdmin | NIMASA Admin | Workspace Owner | Regular User |
|--------|-----------|--------------|----------------|--------------|
| **Create Resources** | ✅ | ❌ | ❌ | ❌ |
| **Create Roles** | ✅ | ✅ | ✅ | ❌ |
| **Assign Resources to Roles** | ✅ | ✅ | ✅ | ❌ |
| **Invite Users** | ✅ | ✅ | ✅ | ❌ |
| **Accept Invitation** | ✅ | ✅ | ✅ | ✅ |
| **Complete Onboarding** | ✅ | ✅ | ✅ | ✅ |
| **Use Waste Management** | ✅ | ✅ | ✅ | ✅ |

### **Setup Flow Summary:**

1. **SuperAdmin** creates resources in IAM workspace
2. **SuperAdmin** creates roles (Vessel Operator, WCO, WRF, NIMASA)
3. **SuperAdmin** assigns resources/permissions to roles
4. **SuperAdmin/NIMASA Admin** invites users to workspace
5. **Users** accept invitation → Assigned to workspace
6. **Users** complete Waste Management onboarding
7. **Users** can now access Waste Management features

### **Key Points:**

- ✅ **Only SuperAdmin** can create resources
- ✅ **Resources are assigned to roles**, not directly to users
- ✅ **Users get permissions through their roles**
- ✅ **NIMASA Admin Portal** can manage users but cannot create resources
- ✅ **All users** must complete Waste Management onboarding to use features

---

## 🔧 Next Steps

1. **SuperAdmin** should create all required resources first
2. **SuperAdmin** should create roles for each user type
3. **SuperAdmin** should assign resources to roles based on permission matrix
4. **SuperAdmin/NIMASA Admin** can then invite users
5. **Users** accept invitation and complete onboarding

---

## 📞 Support

If you need to create resources but don't have SuperAdmin access:
1. Contact SuperAdmin (`superadmin@rdlc.com`)
2. Request resource creation
3. Provide list of required resources
4. SuperAdmin will create resources and assign to appropriate roles

