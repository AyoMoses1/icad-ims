import { useAuthStore } from "@/store/auth-store";
import { AuthSession, UserStatus } from "@/types";

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.getState().logout();
  });

  const mockSession: AuthSession = {
    user: {
      id: "user-001",
      username: "testuser",
      email: "test@example.com",
      phoneNumber: "+1234567890",
      firstName: "Test",
      lastName: "User",
      country: "US",
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      fullName: "Test User",
    },
    token: "mock-token",
    refreshToken: "mock-refresh-token",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  it("initializes with null user and not authenticated", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it("sets session correctly", () => {
    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockSession.user);
    expect(state.token).toBe(mockSession.token);
    expect(state.refreshToken).toBe(mockSession.refreshToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it("updates user correctly", () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().updateUser({ firstName: "Updated" });

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe("Updated");
    expect(state.user?.fullName).toBe("Updated User");
  });

  it("logs out correctly", () => {
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("checks valid session correctly", () => {
    // No session
    expect(useAuthStore.getState().hasValidSession()).toBe(false);

    // Set valid session
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().hasValidSession()).toBe(true);

    // Set expired session
    useAuthStore.getState().setSession({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
    });
    expect(useAuthStore.getState().hasValidSession()).toBe(false);
  });

  it("sets loading state correctly", () => {
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});


