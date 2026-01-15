"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Sidebar, Header } from "@/components/dashboard";
import { useAuthStore, useWorkspaceStore, useUIStore } from "@/store";
import { LoadingPage } from "@/components/shared";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    setLoading,
    token,
  } = useAuthStore();
  const { setWorkspaces, setCurrentWorkspaceById, currentWorkspaceId } =
    useWorkspaceStore();

  // Check authentication on mount - wait for hydration to complete
  useEffect(() => {
    console.log("Dashboard Layout - Auth Check:", {
      authLoading,
      isAuthenticated,
      hasToken: !!token,
    });

    // Check if we're in the middle of a tenant switch by checking localStorage
    // During tenant switch, we write a flag to prevent redirect
    const isSwitchingTenant =
      typeof window !== "undefined" &&
      localStorage.getItem("switching-tenant") === "true";

    if (isSwitchingTenant) {
      console.log("🔄 Tenant switch in progress, skipping auth check");
      // Clear the flag after a delay
      setTimeout(() => {
        localStorage.removeItem("switching-tenant");
      }, 2000);
      return;
    }

    // If loading takes too long (more than 3 seconds), force it to false
    // This handles cases where rehydration might be stuck
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.warn("Auth loading taking too long, forcing completion");
        const currentState = useAuthStore.getState();
        if (!currentState.token || !currentState.user) {
          // No valid session, redirect to login
          useAuthStore.getState().setLoading(false);
          router.replace("/auth/signin");
        } else {
          // Has session, just set loading to false
          useAuthStore.getState().setLoading(false);
        }
      }
    }, 3000);

    // Wait for auth store to finish hydrating from localStorage
    if (!authLoading) {
      // Small delay to allow state to settle after navigation from login or tenant switch
      const timer = setTimeout(() => {
        const currentState = useAuthStore.getState();
        console.log("Dashboard Layout - State Check:", {
          isAuthenticated: currentState.isAuthenticated,
          hasToken: !!currentState.token,
          user: currentState.user?.email,
        });

        // Double-check we're not switching tenants
        const stillSwitching =
          typeof window !== "undefined" &&
          localStorage.getItem("switching-tenant") === "true";

        if (stillSwitching) {
          console.log("🔄 Still switching tenant, skipping redirect");
          return;
        }

        if (!currentState.isAuthenticated || !currentState.token) {
          console.log("Dashboard Layout - Redirecting to signin");
          router.replace("/auth/signin");
        }
      }, 200); // Increased delay to allow tenant switch to complete

      return () => {
        clearTimeout(timer);
        clearTimeout(timeoutId);
      };
    }

    return () => clearTimeout(timeoutId);
  }, [authLoading, router, isAuthenticated, token]);

  // Load workspaces when authenticated
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        const result = await response.json();
        if (result.success && result.data) {
          // Handle both paginated response (with items) and direct array response
          const workspacesData = Array.isArray(result.data)
            ? result.data
            : result.data.items || [];
          setWorkspaces(workspacesData);
          // Set first workspace as current if none selected
          if (!currentWorkspaceId && workspacesData.length > 0) {
            setCurrentWorkspaceById(workspacesData[0].workspaceId);
          }
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      }
    };

    if (isAuthenticated) {
      loadWorkspaces();
    }
  }, [
    isAuthenticated,
    setWorkspaces,
    setCurrentWorkspaceById,
    currentWorkspaceId,
  ]);

  // Show loading state while hydrating
  if (authLoading) {
    return <LoadingPage message="Loading..." />;
  }

  // Don't render anything while checking auth or redirecting
  if (!isAuthenticated || !token) {
    return <LoadingPage message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-80">
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
