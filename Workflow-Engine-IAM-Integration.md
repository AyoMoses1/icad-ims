# Role-Based Workflow Engine – Integration with MEMS IAM API

This document explains how to introduce the **Role-Based Workflow Engine** (from the technical design) with your existing **MEMS IAM API**. It maps the workflow design’s “Role” and “UserRole” to your current workspace/role model and describes what to reuse, what to add, and how authorization and auditing align.

---

## 1. Executive Summary

| Workflow design concept | IAM equivalent | Action |
|-------------------------|----------------|--------|
| **Role**                | `WorkspaceRole` | **Reuse** – no new Role table; use existing workspace roles. |
| **UserRole**            | `WorkspaceMember` + `WorkspaceMembersRole` + `WorkspaceRole` | **Reuse** – resolve “user’s roles” via existing IAM data. |
| **WorkflowType, WorkflowStage, WorkflowStageAssignee** | — | **Add** – new tables/entities. |
| **Workflow, WorkflowActivity** | — | **Add** – new tables/entities. |
| **WorkflowAssignment** (claiming) | — | **Add** (optional). |

The workflow engine does **not** duplicate Role or UserRole. It uses your existing **WorkspaceRole** and **WorkspaceMembersRole** for role-based assignment and authorization. New tables are only for workflow definitions and instances.

---

## 2. Mapping Design Entities to IAM

### 2.1 Role → WorkspaceRole

The design’s **Role** entity is satisfied by your existing **WorkspaceRole**.

| Design field   | IAM field / note |
|----------------|-------------------|
| RoleId (PK)    | `WorkspaceRoleId` (Guid) |
| RoleName       | `RoleName` or `RoleCode` (e.g. WCO, NIMASA_REVIEWER, ADMIN_FINAL_APPROVER) |
| Description    | `RoleDescription` |
| IsActive       | Use `!IsDeleted` (and optionally `IsActive` if you add it) |
| DateCreated, CreatedBy | `DateCreated`, `CreatedBy` (BaseEntity; Guid?) |

**Recommendation for workflow assignees**

- In **WorkflowStageAssignee.AssigneeValue**, store the **role identifier** that IAM uses when resolving “user has this role”.
- Prefer **RoleCode** (e.g. `NIMASA_REVIEWER`) if it is unique per workspace and stable; otherwise use **RoleName**.
- If roles are only unique per workspace, then workflow resolution must be **scoped by WorkspaceId** (and optionally TenantId). See §4.

**No new Role table** – workflow definitions reference roles by name/code that already exist in `WorkspaceRoles`.

---

### 2.2 UserRole → WorkspaceMember + WorkspaceMembersRole + WorkspaceRole

The design’s **UserRole** (user ↔ role mapping) is represented by:

1. **WorkspaceMember** – “this user/tenant is in this workspace”.
2. **WorkspaceMembersRole** – “this member has this workspace role”.
3. **WorkspaceRole** – the role (name/code).

So: **User’s roles in a workspace** =  
`WorkspaceMember` (UserId + WorkspaceId) → `WorkspaceMembersRole` → `WorkspaceRole` (RoleName / RoleCode).

**No new UserRole table** – the workflow engine will **query** IAM (same DB or via API) to get “list of role names/codes for this user in this workspace” and then check that list against **WorkflowStageAssignee** (AssigneeType = ROLE, AssigneeValue = role name/code).

---

### 2.3 User identity (CreatedBy, ClaimedBy, etc.)

Your IAM uses **Guid** for user identity (`AppUser.Id`, `BaseEntity.CreatedBy`). The workflow engine should use the **same**:

- **CreatedBy** (Workflow, WorkflowActivity): store **UserId** (Guid).
- **ClaimedBy** (WorkflowAssignment): store **UserId** (Guid) or a stable username/identifier; if you use Guid, it aligns with IAM and token claims (`sub` / `ClaimTypes.NameIdentifier`).

