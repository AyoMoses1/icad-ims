# Workspace to Application Routing

## Overview

Different workspaces in IMS represent different applications. When a user clicks on a workspace card/box, they are routed to the corresponding application based on the workspace code.

## How It Works

1. **Workspace Cards**: Displayed on the IMS dashboard (`/dashboard`)
2. **Click Handler**: When a workspace card is clicked, the system:
   - Extracts `workspaceCode` from the workspace object
   - Maps the code to an application URL
   - Redirects to that application with the token in the URL

## Workspace Code Mapping

The system maps workspace codes to application URLs:

| Workspace Code | Application | URL | Port |
|----------------|------------|-----|------|
| `SEAFARER` | Seafarer Frontend | `http://localhost:3001` | 3001 |
| `TRAINING` or `TRAINING_INSTITUTION` | Training Application | `http://localhost:3002` | 3002 |
| `AGENT` | Agent Application | `http://localhost:3003` | 3003 |
| `ADMIN` | IMS (current app) | `http://localhost:3000` | 3000 |

## Routing Logic

The routing function (`getApplicationUrl`) in `src/app/(dashboard)/page.tsx`:

1. **Primary Match**: Tries to match by `workspaceCode` (case-insensitive)
2. **Fallback Match**: If no code match, tries to match by workspace name
3. **Default**: If no match found, stays in IMS at `/workspaces/{workspaceId}`

## Token Passing

When redirecting to an external application, the token is passed as a URL query parameter:

```
http://localhost:3001?token={jwt_token}
```

The target application should:
1. Extract the token from the URL
2. Call `/connect/userinfo` to get user details
3. Determine user role and show appropriate sidebar

## Implementation Details

### Workspace Code Preservation

The `workspaceCode` from the JWT token is preserved when mapping workspaces:

- **Token Format**: `WorkspaceFromToken` includes `workspaceCode`
- **Store Mapping**: `workspace-store.ts` preserves `workspaceCode` when converting
- **Sidebar Mapping**: `sidebar.tsx` also preserves `workspaceCode`

### Code Location

- **Routing Function**: `src/app/(dashboard)/page.tsx` - `getApplicationUrl()`
- **Click Handler**: `src/app/(dashboard)/page.tsx` - `handleWorkspaceClick()`
- **Workspace Store**: `src/store/workspace-store.ts` - preserves `workspaceCode`

## Adding New Applications

To add a new application route:

1. Update the `applicationRoutes` object in `getApplicationUrl()`:

```typescript
const applicationRoutes: Record<string, string> = {
  'SEAFARER': 'http://localhost:3001',
  'TRAINING': 'http://localhost:3002',
  'NEW_APP': 'http://localhost:3004', // Add new mapping
  // ...
};
```

2. Ensure the workspace code in the JWT token matches the key (case-insensitive)

## Environment Variables (Future Enhancement)

Consider using environment variables for application URLs:

```env
NEXT_PUBLIC_SEAFARER_APP_URL=http://localhost:3001
NEXT_PUBLIC_TRAINING_APP_URL=http://localhost:3002
NEXT_PUBLIC_AGENT_APP_URL=http://localhost:3003
```

Then update the routing function to use these variables instead of hardcoded URLs.

## Testing

1. Login to IMS
2. View workspace cards on dashboard
3. Click a workspace card
4. Should redirect to the corresponding application with token in URL
5. Target application should extract token and initialize user session



