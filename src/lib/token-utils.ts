/**
 * Token Utility Functions
 * Utilities for decoding JWT tokens and extracting claims
 */

export interface TokenClaims {
  /** Present when the access token is a JWE; claims are not readable in the browser. */
  __tokenFormat?: "jwe";
  sub?: string;
  user_id?: string;
  tenant_id?: string;
  workspace_id?: string;
  workspace_name?: string;
  workspaces?: string; // JSON string of workspaces array
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface WorkspaceFromToken {
  workspaceId: string;
  workspaceName: string;
  workspaceCode: string;
}

/**
 * Decodes JWT base64url payload to a UTF-8 string (claims JSON).
 * Avoids decodeURIComponent(byte-hack) which throws URIError on many UTF-8 payloads.
 */
function decodeJwtPayloadSegment(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + (pad ? "=".repeat(pad) : "");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function parseJsonSegment(base64Url: string): unknown | null {
  try {
    return JSON.parse(decodeJwtPayloadSegment(base64Url)) as unknown;
  } catch {
    return null;
  }
}

/** RFC 7516 compact JWE: five segments; claims are not readable without the CEK. */
function isLikelyJweCompact(parts: string[]): boolean {
  if (parts.length !== 5) return false;
  const header = parseJsonSegment(parts[0] ?? "");
  return (
    !!header &&
    typeof header === "object" &&
    header !== null &&
    "enc" in header
  );
}

/**
 * Decodes a JWT token and returns its claims
 */
export function decodeToken(token: string): TokenClaims {
  try {
    const normalized = token.trim();
    const parts = normalized.split(".");

    if (isLikelyJweCompact(parts)) {
      return { __tokenFormat: "jwe" } as TokenClaims;
    }

    if (parts.length !== 3 || !parts[1]) {
      throw new Error("Invalid token format");
    }

    const jsonPayload = decodeJwtPayloadSegment(parts[1]);
    return JSON.parse(jsonPayload) as TokenClaims;
  } catch (error) {
    console.error("Failed to decode token:", error);
    throw new Error("Invalid token format");
  }
}

/**
 * Extracts workspaces array from token claims
 */
export function getWorkspacesFromToken(token: string): WorkspaceFromToken[] {
  try {
    const decoded = decodeToken(token);
    if (decoded.__tokenFormat === "jwe") {
      return [];
    }
    const workspacesClaim = decoded.workspaces;

    if (!workspacesClaim) {
      return [];
    }

    // If workspaces is already an array, return it
    if (Array.isArray(workspacesClaim)) {
      return workspacesClaim as WorkspaceFromToken[];
    }

    // If workspaces is a JSON string, parse it
    if (typeof workspacesClaim === "string") {
      return JSON.parse(workspacesClaim) as WorkspaceFromToken[];
    }

    return [];
  } catch (error) {
    console.error("Failed to extract workspaces from token:", error);
    return [];
  }
}

/**
 * Gets the default workspace ID from token
 */
export function getDefaultWorkspaceId(token: string): string | null {
  try {
    const decoded = decodeToken(token);
    return decoded.workspace_id || null;
  } catch (error) {
    console.error("Failed to get default workspace ID from token:", error);
    return null;
  }
}

/**
 * Gets the tenant ID from token
 */
export function getTenantIdFromToken(token: string): string | null {
  try {
    const decoded = decodeToken(token);
    return decoded.tenant_id || null;
  } catch (error) {
    console.error("Failed to get tenant ID from token:", error);
    return null;
  }
}

/**
 * Gets the user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = decodeToken(token);
    return decoded.user_id || decoded.sub || null;
  } catch (error) {
    console.error("Failed to get user ID from token:", error);
    return null;
  }
}

/**
 * Checks if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (decoded.__tokenFormat === "jwe") {
      return false;
    }
    if (!decoded.exp) {
      return true; // If no expiration claim, consider it expired
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error("Failed to check token expiration:", error);
    return true; // If we can't decode, consider it expired
  }
}

/**
 * Gets the token expiration time as a Date object
 */
export function getTokenExpirationDate(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (decoded.__tokenFormat === "jwe") {
      return null;
    }
    if (!decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error("Failed to get token expiration date:", error);
    return null;
  }
}