`ICurrentUserService.GetUserId()` returns a string; parse to Guid when persisting.

---

## 3. What to Add (New Tables / Entities)

Add only the following. Keep **Role** and **UserRole** as the IAM concepts above; do not create separate Role/UserRole tables for the workflow.

| Entity                  | Purpose |
|-------------------------|--------|
| **WorkflowType**        | Template: name, description, optional `UpdateUrl`, IsActive. |
| **WorkflowStage**       | Ordered stages per WorkflowType (StageOrder 1..N), includes optional `ViewDetailUrl`. |
| **WorkflowStageAssignee** | Per stage: AssigneeType (ROLE/USER), AssigneeValue (RoleName/RoleCode or UserId), CanApprove, CanReject. |
| **Workflow**            | Instance: ReferenceType, ReferenceId, CurrentWorkflowStageId, Status, CreatedBy (Guid), etc. |
| **WorkflowActivity**    | Audit log: Action, Remark, CreatedBy (Guid), Old/NewWorkflowStageId. |
| **WorkflowAssignment**  | Optional claiming: WorkflowId, WorkflowStageId, AssignedRoleName, ClaimedBy, ClaimedAt. |

**Important:**  
- **WorkflowStageAssignee.AssigneeValue** for roles should store the **WorkspaceRoleId** (GUID) as string – the same value you get when resolving the user’s workspace roles from IAM.  
- If your workflow is **workspace-scoped**, add **WorkspaceId** (and optionally **TenantId**) to **WorkflowType** or **Workflow** so that “user’s roles” are always resolved in the correct workspace/tenant. See §4.

---

## 4. Workspace and Tenant Context

In IAM, roles are **per workspace** (and tenant). So workflow authorization must be **scoped**:

1. **Where to store context**  
   Either:
   - Add **WorkspaceId** (and optionally **TenantId**) to **WorkflowType**, and derive them for an instance from its type, or  
   - Add **WorkspaceId** (and optionally **TenantId**) to **Workflow** so each instance is explicitly tied to a workspace/tenant.

2. **Resolving “user’s roles” for authorization**  
   For the current user (UserId from token) and the workflow’s WorkspaceId (and TenantId if needed):
   - Find **WorkspaceMember** by `UserId` + `WorkspaceId` (and optionally `TenantId`).
   - From that member, get **WorkspaceRole** via **WorkspaceMembersRole**.
   - Build the set of **RoleName** or **RoleCode** for that user in that workspace.
   - Check whether this set contains **WorkflowStageAssignee.AssigneeValue** for the current stage and the required permission (CanApprove / CanReject).

This is the same logic used in **AuthorizationService** (WorkspaceMember → WorkspaceMembersRoles → WorkspaceRole) and in **UserinfoEndpointHandler** (roles per workspace/tenant). The workflow engine can reuse it by:
- **Option A:** Same solution/database – inject IAM DbContext or a shared “user roles” service and run the same queries.  
- **Option B:** Separate service – IAM exposes an internal or B2B API such as “get role names for user in workspace” and the workflow service calls it.

---

## 5. IAM APIs / Services to Leverage

### 5.1 Current user and context

- **ICurrentUserService**
  - `GetUserId()` – use for CreatedBy, ClaimedBy (convert to Guid where needed).
  - `GetWorkspaceId()`, `GetTenantId()` – use to scope workflow creation and authorization when the request is workspace/tenant-scoped.

### 5.2 Resolving user’s roles in a workspace

Today this is done inside:
- **AuthorizationService** – for resource/permission checks.
- **UserinfoEndpointHandler** – for token/userinfo (roles per workspace/tenant).

For the workflow engine you need a **reusable** way to get “role names (or codes) for user in workspace”:

