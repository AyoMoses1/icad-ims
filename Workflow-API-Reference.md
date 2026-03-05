# Workflow API Reference – MEMS.IAM

This document describes all **workflow engine endpoints** in MEMS.IAM: URLs, request/response shapes, and short descriptions. All endpoints are **workspace-scoped** and use the same `ApiResponse<T>` wrapper.

---

## Base URL and context

- **Base path:** `api/workspaces/{workspaceId}/workflows`
- **Path parameter:** `workspaceId` (GUID) – required on every request; all workflow types and instances belong to this workspace.
- **Authentication:** Bearer token in `Authorization` header (same as rest of IAM).
- **Response wrapper:** Every endpoint returns `ApiResponse<T>` with `success`, `data`, `message`, `code`, and optionally `error`.

**Example base URL:**
```
GET https://localhost:49933/api/workspaces/{workspaceId}/workflows/workflow-types
```

---

## Common response wrapper

All endpoints return JSON in this shape:

```json
{
  "apiVersion": "v1",
  "success": true,
  "code": "00",
  "message": "Successful",
  "requestId": null,
  "data": { ... },
  "error": null
}
```

- **success:** `true` when the operation succeeded.
- **data:** The result (single object or paged object with `items`, `totalCount`, `pageNumber`, `pageSize`).
- **message / code / error:** Populated when `success` is `false` (e.g. validation, not found, unauthorized). Unauthorized responses may return **403 Forbidden**.

---

## 1. Workflow types

### 1.1 Get workflow types (list)

**GET**  
`/api/workspaces/{workspaceId}/workflows/workflow-types`

**Description:** Returns a paginated list of workflow types for the workspace. Used to show available workflow definitions (e.g. “Registration Approval”, “Document Review”).

**Path parameters**

| Name          | Type | Required | Description        |
|---------------|------|----------|--------------------|
| `workspaceId` | GUID | Yes      | Workspace scope    |

**Query parameters**

| Name         | Type    | Required | Default | Description                    |
|--------------|---------|----------|---------|--------------------------------|
| `PageNumber` | integer | No       | 1       | Page number (1-based)           |
| `PageSize`   | integer | No       | 20      | Items per page                 |
| `IsActive`   | boolean | No       | -       | Filter by active/inactive only |

**Response:** `ApiResponse<PagedResultDto<WorkflowTypeDto>>`

**Success response (data):**
```json
{
  "items": [
    {
      "workflowTypeId": "guid",
      "workspaceId": "guid",
      "name": "Registration Approval",
      "description": "Approval workflow for registrations",
      "updateUrl": null,
      "viewDetailUrl": "/registrations/{ReferenceId}",
      "isActive": true,
      "stageCount": 3,
      "dateCreated": "2025-02-23T12:00:00Z",
      "createdBy": "guid"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}
```

---

### 1.2 Get workflow type by id

**GET**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}`

**Description:** Returns a single workflow type with its stages and assignees. Used when editing a workflow definition or viewing full setup.

**Path parameters**

| Name             | Type | Required | Description        |
|------------------|------|----------|--------------------|
| `workspaceId`    | GUID | Yes      | Workspace scope    |
| `workflowTypeId` | GUID | Yes      | Workflow type id   |

**Response:** `ApiResponse<WorkflowTypeDetailDto>`

**Success response (data):**
```json
{
  "workflowTypeId": "guid",
  "workspaceId": "guid",
  "name": "Registration Approval",
  "description": "Approval workflow for registrations",
  "updateUrl": null,
  "viewDetailUrl": "/registrations/{ReferenceId}",
  "isActive": true,
  "stageCount": 2,
  "dateCreated": "2025-02-23T12:00:00Z",
  "createdBy": "guid",
  "stages": [
    {
      "workflowStageId": "guid",
      "workflowTypeId": "guid",
      "stageOrder": 1,
      "stageName": "Initial Review",
      "description": "First stage",
      "isActive": true,
      "assignees": [
        {
          "workflowStageAssigneeId": "guid",
          "workflowStageId": "guid",
          "assigneeType": "Role",
          "assigneeValue": "Approver",
          "canApprove": true,
          "canReject": true,
          "isActive": true
        }
      ]
    }
  ]
}
```

---

### 1.3 Create workflow type

**POST**  
`/api/workspaces/{workspaceId}/workflows/workflow-types`

**Description:** Creates a new workflow type in the workspace. Name must be unique within the workspace.

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |

**Request body:** `CreateWorkflowTypeRequestDto`

| Field           | Type   | Required | Description                                      |
|-----------------|--------|----------|--------------------------------------------------|
| `name`          | string | Yes      | Display name (max 255)                           |
| `description`   | string | No       | Optional description (max 1000)                  |
| `updateUrl`     | string | No       | Optional URL for external update actions (max 500)|
| `viewDetailUrl` | string | No       | Optional UI link template, e.g. `/registrations/{ReferenceId}` (max 500) |

**Example request:**
```json
{
  "name": "Registration Approval",
  "description": "Approval workflow for registrations",
  "updateUrl": null,
  "viewDetailUrl": "/registrations/{ReferenceId}"
}
```

**Response:** `ApiResponse<WorkflowTypeDto>` (created type, including `workflowTypeId`).

---

### 1.4 Update workflow type

**PUT**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}`

