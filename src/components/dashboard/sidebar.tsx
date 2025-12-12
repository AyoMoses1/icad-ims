"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  FolderTree,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Trash2,
  UserCheck,
  AlertTriangle,
  DollarSign,
  Receipt,
  Waves,
  Anchor,
  Ship,
  CheckCircle,
  Menu,
  X,
  User,
  ClipboardList,
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

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Certification & Registration",
    href: "#",
    icon: FileCheck,
    children: [
      { title: "Vessel Certification", href: "/certification/vessels" },
      { title: "Registration Services", href: "/certification/registration" },
      { title: "Document Management", href: "/certification/documents" },
    ],
  },
  {
    title: "Waste Management",
    href: "#",
    icon: Trash2,
    children: [
      { title: "Waste Tracking", href: "/waste/tracking" },
      { title: "Disposal Method", href: "/waste/disposal" },
      { title: "Facilities", href: "/waste/facilities" },
    ],
  },
  {
    title: "Seafarer Certification & License",
    href: "#",
    icon: UserCheck,
    children: [
      { title: "Overview", href: "/seafarer/overview" },
      { title: "Applications", href: "/seafarer/applications" },
      { title: "Seafarer Registry", href: "/seafarer/registry" },
      { title: "Accredited MIIs", href: "/seafarer/miis" },
    ],
  },
  {
    title: "Incident & Risk Management",
    href: "#",
    icon: AlertTriangle,
    children: [
      { title: "Incident Report", href: "/incidents/report" },
      { title: "Risk Assessment", href: "/incidents/assessment" },
    ],
  },
  {
    title: "Levies & Fees",
    href: "#",
    icon: DollarSign,
    children: [
      { title: "Fee Management", href: "/levies/fees" },
      { title: "Levy Collection", href: "/levies/collection" },
    ],
  },
  {
    title: "Invoices & Payments",
    href: "#",
    icon: Receipt,
    children: [
      { title: "Invoice Management", href: "/invoices/management" },
      { title: "Payments", href: "/invoices/payments" },
    ],
  },
  {
    title: "Marine Environment Management",
    href: "#",
    icon: Waves,
    children: [
      { title: "Environmental Monitoring", href: "/marine/monitoring" },
      { title: "Pollution Control", href: "/marine/pollution" },
      { title: "Protected Areas", href: "/marine/protected" },
    ],
  },
  {
    title: "Cabotage & Terminal Operation",
    href: "#",
    icon: Anchor,
    children: [
      { title: "Cabotage Permits", href: "/cabotage/permits" },
      { title: "Terminal Operations", href: "/cabotage/terminals" },
    ],
  },
  {
    title: "Vessel Surveillance & Tracking",
    href: "#",
    icon: Ship,
    children: [
      { title: "Vessel Tracking", href: "/surveillance/tracking" },
      { title: "Vessel Surveillance", href: "/surveillance/monitoring" },
    ],
  },
  {
    title: "Compliance Monitoring & Checks",
    href: "#",
    icon: CheckCircle,
    children: [{ title: "Compliance Checks", href: "/compliance/checks" }],
  },
  {
    title: "User & Profile Management",
    href: "#",
    icon: Settings,
    children: [
      { title: "Workspace Management", href: "/workspaces" },
      { title: "User Management", href: "/users" },
      { title: "Profile Management", href: "/settings" },
      { title: "Permission Management", href: "/permissions" },
      { title: "Resources Management", href: "/resources" },
      { title: "Role Management", href: "/roles" },
      { title: "Role Resources Management", href: "/role-resources" },
      { title: "User Role Management", href: "/user-roles" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspaceStore();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [workspaceMenu, setWorkspaceMenu] = useState<WorkspaceResource[]>([]);

  // Load workspace menu when workspace changes
  useEffect(() => {
    if (currentWorkspace?.workspaceId) {
      loadWorkspaceMenu(currentWorkspace.workspaceId);
    } else {
      setWorkspaceMenu([]);
    }
  }, [currentWorkspace?.workspaceId]);

  const loadWorkspaceMenu = async (workspaceId: string) => {
    try {
      const result = await apiGet<PaginatedResponse<WorkspaceResource>>(
        `/api/workspaces/${workspaceId}/menu`
      );
      if (result.success && result.data) {
        // Extract the items array from the paginated response
        setWorkspaceMenu(result.data.items || []);
      } else {
        setWorkspaceMenu([]);
      }
    } catch (error) {
      console.error("Failed to load workspace menu", error);
      setWorkspaceMenu([]);
    }
  };

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
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
  }: {
    item: NavItem | { title: string; href: string };
    isChild?: boolean;
  }) => {
    const hasIcon = "icon" in item;
    const Icon = hasIcon ? item.icon : null;
    const active = isActive(item.href);

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
        {/* Workspace Label */}
        <div className="px-3 mb-3">
          <span className="text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider">
            Workspace
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {/* Workspace Menu Items (if available) */}
          {workspaceMenu.length > 0 && currentWorkspace ? (
            <>
              {workspaceMenu
                .filter((item: WorkspaceResource) => !item.parentId) // Top-level items only
                .map((menuItem: WorkspaceResource) => {
                  const children = workspaceMenu.filter(
                    (item: WorkspaceResource) =>
                      item.parentId === menuItem.resourceId
                  );
                  return (
                    <div key={menuItem.resourceId}>
                      {children.length > 0 ? (
                        <>
                          <button
                            onClick={() => toggleExpand(menuItem.resourceId)}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors",
                              isChildActive(
                                children.map((c: WorkspaceResource) => ({
                                  title: c.resourceName,
                                  href: c.url || "#",
                                }))
                              ) || expandedItems.includes(menuItem.resourceId)
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-muted"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <FolderTree className="h-5 w-5 flex-shrink-0" />
                              <span className="text-left">
                                {menuItem.resourceName}
                              </span>
                            </div>
                            {expandedItems.includes(menuItem.resourceId) ? (
                              <ChevronDown className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            )}
                          </button>
                          {expandedItems.includes(menuItem.resourceId) && (
                            <div className="mt-1 space-y-1 ml-2">
                              {children.map((child: WorkspaceResource) => (
                                <NavLink
                                  key={child.resourceId}
                                  item={{
                                    title: child.resourceName,
                                    href: child.url || "#",
                                  }}
                                  isChild
                                />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <NavLink
                          item={{
                            title: menuItem.resourceName,
                            href: menuItem.url || "#",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              {/* Separator if both menu and nav items exist */}
              {navItems.length > 0 && (
                <div className="my-2 border-t border-sidebar-border" />
              )}
            </>
          ) : null}
          {/* Default Navigation Items */}
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors",
                      isChildActive(item.children) ||
                        expandedItems.includes(item.title)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-left">{item.title}</span>
                    </div>
                    {expandedItems.includes(item.title) ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                  {expandedItems.includes(item.title) && (
                    <div className="mt-1 space-y-1 ml-2">
                      {item.children.map((child) => (
                        <NavLink key={child.href} item={child} isChild />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink item={item} />
              )}
            </div>
          ))}
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
