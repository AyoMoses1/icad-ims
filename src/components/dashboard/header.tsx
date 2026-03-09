"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  Building2,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useUIStore } from "@/store";
import { getMyTenants, switchTenant } from "@/lib/services/tenant-service";
import { getTenantIdFromToken } from "@/lib/token-utils";
import type { TenantDto } from "@/types";

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/": "Dashboard",
    // User & Profile Management
    "/workspaces": "Workspace Management",
    "/users": "User Management",
    "/roles": "Role Management",
    "/permissions": "Permission Management",
    "/resources": "Resources Management",
    "/role-resources": "Role Resources Management",
    "/user-roles": "User Role Management",
    "/invitations": "Invitations",
    "/audit": "Audit Logs",
    "/settings": "Settings",
    // Certification & Registration
    "/certification/vessels": "Vessel Certification",
    "/certification/registration": "Registration Services",
    "/certification/documents": "Document Management",
    // Waste Management
    "/waste/tracking": "Waste Tracking",
    "/waste/disposal": "Disposal Method",
    "/waste/facilities": "Facilities",
    // Seafarer
    "/seafarer/overview": "Seafarer Overview",
    "/seafarer/applications": "Applications",
    "/seafarer/registry": "Seafarer Registry",
    "/seafarer/miis": "Accredited MIIs",
    // Incidents
    "/incidents/report": "Incident Report",
    "/incidents/assessment": "Risk Assessment",
    // Levies & Fees
    "/levies/fees": "Fee Management",
    "/levies/collection": "Levy Collection",
    // Invoices & Payments
    "/invoices/management": "Invoice Management",
    "/invoices/payments": "Payments",
    // Marine Environment
    "/marine/monitoring": "Environmental Monitoring",
    "/marine/pollution": "Pollution Control",
    "/marine/protected": "Protected Areas",
    "/marine/ship-history": "Ship History (AIS)",
    "/maritime-intelligence": "Live AIS Tracking",
    "/sts": "Ship-to-Ship (STS)",
    "/sbm": "Single Buoy Mooring (SBM)",
    // Cabotage
    "/cabotage/permits": "Cabotage Permits",
    "/cabotage/terminals": "Terminal Operations",
    // Surveillance
    "/surveillance/tracking": "Vessel Tracking",
    "/surveillance/monitoring": "Vessel Surveillance",
    // Compliance
    "/compliance/checks": "Compliance Checks",
  };

  // Check for dynamic routes
  if (pathname.startsWith("/workspaces/")) return "Workspace Details";
  if (pathname.startsWith("/users/")) return "User Details";

  return routes[pathname] || "Dashboard";
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setMobileSidebarOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [currentTenant, setCurrentTenant] = useState<TenantDto | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  useEffect(() => {
    loadTenants();

    // Listen for tenant refresh events (e.g., after accepting invitation)
    const handleTenantRefresh = () => {
      loadTenants();
    };

    window.addEventListener("tenantListRefresh", handleTenantRefresh);

    return () => {
      window.removeEventListener("tenantListRefresh", handleTenantRefresh);
    };
  }, []);

  // Helper function to handle token persistence
  const handleTokenPersistence = async (
    newToken: string,
    tenant: TenantDto,
    currentUser: any,
    expiresAt: string,
    refreshToken?: string
  ) => {
    // Wait for Zustand persist middleware to save (it's async)
    // Give it more time to ensure it completes
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if Zustand already persisted it
    const { safeLocalStorage } = await import("@/lib/utils");
    const existingStorage = safeLocalStorage.getItem("auth-storage");
    if (existingStorage) {
      try {
        const existing = JSON.parse(existingStorage);
        if (existing.state?.token === newToken) {
          console.log("✅ Zustand already persisted the token correctly");
          return; // Zustand already saved it correctly
        }
      } catch (e) {
        console.warn("Failed to parse existing storage:", e);
      }
    }

    // Force localStorage write to ensure token is persisted before reload
    if (typeof window !== "undefined") {
      const { safeLocalStorage } = await import("@/lib/utils");
      try {
        // Get current auth storage state to preserve version
        const authStorage = safeLocalStorage.getItem("auth-storage");
        let version = 0;
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            version = parsed.version || 0;
          } catch {
            // If parsing fails, use default version
          }
        }

        // Get the latest state from Zustand
        const latestState = useAuthStore.getState();

        // Create the persisted state structure that Zustand expects
        // Note: Zustand persist stores data as { state: {...}, version: 0 }
        // But we need to match the exact structure that Zustand's createJSONStorage expects
        // Use the provided refreshToken if available, otherwise use the one from latestState
        const refreshTokenToUse =
          refreshToken || latestState.refreshToken || "";

        const persistedState = {
          state: {
            user: latestState.user || currentUser,
            token: newToken, // Always use the new token
            refreshToken: refreshTokenToUse, // Use the new refreshToken if provided
            expiresAt: latestState.expiresAt || expiresAt,
            isAuthenticated: true,
            isLoading: false, // Ensure loading is false after save
          },
          version,
        };

        console.log("💾 Persisting state to localStorage:", {
          hasUser: !!persistedState.state.user,
          hasToken: !!persistedState.state.token,
          tokenLength: persistedState.state.token?.length,
          hasRefreshToken: !!persistedState.state.refreshToken,
          version: persistedState.version,
        });

        // Write directly to localStorage synchronously
        // Ensure the token is valid before stringifying
        try {
          // Validate token is a string and not empty
          if (
            !newToken ||
            typeof newToken !== "string" ||
            newToken.length === 0
          ) {
            throw new Error("Invalid token: token is empty or not a string");
          }

          const stateToSave = JSON.stringify(persistedState);

          // Verify it can be parsed back (sanity check)
          const parsed = JSON.parse(stateToSave);
          if (!parsed.state || !parsed.state.token) {
            throw new Error("Invalid state structure after stringify");
          }

          // IMPORTANT: Zustand's persist middleware expects the value to be the state object directly,
          // not wrapped in { state, version }. But when we read it back, Zustand wraps it.
          // So we need to match Zustand's format exactly.
          // Zustand's createJSONStorage.getItem returns the unwrapped state, but setItem receives the wrapped { state, version }
          safeLocalStorage.setItem("auth-storage", stateToSave);

          // Immediately verify the write succeeded
          const immediateCheck = safeLocalStorage.getItem("auth-storage");
          if (!immediateCheck || immediateCheck !== stateToSave) {
            throw new Error(
              "Failed to write to localStorage - write verification failed"
            );
          }

          // Double-check it was saved
          const verifySave = safeLocalStorage.getItem("auth-storage");
          if (verifySave) {
            try {
              const verifyParsed = JSON.parse(verifySave);
              const tokenMatches = verifyParsed.state?.token === newToken;
              console.log("✅ Verified localStorage save:", {
                hasState: !!verifyParsed.state,
                hasToken: !!verifyParsed.state?.token,
                tokenMatches,
                hasUser: !!verifyParsed.state?.user,
                hasRefreshToken: !!verifyParsed.state?.refreshToken,
                tokenPreview:
                  verifyParsed.state?.token?.substring(0, 30) + "...",
              });

              if (!tokenMatches) {
                console.error("❌ Token mismatch in saved state! Retrying...");
                // Retry the save
                safeLocalStorage.setItem("auth-storage", stateToSave);
              }
            } catch (e) {
              console.error("❌ Failed to verify saved state:", e);
            }
          } else {
            console.error("❌ Failed to read back saved state! Retrying...");
            // Retry the save
            safeLocalStorage.setItem("auth-storage", stateToSave);
          }
        } catch (error) {
          console.error("Failed to save token to localStorage:", error);
          // Don't throw - just log and continue, the Zustand persist might still work
          console.warn("Continuing despite localStorage save error");
        }

        // Verify it was written correctly
        const verify = safeLocalStorage.getItem("auth-storage");
        if (verify) {
          try {
            const verifyParsed = JSON.parse(verify);
            const storedToken = verifyParsed.state?.token;
            if (storedToken === newToken) {
              console.log("✅ Token successfully persisted to localStorage");

              // Verify tenant_id in the token
              try {
                const tenantIdFromStoredToken =
                  getTenantIdFromToken(storedToken);
                console.log(
                  "✅ Tenant ID in stored token:",
                  tenantIdFromStoredToken
                );
                console.log("✅ Expected tenant ID:", tenant.tenantId);
                if (tenantIdFromStoredToken !== tenant.tenantId) {
                  console.warn("⚠️ Tenant ID mismatch in token!", {
                    expected: tenant.tenantId,
                    actual: tenantIdFromStoredToken,
                  });
                }
              } catch (error) {
                console.warn(
                  "Failed to verify tenant ID in stored token:",
                  error
                );
              }
            } else {
              console.warn("⚠️ Token verification failed after write");
              // Try one more time
              safeLocalStorage.setItem(
                "auth-storage",
                JSON.stringify(persistedState)
              );
            }
          } catch (error) {
            console.error("Failed to verify persisted token:", error);
          }
        }
      } catch (error) {
        console.error("Failed to manually persist token:", error);
      }
    }
  };

  const loadTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const result = await getMyTenants();
      if (result.success && result.data) {
        const tenantsList = Array.isArray(result.data) ? result.data : [];
        setTenants(tenantsList);
        // Set current tenant (first one or from token)
        if (tenantsList.length > 0) {
          // Get current tenant ID from token (most reliable source)
          const authStore = useAuthStore.getState();
          let currentTenantId: string | null = null;

          // Try to get tenant ID from token first
          if (authStore.token) {
            try {
              currentTenantId = getTenantIdFromToken(authStore.token);
              console.log(
                "🔍 LoadTenants - Tenant ID from token:",
                currentTenantId
              );
            } catch (error) {
              console.warn("Failed to decode token for tenant ID:", error);
            }
          } else {
            console.warn("⚠️ No token available in auth store");
          }

          // Fallback to user.tenantId if token doesn't have it
          if (!currentTenantId) {
            currentTenantId = (authStore.user as any)?.tenantId || null;
            console.log(
              "🔍 LoadTenants - Tenant ID from user object:",
              currentTenantId
            );
          }

          // Find the current tenant or default to first one
          const current =
            (currentTenantId &&
              tenantsList.find((t) => t.tenantId === currentTenantId)) ||
            tenantsList[0];

          console.log("🔍 LoadTenants - Selected tenant:", {
            tenantId: current?.tenantId,
            name: current?.name,
            availableTenants: tenantsList.map((t) => ({
              id: t.tenantId,
              name: t.name,
            })),
          });

          setCurrentTenant(current);
        } else {
          setCurrentTenant(null);
        }
      } else {
        setTenants([]);
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      setTenants([]);
      setCurrentTenant(null);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false);

  const handleSwitchTenant = async (tenant: TenantDto) => {
    if (!tenant.tenantId || isSwitchingTenant) return;

    setIsSwitchingTenant(true);

    // Set flag to prevent layout from redirecting during switch
    if (typeof window !== "undefined") {
      localStorage.setItem("switching-tenant", "true");
    }

    try {
      console.log("🔄 Switching to tenant:", tenant.tenantId, tenant.name);

      // Get refresh token from auth store
      const authStore = useAuthStore.getState();
      const refreshToken = authStore.refreshToken;
      if (!refreshToken) {
        toast.error("No refresh token available. Please login again.");
        setIsSwitchingTenant(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("switching-tenant");
        }
        return;
      }

      console.log(
        "🔄 Calling switch tenant with refresh token in X-Refresh-Token header..."
      );
      const result = await switchTenant(tenant.tenantId, refreshToken);

      console.log("🔄 Switch tenant response:", {
        success: result.success,
        hasData: !!result.data,
        hasToken: !!(result.data as any)?.token,
        hasAccessToken: !!(result.data as any)?.accessToken,
        error: result.error,
      });

      if (result.success && result.data) {
        const responseData = result.data as any;
        const authStore = useAuthStore.getState();
        const currentUser = authStore.user;

        // With refresh token in header, backend should return a real token
        // Check for both accessToken and token fields
        const accessToken = responseData.accessToken || responseData.token;

        console.log("🔍 Switch response accessToken:", {
          hasAccessToken: !!responseData.accessToken,
          hasToken: !!responseData.token,
          accessTokenPreview: accessToken?.substring(0, 50) + "...",
          isPlaceholder: accessToken === "SWITCH_TENANT",
        });

        // If backend still returns SWITCH_TENANT placeholder, fall back to refresh flow
        if (
          accessToken === "SWITCH_TENANT" ||
          !accessToken ||
          accessToken === ""
        ) {
          // Backend is telling us to refresh the token to get new tenant context
          console.log(
            "🔄 Backend returned SWITCH_TENANT placeholder, refreshing token..."
          );

          try {
            // Refresh the token to get a new one with the new tenant context
            const { apiPostForm } = await import("@/lib/api-client");
            const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
            const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;
            const refreshToken = authStore.refreshToken;

            if (!refreshToken) {
              toast.error("No refresh token available. Please login again.");
              setIsSwitchingTenant(false);
              if (typeof window !== "undefined") {
                localStorage.removeItem("switching-tenant");
              }
              return;
            }

            if (!clientId || !clientSecret) {
              toast.error("OAuth credentials not configured");
              setIsSwitchingTenant(false);
              if (typeof window !== "undefined") {
                localStorage.removeItem("switching-tenant");
              }
              return;
            }

            // Call refresh token endpoint
            console.log("🔄 Calling refresh token endpoint...");
            let tokenResponse;
            try {
              tokenResponse = await apiPostForm<{
                access_token: string;
                refresh_token?: string;
                expires_in?: number;
              }>("/connect/token", {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
              });

              console.log("🔄 Refresh token response:", {
                hasAccessToken: !!tokenResponse.access_token,
                hasRefreshToken: !!tokenResponse.refresh_token,
                expiresIn: tokenResponse.expires_in,
              });
            } catch (error: any) {
              console.error("❌ Refresh token endpoint failed:", error);
              toast.error(
                error?.message ||
                  "Failed to refresh token. Please try logging in again."
              );
              setIsSwitchingTenant(false);
              return;
            }

            const newToken = tokenResponse.access_token;

            if (!newToken || newToken === "SWITCH_TENANT") {
              console.error("❌ Invalid token received from refresh:", {
                token: newToken?.substring(0, 50) + "...",
                isPlaceholder: newToken === "SWITCH_TENANT",
              });
              toast.error("Failed to get new token after tenant switch");
              setIsSwitchingTenant(false);
              if (typeof window !== "undefined") {
                localStorage.removeItem("switching-tenant");
              }
              return;
            }

            // Verify the new token contains the correct tenant_id
            try {
              const tenantIdInToken = getTenantIdFromToken(newToken);
              console.log("🔍 Tenant ID verification after refresh:", {
                expected: tenant.tenantId,
                inToken: tenantIdInToken,
                matches: tenantIdInToken === tenant.tenantId,
              });

              if (tenantIdInToken !== tenant.tenantId) {
                console.warn(
                  "⚠️ Token tenant ID doesn't match expected, but continuing...",
                  {
                    expected: tenant.tenantId,
                    actual: tenantIdInToken,
                  }
                );
              }
            } catch (error) {
              console.warn(
                "Failed to verify tenant ID in refreshed token:",
                error
              );
            }

            // Update session with the refreshed token
            if (currentUser) {
              const expiresIn = tokenResponse.expires_in || 86400; // Default 24 hours
              const expiresAt = new Date(
                Date.now() + expiresIn * 1000
              ).toISOString();

              // Update user object with tenant info from switch response if available
              const updatedUser = responseData.user
                ? {
                    ...currentUser,
                    // Map API response user fields to match our User type structure
                    id: responseData.user.id || currentUser.id,
                    username:
                      responseData.user.userName ||
                      responseData.user.username ||
                      currentUser.username,
                    email: responseData.user.email || currentUser.email,
                    firstName:
                      responseData.user.firstName || currentUser.firstName,
                    middleName:
                      responseData.user.middleName || currentUser.middleName,
                    lastName:
                      responseData.user.lastName || currentUser.lastName,
                    // Preserve tenantId from response
                    tenantId: responseData.user.tenantId || tenant.tenantId,
                  }
                : {
                    ...currentUser,
                    tenantId: tenant.tenantId,
                  };

              // Get fullName utility function to ensure it's calculated correctly
              const { getUserFullName } = await import("@/lib/mock-data");
              const userWithFullName = {
                ...updatedUser,
                fullName: getUserFullName(updatedUser),
              };

              console.log("🔄 Updating auth session with new token...", {
                userTenantId: userWithFullName.tenantId,
                expectedTenantId: tenant.tenantId,
                hasFullName: !!userWithFullName.fullName,
              });

              // Update session - this will trigger Zustand's persist middleware
              authStore.setSession({
                user: userWithFullName,
                token: newToken,
                refreshToken:
                  tokenResponse.refresh_token ||
                  responseData.refreshToken ||
                  refreshToken,
                expiresAt,
              });

              // Verify session was set
              const sessionState = useAuthStore.getState();
              console.log("🔄 Session state after update:", {
                hasToken: !!sessionState.token,
                tokenMatches: sessionState.token === newToken,
                isAuthenticated: sessionState.isAuthenticated,
                hasUser: !!sessionState.user,
                hasRefreshToken: !!sessionState.refreshToken,
              });

              // Wait for Zustand's persist middleware to save (it's async)
              // Give it enough time to complete
              await new Promise((resolve) => setTimeout(resolve, 800));

              // Verify Zustand persisted it
              const { safeLocalStorage: zustandCheckStorage } =
                await import("@/lib/utils");
              const zustandStorage =
                zustandCheckStorage.getItem("auth-storage");
              if (zustandStorage) {
                try {
                  const zustandParsed = JSON.parse(zustandStorage);
                  const zustandToken = zustandParsed.state?.token;
                  console.log("🔄 Zustand persist check:", {
                    hasState: !!zustandParsed.state,
                    hasToken: !!zustandToken,
                    tokenMatches: zustandToken === newToken,
                    tokenPreview: zustandToken?.substring(0, 30) + "...",
                  });

                  if (zustandToken !== newToken) {
                    console.warn(
                      "⚠️ Zustand persist token mismatch, forcing manual save..."
                    );
                    // Zustand didn't persist correctly, manually save
                    await handleTokenPersistence(
                      newToken,
                      tenant,
                      userWithFullName,
                      expiresAt,
                      tokenResponse.refresh_token ||
                        responseData.refreshToken ||
                        refreshToken ||
                        undefined
                    );
                  } else {
                    console.log("✅ Zustand persist worked correctly");
                  }
                } catch (e) {
                  console.error("Failed to check Zustand storage:", e);
                  // Fallback to manual save
                  await handleTokenPersistence(
                    newToken,
                    tenant,
                    userWithFullName,
                    expiresAt,
                    tokenResponse.refresh_token ||
                      responseData.refreshToken ||
                      refreshToken ||
                      undefined
                  );
                }
              } else {
                console.warn("⚠️ Zustand didn't persist, manually saving...");
                // Zustand didn't persist, manually save
                await handleTokenPersistence(
                  newToken,
                  tenant,
                  userWithFullName,
                  expiresAt,
                  tokenResponse.refresh_token ||
                    responseData.refreshToken ||
                    refreshToken ||
                    undefined
                );
              }

              // Update current tenant and show success
              setCurrentTenant(tenant);
              toast.success(`Switched to ${tenant.name || "organization"}`);

              // Reload tenants to ensure list is up to date
              await loadTenants();

              // Final verification before reload
              const finalAuthState = useAuthStore.getState();
              const { safeLocalStorage: finalCheckStorage } =
                await import("@/lib/utils");
              const verifyStorage = finalCheckStorage.getItem("auth-storage");

              let finalToken = newToken;
              let finalTenantId: string | null = null;

              if (verifyStorage) {
                try {
                  const verifyParsed = JSON.parse(verifyStorage);
                  finalToken = verifyParsed.state?.token || newToken;
                  if (finalToken) {
                    try {
                      finalTenantId = getTenantIdFromToken(finalToken);
                    } catch (error) {
                      console.warn(
                        "Failed to get tenant ID from final token:",
                        error
                      );
                    }
                  }
                } catch (error) {
                  console.error("Failed to parse final storage:", error);
                }
              }

              console.log("🔍 Final verification before reload:", {
                zustandToken: finalAuthState.token?.substring(0, 30) + "...",
                localStorageToken: finalToken.substring(0, 30) + "...",
                newToken: newToken.substring(0, 30) + "...",
                tenantIdFromZustandToken: finalAuthState.token
                  ? getTenantIdFromToken(finalAuthState.token)
                  : null,
                tenantIdFromLocalStorageToken: finalTenantId,
                expectedTenantId: tenant.tenantId,
                tokensMatch:
                  finalAuthState.token === finalToken &&
                  finalToken === newToken,
              });

              // Ensure the token in localStorage matches what we expect
              if (finalToken !== newToken) {
                console.warn(
                  "⚠️ Token mismatch detected, forcing one more write..."
                );
                const { safeLocalStorage: sls } = await import("@/lib/utils");
                const currentStorage = sls.getItem("auth-storage");
                if (currentStorage) {
                  try {
                    const parsed = JSON.parse(currentStorage);
                    parsed.state.token = newToken;
                    const updatedState = JSON.stringify(parsed);
                    // Verify it can be parsed
                    JSON.parse(updatedState);
                    sls.setItem("auth-storage", updatedState);
                    console.log("✅ Forced token update in localStorage");
                  } catch (error) {
                    console.error("Failed to force token update:", error);
                    // If JSON is corrupted, clear and rebuild
                    console.warn("⚠️ Clearing corrupted auth storage");
                    sls.removeItem("auth-storage");
                  }
                }
              }

              // Final check before reload - ensure token is in both Zustand and localStorage
              const preReloadCheck = useAuthStore.getState();
              const { safeLocalStorage: preReloadCheckStorage } =
                await import("@/lib/utils");
              const preReloadStorage =
                preReloadCheckStorage.getItem("auth-storage");
              let preReloadToken: string | null = null;

              if (preReloadStorage) {
                try {
                  const parsed = JSON.parse(preReloadStorage);
                  preReloadToken = parsed.state?.token || null;
                } catch (e) {
                  console.error("Failed to parse pre-reload storage:", e);
                }
              }

              console.log("🔍 Pre-reload verification:", {
                zustandToken: preReloadCheck.token?.substring(0, 30) + "...",
                localStorageToken: preReloadToken?.substring(0, 30) + "...",
                expectedToken: newToken.substring(0, 30) + "...",
                zustandMatches: preReloadCheck.token === newToken,
                storageMatches: preReloadToken === newToken,
                isAuthenticated: preReloadCheck.isAuthenticated,
              });

              if (!preReloadCheck.token || preReloadCheck.token !== newToken) {
                console.error(
                  "❌ Token mismatch before reload! Retrying session update..."
                );
                // Retry setting the session
                authStore.setSession({
                  user: currentUser,
                  token: newToken,
                  refreshToken: tokenResponse.refresh_token || refreshToken,
                  expiresAt,
                });
                // Wait a bit more
                await new Promise((resolve) => setTimeout(resolve, 200));
              }

              // Final check - verify token is in localStorage before reload
              const { safeLocalStorage: finalStorage } =
                await import("@/lib/utils");
              const finalCheck = finalStorage.getItem("auth-storage");
              if (finalCheck) {
                try {
                  const finalParsed = JSON.parse(finalCheck);
                  const finalToken = finalParsed.state?.token;
                  if (finalToken === newToken) {
                    console.log(
                      "✅ Final verification: Token is in localStorage",
                      {
                        tokenPreview: finalToken.substring(0, 30) + "...",
                        hasUser: !!finalParsed.state?.user,
                        hasRefreshToken: !!finalParsed.state?.refreshToken,
                      }
                    );
                  } else {
                    console.error(
                      "❌ Final verification failed: Token mismatch in localStorage",
                      {
                        expected: newToken.substring(0, 30) + "...",
                        actual: finalToken?.substring(0, 30) + "...",
                      }
                    );
                    // Force one more write with a longer delay
                    await new Promise((resolve) => setTimeout(resolve, 200));
                    const latestState = useAuthStore.getState();
                    const forceState = {
                      state: {
                        user: latestState.user || userWithFullName,
                        token: newToken,
                        refreshToken:
                          latestState.refreshToken ||
                          tokenResponse.refresh_token ||
                          refreshToken,
                        expiresAt: latestState.expiresAt || expiresAt,
                        isAuthenticated: true,
                        isLoading: false,
                      },
                      version: 0,
                    };
                    finalStorage.setItem(
                      "auth-storage",
                      JSON.stringify(forceState)
                    );
                    console.log("✅ Forced final write to localStorage");
                    // Wait a bit more after forced write
                    await new Promise((resolve) => setTimeout(resolve, 200));
                  }
                } catch (e) {
                  console.error("Failed to verify final storage:", e);
                }
              } else {
                console.error("❌ Final check: localStorage is empty!");
                // Force write one more time with retry
                const latestState = useAuthStore.getState();
                const forceState = {
                  state: {
                    user: latestState.user || userWithFullName,
                    token: newToken,
                    refreshToken:
                      latestState.refreshToken ||
                      tokenResponse.refresh_token ||
                      refreshToken,
                    expiresAt: latestState.expiresAt || expiresAt,
                    isAuthenticated: true,
                    isLoading: false,
                  },
                  version: 0,
                };
                finalStorage.setItem(
                  "auth-storage",
                  JSON.stringify(forceState)
                );
                console.log("✅ Forced write to empty localStorage");
                // Wait after forced write
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Verify it was written
                const verifyAfterForce = finalStorage.getItem("auth-storage");
                if (verifyAfterForce) {
                  console.log("✅ Verified forced write succeeded");
                } else {
                  console.error(
                    "❌ Forced write failed - localStorage might be disabled or full"
                  );
                }
              }

              // Final verification - read localStorage one more time right before reload
              const absoluteFinalCheck = finalStorage.getItem("auth-storage");
              if (absoluteFinalCheck) {
                try {
                  const absoluteFinal = JSON.parse(absoluteFinalCheck);
                  console.log("🔍 Absolute final check before reload:", {
                    hasToken: !!absoluteFinal.state?.token,
                    tokenPreview:
                      absoluteFinal.state?.token?.substring(0, 50) + "...",
                    hasUser: !!absoluteFinal.state?.user,
                    hasRefreshToken: !!absoluteFinal.state?.refreshToken,
                    isAuthenticated: absoluteFinal.state?.isAuthenticated,
                  });

                  if (
                    !absoluteFinal.state?.token ||
                    absoluteFinal.state.token !== newToken
                  ) {
                    console.error(
                      "❌ CRITICAL: Token not in localStorage before reload!"
                    );
                    // Don't reload if token isn't there
                    toast.error("Failed to save session. Please try again.");
                    setIsSwitchingTenant(false);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("switching-tenant");
                    }
                    return;
                  }
                } catch (e) {
                  console.error(
                    "❌ CRITICAL: Failed to parse localStorage before reload:",
                    e
                  );
                  toast.error("Session data corrupted. Please login again.");
                  setIsSwitchingTenant(false);
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("switching-tenant");
                  }
                  return;
                }
              } else {
                console.error(
                  "❌ CRITICAL: localStorage is empty before reload!"
                );
                toast.error("Failed to save session. Please try again.");
                setIsSwitchingTenant(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("switching-tenant");
                }
                return;
              }

              // Clear the switching flag right before reload
              if (typeof window !== "undefined") {
                localStorage.removeItem("switching-tenant");
              }

              // Reload the page to update tenant context
              // Use a small delay to ensure localStorage is written and avoid infinite loops
              console.log(
                "🔄 All checks passed, reloading page with new tenant context..."
              );
              setTimeout(() => {
                // Use replace to avoid adding to history
                window.location.replace(window.location.pathname);
              }, 300);

              return; // Exit early - we've handled the refresh flow
            } else {
              console.error("❌ No current user found in auth store");
              toast.error("User session not found. Please login again.");
              setIsSwitchingTenant(false);
              if (typeof window !== "undefined") {
                localStorage.removeItem("switching-tenant");
              }
              return;
            }
          } catch (error: any) {
            console.error(
              "Failed to refresh token after tenant switch:",
              error
            );

            // Log the full error details
            if (error?.response) {
              console.error("Refresh token error response:", error.response);
            }
            if (error?.message) {
              console.error("Refresh token error message:", error.message);
            }

            toast.error(
              error?.message ||
                "Failed to refresh token. Please try logging in again."
            );
            setIsSwitchingTenant(false);
            if (typeof window !== "undefined") {
              localStorage.removeItem("switching-tenant");
            }
            return;
          }
        } else if (accessToken && accessToken !== "SWITCH_TENANT") {
          // Real token was returned (backend should return this when refresh token is in header)
          console.log(
            "✅ Backend returned real token with refresh token in header"
          );
          const newToken = accessToken;

          // Verify the new token contains the correct tenant_id
          try {
            const tenantIdInToken = getTenantIdFromToken(newToken);
            console.log("🔍 Tenant ID verification:", {
              expected: tenant.tenantId,
              inToken: tenantIdInToken,
              matches: tenantIdInToken === tenant.tenantId,
            });

            if (tenantIdInToken !== tenant.tenantId) {
              console.warn("⚠️ Token tenant ID doesn't match expected", {
                expected: tenant.tenantId,
                actual: tenantIdInToken,
              });
            }
          } catch (error) {
            console.warn("Failed to verify tenant ID in new token:", error);
          }

          if (currentUser) {
            const expiresIn = responseData.expiresIn || 86400;
            const expiresAt = new Date(
              Date.now() + expiresIn * 1000
            ).toISOString();

            // Use the user from the response if available (it has the updated tenantId)
            // Otherwise merge the tenantId into the current user
            const updatedUser = responseData.user
              ? {
                  ...currentUser,
                  // Map API response user fields to match our User type structure
                  id: responseData.user.id || currentUser.id,
                  username:
                    responseData.user.userName ||
                    responseData.user.username ||
                    currentUser.username,
                  email: responseData.user.email || currentUser.email,
                  firstName:
                    responseData.user.firstName || currentUser.firstName,
                  middleName:
                    responseData.user.middleName || currentUser.middleName,
                  lastName: responseData.user.lastName || currentUser.lastName,
                  // Preserve tenantId from response
                  tenantId: responseData.user.tenantId || tenant.tenantId,
                }
              : {
                  ...currentUser,
                  tenantId: tenant.tenantId,
                };

            // Get fullName utility function to ensure it's calculated correctly
            const { getUserFullName } = await import("@/lib/mock-data");
            const userWithFullName = {
              ...updatedUser,
              fullName: getUserFullName(updatedUser),
            };

            console.log("🔄 Updating session with new token and user:", {
              hasUser: !!userWithFullName,
              tenantId: userWithFullName.tenantId,
              expectedTenantId: tenant.tenantId,
              userEmail: userWithFullName.email,
            });

            authStore.setSession({
              user: userWithFullName,
              token: newToken,
              refreshToken:
                responseData.refreshToken || authStore.refreshToken || "",
              expiresAt,
            });

            // Immediately verify the token was set in the store
            const immediateState = useAuthStore.getState();
            console.log("🔍 Immediate verification after setSession:", {
              tokenSet: immediateState.token === newToken,
              tokenLength: immediateState.token?.length,
              tokenPreview: immediateState.token?.substring(0, 50) + "...",
              expectedTokenPreview: newToken.substring(0, 50) + "...",
              hasUser: !!immediateState.user,
              userTenantId: (immediateState.user as any)?.tenantId,
            });

            if (immediateState.token !== newToken) {
              console.error("❌ CRITICAL: Token mismatch after setSession!");
              console.error({
                expected: newToken.substring(0, 50) + "...",
                actual: immediateState.token?.substring(0, 50) + "...",
              });
              // Force set it again
              authStore.setSession({
                user: userWithFullName,
                token: newToken,
                refreshToken:
                  responseData.refreshToken || authStore.refreshToken || "",
                expiresAt,
              });
            }

            // Continue with persistence logic
            await handleTokenPersistence(
              newToken,
              tenant,
              userWithFullName,
              expiresAt,
              responseData.refreshToken || authStore.refreshToken || undefined
            );

            // Clear the switching flag right before reload
            if (typeof window !== "undefined") {
              localStorage.removeItem("switching-tenant");
            }

            // Update current tenant and show success
            setCurrentTenant(tenant);
            toast.success(`Switched to ${tenant.name || "organization"}`);

            // Reload tenants to ensure list is up to date
            await loadTenants();

            // Final verification before reload
            const finalAuthState = useAuthStore.getState();
            const { safeLocalStorage } = await import("@/lib/utils");
            const verifyStorage = safeLocalStorage.getItem("auth-storage");

            let finalToken = newToken;
            let finalTenantId: string | null = null;

            if (verifyStorage) {
              try {
                const verifyParsed = JSON.parse(verifyStorage);
                finalToken = verifyParsed.state?.token || newToken;
                if (finalToken) {
                  try {
                    finalTenantId = getTenantIdFromToken(finalToken);
                  } catch (error) {
                    console.warn(
                      "Failed to get tenant ID from final token:",
                      error
                    );
                  }
                }
              } catch (error) {
                console.error("Failed to parse final storage:", error);
              }
            }

            console.log("🔍 Final verification before reload:", {
              zustandToken: finalAuthState.token?.substring(0, 30) + "...",
              localStorageToken: finalToken.substring(0, 30) + "...",
              newToken: newToken.substring(0, 30) + "...",
              tenantIdFromZustandToken: finalAuthState.token
                ? getTenantIdFromToken(finalAuthState.token)
                : null,
              tenantIdFromLocalStorageToken: finalTenantId,
              expectedTenantId: tenant.tenantId,
              tokensMatch:
                finalAuthState.token === finalToken && finalToken === newToken,
            });

            // Ensure the token in localStorage matches what we expect
            if (
              finalToken !== newToken ||
              (finalTenantId && finalTenantId !== tenant.tenantId)
            ) {
              console.warn(
                "⚠️ Token mismatch detected, forcing one more write..."
              );
              const { safeLocalStorage: sls } = await import("@/lib/utils");
              const currentStorage = sls.getItem("auth-storage");
              if (currentStorage) {
                try {
                  const parsed = JSON.parse(currentStorage);
                  parsed.state.token = newToken;
                  sls.setItem("auth-storage", JSON.stringify(parsed));
                  console.log("✅ Forced token update in localStorage");
                } catch (error) {
                  console.error("Failed to force token update:", error);
                }
              }
            }

            // Final check: Ensure token is correctly saved before reload
            const preReloadState = useAuthStore.getState();
            const preReloadStorageCheck =
              safeLocalStorage.getItem("auth-storage");

            console.log("🔍 Pre-reload final check:", {
              zustandTokenMatches: preReloadState.token === newToken,
              zustandTokenPreview:
                preReloadState.token?.substring(0, 50) + "...",
              newTokenPreview: newToken.substring(0, 50) + "...",
              hasLocalStorage: !!preReloadStorageCheck,
            });

            if (preReloadStorageCheck) {
              try {
                const parsed = JSON.parse(preReloadStorageCheck);
                const storedToken = parsed.state?.token;
                console.log("🔍 Pre-reload localStorage token check:", {
                  storedTokenMatches: storedToken === newToken,
                  storedTokenPreview: storedToken?.substring(0, 50) + "...",
                  newTokenPreview: newToken.substring(0, 50) + "...",
                });

                // If token doesn't match, force one final save
                if (storedToken !== newToken) {
                  console.warn(
                    "⚠️ Token mismatch in localStorage before reload, forcing save..."
                  );
                  parsed.state.token = newToken;
                  parsed.state.refreshToken =
                    responseData.refreshToken || authStore.refreshToken || "";
                  parsed.state.user = userWithFullName;
                  parsed.state.expiresAt = expiresAt;
                  parsed.state.isAuthenticated = true;
                  safeLocalStorage.setItem(
                    "auth-storage",
                    JSON.stringify(parsed)
                  );
                  console.log("✅ Forced final token save before reload");
                }
              } catch (e) {
                console.error(
                  "Failed to verify localStorage before reload:",
                  e
                );
              }
            }

            // Reload the page to update tenant context
            // Use a longer delay to ensure localStorage is written and Zustand persists
            setTimeout(() => {
              console.log("🔄 Reloading page with new tenant context...");
              // Use replace to avoid adding to history
              window.location.replace(window.location.pathname);
            }, 500);
          } else {
            toast.error("User session not found. Please login again.");
          }
        } else {
          toast.error("Invalid response from server. Please try again.");
        }
      } else {
        toast.error(
          result.error?.message || "Failed to switch tenant. Please try again."
        );
      }
    } catch (error) {
      console.error("Error switching tenant:", error);
      toast.error("Failed to switch tenant");
      setIsSwitchingTenant(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("switching-tenant");
      }
    }
  };

  const pageTitle = getPageTitle(pathname ?? "");

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Companies, Vessels, Applications..."
            className="w-80 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <span className="font-medium">New user registered</span>
            <span className="text-sm text-muted-foreground">
              John Doe created an account
            </span>
            <span className="text-xs text-muted-foreground">2 mins ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <span className="font-medium">Role updated</span>
            <span className="text-sm text-muted-foreground">
              Admin role permissions changed
            </span>
            <span className="text-xs text-muted-foreground">1 hour ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
            <span className="font-medium">Workspace created</span>
            <span className="text-sm text-muted-foreground">
              New workspace &quot;Fleet Management&quot; added
            </span>
            <span className="text-xs text-muted-foreground">3 hours ago</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-primary">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tenant Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            disabled={isLoadingTenants}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="max-w-[120px] truncate">
              {isLoadingTenants
                ? "Loading..."
                : currentTenant?.name || "Select Organization"}
            </span>
            {tenants.length > 1 && (
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Organization</DropdownMenuLabel>
          {isLoadingTenants ? (
            <DropdownMenuItem disabled>Loading tenants...</DropdownMenuItem>
          ) : tenants.length === 0 ? (
            <DropdownMenuItem disabled>
              No organizations available
            </DropdownMenuItem>
          ) : (
            <>
              {tenants.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Switch Organization
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.tenantId}
                  onClick={() => {
                    if (
                      tenants.length > 1 &&
                      currentTenant?.tenantId !== tenant.tenantId
                    ) {
                      handleSwitchTenant(tenant);
                    }
                  }}
                  className={`flex items-center justify-between ${
                    currentTenant?.tenantId === tenant.tenantId
                      ? "bg-accent"
                      : tenants.length === 1
                        ? "cursor-default"
                        : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {tenant.name || "Unnamed"}
                    </span>
                    {tenant.role && (
                      <span className="text-xs text-muted-foreground">
                        {tenant.role}
                      </span>
                    )}
                  </div>
                  {currentTenant?.tenantId === tenant.tenantId && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {getInitials(user?.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:block text-sm font-medium">
          {user?.fullName || "John Doe"}
        </span>
      </div>
    </header>
  );
}