**Description:** Updates an existing workflow type. All body fields are optional; only provided fields are updated.

**Path parameters**

| Name             | Type | Required | Description      |
|------------------|------|----------|------------------|
| `workspaceId`    | GUID | Yes      | Workspace scope  |
| `workflowTypeId` | GUID | Yes      | Workflow type id |

**Request body:** `UpdateWorkflowTypeRequestDto`

| Field           | Type    | Required | Description                    |
|-----------------|---------|----------|--------------------------------|
| `name`          | string  | No       | Display name (max 255)         |
| `description`   | string  | No       | Description (max 1000)        |
| `updateUrl`     | string  | No       | Update URL (max 500)          |
| `viewDetailUrl` | string  | No       | View detail URL template      |
| `isActive`      | boolean | No       | Whether the type is active     |

**Example request:**
```json
{
  "name": "Registration Approval (Updated)",
  "description": "Updated description",
  "isActive": true
}
```

**Response:** `ApiResponse<WorkflowTypeDto>`

---

### 1.5 Delete workflow type

**DELETE**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}`

**Description:** Soft-deletes a workflow type (sets `IsDeleted`). The type will no longer appear in lists or be usable for new workflows.

**Path parameters**

| Name             | Type | Required | Description      |
|------------------|------|----------|------------------|
| `workspaceId`    | GUID | Yes      | Workspace scope  |
| `workflowTypeId` | GUID | Yes      | Workflow type id |

**Response:** `ApiResponse<bool>` (`data: true` on success).

---

## 2. Stages and assignees

### 2.1 Add stage

**POST**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages`

**Description:** Adds a new stage to a workflow type. Stages define the steps (e.g. “Initial Review”, “Final Approval”). Order is used to determine flow (1 = first, then 2, 3, …).

**Path parameters**

| Name             | Type | Required | Description      |
|------------------|------|----------|------------------|
| `workspaceId`    | GUID | Yes      | Workspace scope  |
| `workflowTypeId` | GUID | Yes      | Workflow type id |

**Request body:** `CreateWorkflowStageRequestDto`

| Field         | Type   | Required | Description           |
|---------------|--------|----------|-----------------------|
| `stageOrder`  | int    | Yes      | Order (1, 2, 3, …)    |
| `stageName`   | string | Yes      | Display name (max 255)|
| `description` | string | No       | Optional (max 1000)   |

**Example request:**
```json
{
  "stageOrder": 1,
  "stageName": "Initial Review",
  "description": "First approval stage"
}
```

**Response:** `ApiResponse<WorkflowStageDto>` (created stage including `workflowStageId`).

---

### 2.2 Update stage

**PUT**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages/{workflowStageId}`

**Description:** Updates a stage’s name, description, or active flag.

**Path parameters**

| Name              | Type | Required | Description      |
|-------------------|------|----------|------------------|
| `workspaceId`     | GUID | Yes      | Workspace scope  |
| `workflowTypeId`  | GUID | Yes      | Workflow type id |
| `workflowStageId` | GUID | Yes      | Stage id         |

**Request body:** `UpdateWorkflowStageRequestDto`

| Field         | Type    | Required | Description        |
|---------------|---------|----------|--------------------|
| `stageName`   | string  | No       | Display name       |
| `description` | string  | No       | Description        |
| `isActive`    | boolean | No       | Active/inactive    |

**Response:** `ApiResponse<WorkflowStageDto>`

---

### 2.3 Add stage assignee

**POST**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages/{workflowStageId}/assignees`

**Description:** Adds a role or user as an assignee for a stage. Only users with a matching role (or the specified user) can approve/reject at that stage.

