import {
  PERMISSION_COMPONENTS,
  PERMISSION_LEVELS,
  DEFAULT_ROLES,
  DEFAULT_MEMBERS,
  UNASSIGNED_ROLE_ID,
  initialsOf,
  colorForSeed,
  slugifyRoleName,
} from "../constants";

describe("team constants", () => {
  it("defines 8 permission components", () => {
    expect(PERMISSION_COMPONENTS).toHaveLength(8);
    expect(PERMISSION_COMPONENTS.map((c) => c.key)).toEqual([
      "campaignJourney",
      "segments",
      "userProfile",
      "channelConfig",
      "revenueConfig",
      "dataImports",
      "dataUpload",
      "couponCode",
    ]);
  });

  it("defines the 3 permission levels in order", () => {
    expect(PERMISSION_LEVELS.map((l) => l.key)).toEqual(["view", "createManage", "publish"]);
  });

  it("defines 5 default roles with Admin locked and fully checked", () => {
    expect(DEFAULT_ROLES.map((r) => r.name)).toEqual(["Admin", "Manager", "Developer", "Analyst", "Support"]);
    const admin = DEFAULT_ROLES.find((r) => r.id === "admin");
    expect(admin.locked).toBe(true);
    PERMISSION_COMPONENTS.forEach(({ key }) => {
      expect(admin.permissions[key]).toEqual({ view: true, createManage: true, publish: true });
    });
    const manager = DEFAULT_ROLES.find((r) => r.id === "manager");
    expect(manager.locked).toBe(false);
  });

  it("seeds 3 default members referencing real role ids", () => {
    const roleIds = DEFAULT_ROLES.map((r) => r.id);
    expect(DEFAULT_MEMBERS).toHaveLength(3);
    DEFAULT_MEMBERS.forEach((m) => expect(roleIds).toContain(m.roleId));
  });

  it("UNASSIGNED_ROLE_ID is a distinct sentinel", () => {
    expect(DEFAULT_ROLES.map((r) => r.id)).not.toContain(UNASSIGNED_ROLE_ID);
  });

  it("initialsOf derives from first and last name, falls back for a single name", () => {
    expect(initialsOf("Himanshu Kumar")).toBe("HK");
    expect(initialsOf("Cher")).toBe("CH");
  });

  it("colorForSeed is deterministic for the same input", () => {
    expect(colorForSeed("a@b.com")).toBe(colorForSeed("a@b.com"));
  });

  it("slugifyRoleName dedupes collisions with a numeric suffix", () => {
    const first = slugifyRoleName("Growth", []);
    expect(first).toBe("custom-growth");
    const second = slugifyRoleName("Growth", [first]);
    expect(second).toBe("custom-growth-2");
  });
});
