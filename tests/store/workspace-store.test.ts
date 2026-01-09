import { useWorkspaceStore } from "@/store/workspace-store";
import { Workspace, EffectivePermission } from "@/types";

describe("WorkspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().clearWorkspaceData();
    useWorkspaceStore.getState().setWorkspaces([]);
  });

  const mockWorkspaces: Workspace[] = [
    {
      workspaceId: "ws-001",
      name: "Test Workspace 1",
      description: "Test description",
      isActive: true,
      createdBy: "user-001",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      workspaceId: "ws-002",
      name: "Test Workspace 2",
      description: "Test description 2",
      isActive: true,
      createdBy: "user-001",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const mockPermissions: EffectivePermission[] = [
    {
      resourceId: "res-001",
      resourceName: "Dashboard",
      permissions: [
        {
          permissionId: "perm-001",
          permissionName: "Read",
          permissionCode: "READ",
        },
        {
          permissionId: "perm-002",
          permissionName: "Create",
          permissionCode: "CREATE",
        },
      ],
    },
    {
      resourceId: "res-002",
      resourceName: "Users",
      permissions: [
        {
          permissionId: "perm-001",
          permissionName: "Read",
          permissionCode: "READ",
        },
      ],
    },
  ];

  it("initializes with empty state", () => {
    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual([]);
    expect(state.currentWorkspace).toBeNull();
    expect(state.resources).toEqual([]);
    expect(state.roles).toEqual([]);
    expect(state.userPermissions).toEqual([]);
  });

  it("sets workspaces correctly", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual(mockWorkspaces);
  });

  it("sets current workspace correctly", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspaces[0]);

    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toEqual(mockWorkspaces[0]);
    expect(state.currentWorkspaceId).toBe("ws-001");
  });

  it("sets current workspace by ID", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);
    useWorkspaceStore.getState().setCurrentWorkspaceById("ws-002");

    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toEqual(mockWorkspaces[1]);
    expect(state.currentWorkspaceId).toBe("ws-002");
  });

  it("handles invalid workspace ID", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);
    useWorkspaceStore.getState().setCurrentWorkspaceById("invalid-id");

    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toBeNull();
    expect(state.currentWorkspaceId).toBe("invalid-id");
  });

  it("sets user permissions correctly", () => {
    useWorkspaceStore.getState().setUserPermissions(mockPermissions);

    const state = useWorkspaceStore.getState();
    expect(state.userPermissions).toEqual(mockPermissions);
  });

  it("checks hasPermission correctly", () => {
    useWorkspaceStore.getState().setUserPermissions(mockPermissions);

    // Has permission
    expect(useWorkspaceStore.getState().hasPermission("res-001", "READ")).toBe(
      true
    );
    expect(
      useWorkspaceStore.getState().hasPermission("res-001", "CREATE")
    ).toBe(true);
    expect(useWorkspaceStore.getState().hasPermission("res-002", "READ")).toBe(
      true
    );

    // Doesn't have permission
    expect(
      useWorkspaceStore.getState().hasPermission("res-002", "CREATE")
    ).toBe(false);
    expect(useWorkspaceStore.getState().hasPermission("res-003", "READ")).toBe(
      false
    );
  });

  it("checks hasAnyPermission correctly", () => {
    useWorkspaceStore.getState().setUserPermissions(mockPermissions);

    expect(
      useWorkspaceStore
        .getState()
        .hasAnyPermission("res-001", ["READ", "DELETE"])
    ).toBe(true);
    expect(
      useWorkspaceStore
        .getState()
        .hasAnyPermission("res-002", ["CREATE", "DELETE"])
    ).toBe(false);
    expect(
      useWorkspaceStore.getState().hasAnyPermission("res-003", ["READ"])
    ).toBe(false);
  });

  it("checks canAccessResource correctly", () => {
    useWorkspaceStore.getState().setUserPermissions(mockPermissions);

    expect(useWorkspaceStore.getState().canAccessResource("res-001")).toBe(
      true
    );
    expect(useWorkspaceStore.getState().canAccessResource("res-002")).toBe(
      true
    );
    expect(useWorkspaceStore.getState().canAccessResource("res-003")).toBe(
      false
    );
  });

  it("clears workspace data correctly", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspaces[0]);
    useWorkspaceStore.getState().setUserPermissions(mockPermissions);

    useWorkspaceStore.getState().clearWorkspaceData();

    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toBeNull();
    expect(state.currentWorkspaceId).toBeNull();
    expect(state.resources).toEqual([]);
    expect(state.roles).toEqual([]);
    expect(state.userPermissions).toEqual([]);
    // Workspaces should still be there
    expect(state.workspaces).toEqual(mockWorkspaces);
  });
});



















