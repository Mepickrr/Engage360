export const PERMISSION_COMPONENTS = [
  { key: "campaignJourney", label: "Campaign & Journey Management" },
  { key: "segments", label: "Segments" },
  { key: "userProfile", label: "User Profile" },
  { key: "channelConfig", label: "Channel Configuration" },
  { key: "revenueConfig", label: "Revenue Configuration" },
  { key: "dataImports", label: "Data Imports" },
  { key: "dataUpload", label: "Data Upload" },
  { key: "couponCode", label: "Coupon Code" },
];

export const PERMISSION_LEVELS = [
  { key: "view", label: "View" },
  { key: "createManage", label: "Create & Manage" },
  { key: "publish", label: "Publish" },
];

export const UNASSIGNED_ROLE_ID = "unassigned";

function blankPermissionFor(value) {
  return { view: value, createManage: value, publish: value };
}

export function allPermissions(value) {
  return PERMISSION_COMPONENTS.reduce((acc, { key }) => {
    acc[key] = blankPermissionFor(value);
    return acc;
  }, {});
}

function permissionsFrom(overrides) {
  const base = allPermissions(false);
  Object.entries(overrides).forEach(([key, levels]) => {
    base[key] = { ...base[key], ...levels };
  });
  return base;
}

export const DEFAULT_ROLES = [
  { id: "admin", name: "Admin", type: "default", locked: true, permissions: allPermissions(true) },
  {
    id: "manager",
    name: "Manager",
    type: "default",
    locked: false,
    permissions: permissionsFrom({
      campaignJourney: { view: true, createManage: true, publish: true },
      segments: { view: true, createManage: true, publish: true },
      userProfile: { view: true, createManage: true },
      channelConfig: { view: true, createManage: true },
      revenueConfig: { view: true },
      dataImports: { view: true, createManage: true },
      dataUpload: { view: true, createManage: true },
      couponCode: { view: true, createManage: true, publish: true },
    }),
  },
  {
    id: "developer",
    name: "Developer",
    type: "default",
    locked: false,
    permissions: permissionsFrom({
      channelConfig: { view: true, createManage: true, publish: true },
      dataImports: { view: true, createManage: true },
      dataUpload: { view: true, createManage: true },
      segments: { view: true },
      campaignJourney: { view: true },
    }),
  },
  {
    id: "analyst",
    name: "Analyst",
    type: "default",
    locked: false,
    permissions: permissionsFrom({
      segments: { view: true },
      campaignJourney: { view: true },
      userProfile: { view: true },
      dataImports: { view: true },
      revenueConfig: { view: true },
    }),
  },
  {
    id: "support",
    name: "Support",
    type: "default",
    locked: false,
    permissions: permissionsFrom({
      userProfile: { view: true },
      campaignJourney: { view: true },
      couponCode: { view: true, createManage: true },
    }),
  },
];

export const DEFAULT_MEMBERS = [
  { id: "himanshu@tspkarix.com", name: "Himanshu Kumar", email: "himanshu@tspkarix.com", initials: "HK", color: "#6C3AE8", roleId: "admin" },
  { id: "riya@tspkarix.com", name: "Riya Sharma", email: "riya@tspkarix.com", initials: "RS", color: "#EC4899", roleId: "manager" },
  { id: "arjun@tspkarix.com", name: "Arjun Patel", email: "arjun@tspkarix.com", initials: "AP", color: "#10B981", roleId: "analyst" },
];

const AVATAR_COLORS = ["#6C3AE8", "#EC4899", "#10B981", "#3B82F6", "#F59E0B", "#14B8A6", "#8B5CF6", "#EF4444"];

export function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function colorForSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function slugifyRoleName(name, existingIds) {
  const base = `custom-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  let candidate = base;
  let n = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
