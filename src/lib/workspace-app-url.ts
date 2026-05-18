/**
 * Build external workspace app URLs (e.g. Seafarer on localhost:3001)
 * with token, refreshToken, and workspaceId for SSO handoff.
 */

import { useAuthStore } from "@/store";

export interface WorkspaceAppLinkParams {
  workspaceId: string;
  workspaceUrl?: string | null;
  token?: string | null;
  refreshToken?: string | null;
}

const DEFAULT_WORKSPACE_APP_URL = "http://localhost:3001";

/**
 * Returns the full URL to open an external workspace application.
 * Appends token, refreshToken (when available), and workspaceId as query params.
 */
export function buildWorkspaceApplicationUrl({
  workspaceId,
  workspaceUrl,
  token,
  refreshToken,
}: WorkspaceAppLinkParams): string {
  const base = (workspaceUrl?.trim() || DEFAULT_WORKSPACE_APP_URL).replace(
    /\/$/,
    ""
  );
  const url = new URL(base);

  if (token) {
    url.searchParams.set("token", token);
  }
  if (refreshToken) {
    url.searchParams.set("refreshToken", refreshToken);
  }
  if (workspaceId?.trim()) {
    url.searchParams.set("workspaceId", workspaceId.trim());
  }

  return url.toString();
}

/**
 * Build URL using tokens from the current auth store.
 */
export function buildWorkspaceApplicationUrlFromAuth(
  workspace: { workspaceId: string; workspaceUrl?: string | null }
): string {
  const { token, refreshToken } = useAuthStore.getState();
  return buildWorkspaceApplicationUrl({
    workspaceId: workspace.workspaceId,
    workspaceUrl: workspace.workspaceUrl,
    token: token ?? undefined,
    refreshToken: refreshToken ?? undefined,
  });
}
