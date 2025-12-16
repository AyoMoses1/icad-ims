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

  // Add authorization token if available
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    // Handle non-2xx responses
    if (!response.ok) {
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
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: "DELETE" });
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
  const token = getAuthToken();

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
  const token = getAuthToken();

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
