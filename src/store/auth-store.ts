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
        // console.log("AuthStore - setSession called:", {
        //   hasToken: !!session.token,
        //   tokenLength: session.token?.length,
        //   hasUser: !!session.user,
        //   userEmail: session.user?.email,
        // });

        set({
          user: session.user,
          token: session.token,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          isAuthenticated: true,
          isLoading: false,
        });

        // Verify it was set
        // const stateAfterSet = get();
        // console.log("AuthStore - State after setSession:", {
        //   hasToken: !!stateAfterSet.token,
        //   isAuthenticated: stateAfterSet.isAuthenticated,
        //   userEmail: stateAfterSet.user?.email,
        // });
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
        // Note: createJSONStorage expects getItem to return a string (Zustand will parse it)
        // and setItem to receive a string (Zustand already stringified it)
        return {
          getItem: (name) => {
            try {
              const str = safeLocalStorage.getItem(name);
              if (!str) return null;

              // Zustand's createJSONStorage expects a string, it will parse it
              // Ensure we return a string, not an object
              if (typeof str !== "string") {
                console.error("Storage item is not a string:", typeof str, str);
                // Clear corrupted data
                safeLocalStorage.removeItem(name);
                return null;
              }

              // Validate that the string is valid JSON before returning it
              // If it's "[object Object]", it's corrupted data that was stored incorrectly
              if (
                str === "[object Object]" ||
                str.trim() === "[object Object]"
              ) {
                console.error(
                  "Storage item contains corrupted data '[object Object]', clearing it"
                );
                safeLocalStorage.removeItem(name);
                return null;
              }

              // Try to parse it to ensure it's valid JSON
              try {
                JSON.parse(str);
              } catch (parseError) {
                console.error(
                  "Storage item is not valid JSON, clearing corrupted data:",
                  parseError,
                  {
                    valuePreview: str.substring(0, 100),
                    valueLength: str.length,
                  }
                );
                safeLocalStorage.removeItem(name);
                return null;
              }

              return str;
            } catch (error) {
              console.error("Error reading from localStorage:", error);
              // Clear corrupted data
              safeLocalStorage.removeItem(name);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              // Zustand's createJSONStorage passes the value as a string already
              if (typeof value !== "string") {
                console.error(
                  "Storage value is not a string:",
                  typeof value,
                  value
                );
                // Try to stringify it as fallback
                value = JSON.stringify(value);
              }

              // Validate that the string is valid JSON before storing
              if (
                value === "[object Object]" ||
                value.trim() === "[object Object]"
              ) {
                console.error(
                  "Attempted to store '[object Object]' string, rejecting write"
                );
                return;
              }

              // Validate it's valid JSON by trying to parse it
              try {
                JSON.parse(value);
              } catch (parseError) {
                console.error(
                  "Attempted to store invalid JSON, rejecting write:",
                  parseError,
                  {
                    valuePreview: value.substring(0, 100),
                    valueLength: value.length,
                  }
                );
                return;
              }

              safeLocalStorage.setItem(name, value);
            } catch (error) {
              console.error("Error writing to localStorage:", error);
            }
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
      onRehydrateStorage: () => (state, error) => {
        // After rehydration, set loading to false
        if (error) {
          console.error("Auth store rehydration error:", error);
          // If rehydration fails, clear corrupted data and set loading to false
          safeLocalStorage.removeItem("auth-storage");
          if (state) {
            state.isLoading = false;
            state.isAuthenticated = false;
          }
          return;
        }

        if (state) {
          console.log("Auth store rehydrated:", {
            hasToken: !!state.token,
            hasUser: !!state.user,
            hasRefreshToken: !!state.refreshToken,
            hasExpiresAt: !!state.expiresAt,
            isAuthenticated: state.isAuthenticated,
            tokenPreview: state.token?.substring(0, 30) + "...",
          });

          // Check if we have a valid token and session
          const hasValidToken =
            state.token &&
            state.expiresAt &&
            new Date(state.expiresAt) > new Date();

          // If we have persisted auth data, ensure isAuthenticated is set correctly
          if (hasValidToken && state.user) {
            state.isAuthenticated = true;
            console.log("✅ Valid session restored from localStorage");
          } else if (!hasValidToken) {
            // Token expired or invalid
            state.isAuthenticated = false;
            if (state.token) {
              console.warn("Token expired or invalid after rehydration");
            } else {
              console.warn("No token found in rehydrated state");
            }
          }

          state.isLoading = false;
        } else {
          // No state means no persisted data, set loading to false
          console.log("No persisted auth state found - localStorage is empty");

          // Check if localStorage actually has data
          const storageCheck = safeLocalStorage.getItem("auth-storage");
          if (storageCheck) {
            console.warn(
              "⚠️ localStorage has data but Zustand didn't rehydrate it:",
              {
                storageLength: storageCheck.length,
                storagePreview: storageCheck.substring(0, 100) + "...",
              }
            );
            try {
              const parsed = JSON.parse(storageCheck);
              console.warn("Parsed storage:", {
                hasState: !!parsed.state,
                hasToken: !!parsed.state?.token,
                version: parsed.version,
              });
            } catch (e) {
              console.error("Failed to parse localStorage data:", e);
            }
          }
        }
      },
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
