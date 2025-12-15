# MEMS IAM Frontend Integration Guide

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Token Management](#token-management)
3. [Workspace Management](#workspace-management)
4. [Permission Handling](#permission-handling)
5. [API Integration](#api-integration)
6. [Error Handling](#error-handling)
7. [Security Best Practices](#security-best-practices)

---

## Authentication Flow

### 1. User Login

**Endpoint:** `POST /connect/token`

**Request:**
```http
POST /connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=user@example.com
&password=UserPassword123
&client_id=your_client_id
&client_secret=your_client_secret
&scope=openid profile email
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "CfDJ8..."
}
```

**Frontend Implementation:**
```javascript
async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('username', username);
  formData.append('password', password);
  formData.append('client_id', 'your_client_id');
  formData.append('client_secret', 'your_client_secret');
  formData.append('scope', 'openid profile email');

  const response = await fetch('/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  
  // Store tokens securely
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
  
  return data;
}
```

---

## Token Management

### Token Structure

The access token is a JWT containing the following claims:

```json
{
  "sub": "user-guid",
  "user_id": "user-guid",
  "tenant_id": "tenant-guid",
  "workspace_id": "default-workspace-guid",
  "workspace_name": "Default Workspace",
  "workspaces": "[{\"workspaceId\":\"...\",\"workspaceName\":\"...\",\"workspaceCode\":\"...\"}]",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Important Notes:**
- Token expires in **24 hours** (86400 seconds)
- Token does **NOT** contain permissions (security best practice)
- `workspaces` claim contains JSON array of all accessible workspaces
- `workspace_id` is the default/active workspace

### Decoding Token Claims

```javascript
function decodeToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

function getWorkspacesFromToken(token) {
  const decoded = decodeToken(token);
  const workspacesClaim = decoded.workspaces;
  return JSON.parse(workspacesClaim || '[]');
}

function getDefaultWorkspaceId(token) {
  const decoded = decodeToken(token);
  return decoded.workspace_id;
}
```

### Token Refresh

**Endpoint:** `POST /connect/token`

**Request:**
```http
POST /connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=your_refresh_token
&client_id=your_client_id
&client_secret=your_client_secret
```

**Frontend Implementation:**
```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const formData = new URLSearchParams();
  formData.append('grant_type', 'refresh_token');
  formData.append('refresh_token', refreshToken);
  formData.append('client_id', 'your_client_id');
  formData.append('client_secret', 'your_client_secret');

  const response = await fetch('/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    // Refresh failed - redirect to login
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
  
  return data.access_token;
}
```

### Token Expiration Check

```javascript
function isTokenExpired() {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;
  
  return Date.now() >= parseInt(expiresAt);
}

async function getValidToken() {
  if (isTokenExpired()) {
    return await refreshToken();
  }
  return localStorage.getItem('access_token');
}
```

---

## Workspace Management

### Getting User's Workspaces

Workspaces are available in the token's `workspaces` claim:

```javascript
function getUserWorkspaces() {
  const token = localStorage.getItem('access_token');
  return getWorkspacesFromToken(token);
}

// Example usage
const workspaces = getUserWorkspaces();
// [
//   { workspaceId: "guid-1", workspaceName: "Waste Management", workspaceCode: "WM" },
//   { workspaceId: "guid-2", workspaceName: "Sea Ferries", workspaceCode: "SF" }
// ]
```

### Workspace Switcher Implementation

```javascript
class WorkspaceManager {
  constructor() {
    this.currentWorkspaceId = null;
    this.permissions = [];
    this.permissionCache = new Map();
  }

  async initialize() {
    const token = localStorage.getItem('access_token');
    const defaultWorkspaceId = getDefaultWorkspaceId(token);
    
    if (defaultWorkspaceId) {
      await this.switchWorkspace(defaultWorkspaceId);
    }
  }

  async switchWorkspace(workspaceId) {
    // Update current workspace
    this.currentWorkspaceId = workspaceId;
    
    // Fetch permissions for this workspace
    this.permissions = await this.getWorkspacePermissions(workspaceId);
    
    // Update UI
    this.updateUI();
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('workspaceChanged', {
      detail: { workspaceId, permissions: this.permissions }
    }));
  }

  async getWorkspacePermissions(workspaceId) {
    // Check cache first (5-minute cache)
    if (this.permissionCache.has(workspaceId)) {
      const cached = this.permissionCache.get(workspaceId);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.permissions;
      }
    }

    // Fetch from API
    const token = await getValidToken();
    const response = await fetch(`/api/workspaces/${workspaceId}/permissions/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch permissions');
      return [];
    }

    const data = await response.json();
    const permissions = data.data || [];

    // Cache permissions
    this.permissionCache.set(workspaceId, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  updateUI() {
    // Show/hide UI elements based on permissions
    const createUserBtn = document.getElementById('create-user-btn');
    if (createUserBtn) {
      createUserBtn.style.display = this.hasPermission('users:create') ? 'block' : 'none';
    }

    const deleteUserBtn = document.getElementById('delete-user-btn');
    if (deleteUserBtn) {
      deleteUserBtn.style.display = this.hasPermission('users:delete') ? 'block' : 'none';
    }
    // ... add more UI updates
  }
}

// Initialize workspace manager
const workspaceManager = new WorkspaceManager();
workspaceManager.initialize();
```

---

## Permission Handling

### Permission Endpoint

**Endpoint:** `GET /api/workspaces/{workspaceId}/permissions/my`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "users:view",
    "users:create",
    "users:update",
    "workspaces:view",
    "workspaces:create"
  ]
}
```

### When to Fetch Permissions

1. **On Workspace Switch** (Primary)
   ```javascript
   await workspaceManager.switchWorkspace(newWorkspaceId);
   ```

2. **On Initial App Load**
   ```javascript
   await workspaceManager.initialize();
   ```

3. **When User Selects Workspace from Switcher**
   ```javascript
   workspaceSwitcher.on('change', async (workspaceId) => {
     await workspaceManager.switchWorkspace(workspaceId);
   });
   ```

### Permission Checking Pattern

```javascript
// Check permission before showing UI element
function renderCreateButton() {
  if (workspaceManager.hasPermission('users:create')) {
    return <button onClick={handleCreate}>Create User</button>;
  }
  return null;
}

// Check permission before API call (optional - server validates anyway)
async function createUser(userData) {
  if (!workspaceManager.hasPermission('users:create')) {
    alert('You do not have permission to create users');
    return;
  }

  const token = await getValidToken();
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  if (response.status === 403) {
    alert('Access denied');
    return;
  }

  return await response.json();
}
```

### Common Permission Names

- `users:view` - View users
- `users:create` - Create users
- `users:update` - Update users
- `users:delete` - Delete users
- `workspaces:view` - View workspaces
- `workspaces:create` - Create workspaces
- `workspaces:update` - Update workspaces
- `workspaces:delete` - Delete workspaces
- `roles:view` - View roles
- `roles:create` - Create roles
- `roles:update` - Update roles
- `roles:delete` - Delete roles

---

## API Integration

### Base API Configuration

```javascript
const API_BASE_URL = 'https://your-api-domain.com';

async function apiRequest(endpoint, options = {}) {
  const token = await getValidToken();
  
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  // Handle token expiration
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      // Retry request with new token
      return apiRequest(endpoint, options);
    }
    // Refresh failed - redirect to login
    window.location.href = '/login';
    return;
  }

  return response;
}
```

### Workspace-Scoped Endpoints

Many endpoints require a `workspaceId` in the route:

```javascript
// Get workspace members
async function getWorkspaceMembers(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/members`);
  return await response.json();
}

// Add member to workspace
async function addWorkspaceMember(workspaceId, memberData) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify(memberData)
  });
  return await response.json();
}
```

### Non-Workspace-Scoped Endpoints

Some endpoints don't require workspaceId:

```javascript
// Get all workspaces
async function getAllWorkspaces() {
  const response = await apiRequest('/api/workspaces');
  return await response.json();
}

// Get workspace by ID
async function getWorkspace(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}`);
  return await response.json();
}
```

---

## UserInfo Endpoint

### Getting User Profile

**Endpoint:** `GET /connect/userinfo`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "sub": "user-guid",
  "name": "John Doe",
  "email": "user@example.com",
  "email_verified": true,
  "given_name": "John",
  "family_name": "Doe",
  "middle_name": "Michael",
  "phone_number": "+1234567890",
  "phone_number_verified": false,
  "date_of_birth": "1990-01-15",
  "country": "United States",
  "status": "Active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-12-01T12:00:00Z",
  "last_login": "2024-12-10T10:30:00Z",
  "address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "United States"
  },
  "workspace_id": "default-workspace-guid",
  "workspace_name": "Default Workspace",
  "workspace_role": "Admin",
  "workspaces": [
    {
      "workspaceId": "guid-1",
      "workspaceName": "Waste Management",
      "workspaceCode": "WM"
    },
    {
      "workspaceId": "guid-2",
      "workspaceName": "Sea Ferries",
      "workspaceCode": "SF"
    }
  ]
}
```

**Response Fields:**
- `sub` - User ID (GUID)
- `name` - Full name (FirstName + LastName)
- `email` - User email address
- `email_verified` - Whether email is confirmed
- `given_name` - First name
- `family_name` - Last name
- `middle_name` - Middle name (if provided)
- `phone_number` - Phone number (if provided)
- `phone_number_verified` - Whether phone is verified
- `date_of_birth` - Date of birth in YYYY-MM-DD format (if provided)
- `country` - Country (if provided)
- `status` - User status (Active, PendingVerification, etc.)
- `created_at` - Account creation timestamp (ISO 8601)
- `updated_at` - Last update timestamp (ISO 8601)
- `last_login` - Last login timestamp (ISO 8601, if available)
- `address` - Address object containing:
  - `line1` - Street address line 1
  - `line2` - Street address line 2 (if provided)
  - `city` - City
  - `state` - State/Province
  - `postalCode` - Postal/ZIP code
  - `country` - Country
- `workspace_id` - Default workspace ID
- `workspace_name` - Default workspace name
- `workspace_role` - Role in default workspace
- `workspaces` - Array of all accessible workspaces

**Note:** 
- UserInfo does **NOT** contain permissions (security best practice). Use the workspace-specific permissions endpoint instead.
- Empty/null fields will return empty strings or empty objects for address
- Date fields use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)

**Frontend Implementation:**
```javascript
async function getUserInfo() {
  const token = await getValidToken();
  const response = await fetch('/connect/userinfo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return await response.json();
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Error Handling Implementation

```javascript
async function handleApiResponse(response) {
  if (response.ok) {
    return await response.json();
  }

  const errorData = await response.json().catch(() => ({}));
  
  switch (response.status) {
    case 401:
      // Token expired - try refresh
      const newToken = await refreshToken();
      if (newToken) {
        throw new RetryableError('Token refreshed, retry request');
      }
      // Refresh failed - redirect to login
      window.location.href = '/login';
      break;
      
    case 403:
      throw new PermissionError(errorData.message || 'Access denied');
      
    case 404:
      throw new NotFoundError(errorData.message || 'Resource not found');
      
    case 400:
      throw new ValidationError(errorData.errors || []);
      
    default:
      throw new ApiError(errorData.message || 'An error occurred');
  }
}
```

---

## Security Best Practices

### 1. Token Storage

**DO:**
- Store tokens in `localStorage` or `sessionStorage`
- Use `sessionStorage` for better security (cleared on tab close)
- Implement token expiration checks

**DON'T:**
- Store tokens in cookies (unless HttpOnly)
- Log tokens to console
- Include tokens in URLs

### 2. Token Transmission

**DO:**
- Always send tokens in `Authorization` header
- Use HTTPS only
- Validate token expiration before API calls

**DON'T:**
- Send tokens in query parameters
- Include tokens in error messages
- Cache tokens in global variables

### 3. Permission Handling

**DO:**
- Fetch permissions per workspace
- Cache permissions (5-minute TTL)
- Validate permissions server-side (don't trust client)

**DON'T:**
- Store all permissions in token
- Trust client-side permission checks alone
- Expose permissions in UserInfo endpoint

### 4. Workspace Context

**DO:**
- Always include `workspaceId` in workspace-scoped API calls
- Validate workspace access before API calls
- Handle workspace switching gracefully

**DON'T:**
- Assume user has access to all workspaces
- Skip workspace validation
- Mix permissions across workspaces

---

## Complete Example: React Implementation

```javascript
// authService.js
class AuthService {
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('client_id', process.env.REACT_APP_CLIENT_ID);
    formData.append('client_secret', process.env.REACT_APP_CLIENT_SECRET);
    formData.append('scope', 'openid profile email');

    const response = await fetch('/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('refresh_token', data.refresh_token);
    sessionStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
    
    return data;
  }

  async getValidToken() {
    const expiresAt = sessionStorage.getItem('token_expires_at');
    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return await this.refreshToken();
    }
    return sessionStorage.getItem('access_token');
  }

  async refreshToken() {
    const refreshToken = sessionStorage.getItem('refresh_token');
    // ... refresh implementation
  }

  logout() {
    sessionStorage.clear();
    window.location.href = '/login';
  }
}