**Path parameters**

| Name              | Type | Required | Description      |
|-------------------|------|----------|------------------|
| `workspaceId`     | GUID | Yes      | Workspace scope  |
| `workflowTypeId`  | GUID | Yes      | Workflow type id |
| `workflowStageId` | GUID | Yes      | Stage id         |

**Request body:** `AddWorkflowStageAssigneeRequestDto`

| Field          | Type   | Required | Description                                                                 |
|----------------|--------|----------|-----------------------------------------------------------------------------|
| `assigneeType` | string | Yes      | `"Role"` or `"User"`                                                        |
| `assigneeValue`| string | Yes      | For Role: workspace role code/name; for User: user GUID as string (max 255)|
| `canApprove`   | bool   | No       | Can approve at this stage (default false)                                   |
| `canReject`    | bool   | No       | Can reject at this stage (default false)                                    |

**Example request:**
```json
{
  "assigneeType": "Role",
  "assigneeValue": "Approver",
  "canApprove": true,
  "canReject": true
}
```

**Response:** `ApiResponse<WorkflowStageAssigneeDto>` (created assignee including `workflowStageAssigneeId`).

---

### 2.4 Remove stage assignee

**DELETE**  
`/api/workspaces/{workspaceId}/workflows/workflow-types/{workflowTypeId}/stages/{workflowStageId}/assignees/{workflowStageAssigneeId}`

**Description:** Removes an assignee from a stage. That role/user will no longer be able to act at this stage.

**Path parameters**

| Name                     | Type | Required | Description        |
|--------------------------|------|----------|--------------------|
| `workspaceId`            | GUID | Yes      | Workspace scope    |
| `workflowTypeId`         | GUID | Yes      | Workflow type id   |
| `workflowStageId`        | GUID | Yes      | Stage id           |
| `workflowStageAssigneeId`| GUID | Yes      | Assignee id        |

**Response:** `ApiResponse<bool>` (`data: true` on success).

---

## 3. Workflow instances (submit and list)

### 3.1 Submit workflow

**POST**  
`/api/workspaces/{workspaceId}/workflows`

**Description:** Creates a new workflow instance (e.g. “this registration needs approval”). The workflow starts at the first stage (lowest `stageOrder`) of the given workflow type. Current user is set as creator.

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |

**Request body:** `SubmitWorkflowRequestDto`

| Field             | Type   | Required | Description                                      |
|-------------------|--------|----------|--------------------------------------------------|
| `workflowTypeId`  | GUID   | Yes      | Workflow type to use                             |
| `referenceType`  | string | Yes      | Business entity type (e.g. "Registration") (max 100) |
| `referenceId`    | string | Yes      | Business record id (e.g. "REG-001") (max 100)    |
| `description`    | string | No       | Optional description (max 1000)                  |

**Example request:**
```json
{
  "workflowTypeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "referenceType": "Registration",
  "referenceId": "REG-001",
  "description": "New registration submission"
}
```

**Response:** `ApiResponse<WorkflowDto>` (created workflow including `workflowId`, `currentWorkflowStageId`, `status: "Pending"`).

**Success response (data) example:**
```json
{
  "workflowId": "guid",
  "workflowTypeId": "guid",
  "workflowTypeName": "Registration Approval",
  "workspaceId": "guid",
  "referenceType": "Registration",
  "referenceId": "REG-001",
  "description": "New registration submission",
  "currentWorkflowStageId": "guid",
  "currentStageName": "Initial Review",
  "status": "Pending",
  "dateCreated": "2025-02-23T12:00:00Z",
  "createdBy": "guid",
  "dateCompleted": null
}
```

---

### 3.2 Get workflows (list)

**GET**  
`/api/workspaces/{workspaceId}/workflows`

**Description:** Returns a paginated list of all workflows in the workspace, with optional filters (type, status, reference, creator).

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |

**Query parameters**

| Name             | Type   | Required | Default | Description                              |
|------------------|--------|----------|---------|------------------------------------------|
| `PageNumber`     | int    | No       | 1       | Page number                              |
| `PageSize`       | int    | No       | 20      | Items per page                           |
| `WorkflowTypeId` | GUID   | No       | -       | Filter by workflow type                  |
| `Status`         | string | No       | -       | `Pending`, `Approved`, `Rejected`, `Cancelled` |
| `ReferenceType`  | string | No       | -       | Filter by reference type                |
| `ReferenceId`    | string | No       | -       | Filter by reference id                  |
| `CreatedBy`      | GUID   | No       | -       | Filter by creator user id               |

