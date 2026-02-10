# MEMS Seafarer Frontend – Routes & Role Configuration for IMS

This document lists **all page routes** in `mems-seafarer-frontend` and how they map to IMS roles (Super Admin, Training Institution, Agent, Seafarer) so you can configure them as **resources** in the IMS project (Admin → Workspaces → [Workspace] → Resources, and Role-Resource permissions).

---

## 1. All Possible Routes (URLs) in mems-seafarer-frontend

Use these exact paths as the **URL** field when creating workspace resources in IMS. For dynamic segments (e.g. `[id]`), use the **base path** as the resource URL so one resource covers the whole section (e.g. `/seafarer/applications` covers `/seafarer/applications/[id]`).

### Auth (public – usually not restricted by role)

| #   | Route (URL)             | Description     |
| --- | ----------------------- | --------------- |
| 1   | `/auth/signin`          | Sign in         |
| 2   | `/auth/signup`          | Sign up         |
| 3   | `/auth/forgot-password` | Forgot password |
| 4   | `/auth/reset-password`  | Reset password  |
| 5   | `/auth/verify-email`    | Verify email    |

### Root & onboarding

| #   | Route (URL)                   | Description                     |
| --- | ----------------------------- | ------------------------------- |
| 6   | `/`                           | Dashboard home / role selection |
| 7   | `/onboarding`                 | Onboarding entry                |
| 8   | `/onboarding/seafarer`        | Seafarer onboarding             |
| 9   | `/onboarding/institution`     | Institution onboarding          |
| 10  | `/onboarding/comprehensive`   | Comprehensive onboarding        |
| 11  | `/onboarding/status/pending`  | Onboarding pending              |
| 12  | `/onboarding/status/rejected` | Onboarding rejected             |
| 13  | `/applications/apply`         | Apply for application (generic) |

### Seafarer

| #   | Route (URL)                            | Description                                                |
| --- | -------------------------------------- | ---------------------------------------------------------- |
| 14  | `/seafarer/dashboard`                  | Seafarer dashboard                                         |
| 15  | `/seafarer/overview`                   | Seafarer overview                                          |
| 16  | `/seafarer/add`                        | Add/onboard seafarer                                       |
| 17  | `/seafarer/registry`                   | Seafarer registry                                          |
| 18  | `/seafarer/applications`               | My applications list                                       |
| 19  | `/seafarer/applications/history`       | Application history                                        |
| 20  | `/seafarer/applications/[id]`          | Application detail (use resource `/seafarer/applications`) |
| 21  | `/seafarer/applications/[id]/review`   | Application review (use resource `/seafarer/applications`) |
| 22  | `/seafarer/services`                   | Browse services                                            |
| 23  | `/seafarer/services/[serviceId]/apply` | Apply for service (use resource `/seafarer/services`)      |
| 24  | `/seafarer/miis`                       | MIIS list                                                  |
| 25  | `/seafarer/miis/[id]`                  | MIIS detail (use resource `/seafarer/miis`)                |
| 26  | `/seafarer/profile/contact`            | Profile contact details                                    |
| 27  | `/seafarer/profile/education`          | Profile education                                          |
| 28  | `/seafarer/profile/[id]`               | Profile by id (use resource `/seafarer/profile`)           |

### Agent

| #   | Route (URL)        | Description     |
| --- | ------------------ | --------------- |
| 29  | `/agent/dashboard` | Agent dashboard |

### Institution (training institution)

| #   | Route (URL)                            | Description              |
| --- | -------------------------------------- | ------------------------ |
| 30  | `/institution/dashboard`               | Institution dashboard    |
| 31  | `/institution/training-results`        | Training results list    |
| 32  | `/institution/training-results/upload` | Upload training results  |
| 33  | `/institution/inspections`             | Institution inspections  |
| 34  | `/institution/deficiencies`            | Institution deficiencies |

### Admin (Super Admin / Admin)