// workspaceService.js
class WorkspaceService {
  constructor() {
    this.currentWorkspaceId = null;
    this.permissions = [];
    this.cache = new Map();
  }

  async switchWorkspace(workspaceId) {
    this.currentWorkspaceId = workspaceId;
    this.permissions = await this.getPermissions(workspaceId);
    return this.permissions;
  }

  async getPermissions(workspaceId) {
    // Check cache
    const cached = this.cache.get(workspaceId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.permissions;
    }

    // Fetch from API
    const token = await authService.getValidToken();
    const response = await fetch(`/api/workspaces/${workspaceId}/permissions/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const permissions = data.data || [];

    // Cache
    this.cache.set(workspaceId, { permissions, timestamp: Date.now() });
    return permissions;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }
}

// apiClient.js
class ApiClient {
  async request(endpoint, options = {}) {
    const token = await authService.getValidToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        return this.request(endpoint, options);
      }
      authService.logout();
      return;
    }

    return response;
  }
}

// Usage in React component
function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const workspacesList = getWorkspacesFromToken(token);
    setWorkspaces(workspacesList);
    
    const defaultWorkspaceId = getDefaultWorkspaceId(token);
    if (defaultWorkspaceId) {
      handleWorkspaceChange(defaultWorkspaceId);
    }
  }, []);

  async function handleWorkspaceChange(workspaceId) {
    await workspaceService.switchWorkspace(workspaceId);
    setCurrentWorkspace(workspaceId);
  }

  return (
    <select onChange={(e) => handleWorkspaceChange(e.target.value)}>
      {workspaces.map(ws => (
        <option key={ws.workspaceId} value={ws.workspaceId}>
          {ws.workspaceName}
        </option>
      ))}
    </select>
  );
}

function CreateUserButton() {
  const hasPermission = workspaceService.hasPermission('users:create');
  
  if (!hasPermission) return null;
  
  return <button onClick={handleCreate}>Create User</button>;
}
```

---

## API Endpoints Reference

### Authentication
- `POST /connect/token` - Login/Refresh token
- `GET /connect/userinfo` - Get user profile

### Workspaces
- `GET /api/workspaces` - Get all workspaces
- `GET /api/workspaces/{id}` - Get workspace by ID
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/{id}` - Update workspace
- `DELETE /api/workspaces/{id}` - Delete workspace
- `GET /api/workspaces/{id}/permissions/my` - Get my permissions in workspace

### Workspace Members
- `GET /api/workspaces/{workspaceId}/members` - Get workspace members
- `POST /api/workspaces/{workspaceId}/members` - Add member to workspace
- `POST /api/workspaces/{workspaceId}/members/{memberId}/roles` - Assign role to member

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user (registration)

---

## Troubleshooting

### Token Expired
**Symptom:** 401 Unauthorized errors

**Solution:**
```javascript
// Implement automatic token refresh
if (response.status === 401) {
  await refreshToken();
  // Retry request
}
```

### No Permissions Returned
**Symptom:** Empty permissions array

**Possible Causes:**
- User not a member of the workspace
- User has no roles assigned
- Workspace doesn't exist

**Solution:** Check workspace membership and role assignments

### Workspace Not Found
**Symptom:** 404 when switching workspace

**Solution:** Verify workspace exists and user has access via UserWorkspace

---

## Support

For questions or issues, contact the backend team or refer to:
- API Documentation: `/swagger`
- OpenAPI Spec: `/swagger/v1/swagger.json`

---

**Last Updated:** December 2024
**Version:** 1.0
