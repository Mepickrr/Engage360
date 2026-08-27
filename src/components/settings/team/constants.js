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
  { id: "himanshu@tspkarix.com", name: "Himanshu Kumar", email: "himanshu@tspkarix.com", initials: "HK", color: "#6C3AE8", roleId: "admin", lastActive: "2026-07-28", phone: "+91 98765 43210", instagram: "@himanshu.kumar", isTestUser: false },
  { id: "riya@tspkarix.com", name: "Riya Sharma", email: "riya@tspkarix.com", initials: "RS", color: "#EC4899", roleId: "manager", lastActive: "2026-07-27", phone: "+91 90000 11111", instagram: null, isTestUser: true },
  { id: "arjun@tspkarix.com", name: "Arjun Patel", email: "arjun@tspkarix.com", initials: "AP", color: "#10B981", roleId: "analyst", lastActive: "2026-07-14", phone: null, instagram: "@arjun.patel", isTestUser: false },
];

export const DEFAULT_TEST_PHONE_NUMBERS = ["+917381669794", "+919975124268", "+917056138252", "+918849618439"];
export const DEFAULT_TEST_INSTAGRAM_HANDLES = ["_vidushichoudhary_", "swastik_rp", "jaswanth_vungarala"];
export const DEFAULT_TEST_EMAILS = [];

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

export const ACTIVITY_LOG_TIME_OPTIONS = ["Last 7 Days", "This Month", "Last Month", "All Time", "Custom Range"];

export const ACTIVITY_LOG_ACTIONS = [
  "Login",
  "Campaign created",
  "Campaign edited",
  "Journey created",
  "Journey Edited",
  "Settings",
];

export const DEFAULT_ACTIVITY_LOGS = [
  { id: "log-1", memberName: "Himanshu Kumar", action: "Login", description: "himanshu@tspkarix.com has logged in", createdAt: "2026-08-11T12:25:00" },
  { id: "log-2", memberName: "Riya Sharma", action: "Campaign created", description: '"Riya Sharma" created campaign "Diwali Cashback Blast"', createdAt: "2026-08-11T10:19:00" },
  { id: "log-3", memberName: "Arjun Patel", action: "Journey Edited", description: '"Arjun Patel" edited journey "Abandoned Cart Recovery"', createdAt: "2026-08-10T09:42:00" },
  { id: "log-4", memberName: "Himanshu Kumar", action: "Settings", description: '"Himanshu Kumar" updated Delivery Controls settings', createdAt: "2026-08-09T17:05:00" },
  { id: "log-5", memberName: "Riya Sharma", action: "Login", description: "riya@tspkarix.com has logged in", createdAt: "2026-08-08T08:52:00" },
  { id: "log-6", memberName: "Arjun Patel", action: "Campaign edited", description: '"Arjun Patel" edited campaign "Weekend Flash Sale"', createdAt: "2026-08-06T14:30:00" },
  { id: "log-7", memberName: "Himanshu Kumar", action: "Journey created", description: '"Himanshu Kumar" created journey "Welcome Series"', createdAt: "2026-08-02T11:15:00" },
  { id: "log-8", memberName: "Riya Sharma", action: "Settings", description: '"Riya Sharma" updated Frequency Capping settings', createdAt: "2026-07-25T16:40:00" },
  { id: "log-9", memberName: "Arjun Patel", action: "Login", description: "arjun@tspkarix.com has logged in", createdAt: "2026-07-18T09:00:00" },
  { id: "log-10", memberName: "Himanshu Kumar", action: "Campaign created", description: '"Himanshu Kumar" created campaign "Monsoon Restock Alert"', createdAt: "2026-07-05T13:20:00" },
];

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
