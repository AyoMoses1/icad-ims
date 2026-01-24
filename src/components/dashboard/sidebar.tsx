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
  Shield,
  FolderTree,
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
import {
  Workspace,
  WorkspaceResource,
  PaginatedResponse,
  UserInfo,
} from "@/types";
import { apiGet, apiGetAuth } from "@/lib/api-client";
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
  workspaceUrl?: string;
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
// Also handles temporary redirect for Waste Management workspace to localhost:3002
const normalizeResourceUrl = (
  url: string | null | undefined,
  workspaceName?: string
): string => {
  if (!url || url === "#") return "#";
  
  // Temporary: Redirect Waste Management workspace to localhost:3002
  if (workspaceName?.toLowerCase() === "waste management") {
    return "http://localhost:3002";
  }
  
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

// Helper function to check if user is OWNER of a workspace
// Based on the user info response structure:
// roles: [{ workspaceId: "...", tenants: [{ roles: [{ role: "OWNER" }] }] }]
const isWorkspaceOwner = (
  userInfo: UserInfo | null,
  workspaceId: string
): boolean => {
  if (!userInfo) {
    return false;
  }

  // Access roles from userInfo - it's a complex structure, not just string[]
  const roles = (userInfo as any).roles;

  if (!roles || !Array.isArray(roles)) {
    return false;
  }

  // Find the role entry for this workspace (compare as strings to ensure exact match)
  // Normalize UUIDs by trimming and converting to lowercase for comparison
  const normalizedWorkspaceId = String(workspaceId).trim().toLowerCase();

  const workspaceRole = roles.find((role: any) => {
    const roleWorkspaceId = String(role.workspaceId || "")
      .trim()
      .toLowerCase();
    return roleWorkspaceId === normalizedWorkspaceId;
  });

  if (!workspaceRole) {
    return false;
  }

  if (!workspaceRole.tenants || !Array.isArray(workspaceRole.tenants)) {
    return false;
  }

  // Check if any tenant has OWNER role
  const isOwner = workspaceRole.tenants.some((tenant: any) => {
    if (!tenant.roles || !Array.isArray(tenant.roles)) {
      return false;
    }
    return tenant.roles.some((role: any) => {
      const roleValue = String(role.role || role)
        .trim()
        .toUpperCase();
      return roleValue === "OWNER";
    });
  });

  return isOwner;
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Load menu immediately after login - menu endpoint contains workspaces user has access to
  // Also initialize workspaces from token as per integration guide
  useEffect(() => {
    if (user) {
      // Fetch user info to get roles structure for workspace ownership check
      const fetchUserInfo = async () => {
        try {
          const { token } = useAuthStore.getState();
          if (token) {
            const info = await apiGetAuth<UserInfo>("/connect/userinfo");
            setUserInfo(info);
          }
        } catch (error) {
          console.error("Failed to fetch user info:", error);
        }
      };

      // Try to initialize workspaces from token first (as per integration guide)
      const { token } = useAuthStore.getState();
      if (token) {
        try {
          const workspacesFromToken = getWorkspacesFromToken(token);
          if (workspacesFromToken.length > 0) {
            const defaultWorkspaceId = getDefaultWorkspaceId(token);

            // Convert token workspaces to Workspace format, preserving workspaceCode
            const workspaces: (Workspace & { workspaceCode?: string })[] =
              workspacesFromToken.map((ws) => ({
                workspaceId: ws.workspaceId,
                name: ws.workspaceName,
                description: "",
                isActive: true,
                isDeleted: false,
                color: undefined,
                createdBy: "",
                createdAt: "",
                updatedAt: "",
                workspaceCode: ws.workspaceCode, // Preserve workspaceCode for routing
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

      // Fetch user info and load menu
      fetchUserInfo();
      loadMenu();
    }
  }, [user]);

  const loadMenu = async () => {
    try {
      // Load both menu and all workspaces to ensure we show all workspaces
      const [menuResult, workspacesResult] = await Promise.all([
        apiGet<WorkspaceMenu[] | PaginatedResponse<WorkspaceMenu>>(`/api/menu`),
        apiGet<PaginatedResponse<Workspace>>(
          `/api/workspaces?includeInactive=true`
        ),
      ]);

      // Handle menu data
      if (menuResult.success && menuResult.data) {
        const menuData = Array.isArray(menuResult.data)
          ? menuResult.data
          : menuResult.data.items || [];
        setWorkspaceMenus(menuData);
      } else {
        setWorkspaceMenus([]);
      }

      // Handle all workspaces - merge with menu data to ensure all workspaces are shown
      if (workspacesResult.success && workspacesResult.data) {
        const allWorkspaces = Array.isArray(workspacesResult.data)
          ? workspacesResult.data
          : workspacesResult.data.items || [];

        // Filter out deleted workspaces
        const validWorkspaces = allWorkspaces.filter((ws) => !ws.isDeleted);

        // Create a map of workspaceId to menu data for quick lookup
        const menuMap: Record<string, WorkspaceMenu> = {};
        if (menuResult.success && menuResult.data) {
          const menuData = Array.isArray(menuResult.data)
            ? menuResult.data
            : (menuResult.data as PaginatedResponse<WorkspaceMenu>).items || [];
          menuData.forEach((menu) => {
            menuMap[menu.workspaceId] = menu;
          });
        }

        // Merge workspaces with menu data - workspaces with menu get menu data, others still show
        const mergedWorkspaces: Workspace[] = validWorkspaces.map((ws) => {
          const menuData = menuMap[ws.workspaceId];
          return {
            workspaceId: ws.workspaceId,
            name: ws.name,
            description: ws.description || "",
            workspaceUrl: menuData?.workspaceUrl || ws.workspaceUrl,
            isActive: ws.isActive,
            isDeleted: ws.isDeleted,
            color: ws.color,
            createdBy: ws.createdBy || "",
            createdAt: ws.createdAt || "",
            updatedAt: ws.updatedAt || "",
          };
        });

        setWorkspaces(mergedWorkspaces);

        // Also ensure workspaceMenus includes all workspaces (even without menu items)
        // Create menu entries for workspaces without menu data
        const existingMenuWorkspaceIds = new Set(
          Array.isArray(menuResult.data)
            ? menuResult.data.map((m) => m.workspaceId)
            : menuResult.data?.items?.map((m) => m.workspaceId) || []
        );

        const workspacesWithoutMenu = validWorkspaces
          .filter((ws) => !existingMenuWorkspaceIds.has(ws.workspaceId))
          .map((ws) => ({
            workspaceId: ws.workspaceId,
            workspaceName: ws.name,
            workspaceCode: "",
            workspaceUrl: ws.workspaceUrl,
            resources: [],
          }));

        if (workspacesWithoutMenu.length > 0) {
          const currentMenus = Array.isArray(menuResult.data)
            ? menuResult.data
            : menuResult.data?.items || [];
          setWorkspaceMenus([...currentMenus, ...workspacesWithoutMenu]);
        }
      } else {
        // Fallback: use workspaces from menu only
        if (menuResult.success && menuResult.data) {
          const menuData = Array.isArray(menuResult.data)
            ? menuResult.data
            : menuResult.data.items || [];
          const workspacesFromMenu: Workspace[] = menuData.map((menu) => ({
            workspaceId: menu.workspaceId,
            name: menu.workspaceName,
            description: "",
            workspaceUrl: menu.workspaceUrl,
            isActive: true,
            isDeleted: false,
            color: undefined,
            createdBy: "",
            createdAt: "",
            updatedAt: "",
          }));
          setWorkspaces(workspacesFromMenu);
        } else {
          setWorkspaces([]);
        }
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
    
    // Check if URL is external (starts with http:// or https://)
    const isExternal = item.href.startsWith("http://") || item.href.startsWith("https://");
    
    const handleClick = (e: React.MouseEvent) => {
      if (isExternal) {
        e.preventDefault();
        window.location.href = item.href;
      } else {
        setMobileSidebarOpen(false);
      }
    };

    const linkClassName = isChild
      ? cn(
          "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ml-6 relative",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-sidebar-muted-foreground/30",
          "before:content-['']",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted"
        )
      : cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-muted"
        );

    if (isExternal) {
      // Use anchor tag for external URLs
      return (
        <a
          href={item.href}
          onClick={handleClick}
          className={linkClassName}
        >
          {isChild && (
            <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-muted-foreground/30" />
          )}
          {Icon && <Icon className={isChild ? "h-4 w-4 flex-shrink-0" : "h-5 w-5 flex-shrink-0"} />}
          <span>{item.title}</span>
        </a>
      );
    }

    // Use Next.js Link for internal URLs
    if (isChild) {
      return (
        <Link
          href={item.href}
          className={linkClassName}
          onClick={handleClick}
        >
          <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-muted-foreground/30" />
          {item.title}
        </Link>
      );
    }

    return (
      <Link
        href={item.href}
        className={linkClassName}
        onClick={handleClick}
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
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 text-sm hover:bg-sidebar-muted text-sidebar-foreground"
            onClick={() => {
              router.push("/");
            }}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span>Dashboard</span>
          </Button>
          {/* Invitations - Only show for non-admin users */}
          {!userInfo?.isAdmin && (
            <NavLink
              item={{ title: "Invitations", href: "/invitations" }}
              icon={Mail}
            />
          )}
          {/* Admin Section - Only show if user is admin */}
          {userInfo?.isAdmin && (
            <>
              <NavLink
                item={{ title: "User Management", href: "/admin/users" }}
                icon={Shield}
              />
              <NavLink
                item={{ title: "Admin Roles", href: "/admin/roles" }}
                icon={Shield}
              />
              <NavLink
                item={{
                  title: "Workspace Resources",
                  href: "/admin/resources",
                }}
                icon={FolderTree}
              />
              <NavLink
                item={{
                  title: "Workspace Management",
                  href: "/admin/workspaces",
                }}
                icon={Building}
              />
            </>
          )}
        </div>

        {/* Workspace Label - Only show for non-admin users */}
        {!userInfo?.isAdmin && (
          <>
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
                const isOwner = isWorkspaceOwner(
                  userInfo,
                  workspaceMenu.workspaceId
                );

                // Debug: Log ownership check
                if (process.env.NODE_ENV === "development") {
                  console.log(
                    `[Sidebar] Workspace "${workspaceMenu.workspaceName}" (${workspaceMenu.workspaceId}):`,
                    {
                      isOwner,
                      hasUserInfo: !!userInfo,
                      userInfoRoles: userInfo ? (userInfo as any).roles : null,
                    }
                  );
                }

                // Create workspace object for setCurrentWorkspace
                const workspace: Workspace = {
                  workspaceId: workspaceMenu.workspaceId,
                  name: workspaceMenu.workspaceName,
                  description: "",
                  workspaceUrl: workspaceMenu.workspaceUrl,
                  isActive: true,
                  isDeleted: false,
                  color: undefined,
                  createdBy: "",
                  createdAt: "",
                  updatedAt: "",
                };

                return (
                  <div
                    key={workspaceMenu.workspaceId}
                    className="relative group"
                  >
                    <div className="flex items-center gap-2 w-full min-w-0">
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
                          "flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-colors min-w-0 flex-shrink",
                          isWorkspaceActive || isWorkspaceExpanded
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-muted",
                          "flex-1 max-w-[calc(100%-3rem)]"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {(() => {
                            const WorkspaceIcon = getIconForWorkspace(
                              workspaceMenu.workspaceId ||
                                workspaceMenu.workspaceName
                            );
                            return (
                              <div
                                className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `#6366F11A`, // light tint
                                  color: "#6366F1",
                                }}
                              >
                                <WorkspaceIcon className="h-3.5 w-3.5" />
                              </div>
                            );
                          })()}
                          <span className="text-left truncate text-xs">
                            {workspaceMenu.workspaceName}
                          </span>
                        </div>

                        {isWorkspaceExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 ml-1" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 ml-1" />
                        )}
                      </button>
                      {/* Settings icon - only show for workspace owners, but not for admin users */}
                      {isOwner && !userInfo?.isAdmin && (
                        <Link
                          href={`/workspaces/${workspaceMenu.workspaceId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentWorkspace(workspace);
                            setMobileSidebarOpen(false);
                          }}
                          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted transition-colors border border-sidebar-border"
                          title="Manage workspace"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                      )}
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
                                              href: normalizeResourceUrl(
                                                child.url,
                                                workspaceMenu.workspaceName
                                              ),
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
                                        href: normalizeResourceUrl(
                                          resource.url,
                                          workspaceMenu.workspaceName
                                        ),
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
          </>
        )}
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
          "fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
