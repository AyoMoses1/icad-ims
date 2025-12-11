import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, UserWithFullName, AuthSession } from "@/types";
import { getUserFullName } from "@/lib/mock-data";
import { safeLocalStorage } from "@/lib/utils";

interface AuthState {
  // State
  user: UserWithFullName | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setSession: (session: AuthSession) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Computed
  hasValidSession: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setSession: (session: AuthSession) => {
        set({
          user: session.user,
          token: session.token,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        const userWithFullName: UserWithFullName = {
          ...user,
          fullName: getUserFullName(user),
        };
        set({ user: userWithFullName });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser: UserWithFullName = {
            ...currentUser,
            ...updates,
            fullName: getUserFullName({ ...currentUser, ...updates }),
          };
          set({ user: updatedUser });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Clear from storage
        safeLocalStorage.removeItem("auth-storage");
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Computed
      hasValidSession: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        // Return a storage implementation that works on both server and client
        return {
          getItem: (name) => {
            const str = safeLocalStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          },
          setItem: (name, value) => {
            safeLocalStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            safeLocalStorage.removeItem(name);
          },
        };
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);