**Response:** `ApiResponse<PagedResultDto<WorkflowDto>>`  
**Data shape:** `{ "items": [ WorkflowDto, ... ], "totalCount": number, "pageNumber": number, "pageSize": number }`.

---

### 3.3 Get workflows assignable to me

**GET**  
`/api/workspaces/{workspaceId}/workflows/assignable-to-me`

**Description:** Returns workflows that the **current user** can act on: status is Pending and the current stage has at least one assignee (role or user) that matches the current user. Used for “My tasks” or “Pending for me” lists.

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |

**Query parameters:** Same as **Get workflows (list)** (`PageNumber`, `PageSize`, `WorkflowTypeId`, `Status`, `ReferenceType`, `ReferenceId`, `CreatedBy`).

**Response:** `ApiResponse<PagedResultDto<WorkflowDto>>` (same shape as list).

**Note:** Route must be registered **before** `GET .../workflows/{workflowId}` so `assignable-to-me` is not treated as a workflow id.

---

### 3.4 Get workflow by id

**GET**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}`

**Description:** Returns full details for one workflow: type info, current stage, assignees at current stage, resolved view detail URL, and recent activities.

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |
| `workflowId`  | GUID | Yes      | Workflow id     |

**Response:** `ApiResponse<WorkflowDetailDto>`

**Success response (data) example:**
```json
{
  "workflowId": "guid",
  "workflowTypeId": "guid",
  "workflowTypeName": "Registration Approval",
  "workspaceId": "guid",
  "referenceType": "Registration",
  "referenceId": "REG-001",
  "description": "New registration submission",
  "currentWorkflowStageId": "guid",
  "currentStageName": "Initial Review",
  "status": "Pending",
  "dateCreated": "2025-02-23T12:00:00Z",
  "createdBy": "guid",
  "dateCompleted": null,
  "currentStageAssignees": [
    {
      "workflowStageAssigneeId": "guid",
      "workflowStageId": "guid",
      "assigneeType": "Role",
      "assigneeValue": "Approver",
      "canApprove": true,
      "canReject": true,
      "isActive": true
    }
  ],
  "viewDetailUrl": "/registrations/REG-001",
  "recentActivities": [
    {
      "workflowActivityId": "guid",
      "workflowId": "guid",
      "action": "Submitted",
      "remark": null,
      "createdBy": "guid",
      "createdByName": null,
      "dateCreated": "2025-02-23T12:00:00Z",
      "oldWorkflowStageId": null,
      "newWorkflowStageId": "guid",
      "oldStageName": null,
      "newStageName": "Initial Review"
    }
  ]
}
```

---

## 4. Workflow actions (approve, reject, return, cancel, claim, unclaim)

All action endpoints require the current user to have the right **workspace role** (or be the assigned user) for the current stage, as configured in stage assignees. Unauthorized calls return **403** with the standard response wrapper.

### 4.1 Approve

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/approve`

**Description:** Approves the current stage. If there is a next stage, the workflow moves to it; if this is the last stage, the workflow is marked **Approved** and completed. Records an activity.

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** `ApproveWorkflowRequestDto`

| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| `remark` | string | No       | Optional comment (max 2000) |

**Example:** `{}` or `{ "remark": "Approved after review" }`

**Response:** `ApiResponse<WorkflowDto>` (updated workflow).

---

### 4.2 Reject

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/reject`

**Description:** Rejects the workflow. Status becomes **Rejected** and the workflow is completed (no further actions). Records an activity.

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** `RejectWorkflowRequestDto`

| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| `remark` | string | No       | Optional comment (max 2000) |

**Example:** `{ "remark": "Rejected: incomplete documents" }`

**Response:** `ApiResponse<WorkflowDto>`

---

### 4.3 Return

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/return`

**Description:** Returns the workflow to a **previous** stage. The target stage must belong to the same workflow type and have a lower `stageOrder` than the current stage. Records an activity.

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** `ReturnWorkflowRequestDto`

| Field                    | Type | Required | Description                          |
|--------------------------|------|----------|--------------------------------------|
| `targetWorkflowStageId` | GUID | Yes      | Stage to return to (earlier stage)   |
| `remark`                 | string | No     | Optional comment (max 2000)           |

**Example:**
```json
{
  "targetWorkflowStageId": "guid-of-earlier-stage",
  "remark": "Returned for corrections"
}
```