- **Option 1 – Same codebase:** Add a method such as:
  - `Task<IReadOnlyList<string>> GetUserRoleNamesForWorkspaceAsync(Guid userId, Guid workspaceId, string? tenantId = null, CancellationToken ct = default)`
  - Implement it by querying WorkspaceMember (UserId + WorkspaceId + optional TenantId) → WorkspaceMembersRoles → WorkspaceRole, and returning `RoleCode` (or `RoleName`). Use this in both IAM and workflow authorization.

- **Option 2 – Internal API:** Expose an internal or B2B endpoint, e.g. `GET /api/internal/users/{userId}/workspaces/{workspaceId}/roles`, returning role names/codes. The workflow service (if in another process) calls it with the current user and workflow’s workspace.

### 5.3 Existing audit and identity

- **BaseEntity** – `CreatedBy`, `DateCreated`, `ModifiedBy`, `DateModified` are Guid? and DateTime. Workflow entities can mirror this for CreatedBy/DateCreated (and optionally ModifiedBy/DateModified) so audit and IAM stay consistent.
- **AuditLog** – You may still write high-level “Workflow approved/rejected” events to your existing AuditLog from the workflow engine, while keeping the full trail in **WorkflowActivity**.

---

## 6. Authorization Rules (Who Can Act on a Stage)

Implement the design’s authorization as follows:

1. **Inputs:** Current user Id (Guid), WorkflowId, action (Approve / Reject).
2. **Load:** Workflow instance and its CurrentWorkflowStageId; WorkflowType; WorkflowStageAssignees for that stage (AssigneeType = ROLE, IsActive = true).
3. **Workspace/tenant:** From Workflow or WorkflowType get WorkspaceId (and TenantId if stored).
4. **User’s roles:** Call `GetUserRoleNamesForWorkspaceAsync(userId, workspaceId, tenantId)` (or equivalent) to get the set of role names/codes for the user in that workspace.
5. **Check:** There must be at least one assignee where:
   - `AssigneeType == "ROLE"` and `AssigneeValue` is in the user’s role set, and  
   - For Approve: `CanApprove`; for Reject: `CanReject`.
6. **Claiming (if enabled):** If WorkflowAssignment is used, also require that the workflow is either not claimed or claimed by the current user (ClaimedBy = userId or equivalent).

If any check fails → **403 Forbidden**.

---

## 7. Where to Host the Workflow (Same API vs New Service)

- **Same API (recommended for simplicity):**
  - Add workflow entities and DbSet(s) to **IamDbContext** (or a dedicated **WorkflowDbContext** in the same solution that references the same DB).
  - Add workflow controllers and application services in the same API.
  - Reuse ICurrentUserService, existing auth middleware, and the new “user roles for workspace” method. No extra network hop for authorization.

- **Separate workflow service:**
  - New DB or same DB; if same DB, workflow service can read WorkspaceRole / WorkspaceMembersRole / WorkspaceMember (read-only).
  - Requires an internal API or shared library for “user roles for workspace” and consistent user identity (Guid). Tokens should include at least `sub` (userId) and ideally workspace_id / tenant_id so the workflow service can scope roles.

---

## 8. Database and Migrations

- **Same database (MEMS_IAM):**
  - Add the new workflow tables (WorkflowTypes, WorkflowStages, WorkflowStageAssignees, Workflows, WorkflowActivities, optional WorkflowAssignments).
  - Add `WorkflowStages.ViewDetailUrl` (nullable, max length 500) for stage-based UI detail navigation.
  - Do **not** add Role or UserRole tables; workflow references roles by name/code stored in WorkflowStageAssignee and resolved via existing WorkspaceRole/WorkspaceMembersRole.
  - Use **Guid** for CreatedBy, ClaimedBy (and any other user references) to match IAM.

- **Separate database:**
  - Only workflow tables live there. No FK to WorkspaceRole/WorkspaceMember; resolve roles via IAM API or shared library. Store WorkspaceId (and TenantId) on Workflow or WorkflowType so the workflow service knows which workspace/tenant to ask IAM about.

