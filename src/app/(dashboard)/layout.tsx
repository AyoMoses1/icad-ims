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
  } = useAuthStore();
  const { setWorkspaces, setCurrentWorkspaceById, currentWorkspaceId } =
    useWorkspaceStore();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Small delay to allow hydration
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isAuthenticated) {
        router.replace("/auth/signin");
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, router, setLoading]);

  // Load workspaces when authenticated
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        const result = await response.json();
        if (result.success) {
          setWorkspaces(result.data);
          // Set first workspace as current if none selected
          if (!currentWorkspaceId && result.data.length > 0) {
            setCurrentWorkspaceById(result.data[0].workspaceId);
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

  // Show loading state
  if (authLoading) {
    return <LoadingPage message="Loading..." />;
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return <LoadingPage message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}