| #   | Route (URL)                        | Description                                                 |
| --- | ---------------------------------- | ----------------------------------------------------------- |
| 35  | `/admin/dashboard`                 | Admin dashboard                                             |
| 36  | `/admin/onboarding`                | All onboarding                                              |
| 37  | `/admin/onboarding/[id]`           | Onboarding detail (use resource `/admin/onboarding`)        |
| 38  | `/admin/applications/review`       | Pending applications review                                 |
| 39  | `/admin/accreditations`            | Accreditations dashboard                                    |
| 40  | `/admin/accreditations/review`     | Review accreditations                                       |
| 41  | `/admin/accreditations/[id]`       | Accreditation detail (use resource `/admin/accreditations`) |
| 42  | `/admin/inspections`               | Inspection schedules                                        |
| 43  | `/admin/inspections/reports`       | Inspection reports                                          |
| 44  | `/admin/inspections/deficiencies`  | Deficiency reports                                          |
| 45  | `/admin/audits`                    | Follow-up audits                                            |
| 46  | `/admin/services`                  | Services management                                         |
| 47  | `/admin/services/create`           | Create service (use resource `/admin/services`)             |
| 48  | `/admin/services/[serviceId]`      | Service detail (use resource `/admin/services`)             |
| 49  | `/admin/services/[serviceId]/edit` | Edit service (use resource `/admin/services`)               |
| 50  | `/admin/requirement-lists`         | Requirement lists                                           |
| 51  | `/admin/statistics`                | Statistics                                                  |

### Shared / common

| #   | Route (URL)                    | Description                                       |
| --- | ------------------------------ | ------------------------------------------------- |
| 52  | `/profile-documents`           | Profile & documents                               |
| 53  | `/documents`                   | Documents                                         |
| 54  | `/institutions`                | Institutions list                                 |
| 55  | `/medical-institutes`          | Medical institutes                                |
| 56  | `/invoices/my-invoices`        | My invoices                                       |
| 57  | `/invoices/management`         | Invoice management (admin/finance)                |
| 58  | `/invoices/payments`           | Payment history                                   |
| 59  | `/accreditations`              | My accreditations                                 |
| 60  | `/accreditations/apply`        | Apply for accreditation                           |
| 61  | `/accreditations/stcw`         | STCW standards                                    |
| 62  | `/certificates`                | Certificates list                                 |
| 63  | `/certificates/[id]`           | Certificate detail (use resource `/certificates`) |
| 64  | `/license-certification`       | License certification                             |
| 65  | `/license-certification/apply` | Apply license certification                       |
| 66  | `/medical/services`            | Medical services                                  |
| 67  | `/medical/appointments`        | Medical appointments                              |
| 68  | `/vessels`                     | Vessels                                           |
| 69  | `/ranks`                       | Ranks (admin)                                     |
| 70  | `/nationalities`               | Nationalities (admin)                             |
| 71  | `/onboarding-requirements`     | Onboarding requirements (admin)                   |
| 72  | `/training`                    | Training home                                     |
| 73  | `/training/programs`           | Training programs                                 |
| 74  | `/training/courses`            | Training courses                                  |
| 75  | `/training/cohorts`            | Training cohorts                                  |
| 76  | `/training/enroll`             | Enroll in training                                |
| 77  | `/training/enrollments`        | Training enrollments                              |
| 78  | `/staff/dashboard`             | Staff dashboard                                   |

---

## 2. Flat list of URLs for IMS resources (copy-paste)

Use this list when creating resources in IMS (one resource per URL, or group by parent as needed):

```
/auth/signin
/auth/signup
/auth/forgot-password
/auth/reset-password
/auth/verify-email
/
/onboarding
/onboarding/seafarer
/onboarding/institution
/onboarding/comprehensive
/onboarding/status/pending
/onboarding/status/rejected
/applications/apply
/seafarer/dashboard
/seafarer/overview
/seafarer/add
/seafarer/registry
/seafarer/applications
/seafarer/applications/history
/seafarer/services
/seafarer/miis
/seafarer/profile/contact
/seafarer/profile/education
/seafarer/profile
/agent/dashboard
/institution/dashboard
/institution/training-results
/institution/training-results/upload
/institution/inspections
/institution/deficiencies
/admin/dashboard
/admin/onboarding
/admin/applications/review
/admin/accreditations
/admin/accreditations/review
/admin/inspections
/admin/inspections/reports
/admin/inspections/deficiencies
/admin/audits
/admin/services
/admin/services/create
/admin/requirement-lists
/admin/statistics
/profile-documents
/documents
/institutions
/medical-institutes
/invoices/my-invoices
/invoices/management
/invoices/payments
/accreditations
/accreditations/apply
/accreditations/stcw
/certificates
/license-certification
/license-certification/apply
/medical/services
/medical/appointments
/vessels
/ranks
/nationalities
/onboarding-requirements
/training
/training/programs
/training/courses
/training/cohorts
/training/enroll
/training/enrollments
/staff/dashboard
```

