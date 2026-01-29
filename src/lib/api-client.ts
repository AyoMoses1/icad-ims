/**
 * API Client for making requests to the backend API
 */

// Get API base URL - access at runtime to ensure env vars are loaded
function getApiBaseUrl(): string {
  // In Next.js, NEXT_PUBLIC_ variables are embedded at build time
  // They should be available in both server and client contexts
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";

  // Log in development to help debug
  if (typeof window !== "undefined") {
    if (!baseUrl) {
      console.error(
        "❌ CRITICAL: NEXT_PUBLIC_API_BASE_URL is not set!",
        "\n  Current value:",
        process.env.NEXT_PUBLIC_API_BASE_URL,
        "\n  This will cause API calls to fail or go to localhost.",
        "\n  Please:",
        "\n  1. Check your .env or .env.local file",
        "\n  2. Restart your Next.js dev server (npm run dev)",
        "\n  3. Clear .next cache if needed (rm -rf .next)"
      );
    }
    // else if (process.env.NODE_ENV === "development") {
    //   console.log("✅ API Base URL loaded:", baseUrl);
    // }
  }

  return baseUrl;
}

export interface ApiError {
  message: string;
  code: string;
}

export interface ApiResponse<T> {
  apiVersion?: string;
  success: boolean;
  code?: string;
  message?: string;
  requestId?: string;
  data?: T;
  error?: ApiError;
}

/**
 * Gets the current access token from auth store
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // Import dynamically to avoid circular dependencies
    const { useAuthStore } = require("@/store");
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}

/**
 * Gets refresh token from auth store
 */
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const { useAuthStore } = require("@/store");
    return useAuthStore.getState().refreshToken;
  } catch {
    return null;
  }
}

/**
 * Checks if token is expired based on expiration time
 */
function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const { useAuthStore } = require("@/store");
    const { expiresAt } = useAuthStore.getState();

    if (!expiresAt) return true;

    return new Date(expiresAt) <= new Date();
  } catch {
    return true;
  }
}

/**
 * Refreshes the access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.warn("No refresh token available");
    return null;
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("OAuth credentials not configured");
      return null;
    }

    // Call refresh token endpoint
    const tokenResponse = await apiPostForm<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    }>("/connect/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Update token in auth store
    const { useAuthStore } = require("@/store");
    const expiresIn = tokenResponse.expires_in || 86400; // Default 24 hours
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setSession({
        user: currentUser,
        token: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || refreshToken,
        expiresAt,
      });
    }

    return tokenResponse.access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    // Refresh failed - clear session and redirect to login
    if (typeof window !== "undefined") {
      const { useAuthStore } = require("@/store");
      useAuthStore.getState().logout();
      window.location.href = "/auth/signin";
    }
    return null;
  }
}

/**
 * Gets a valid token, refreshing if necessary
 * Exported for use by services that need to make authenticated requests to external APIs
 */
export async function getValidToken(): Promise<string | null> {
  if (isTokenExpired()) {
    return await refreshAccessToken();
  }

  return getAuthToken();
}

/**
 * Makes an API request to the backend
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const API_BASE_URL = getApiBaseUrl();

  // console.log({ API_BASE_URL });

  if (!API_BASE_URL) {
    const errorMsg = `NEXT_PUBLIC_API_BASE_URL is not configured. Current value: "${process.env.NEXT_PUBLIC_API_BASE_URL}". Please check your .env file and restart the dev server.`;
    console.error("❌ API Client Error:", errorMsg);
    throw new Error(errorMsg);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // Debug logging in development
  // if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  //   console.log("🌐 API Request:", {
  //     method: options.method || "GET",
  //     url,
  //     endpoint,
  //     baseUrl: API_BASE_URL,
  //   });
  // }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Get valid token (will refresh if expired)
  const token = await getValidToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    // Handle 401 - token expired/invalid, try refresh and retry
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry request with new token
        const retryHeaders: Record<string, string> = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        const retryData: ApiResponse<T> = await retryResponse.json();
        if (!retryResponse.ok) {
          // Handle 403 - Forbidden (no permission)
          if (retryResponse.status === 403) {
            throw new Error(
              retryData.error?.message || retryData.message || "Access denied"
            );
          }
          throw new Error(
            retryData.error?.message || retryData.message || "Request failed"
          );
        }
        return retryData;
      }
      // Refresh failed - redirect will happen in refreshAccessToken
      throw new Error("Authentication failed. Please login again.");
    }

    // Handle non-2xx responses
    if (!response.ok) {
      // Handle 403 - Forbidden (no permission)
      if (response.status === 403) {
        throw new Error(data.error?.message || data.message || "Access denied");
      }
      throw new Error(data.error?.message || data.message || "Request failed");
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }

    // Re-throw if it's already an Error
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected error occurred");
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  options?: { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "GET",
    headers: options?.headers,
  });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: options?.headers,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    headers: options?.headers,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
    headers: options?.headers,
  });
}

/**
 * DELETE request helper
 * Optionally supports a request body for endpoints that require it
 */
export async function apiDelete<T>(
  endpoint: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "DELETE",
    headers: options?.headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * POST request with form-urlencoded body (for OAuth token endpoints)
 */
export async function apiPostForm<T>(
  endpoint: string,
  formData: Record<string, string>
): Promise<T> {
  const API_BASE_URL = getApiBaseUrl();

  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Please check your .env file and restart the dev server."
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // Convert object to URLSearchParams for form-urlencoded
  const params = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    params.append(key, value);
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(
        errorData.error_description || errorData.error || "Request failed"
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }

    // Re-throw if it's already an Error
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected error occurred");
  }
}

/**
 * GET request helper with authentication (returns raw data, not wrapped in ApiResponse)
 */
export async function apiGetAuth<T>(endpoint: string): Promise<T> {
  const API_BASE_URL = getApiBaseUrl();

  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Please check your .env file and restart the dev server."
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // Get valid token (will refresh if expired)
  const token = await getValidToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle 401 - try refresh and retry
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({
            error: "Request failed",
          }));
          throw new Error(
            errorData.error_description || errorData.error || "Request failed"
          );
        }
        const retryData: T = await retryResponse.json();
        return retryData;
      }
      throw new Error("Authentication failed. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(
        errorData.error_description || errorData.error || "Request failed"
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

/**
 * POST request helper with authentication (returns raw data, not wrapped in ApiResponse)
 */
export async function apiPostAuth<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  const API_BASE_URL = getApiBaseUrl();

  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Please check your .env file and restart the dev server."
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // Get valid token (will refresh if expired)
  const token = await getValidToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 - try refresh and retry
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({
            error: "Request failed",
          }));
          throw new Error(
            errorData.error_description || errorData.error || "Request failed"
          );
        }
        const retryData: T = await retryResponse.json();
        return retryData;
      }
      throw new Error("Authentication failed. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(
        errorData.error_description || errorData.error || "Request failed"
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}
