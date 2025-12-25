"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart,
  Calendar,
  Users,
  Building,
  Briefcase,
  Package,
  ShoppingCart,
  CreditCard,
  Bell,
  Mail,
  MessageSquare,
  Video,
  Music,
  Book,
  BookOpen,
  GraduationCap,
  Award,
  Star,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Activity,
  PieChart,
  Grid,
  List,
  Layers,
  Box,
  Archive,
  Folder,
  File,
  Database,
  Server,
  Cloud,
  Globe,
  Map,
  Navigation,
  Compass,
  ImageIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useWorkspaceStore, useUIStore } from "@/store";
import { Workspace, WorkspaceResource, PaginatedResponse } from "@/types";
import { apiGet } from "@/lib/api-client";
import {
  getWorkspacesFromToken,
  getDefaultWorkspaceId,
  type WorkspaceFromToken,
} from "@/lib/token-utils";
import { workspacePermissionService } from "@/lib/services/workspace-permission-service";

interface MenuResource {
  resourceId: string;
  name: string;
  url: string;
  parentId: string | null;
  children: MenuResource[];
}

interface WorkspaceMenu {
  workspaceId: string;
  workspaceName: string;
  workspaceCode: string;
  resources: MenuResource[];
}

// Array of available icons for random assignment
const availableIcons = [
  LayoutDashboard,
  FileText,
  Settings,
  BarChart,
  Calendar,
  Users,
  Building,
  Briefcase,
  Package,
  ShoppingCart,
  CreditCard,
  Bell,
  Mail,
  MessageSquare,
  ImageIcon,
  Video,
  Music,
  Book,
  BookOpen,
  GraduationCap,
  Award,
  Star,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Activity,
  PieChart,
  Grid,
  List,
  Layers,
  Box,
  Archive,
  Folder,
  File,
  Database,
  Server,
  Cloud,
  Globe,
  Map,
  Navigation,
  Compass,
];

// Deterministic icon selection helpers (menus/workspaces always get same icon)
const getIconForKey = (key: string) => {
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return availableIcons[hash % availableIcons.length];
};

const getIconForResource = (resourceId: string) => getIconForKey(resourceId);
const getIconForWorkspace = (workspaceKey: string) =>
  getIconForKey(workspaceKey);

