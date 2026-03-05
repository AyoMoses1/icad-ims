# Workflow Testing Guide

This guide walks you through testing the Workflows feature (workflow types, submit workflow, view detail, and actions) using the UI and optional API calls for stages/assignees.

---

## Prerequisites

1. **Logged in** to the app with a user that has access to at least one workspace.
2. **Workspace** – You need a valid `workspaceId` (GUID). You can get it from:
   - The workspace dropdown on the Workflows page.
   - Browser dev tools → Network tab when loading `/workflows` (look at the request URL or response).
   - Your backend/admin if you have a list of workspaces.
3. **Backend** – `NEXT_PUBLIC_API_BASE_URL` must point to your MEMS.IAM API that implements the workflow endpoints (see `Workflow-API-Reference.md`).

---

## Test Data (copy-paste)

Use this data in the UI or API requests.

### Workflow types (create in UI)

| Field | Value |
|-------|--------|
| **Name** | Registration Approval |
| **Description** | Approval workflow for new registration submissions. |
| **Update URL (optional)** | e.g. `https://service/module/update/{ReferenceId}` |
| **View detail URL template** | `/registrations/{ReferenceId}` |

Second type (optional):

| Field | Value |
|-------|--------|
| **Name** | Document Review |
| **Description** | Review and approve document uploads. |
| **View detail URL template** | `/documents/{ReferenceId}` |

### Submitting workflows (use in “Submit workflow” dialog)

| Workflow type | Reference type | Reference ID | Description |
|---------------|----------------|--------------|-------------|
| Registration Approval | Registration | REG-001 | New vessel registration submission |
| Registration Approval | Registration | REG-002 | Second registration for testing |
| Document Review | Document | DOC-2025-001 | Annual compliance document |

### Remarks (for Approve / Reject / Return / Cancel)

- Approve: `Approved after review.`
- Reject: `Rejected: incomplete supporting documents.`
- Return: `Returned for corrections.`
- Cancel: `Cancelled by submitter.`

---

## Testing Flow

### 1. Open Workflows page

1. Go to **Workflows** in the sidebar (or `/workflows`).
2. Select a **workspace** in the header dropdown.
3. You should see three tabs: **Workflow types**, **All workflows**, **My tasks**.

---

### 2. Create a workflow type (UI)

1. Stay on the **Workflow types** tab.
2. Click **Create type**.
3. Fill in:
   - **Name:** `Registration Approval`
   - **Description:** `Approval workflow for new registration submissions.`
   - **Update URL (optional):** e.g. `https://service/module/update/{ReferenceId}` if your backend uses it.
   - **View detail URL template:** `/registrations/{ReferenceId}`
4. Click **Create**.
5. **Expected:** Toast “Workflow type created”, dialog closes, the new type appears in the table with **Stages: 0**.

---

### 3. Add stages and assignees (UI)

1. On the **Workflow types** tab, click **Edit** on the type you created (e.g. “Registration Approval”).
2. In the **Edit workflow type** dialog:
   - Optionally change **Name**, **Description**, or **View detail URL template**, then click **Save** when done with basics.
   - In the **Stages & assignees** section, click **Add stage**.
3. **Add stage 1 – Initial Review**
   - **Order:** 1  
   - **Name:** `Initial Review`  
   - **Description:** `First approval stage` (optional)  
   - Click **Add stage**. The new stage appears in the list.
4. **Add assignee to stage 1**
   - Under “Stage 1: Initial Review”, click **Add assignee**.
   - **Role:** Select a role from the dropdown (roles come from **Admin Roles** for this workspace; the value sent is the workspace role ID).
   - Check **Can approve** and **Can reject** as needed.
   - Click **Add**. Workflows at this stage will then appear in **My tasks** for users with that role.
5. **(Optional) Add stage 2 – Final Approval**
   - Click **Add stage** again.  
   - **Order:** 2, **Name:** `Final Approval`, **Description:** `Final sign-off`.  
   - Click **Add stage**, then add an assignee to this stage the same way if you want two-step approval.
6. Click **Save** to persist name/URL changes if you edited them, then close the dialog. The table will show the updated **Stages** count.

**Alternative (API):** You can still add stages and assignees via the API (Postman, curl). See the API section in `Workflow-API-Reference.md` for `POST .../stages` and `POST .../stages/{workflowStageId}/assignees`.

---

### 4. Submit a workflow (UI)

1. Go to the **All workflows** tab.
2. Click **Submit workflow**.
3. Fill in:
   - **Workflow type:** `Registration Approval`
   - **Reference type:** `Registration`
   - **Reference ID:** `REG-001`
   - **Description:** `New vessel registration submission`
