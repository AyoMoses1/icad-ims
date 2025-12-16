# IMS - Identity Management System

A comprehensive **Next.js (TypeScript) frontend** for an Identity Management System (IMS) that serves as a module provider for the MEMS (Maritime Enterprise Management System) project. This application handles authentication, authorization, and extends the permission/role/resource model with a top-level **Workspace** (Module) layer.

## 🎯 Features

### Authentication

- Sign in with email and password
- Sign up flow (configurable via environment)
- Forgot password / Reset password
- Email verification
- Sign out
- 2FA placeholder (not yet implemented)

### Workspace Management

- Create, read, update, delete workspaces
- Workspace-specific resources, roles, and permissions
- Visual workspace switcher in sidebar

### User Management

- Full CRUD operations for users
- Role assignment (workspace-scoped)
- User status management (Active, Pending, Inactive, Suspended)

### Role & Permission Management

- Create and manage roles per workspace
- Granular permissions (READ, CREATE, UPDATE, DELETE, ASSIGN, MANAGE)
- Permission assignment to roles
- System roles protection

### Resource Management

- Define resources (features/menus) per workspace
- Hierarchical resource structure support
- URL-based resource routing

### RBAC Enforcement

- UI components that respect permissions
- `PermissionGate` component for conditional rendering
- `usePermission` hook for programmatic checks
- Disabled states with helpful tooltips

### Audit Logging

- Track all system actions
- Filter by action type and entity
- Export capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Navigate to the IMS directory
cd ims

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Start the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

```
Email: admin@mems.io
Password: password123
```

## 📁 Project Structure

```
ims/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages (public)
│   │   │   └── auth/
│   │   │       ├── signin/
│   │   │       ├── signup/
│   │   │       ├── forgot-password/
│   │   │       ├── reset-password/
│   │   │       └── verify-email/
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   ├── workspaces/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── resources/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   └── api/                # Mock API routes
│   │       ├── auth/
│   │       ├── workspaces/
│   │       ├── users/
│   │       ├── roles/
│   │       ├── permissions/
│   │       └── resources/
│   ├── components/
│   │   ├── ui/                 # Base UI components (shadcn-style)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── shared/             # Shared/common components
│   ├── lib/                    # Utilities and mock data
│   ├── store/                  # Zustand stores
│   ├── types/                  # TypeScript type definitions
│   └── providers/              # React context providers
├── tests/                      # Jest test files
└── public/                     # Static assets
```

## 🔧 Tech Stack

| Technology                   | Purpose                                |
| ---------------------------- | -------------------------------------- |
| Next.js 14 (App Router)      | React framework with server components |
| TypeScript                   | Type safety                            |
| Tailwind CSS                 | Styling                                |
| shadcn/ui + Radix UI         | Accessible UI components               |
| React Query (TanStack)       | Data fetching and caching              |
| React Hook Form + Zod        | Form handling and validation           |
| Zustand                      | Lightweight state management           |
| Jest + React Testing Library | Testing                                |
| ESLint + Prettier            | Code quality                           |

## 🏗️ State Management Architecture

### Why Zustand?

We chose **Zustand** over React Context for the following reasons:

1. **Performance**: Zustand uses selectors to prevent unnecessary re-renders
2. **Persistence**: Built-in middleware for localStorage persistence
3. **DevTools**: Easy debugging with Redux DevTools compatibility
4. **Simplicity**: Minimal boilerplate compared to Redux
5. **TypeScript**: Excellent TypeScript support

### Stores

- **`auth-store`**: User session, authentication state
- **`workspace-store`**: Current workspace, resources, roles, permissions
- **`ui-store`**: Sidebar state, modals, toasts, theme

## 🔐 RBAC (Role-Based Access Control)

### How It Works

1. **User logs in** → Receives authentication token
2. **User selects workspace** → Fetches effective permissions for that workspace
3. **UI renders** → Components check permissions before rendering actions

### Permission Structure

```typescript
interface EffectivePermission {
  resourceId: string;
  resourceName: string;
  permissions: {
    permissionId: string;
    permissionName: string;
    permissionCode: string; // READ, CREATE, UPDATE, DELETE, ASSIGN, MANAGE
  }[];
}
```

### Using PermissionGate

```tsx
import { PermissionGate } from "@/components/shared";

// Hide button if user lacks permission
<PermissionGate resourceId="res-002" permission="CREATE">
  <Button>Create User</Button>
</PermissionGate>

// Show disabled button with tooltip
<PermissionGate
  resourceId="res-002"
  permission="DELETE"
  showTooltip
  fallback={<Button disabled>Delete</Button>}
>
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGate>
```