// Helper function to remove /api prefix from URLs for navigation
const normalizeResourceUrl = (url: string | null | undefined): string => {
  if (!url || url === "#") return "#";
  // Special case: /api/s should be /workspaces
  if (url === "/api/s" || url === "/s") {
    return "/workspaces";
  }
  // Remove /api prefix if present
  if (url.startsWith("/api/")) {
    return url.replace("/api", "");
  }
  return url;
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace, setWorkspaces } =
    useWorkspaceStore();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([]);
  const [workspaceMenus, setWorkspaceMenus] = useState<WorkspaceMenu[]>([]);

  // Load menu immediately after login - menu endpoint contains workspaces user has access to
  // Also initialize workspaces from token as per integration guide
  useEffect(() => {
    if (user) {
      // Try to initialize workspaces from token first (as per integration guide)
      const { token } = useAuthStore.getState();
      if (token) {
        try {
          const workspacesFromToken = getWorkspacesFromToken(token);
          if (workspacesFromToken.length > 0) {
            const defaultWorkspaceId = getDefaultWorkspaceId(token);

            // Convert token workspaces to Workspace format
            const workspaces: Workspace[] = workspacesFromToken.map((ws) => ({
              workspaceId: ws.workspaceId,
              name: ws.workspaceName,
              description: "",
              isActive: true,
              isDeleted: false,
              color: undefined,
              createdBy: "",
              createdAt: "",
              updatedAt: "",
            }));

            setWorkspaces(workspaces);

            // Set default workspace and fetch permissions
            if (defaultWorkspaceId) {
              const defaultWorkspace =
                workspaces.find((w) => w.workspaceId === defaultWorkspaceId) ||
                workspaces[0];
              if (defaultWorkspace) {
                setCurrentWorkspace(defaultWorkspace);
                // Fetch permissions for default workspace
                workspacePermissionService
                  .getWorkspacePermissions(defaultWorkspace.workspaceId)
                  .catch((error) => {
                    console.error(
                      "Failed to fetch permissions for default workspace:",
                      error
                    );
                  });
              }
            }
          }
        } catch (error) {
          console.error("Failed to initialize workspaces from token:", error);
        }
      }

      // Also load menu (this might have more detailed workspace info)
      loadMenu();
    }
  }, [user]);

  const loadMenu = async () => {
    try {
      const result = await apiGet<
        WorkspaceMenu[] | PaginatedResponse<WorkspaceMenu>
      >(`/api/menu`);
      if (result.success && result.data) {
        // Handle both direct array and PaginatedResponse formats
        const menuData = Array.isArray(result.data)
          ? result.data
          : result.data.items || [];

        // Store the full menu data
        setWorkspaceMenus(menuData);

        // Also update the workspace store with workspaces from menu
        const workspacesFromMenu: Workspace[] = menuData.map((menu) => ({
          workspaceId: menu.workspaceId,
          name: menu.workspaceName,
          description: "",
          isActive: true,
          isDeleted: false,
          color: undefined,
          createdBy: "",
          createdAt: "",
          updatedAt: "",
        }));
        setWorkspaces(workspacesFromMenu);
      } else {
        setWorkspaceMenus([]);
        setWorkspaces([]);
      }
    } catch (error) {
      console.error("Failed to load menu", error);
      setWorkspaceMenus([]);
      setWorkspaces([]);
    }
  };

  // Only allow one workspace expanded/highlighted at a time to avoid multiple
  // items looking active when the user switches between them.
  const toggleWorkspace = async (workspaceId: string) => {
    const wasExpanded = expandedWorkspaces.includes(workspaceId);
    setExpandedWorkspaces((prev) =>
      prev.includes(workspaceId) ? [] : [workspaceId]
    );

    // When workspace is expanded, fetch permissions for that workspace (as per integration guide)
    if (!wasExpanded) {
      try {
        await workspacePermissionService.getWorkspacePermissions(
          workspaceId,
          false
        );
      } catch (error) {
        console.error(
          `Failed to fetch permissions for workspace ${workspaceId}:`,
          error
        );
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLogout = async () => {
    try {
      console.log("Logout - Calling /connect/logout endpoint...");
      // Call logout endpoint
      const { apiPostAuth } = await import("@/lib/api-client");
      await apiPostAuth("/connect/logout", {});
      console.log("Logout - API call successful");
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout - API call failed:", error);
    } finally {
      // Always clear local session and redirect
      console.log("Logout - Clearing local session and redirecting...");
      logout();
      router.push("/auth/signin");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "#") return false;
    return pathname.startsWith(href);
  };

  const isChildActive = (children?: { title: string; href: string }[]) => {
    if (!children) return false;
    return children.some((child) => isActive(child.href));
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLink = ({
    item,
    isChild = false,
    icon,
  }: {
    item: { title: string; href: string };
    isChild?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    const active = isActive(item.href);
    const Icon = icon;

    if (isChild) {
      return (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ml-6 relative",
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-sidebar-muted-foreground/30",
            "before:content-['']",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted"
          )}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-muted-foreground/30" />
          {item.title}
        </Link>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-muted"
        )}
        onClick={() => setMobileSidebarOpen(false)}
      >
        {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
        <span>{item.title}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="block">
          <div className="w-full rounded-lg bg-white flex items-center justify-center overflow-hidden p-3">
            <Image
              src="/logo.png"
              alt="NIMASA Logo"
              width={240}
              height={80}
              className="object-contain w-full h-auto"
            />
          </div>
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 sidebar-scroll">
        {/* System Menu Items */}
        <div className="space-y-1 mb-6">
          <NavLink
            item={{ title: "Invitations", href: "/invitations" }}
            icon={Mail}
          />
        </div>

        {/* Workspace Label */}
        <div className="px-3 mb-3">
          <span className="text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider">
            Workspace
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {/* Workspaces with their menus from /api/menu endpoint */}
          {workspaceMenus.length > 0 && (
            <>
              {workspaceMenus.map((workspaceMenu) => {
                const workspaceResources = workspaceMenu.resources || [];
                const isWorkspaceExpanded = expandedWorkspaces.includes(
                  workspaceMenu.workspaceId
                );
                const isWorkspaceActive =
                  currentWorkspace?.workspaceId === workspaceMenu.workspaceId;

                // Create workspace object for setCurrentWorkspace
                const workspace: Workspace = {
                  workspaceId: workspaceMenu.workspaceId,
                  name: workspaceMenu.workspaceName,
                  description: "",
                  isActive: true,
                  isDeleted: false,
                  color: undefined,
                  createdBy: "",
                  createdAt: "",
                  updatedAt: "",
                };

                return (
                  <div key={workspaceMenu.workspaceId}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          setCurrentWorkspace(workspace);
                          await toggleWorkspace(workspaceMenu.workspaceId);

                          // Fetch permissions when workspace is selected (as per integration guide)
                          try {
                            await workspacePermissionService.getWorkspacePermissions(
                              workspaceMenu.workspaceId,
                              false
                            );
                            // Emit workspace changed event for other components
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new CustomEvent("workspaceChanged", {
                                  detail: {
                                    workspaceId: workspaceMenu.workspaceId,
                                    workspace,
                                  },
                                })
                              );
                            }
                          } catch (error) {
                            console.error(
                              `Failed to fetch permissions for workspace ${workspaceMenu.workspaceId}:`,
                              error
                            );
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between flex-1 px-3 py-2.5 text-sm rounded-lg transition-colors",
                          isWorkspaceActive || isWorkspaceExpanded
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-muted"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {(() => {
                            const WorkspaceIcon = getIconForWorkspace(
                              workspaceMenu.workspaceId ||
                                workspaceMenu.workspaceName
                            );
                            return (
                              <div
                                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `#6366F11A`, // light tint
                                  color: "#6366F1",
                                }}
                              >
                                <WorkspaceIcon className="h-4 w-4" />
                              </div>
                            );
                          })()}
                          <span className="text-left truncate">
                            {workspaceMenu.workspaceName}
                          </span>
                        </div>
                        {isWorkspaceExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      <Link
                        href={`/workspaces/${workspaceMenu.workspaceId}`}
                        onClick={() => {
                          setCurrentWorkspace(workspace);
                          setMobileSidebarOpen(false);
                        }}
                        className={cn(
                          "px-2 py-2.5 text-xs rounded-lg transition-colors",
                          "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted",
                          "flex items-center justify-center"
                        )}
                        title="Manage workspace"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </div>
                    {isWorkspaceExpanded && workspaceResources.length > 0 && (
                      <div className="mt-1 space-y-1 ml-2">
                        {workspaceResources.map((resource) => {
                          const hasChildren =
                            resource.children && resource.children.length > 0;
                          const isResourceExpanded = expandedItems.includes(
                            resource.resourceId
                          );

                          return (
                            <div key={resource.resourceId}>
                              {hasChildren ? (
                                <>
                                  <button
                                    onClick={() =>
                                      toggleExpand(resource.resourceId)
                                    }
                                    className={cn(
                                      "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ml-6 relative",
                                      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-sidebar-muted-foreground/30",
                                      isResourceExpanded ||
                                        isChildActive(
                                          resource.children.map((c) => ({
                                            title: c.name,
                                            href: c.url || "#",
                                          }))
                                        )
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted"
                                    )}
                                  >
                                    <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-muted-foreground/30" />
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const ResourceIcon = getIconForResource(
                                          resource.resourceId
                                        );
                                        return (
                                          <ResourceIcon className="h-4 w-4 flex-shrink-0" />
                                        );
                                      })()}
                                      <span className="text-left">
                                        {resource.name}
                                      </span>
                                    </div>
                                    {isResourceExpanded ? (
                                      <ChevronDown className="h-3 w-3 flex-shrink-0 ml-2" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 flex-shrink-0 ml-2" />
                                    )}
                                  </button>
                                  {isResourceExpanded && (
                                    <div className="mt-1 space-y-1">
                                      {resource.children.map((child) => {
                                        const ChildIcon = getIconForResource(
                                          child.resourceId
                                        );
                                        return (
                                          <NavLink
                                            key={child.resourceId}
                                            item={{
                                              title: child.name,
                                              href: normalizeResourceUrl(child.url),
                                            }}
                                            isChild
                                            icon={ChildIcon}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                (() => {
                                  const ResourceIcon = getIconForResource(
                                    resource.resourceId
                                  );
                                  return (
                                    <NavLink
                                      item={{
                                        title: resource.name,
                                        href: normalizeResourceUrl(resource.url),
                                      }}
                                      isChild
                                      icon={ResourceIcon}
                                    />
                                  );
                                })()
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isWorkspaceExpanded && workspaceResources.length === 0 && (
                      <div className="ml-6 px-3 py-2 text-xs text-sidebar-muted-foreground">
                        No menu items available
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-6 h-auto hover:bg-sidebar-muted text-sidebar-foreground"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {user?.fullName || "User"}
                </span>
                <span className="text-xs text-sidebar-muted-foreground">
                  {user?.email || "user@example.com"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