---

## 3. Role-based route access (for configuring IMS role–resource permissions)

Assign the following **URLs (resources)** to each role in IMS. Super Admin gets all; other roles get the listed paths.

### Super Admin

- **All routes** (entire list in Section 2). Grant this role access to every resource you create for the MEMS Seafarer workspace.

### Seafarer

- `/`
- `/seafarer/dashboard`
- `/seafarer/overview`
- `/seafarer/applications`
- `/seafarer/applications/history`
- `/seafarer/services`
- `/seafarer/miis`
- `/seafarer/profile`
- `/seafarer/profile/contact`
- `/seafarer/profile/education`
- `/profile-documents`
- `/invoices/my-invoices`
- `/invoices/payments`
- `/certificates`
- `/license-certification`
- `/license-certification/apply`
- `/accreditations`
- `/accreditations/apply`
- `/accreditations/stcw`
- `/training`
- `/training/programs`
- `/training/courses`
- `/training/cohorts`
- `/training/enroll`
- `/training/enrollments`
- `/medical/services`
- `/medical/appointments`
- `/onboarding`
- `/onboarding/comprehensive`
- `/onboarding/status/pending`
- `/onboarding/status/rejected`
- `/applications/apply`

### Agent

- `/agent/dashboard`
- `/seafarer/add`
- `/seafarer/registry`
- `/seafarer/applications`
- `/seafarer/applications/history`
- `/seafarer/services`
- `/institutions`
- `/documents`
- `/accreditations`
- `/accreditations/apply`
- `/institution/inspections`
- `/institution/deficiencies`
- `/invoices/my-invoices`
- `/invoices/payments`

### Training Institution

- All **Agent** routes, plus:
- `/institution/dashboard`
- `/institution/training-results`
- `/institution/training-results/upload`
- `/institution/inspections`
- `/institution/deficiencies`
- `/accreditations/stcw`

(So: Agent set + institution-specific and STCW routes.)

---

## 4. Suggested resource tree (optional)

You can create resources in IMS with a parent/child structure so the menu matches the app. Example:

| Resource name       | URL                              | Parent (optional) |
| ------------------- | -------------------------------- | ----------------- |
| Seafarer            | (group, no URL or `#`)           | —                 |
| Seafarer Dashboard  | `/seafarer/dashboard`            | Seafarer          |
| My Applications     | `/seafarer/applications`         | Seafarer          |
| Application History | `/seafarer/applications/history` | Seafarer          |
| Services            | `/seafarer/services`             | Seafarer          |
| …                   | …                                | …                 |
| Admin               | (group)                          | —                 |
| Admin Dashboard     | `/admin/dashboard`               | Admin             |
| Admin Onboarding    | `/admin/onboarding`              | Admin             |
| …                   | …                                | …                 |

Use the **order** field to control menu order. Keep **isActive** true for all resources you want visible.

---

## 5. IMS steps to configure

1. In IMS, go to **Admin → Workspaces** and select (or create) the workspace that represents the MEMS Seafarer app.
2. Open **Resources** for that workspace.
3. For each URL in Section 2 (or your chosen subset), create a resource:
   - **Resource name**: e.g. “Seafarer Dashboard”
   - **URL**: e.g. `/seafarer/dashboard`
   - **Description**: optional
   - **Parent**: optional, for tree
   - **Order**: optional
   - **Is active**: true
4. In **Roles** (or Role-Resources/Permissions) for that workspace, create or select roles:
   - **Super Admin** (or equivalent): assign **all** resources.
   - **Seafarer**: assign only resources listed in Section 3 for Seafarer.
   - **Agent**: assign only resources listed in Section 3 for Agent.
   - **Training Institution**: assign only resources listed in Section 3 for Training Institution.
5. Ensure the MEMS Seafarer frontend calls the IMS menu/permissions API with the same workspace ID so menus and route protection use these resources.

This gives you a single reference for all MEMS Seafarer routes and how to configure them as IMS resources for Super Admin, Training Institution, Agent, and Seafarer.