### Using Hooks

```tsx
import { usePermission, useCanAccessResource } from "@/components/shared";

function MyComponent() {
  const canCreate = usePermission("res-002", "CREATE");
  const canAccess = useCanAccessResource("res-002");

  if (!canAccess) return <AccessDenied />;

  return <div>{canCreate && <CreateButton />}</div>;
}
```

## 🔌 API Contract

### Authentication

| Endpoint                    | Method | Description                 |
| --------------------------- | ------ | --------------------------- |
| `/api/auth/signin`          | POST   | Sign in with email/password |
| `/api/auth/signup`          | POST   | Create new account          |
| `/api/auth/forgot-password` | POST   | Request password reset      |
| `/api/auth/reset-password`  | POST   | Reset password with token   |
| `/api/auth/verify-email`    | POST   | Verify email address        |
| `/api/auth/me`              | GET    | Get current user            |

### Workspaces

| Endpoint              | Method | Description         |
| --------------------- | ------ | ------------------- |
| `/api/workspaces`     | GET    | List all workspaces |
| `/api/workspaces`     | POST   | Create workspace    |
| `/api/workspaces/:id` | GET    | Get workspace by ID |
| `/api/workspaces/:id` | PUT    | Update workspace    |
| `/api/workspaces/:id` | DELETE | Delete workspace    |

### Users

| Endpoint                               | Method | Description                  |
| -------------------------------------- | ------ | ---------------------------- |
| `/api/users`                           | GET    | List users (with pagination) |
| `/api/users`                           | POST   | Create user                  |
| `/api/users/:id`                       | GET    | Get user by ID               |
| `/api/users/:id`                       | PUT    | Update user                  |
| `/api/users/:id`                       | DELETE | Delete user                  |
| `/api/users/:id/effective-permissions` | GET    | Get computed permissions     |

### Roles, Permissions, Resources

Similar CRUD endpoints for `/api/roles`, `/api/permissions`, `/api/resources`.

### Request/Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

## 🔄 Replacing Mock API with Real Backend

1. **Update environment variable**:

   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
   ```

2. **Create API client**:

   ```typescript
   // src/lib/api-client.ts
   const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

   export async function apiClient<T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> {
     const token = useAuthStore.getState().token;

     const response = await fetch(`${API_BASE}${endpoint}`, {
       ...options,
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
         ...options?.headers,
       },
     });

     return response.json();
   }
   ```

3. **Remove mock API routes** from `/src/app/api/`

4. **Expected backend endpoints**:
   - Implement all endpoints listed in the API Contract section
   - Use JWT tokens for authentication
   - Return responses in the documented format

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

- `tests/components/` - UI component tests
- `tests/auth/` - Authentication flow tests
- `tests/store/` - Zustand store tests

## 📜 Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run dev`      | Start development server |
| `npm run build`    | Build for production     |
| `npm run start`    | Start production server  |
| `npm run lint`     | Run ESLint               |
| `npm run lint:fix` | Fix ESLint issues        |
| `npm run format`   | Format with Prettier     |
| `npm test`         | Run tests                |

## 🎨 Design System

The UI follows the attached template design with:

- **Colors**: Primary blue (#3B82F6), success green, warning yellow, destructive red
- **Typography**: Inter font family
- **Spacing**: 4px base unit (Tailwind defaults)
- **Border Radius**: 0.5rem default
- **Dark Mode**: System preference based

### Accessibility

- Semantic HTML elements
- ARIA attributes on interactive elements
- Keyboard navigation support
- Focus management on modals
- Color contrast compliance

## ⚠️ Known Limitations

1. **2FA**: Placeholder only, not functional
2. **Email Sending**: Mock implementation, no actual emails
3. **File Uploads**: Avatar upload UI present but not functional
4. **Real-time Updates**: No WebSocket integration
5. **Bulk Operations**: UI present but limited implementation

## 📝 Development Notes

### Adding New Features

1. Create types in `/src/types/index.ts`
2. Add mock data in `/src/lib/mock-data.ts`
3. Create API route in `/src/app/api/`
4. Build UI components
5. Add to navigation in sidebar
6. Write tests

### Best Practices

- Use TypeScript strict mode
- Follow ESLint rules
- Write meaningful commit messages
- Keep components small and focused
- Use React Query for server state
- Use Zustand for UI state only

## 📄 License

Proprietary - MEMS Project

---

Built with ❤️ for the MEMS Platform