**Response:** `ApiResponse<WorkflowDto>`

---

### 4.4 Cancel

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/cancel`

**Description:** Cancels a **Pending** workflow. Status becomes **Cancelled** and the workflow is completed. Records an activity.

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** `CancelWorkflowRequestDto`

| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| `remark` | string | No       | Optional comment (max 2000) |

**Response:** `ApiResponse<WorkflowDto>`

---

### 4.5 Claim

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/claim`

**Description:** Claims the workflow for the current user at the current stage. The user must have a role (or be the user) assigned to the current stage. If the stage is already claimed by another user, the API returns an error; if already claimed by the current user, it returns success (idempotent).

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** None

**Response:** `ApiResponse<WorkflowDto>`

---

### 4.6 Unclaim

**POST**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/unclaim`

**Description:** Releases the claim on the workflow. Only the user who claimed it can unclaim. Records an activity.

**Path parameters:** `workspaceId`, `workflowId`

**Request body:** None

**Response:** `ApiResponse<WorkflowDto>`

---

## 5. Activities (audit trail)

### 5.1 Get workflow activities

**GET**  
`/api/workspaces/{workspaceId}/workflows/{workflowId}/activities`

**Description:** Returns the audit trail of actions for a workflow (submitted, claimed, approved, rejected, returned, cancelled, etc.), ordered by date (newest first), with pagination.

**Path parameters**

| Name          | Type | Required | Description     |
|---------------|------|----------|-----------------|
| `workspaceId` | GUID | Yes      | Workspace scope |
| `workflowId`  | GUID | Yes      | Workflow id     |

**Query parameters**

| Name         | Type    | Required | Default | Description      |
|--------------|---------|----------|---------|------------------|
| `pageNumber` | integer | No       | 1       | Page number      |
| `pageSize`   | integer | No       | 20      | Items per page   |

**Response:** `ApiResponse<PagedResultDto<WorkflowActivityDto>>`

**Success response (data) example:**
```json
{
  "items": [
    {
      "workflowActivityId": "guid",
      "workflowId": "guid",
      "action": "Approved",
      "remark": "Approved after review",
      "createdBy": "guid",
      "createdByName": null,
      "dateCreated": "2025-02-23T14:00:00Z",
      "oldWorkflowStageId": "guid",
      "newWorkflowStageId": "guid",
      "oldStageName": "Initial Review",
      "newStageName": "Final Approval"
    }
  ],
  "totalCount": 5,
  "pageNumber": 1,
  "pageSize": 20
}
```

**Activity `action` values:** `Submitted`, `Claimed`, `Unclaimed`, `Approved`, `Rejected`, `Returned`, `Cancelled` (and any others defined in the workflow engine).

---

## 6. Quick reference table

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `.../workflow-types` | List workflow types |
| GET    | `.../workflow-types/{workflowTypeId}` | Get workflow type (with stages & assignees) |
| POST   | `.../workflow-types` | Create workflow type |
| PUT    | `.../workflow-types/{workflowTypeId}` | Update workflow type |
| DELETE | `.../workflow-types/{workflowTypeId}` | Delete workflow type |
| POST   | `.../workflow-types/{workflowTypeId}/stages` | Add stage |
| PUT    | `.../workflow-types/{workflowTypeId}/stages/{workflowStageId}` | Update stage |
| POST   | `.../workflow-types/.../stages/{workflowStageId}/assignees` | Add stage assignee |
| DELETE | `.../workflow-types/.../stages/{workflowStageId}/assignees/{workflowStageAssigneeId}` | Remove stage assignee |
| POST   | `.../workflows` | Submit workflow |
| GET    | `.../workflows` | List workflows |
| GET    | `.../workflows/assignable-to-me` | List workflows assignable to current user |
| GET    | `.../workflows/{workflowId}` | Get workflow by id |
| POST   | `.../workflows/{workflowId}/approve` | Approve |
| POST   | `.../workflows/{workflowId}/reject` | Reject |
| POST   | `.../workflows/{workflowId}/return` | Return to earlier stage |
| POST   | `.../workflows/{workflowId}/cancel` | Cancel |
| POST   | `.../workflows/{workflowId}/claim` | Claim |
| POST   | `.../workflows/{workflowId}/unclaim` | Unclaim |
| GET    | `.../workflows/{workflowId}/activities` | Get workflow activities |

All URLs are relative to: `api/workspaces/{workspaceId}/workflows`.