4. Click **Submit**.
5. **Expected:** Toast “Workflow submitted”, dialog closes, a new row appears in **All workflows** with Status **Pending** and Current stage (e.g. “Initial Review” if you added stages, or empty).

Submit a second one with Reference ID `REG-002` if you want multiple items to filter/view.

---

### 5. View workflow list and filters (UI)

1. On **All workflows**:
   - **Status:** All → then try **Pending** only. List should filter.
   - **Workflow type:** All types → then select “Registration Approval”. List should filter.
2. **Expected:** Table shows only workflows matching the selected filters; pagination works if you have more than one page.

---

### 6. Open workflow detail (UI)

1. In **All workflows**, click **View** on the row for `REG-001`.
2. **Expected:** A dialog opens showing:
   - Type, Reference (type + ID), Current stage, Status (e.g. Pending), View URL.
   - If status is **Pending**: remark textarea and action buttons (Approve, Reject, Cancel, Claim, Unclaim; Return if there are previous stages).
   - **Recent activities** list (e.g. “Submitted” with date).

---

### 7. Test actions (UI) – Pending workflow

Use the same workflow detail dialog.

**7a. Claim (optional)**  
- Click **Claim**.  
- **Expected:** Success toast; activity “Claimed” may appear; list refreshes.

**7b. Approve**  
- Enter remark: `Approved after review.`  
- Click **Approve**.  
- **Expected:** Success toast; status becomes **Approved** (or moves to next stage if you have stage 2); “Approved” in activities. Dialog can stay open with updated data.

**7c. Alternative: Reject**  
- Open another **Pending** workflow (e.g. REG-002), click **View**.  
- Enter remark: `Rejected: incomplete supporting documents.`  
- Click **Reject**.  
- **Expected:** Status becomes **Rejected**; activity “Rejected” with remark.

**7d. Alternative: Cancel**  
- Submit a third workflow (e.g. REG-003), open detail.  
- Click **Cancel** (optionally with remark).  
- **Expected:** Status becomes **Cancelled**.

**7e. Return (only if you have 2+ stages)**  
- Use a workflow that is at stage 2.  
- In detail, choose **Return to stage** = “Initial Review”, add remark, click **Return**.  
- **Expected:** Workflow goes back to stage 1; activity “Returned” with old/new stage names.

---

### 8. My tasks (if you added assignees)

1. Ensure your user has the role you used in step 3b (e.g. “Approver”) in the selected workspace.
2. Go to the **My tasks** tab.
3. **Expected:** Only **Pending** workflows where the current stage has you as assignee (by role or user).  
4. Click **View** on one and use **Approve** / **Reject** as above; it should disappear from **My tasks** after completion.

---

### 9. Edit / delete workflow type (UI)

1. **Workflow types** tab → **Edit** on “Registration Approval”.
2. Change **Name** or **Description**, click **Save**.  
   **Expected:** Toast “Workflow type updated”, table refreshes.
3. **Delete:** Use **Delete** from the row menu, confirm.  
   **Expected:** Type is soft-deleted and no longer appears in the list (and cannot be chosen when submitting).  
   Use a type you are not using for other tests if you need to keep “Registration Approval” for submissions.

---

## Quick checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open /workflows, select workspace | Tabs: Workflow types, All workflows, My tasks |
| 2 | Create type “Registration Approval” | Type in table, Stages: 0 |
| 3 | Edit type → Add stage “Initial Review” → Add assignee (Role: Approver) | Type shows 1 stage; can submit workflows; My tasks can show items |
| 4 | Submit workflow REG-001 | New row in All workflows, Pending |
| 5 | Filter by Status = Pending, Type = Registration Approval | List filtered |
| 6 | View REG-001 | Detail dialog with info + actions + activities |
| 7 | Approve with remark | Status Approved, activity recorded |
| 8 | (If assignee set) My tasks | Pending items for current user |
| 9 | Edit / Delete type | Updated or removed from list |

---

## Troubleshooting

- **403 on workflow endpoints** – User may lack permission or workspace access; check token and workspace membership.
- **“My tasks” empty** – Edit the workflow type, add at least one stage and one assignee (Role or User) for that stage; ensure your user has that role in the workspace.
- **Return button missing** – Workflow has only one stage, or you’re at stage 1; add a second stage and move workflow to it (e.g. approve at stage 1) to test Return.
- **Workflow type dropdown empty on Submit** – Create at least one workflow type and ensure it is **Active** (edit and check status if your API supports it).