---

## 9. Notifications

The design suggests notifying “users belonging to the stage’s assigned roles”. With IAM:

1. For a given **WorkflowStage**, get **WorkflowStageAssignees** with AssigneeType = ROLE and AssigneeValue = role name/code.
2. For each such role, find **WorkspaceRole** by RoleCode (or RoleName) and **WorkspaceId** (from the workflow context).
3. From **WorkspaceMembersRole** for that WorkspaceRoleId, get **WorkspaceMemberId**s, then **WorkspaceMember** → **UserId**.
4. Resolve UserId to email or in-app identity and send the notification (email, in-app, or via queue).

Your existing **NotificationServiceBaseUrl** and patterns can be reused; the only IAM integration is “role → users in workspace” as above.

---

## 9.1 Stage Definition Routes (Current API)

Workflow stage create/update is currently exposed in two route shapes (both workspace-scoped and valid):

- Nested under workflow type:
  - `POST /api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages`
  - `PUT /api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages/{workflowStageId}`
- Top-level stage routes:
  - `POST /api/workspaces/{workspaceId}/workflows/workflow-stages`
  - `PUT /api/workspaces/{workspaceId}/workflows/workflow-stages/{workflowStageId}`

For all stage create/update endpoints, `ViewDetailUrl` is part of the payload and persists on `WorkflowStage`.

---

## 10. Checklist for Implementation

- [ ] Decide workflow scope: **WorkspaceId** (and TenantId) on WorkflowType or Workflow.
- [ ] Add **GetUserRoleNamesForWorkspaceAsync** (or equivalent) and use it for workflow stage authorization.
- [ ] Add new entities/tables: WorkflowType, WorkflowStage, WorkflowStageAssignee, Workflow, WorkflowActivity, (optional) WorkflowAssignment.
- [ ] Ensure `WorkflowStage.ViewDetailUrl` is supported in create/update models and persisted on stages.
- [ ] Keep both stage route shapes active if backward compatibility is required (nested and top-level workspace-scoped routes).
- [ ] Use **AssigneeValue** = RoleCode (or RoleName) from **WorkspaceRole**; ensure workflow assignees are created with existing workspace role codes/names.
- [ ] Use **Guid** for CreatedBy, ClaimedBy (and any user FKs) to align with IAM.
- [ ] Implement approve/reject/return with WorkflowActivity audit and status/DateCompleted updates.
- [ ] (Optional) Implement claiming and enforce ClaimedBy in authorization.
- [ ] Wire notifications: stage assignees → role → WorkspaceMembersRole → WorkspaceMember.UserId → notify.
- [ ] Reuse IAM auth (Bearer token, ICurrentUserService) and optionally add resource-based policy for “workflow:approve” / “workflow:reject” if you want to centralize in IAM.

---

## 11. Summary

- **Role** = **WorkspaceRole** (reuse; use RoleName/RoleCode in WorkflowStageAssignee).
- **UserRole** = **WorkspaceMember** + **WorkspaceMembersRole** + **WorkspaceRole** (reuse; resolve “user’s roles” per workspace).
- **New pieces:** WorkflowType, WorkflowStage, WorkflowStageAssignee, Workflow, WorkflowActivity, optional WorkflowAssignment.
- **UI detail URL location:** `ViewDetailUrl` is stage-level (`WorkflowStage.ViewDetailUrl`) and can be resolved from the workflow’s current stage.
- **Authorization:** Scope by WorkspaceId (and TenantId); get user’s role names for that workspace from IAM; allow action only if the current stage has an assignee (ROLE) whose AssigneeValue is in that set and CanApprove/CanReject matches.
- **Identity and audit:** Use Guid for user references and same CreatedBy/DateCreated semantics as IAM BaseEntity.

This keeps a single source of truth for roles and user–role assignments in IAM while adding a minimal, role-based workflow layer on top.
