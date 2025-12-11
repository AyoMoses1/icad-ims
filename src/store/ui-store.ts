import { create } from "zustand";
import { BreadcrumbItem } from "@/types";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];

  // Modal/Dialog states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Toast/Notifications
  toasts: Toast[];

  // Theme
  theme: "light" | "dark" | "system";

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  breadcrumbs: [],
  activeModal: null,
  modalData: null,
  toasts: [],
  theme: "system",

  // Actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setMobileSidebarOpen: (open: boolean) => {
    set({ mobileSidebarOpen: open });
  },

  setBreadcrumbs: (items: BreadcrumbItem[]) => {
    set({ breadcrumbs: items });
  },

  openModal: (modalId: string, data?: Record<string, unknown>) => {
    set({ activeModal: modalId, modalData: data || null });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  addToast: (toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}`;
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setTheme: (theme: "light" | "dark" | "system") => {
    set({ theme });
  },
}));

// Selector hooks
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () =>
  useUIStore((state) => state.sidebarCollapsed);
export const useBreadcrumbs = () => useUIStore((state) => state.breadcrumbs);
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useModalData = () => useUIStore((state) => state.modalData);


