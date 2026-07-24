# Team & Role Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static, mock Team tab in Settings with a real (client-state, no backend) Team Members + Role Management experience: search/invite/edit-role/delete for members, and an editable permission checklist with custom role creation for roles.

**Architecture:** Six new files under `src/components/settings/team/` (constants, `EmailChipInput`, `InviteMemberModal`, `MembersTab`, `RolesTab`, `TeamManagementPanel`), each colocated with a Jest/RTL test in `src/components/settings/team/__tests__/`. `TeamManagementPanel` owns the lifted `members`/`roles` state and passes callbacks down; `Settings.jsx` is changed only to import and mount it in place of the old inline `TeamPanel`.

**Tech Stack:** React (function components + hooks), Tailwind utility classes matching the existing `Settings.jsx` visual style, `lucide-react` icons, Radix `Dialog` (`src/components/ui/dialog.jsx`) for the invite modal, Radix `Tabs` (`src/components/ui/tabs.jsx`) for the Members/Roles sub-tabs. Tests use `@testing-library/react` + `craco test` (Jest), following the pattern in `src/components/campaigns/builder/__tests__/*`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-24-team-role-management-design.md` — every task below implements one of its sections; re-read it if a step's rationale is unclear.
- Client-state only. No API calls, no backend. State resets on page refresh, matching the rest of `Settings.jsx`.
- **Deliberate deviation from the spec's UI-primitive wording:** the spec mentions Radix `Select`/`Checkbox`/`AlertDialog`. Neither `select.jsx`, `checkbox.jsx`, nor `alert-dialog.jsx` is exercised by any existing test in this repo, and Radix's `Select` trigger requires pointer-capture APIs that don't work under `fireEvent.click` in jsdom (unlike `Dialog`, which the codebase already tests successfully in `ChannelPickerModal.test.jsx`). To keep every new component reliably testable, role pickers use plain native `<select>`, the permission checklist uses plain native `<input type="checkbox">`, and destructive confirmations (delete member, delete role) use `window.confirm(...)`. Visually these are styled to match the existing app (border, rounded-md, text sizes) so the result looks identical to the mockup. `Dialog` and `Tabs` are the only Radix primitives used, since both are already proven testable in this codebase.
- **Radix `TabsTrigger` activates on `mousedown`, not `click`.** Every test that switches tabs MUST use `fireEvent.mouseDown(...)`, never `fireEvent.click(...)` — see the explanatory comment in `src/pages/__tests__/Segments.test.jsx:26-29`. Using `click` silently fails to switch tabs and produces a confusing false negative.
- Role ids: `admin`, `manager`, `developer`, `analyst`, `support` for defaults; custom roles get `custom-<slugified-name>` (deduped with a numeric suffix on collision). Member ids are their email address (already unique, avoids needing an id generator).
- Every new file gets a colocated test in `src/components/settings/team/__tests__/`, mirroring the existing `src/components/campaigns/builder/__tests__/` convention.

---

### Task 1: Team & role data model (`constants.js`)

**Files:**
- Create: `src/components/settings/team/constants.js`
- Test: `src/components/settings/team/__tests__/constants.test.js`

**Interfaces:**
- Produces: `PERMISSION_COMPONENTS` (array of `{ key, label }`, length 8), `PERMISSION_LEVELS` (array of `{ key, label }`, keys `view`/`createManage`/`publish` in that order), `DEFAULT_ROLES` (array of 5 `Role` objects: `{ id, name, type: 'default', locked, permissions }`, names in order `Admin, Manager, Developer, Analyst, Support`, `permissions` keyed by every `PERMISSION_COMPONENTS[].key` → `{ view, createManage, publish }` booleans), `DEFAULT_MEMBERS` (array of 3 `Member` objects: `{ id, name, email, initials, color, roleId }`, `roleId` referencing a real `DEFAULT_ROLES[].id`), `UNASSIGNED_ROLE_ID` (string constant `"unassigned"`), `initialsOf(name: string): string`, `colorForSeed(seed: string): string` (deterministic hex color), `slugifyRoleName(name: string, existingIds: string[]): string`.
- Consumes: nothing (leaf module).

- [ ] **Step 1: Write the failing test**

```js
// src/components/settings/team/__tests__/constants.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/constants.test.js --watchAll=false`
Expected: FAIL with "Cannot find module '../constants'"

- [ ] **Step 3: Write the implementation**

```js
// src/components/settings/team/constants.js
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

function allPermissions(value) {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/constants.test.js --watchAll=false`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/constants.js src/components/settings/team/__tests__/constants.test.js
git commit -m "feat(settings): add team/role data model and seed data"
```

---

### Task 2: `EmailChipInput`

**Files:**
- Create: `src/components/settings/team/EmailChipInput.jsx`
- Test: `src/components/settings/team/__tests__/EmailChipInput.test.jsx`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: default export `EmailChipInput({ value: string[], onChange: (next: string[]) => void, placeholder?: string, testId?: string })`. Renders chips + a text input inside `data-testid={testId}` (default `"email-chip-input"`); the inner text input is `data-testid="${testId}-input"`; each chip is `data-testid="${testId}-chip-${chip}"` with a remove button `data-testid="${testId}-remove-${chip}"`. Later tasks (`InviteMemberModal`) rely on exactly this testid shape.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/team/__tests__/EmailChipInput.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailChipInput from "../EmailChipInput";

function Wrapper() {
  const [value, setValue] = React.useState([]);
  return <EmailChipInput value={value} onChange={setValue} placeholder="Type email" />;
}

describe("EmailChipInput", () => {
  it("commits a chip on Enter and clears the text field", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("email-chip-input-chip-a@b.com")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("commits a chip on comma", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "b@c.com" } });
    fireEvent.keyDown(input, { key: "," });
    expect(screen.getByTestId("email-chip-input-chip-b@c.com")).toBeInTheDocument();
  });

  it("does not add duplicate chips", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByTestId("email-chip-input-chip-a@b.com")).toHaveLength(1);
  });

  it("removes the last chip on Backspace when the input is empty", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.queryByTestId("email-chip-input-chip-a@b.com")).not.toBeInTheDocument();
  });

  it("removes a chip when its remove button is clicked", () => {
    render(<Wrapper />);
    const input = screen.getByTestId("email-chip-input-input");
    fireEvent.change(input, { target: { value: "a@b.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByTestId("email-chip-input-remove-a@b.com"));
    expect(screen.queryByTestId("email-chip-input-chip-a@b.com")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/EmailChipInput.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../EmailChipInput'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/team/EmailChipInput.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

export default function EmailChipInput({ value, onChange, placeholder, testId = "email-chip-input" }) {
  const [text, setText] = useState("");

  function commit(raw) {
    const chip = raw.trim();
    if (!chip) return;
    if (value.includes(chip)) {
      setText("");
      return;
    }
    onChange([...value, chip]);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(text);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeChip(chip) {
    onChange(value.filter((v) => v !== chip));
  }

  return (
    <div
      data-testid={testId}
      className="w-full min-h-[42px] px-2 py-1.5 border border-border rounded-md flex flex-wrap items-center gap-1.5 focus-within:ring-1 focus-within:ring-ring"
    >
      {value.map((chip) => (
        <span
          key={chip}
          data-testid={`${testId}-chip-${chip}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-slate-100 text-text-secondary"
        >
          {chip}
          <button
            type="button"
            data-testid={`${testId}-remove-${chip}`}
            onClick={() => removeChip(chip)}
            aria-label={`Remove ${chip}`}
            className="hover:text-rose-600"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        data-testid={`${testId}-input`}
        value={text}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(text)}
        className="flex-1 min-w-[120px] text-sm outline-none py-0.5"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/EmailChipInput.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/EmailChipInput.jsx src/components/settings/team/__tests__/EmailChipInput.test.jsx
git commit -m "feat(settings): add EmailChipInput for comma/Enter-delimited email entry"
```

---

### Task 3: `InviteMemberModal`

**Files:**
- Create: `src/components/settings/team/InviteMemberModal.jsx`
- Test: `src/components/settings/team/__tests__/InviteMemberModal.test.jsx`

**Interfaces:**
- Consumes: `EmailChipInput` (Task 2) exactly as defined; `initialsOf`, `colorForSeed` from `./constants` (Task 1); `previewToast` from `@/components/common/PreviewHeader` (existing); `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog` (existing).
- Produces: default export `InviteMemberModal({ open: boolean, roles: Role[], onClose: () => void, onInvite: (newMembers: Member[]) => void })`. On Invite, calls `onInvite` with one `Member` object per email chip (shape matching `DEFAULT_MEMBERS` in Task 1: `{ id, name, email, initials, color, roleId }`, `id === email`), then calls `onClose`. Testids relied on by Task 6: `invite-modal` (dialog content), `invite-modal-emails-input`/`invite-modal-emails-chip-*` (via `EmailChipInput`'s `testId="invite-modal-emails"`), `invite-modal-bulk-role`, `invite-modal-row-${email}`, `invite-modal-row-name-${email}`, `invite-modal-row-role-${email}`, `invite-modal-submit`, `invite-modal-cancel`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/team/__tests__/InviteMemberModal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InviteMemberModal from "../InviteMemberModal";
import { DEFAULT_ROLES } from "../constants";

describe("InviteMemberModal", () => {
  it("disables Invite until at least one email chip exists", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    expect(screen.getByTestId("invite-modal-submit")).toBeDisabled();
  });

  it("adds a row per email chip, defaulting its role to the first unlocked role", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    expect(screen.getByTestId("invite-modal-row-new@x.com")).toBeInTheDocument();
    expect(screen.getByTestId("invite-modal-row-role-new@x.com")).toHaveValue("manager");
    expect(screen.getByTestId("invite-modal-submit")).not.toBeDisabled();
  });

  it("changing the bulk role updates every row's role select", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(screen.getByTestId("invite-modal-bulk-role"), { target: { value: "developer" } });
    expect(screen.getByTestId("invite-modal-row-role-new@x.com")).toHaveValue("developer");
  });

  it("lets a single row override the bulk role independently", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "a@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(emailInput, { target: { value: "b@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(screen.getByTestId("invite-modal-row-role-a@x.com"), { target: { value: "support" } });
    expect(screen.getByTestId("invite-modal-row-role-a@x.com")).toHaveValue("support");
    expect(screen.getByTestId("invite-modal-row-role-b@x.com")).toHaveValue("manager");
  });

  it("submits one member per row, using the email's local-part as a fallback name, and resets/closes", () => {
    const onInvite = jest.fn();
    const onClose = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={onClose} onInvite={onInvite} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(onInvite).toHaveBeenCalledWith([
      expect.objectContaining({ id: "new@x.com", email: "new@x.com", name: "new", roleId: "manager" }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("cancel closes without inviting", () => {
    const onInvite = jest.fn();
    const onClose = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={onClose} onInvite={onInvite} />);
    fireEvent.click(screen.getByTestId("invite-modal-cancel"));
    expect(onInvite).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/InviteMemberModal.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../InviteMemberModal'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/team/InviteMemberModal.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { previewToast } from "@/components/common/PreviewHeader";
import EmailChipInput from "./EmailChipInput";
import { initialsOf, colorForSeed } from "./constants";

export default function InviteMemberModal({ open, roles, onClose, onInvite }) {
  const defaultRoleId = roles.find((r) => !r.locked)?.id || roles[0].id;
  const [rows, setRows] = useState([]);
  const [bulkRoleId, setBulkRoleId] = useState(defaultRoleId);

  useEffect(() => {
    if (open) {
      setRows([]);
      setBulkRoleId(defaultRoleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleEmailsChange(newEmails) {
    setRows((prev) => {
      const byEmail = new Map(prev.map((r) => [r.email, r]));
      return newEmails.map((email) => byEmail.get(email) || { email, name: "", roleId: bulkRoleId });
    });
  }

  function handleBulkRoleChange(roleId) {
    setBulkRoleId(roleId);
    setRows((prev) => prev.map((r) => ({ ...r, roleId })));
  }

  function handleRowChange(email, patch) {
    setRows((prev) => prev.map((r) => (r.email === email ? { ...r, ...patch } : r)));
  }

  function handleInvite() {
    const newMembers = rows.map((r) => {
      const name = r.name.trim() || r.email.split("@")[0];
      return {
        id: r.email,
        name,
        email: r.email,
        initials: initialsOf(name),
        color: colorForSeed(r.email),
        roleId: r.roleId,
      };
    });
    onInvite(newMembers);
    previewToast(`Invite sent to ${newMembers.length} member${newMembers.length > 1 ? "s" : ""}`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="invite-modal" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Email addresses</div>
            <EmailChipInput
              value={rows.map((r) => r.email)}
              onChange={handleEmailsChange}
              placeholder='Type the email ID(s) and press "Enter", separate by comma in case of more than one'
              testId="invite-modal-emails"
            />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Assign Role and teams</div>
            <select
              data-testid="invite-modal-bulk-role"
              value={bulkRoleId}
              onChange={(e) => handleBulkRoleChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {rows.length > 0 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Member(s)</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.email} className="border-t border-border" data-testid={`invite-modal-row-${r.email}`}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          data-testid={`invite-modal-row-name-${r.email}`}
                          value={r.name}
                          placeholder={r.email.split("@")[0]}
                          onChange={(e) => handleRowChange(r.email, { name: e.target.value })}
                          className="w-full px-2 py-1 border border-border rounded-md text-[12px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[12px] text-text-secondary">{r.email}</td>
                      <td className="px-3 py-2">
                        <select
                          data-testid={`invite-modal-row-role-${r.email}`}
                          value={r.roleId}
                          onChange={(e) => handleRowChange(r.email, { roleId: e.target.value })}
                          className="px-2 py-1 border border-border rounded-md text-[12px]"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            data-testid="invite-modal-cancel"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-border text-text-secondary text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="invite-modal-submit"
            disabled={rows.length === 0}
            onClick={handleInvite}
            className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invite
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/InviteMemberModal.test.jsx --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/InviteMemberModal.jsx src/components/settings/team/__tests__/InviteMemberModal.test.jsx
git commit -m "feat(settings): add Invite Member modal with per-invitee role override"
```

---

### Task 4: `MembersTab`

**Files:**
- Create: `src/components/settings/team/MembersTab.jsx`
- Test: `src/components/settings/team/__tests__/MembersTab.test.jsx`

**Interfaces:**
- Consumes: `InviteMemberModal` (Task 3) exactly as defined; `UNASSIGNED_ROLE_ID` from `./constants` (Task 1).
- Produces: default export `MembersTab({ members: Member[], roles: Role[], onAddMembers: (newMembers: Member[]) => void, onChangeMemberRole: (memberId: string, roleId: string) => void, onDeleteMember: (memberId: string) => void })`. Root testid `team-members-tab`. Search input `team-members-search`. Invite button `team-invite-btn`. Row `team-member-row-${member.id}`, role select `team-member-role-select-${member.id}`, delete button `team-member-delete-${member.id}`. Relied on by Task 6.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/team/__tests__/MembersTab.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MembersTab from "../MembersTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES } from "../constants";

function renderTab(overrides = {}) {
  const props = {
    members: DEFAULT_MEMBERS,
    roles: DEFAULT_ROLES,
    onAddMembers: jest.fn(),
    onChangeMemberRole: jest.fn(),
    onDeleteMember: jest.fn(),
    ...overrides,
  };
  render(<MembersTab {...props} />);
  return props;
}

describe("MembersTab", () => {
  it("renders all members by default", () => {
    renderTab();
    DEFAULT_MEMBERS.forEach((m) => {
      expect(screen.getByTestId(`team-member-row-${m.id}`)).toBeInTheDocument();
    });
  });

  it("filters by search query across name and email", () => {
    renderTab();
    fireEvent.change(screen.getByTestId("team-members-search"), { target: { value: "riya" } });
    expect(screen.getByTestId("team-member-row-riya@tspkarix.com")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-row-himanshu@tspkarix.com")).not.toBeInTheDocument();
  });

  it("calls onChangeMemberRole when a row's role select changes", () => {
    const onChangeMemberRole = jest.fn();
    renderTab({ onChangeMemberRole });
    fireEvent.change(screen.getByTestId("team-member-role-select-riya@tspkarix.com"), { target: { value: "developer" } });
    expect(onChangeMemberRole).toHaveBeenCalledWith("riya@tspkarix.com", "developer");
  });

  it("calls onDeleteMember after confirming deletion", () => {
    const onDeleteMember = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    renderTab({ onDeleteMember });
    fireEvent.click(screen.getByTestId("team-member-delete-riya@tspkarix.com"));
    expect(onDeleteMember).toHaveBeenCalledWith("riya@tspkarix.com");
    window.confirm.mockRestore();
  });

  it("does not delete when the confirmation is cancelled", () => {
    const onDeleteMember = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderTab({ onDeleteMember });
    fireEvent.click(screen.getByTestId("team-member-delete-riya@tspkarix.com"));
    expect(onDeleteMember).not.toHaveBeenCalled();
    window.confirm.mockRestore();
  });

  it("opens the invite modal from the Invite team mate button", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("team-invite-btn"));
    expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/MembersTab.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../MembersTab'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/team/MembersTab.jsx
import React, { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import { UNASSIGNED_ROLE_ID } from "./constants";

export default function MembersTab({ members, roles, onAddMembers, onChangeMemberRole, onDeleteMember }) {
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = members.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  function handleDelete(member) {
    if (window.confirm(`Remove ${member.name} from the team?`)) {
      onDeleteMember(member.id);
    }
  }

  return (
    <div data-testid="team-members-tab">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            data-testid="team-members-search"
            placeholder="Search by name or email.."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <button
          type="button"
          data-testid="team-invite-btn"
          onClick={() => setInviteOpen(true)}
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium whitespace-nowrap"
        >
          Invite team mate
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Teammate</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border" data-testid={`team-member-row-${m.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </div>
                    <span className="font-semibold text-text-primary text-[13px]">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{m.email}</td>
                <td className="px-4 py-3">
                  <select
                    data-testid={`team-member-role-select-${m.id}`}
                    value={m.roleId}
                    onChange={(e) => onChangeMemberRole(m.id, e.target.value)}
                    className="text-[12px] border border-border rounded-md px-2 py-1 bg-white"
                  >
                    {m.roleId === UNASSIGNED_ROLE_ID && <option value={UNASSIGNED_ROLE_ID}>No role</option>}
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    data-testid={`team-member-delete-${m.id}`}
                    onClick={() => handleDelete(m)}
                    aria-label={`Remove ${m.name}`}
                    className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-text-muted">
                  No teammates match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteMemberModal open={inviteOpen} roles={roles} onClose={() => setInviteOpen(false)} onInvite={onAddMembers} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/MembersTab.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/MembersTab.jsx src/components/settings/team/__tests__/MembersTab.test.jsx
git commit -m "feat(settings): add Team Members tab with search, role edit, delete"
```

---

### Task 5: `RolesTab`

**Files:**
- Create: `src/components/settings/team/RolesTab.jsx`
- Test: `src/components/settings/team/__tests__/RolesTab.test.jsx`

**Interfaces:**
- Consumes: `PERMISSION_COMPONENTS`, `PERMISSION_LEVELS`, `slugifyRoleName` from `./constants` (Task 1).
- Produces: default export `RolesTab({ roles: Role[], onTogglePermission: (roleId: string, componentKey: string, levelKey: string, checked: boolean) => void, onCreateRole: (role: { id: string, name: string }) => void, onDeleteRole: (roleId: string) => void })`. Root testid `team-roles-tab`. Sidebar entries `role-nav-${role.id}`; delete icon (custom roles only) `role-delete-${role.id}`; "Create new role" trigger `role-create-btn`, its inline name input `role-new-name-input`, confirm `role-new-confirm`, cancel `role-new-cancel`. Checklist checkboxes `role-perm-${role.id}-${componentKey}-${levelKey}`. Relied on by Task 6.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/team/__tests__/RolesTab.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RolesTab from "../RolesTab";
import { DEFAULT_ROLES } from "../constants";

function renderTab(roles = DEFAULT_ROLES, overrides = {}) {
  const props = {
    roles,
    onTogglePermission: jest.fn(),
    onCreateRole: jest.fn(),
    onDeleteRole: jest.fn(),
    ...overrides,
  };
  render(<RolesTab {...props} />);
  return props;
}

describe("RolesTab", () => {
  it("selects Admin by default and disables its checkboxes", () => {
    renderTab();
    expect(screen.getByTestId("role-perm-admin-segments-view")).toBeDisabled();
    expect(screen.getByTestId("role-perm-admin-segments-view")).toBeChecked();
  });

  it("toggles a permission checkbox for an editable role", () => {
    const onTogglePermission = jest.fn();
    renderTab(DEFAULT_ROLES, { onTogglePermission });
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    fireEvent.click(screen.getByTestId("role-perm-manager-revenueConfig-createManage"));
    expect(onTogglePermission).toHaveBeenCalledWith("manager", "revenueConfig", "createManage", true);
  });

  it("creates a new custom role from the sidebar", () => {
    const onCreateRole = jest.fn();
    renderTab(DEFAULT_ROLES, { onCreateRole });
    fireEvent.click(screen.getByTestId("role-create-btn"));
    fireEvent.change(screen.getByTestId("role-new-name-input"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByTestId("role-new-confirm"));
    expect(onCreateRole).toHaveBeenCalledWith({ id: "custom-growth", name: "Growth" });
  });

  it("shows a delete action only for custom roles", () => {
    const customRole = { id: "custom-growth", name: "Growth", type: "custom", locked: false, permissions: DEFAULT_ROLES[0].permissions };
    renderTab([...DEFAULT_ROLES, customRole]);
    expect(screen.queryByTestId("role-delete-admin")).not.toBeInTheDocument();
    expect(screen.getByTestId("role-delete-custom-growth")).toBeInTheDocument();
  });

  it("deletes a custom role after confirmation", () => {
    const onDeleteRole = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const customRole = { id: "custom-growth", name: "Growth", type: "custom", locked: false, permissions: DEFAULT_ROLES[0].permissions };
    renderTab([...DEFAULT_ROLES, customRole], { onDeleteRole });
    fireEvent.click(screen.getByTestId("role-delete-custom-growth"));
    expect(onDeleteRole).toHaveBeenCalledWith("custom-growth");
    window.confirm.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/RolesTab.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../RolesTab'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/team/RolesTab.jsx
import React, { useState } from "react";
import { Plus, Trash2, Lock } from "lucide-react";
import { PERMISSION_COMPONENTS, PERMISSION_LEVELS, slugifyRoleName } from "./constants";

export default function RolesTab({ roles, onTogglePermission, onCreateRole, onDeleteRole }) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id);
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = roles.find((r) => r.id === selectedId) || roles[0];

  function handleCreate() {
    const name = newRoleName.trim();
    if (!name) return;
    const id = slugifyRoleName(name, roles.map((r) => r.id));
    onCreateRole({ id, name });
    setSelectedId(id);
    setNewRoleName("");
    setCreating(false);
  }

  function handleDelete(role) {
    if (window.confirm(`Delete the "${role.name}" role?`)) {
      onDeleteRole(role.id);
      setSelectedId(roles.find((r) => r.id !== role.id)?.id);
    }
  }

  return (
    <div className="flex gap-4" data-testid="team-roles-tab">
      <div className="w-[220px] flex-shrink-0 bg-surface border border-border rounded-lg p-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center group">
            <button
              type="button"
              data-testid={`role-nav-${r.id}`}
              onClick={() => setSelectedId(r.id)}
              className={`flex-1 text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                selected?.id === r.id ? "bg-primary-tint text-primary font-semibold" : "text-text-secondary hover:bg-slate-50"
              }`}
            >
              {r.name}
            </button>
            {r.type === "custom" && (
              <button
                type="button"
                data-testid={`role-delete-${r.id}`}
                onClick={() => handleDelete(r)}
                aria-label={`Delete ${r.name}`}
                className="p-1.5 text-text-muted hover:text-rose-600 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {creating ? (
          <div className="p-2 space-y-2">
            <input
              type="text"
              autoFocus
              data-testid="role-new-name-input"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Role name"
              className="w-full px-2 py-1.5 border border-border rounded-md text-[12px]"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                data-testid="role-new-confirm"
                onClick={handleCreate}
                className="px-2 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
              >
                Add
              </button>
              <button
                type="button"
                data-testid="role-new-cancel"
                onClick={() => { setCreating(false); setNewRoleName(""); }}
                className="px-2 py-1 rounded-md border border-border text-[11px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            data-testid="role-create-btn"
            onClick={() => setCreating(true)}
            className="w-full mt-1 flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] text-primary hover:bg-primary-tint font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new role
          </button>
        )}
      </div>

      {selected && (
        <div className="flex-1 bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{selected.name}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-slate-100 text-text-muted">
              {selected.type}
            </span>
            {selected.locked && <Lock className="w-3.5 h-3.5 text-text-muted" />}
          </div>

          <table className="w-full text-left">
            <thead className="text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="py-2 font-medium">Components</th>
                {PERMISSION_LEVELS.map((lvl) => (
                  <th key={lvl.key} className="py-2 font-medium text-center">{lvl.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_COMPONENTS.map((c) => (
                <tr key={c.key} className="border-t border-border" data-testid={`role-perm-row-${c.key}`}>
                  <td className="py-3 text-[13px] text-text-primary">{c.label}</td>
                  {PERMISSION_LEVELS.map((lvl) => (
                    <td key={lvl.key} className="py-3 text-center">
                      <input
                        type="checkbox"
                        data-testid={`role-perm-${selected.id}-${c.key}-${lvl.key}`}
                        checked={selected.permissions[c.key][lvl.key]}
                        disabled={selected.locked}
                        onChange={(e) => onTogglePermission(selected.id, c.key, lvl.key, e.target.checked)}
                        className="w-4 h-4 accent-primary disabled:cursor-not-allowed"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/RolesTab.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/RolesTab.jsx src/components/settings/team/__tests__/RolesTab.test.jsx
git commit -m "feat(settings): add Role Management tab with editable permission checklist"
```

---

### Task 6: `TeamManagementPanel` (wires Members + Roles together)

**Files:**
- Create: `src/components/settings/team/TeamManagementPanel.jsx`
- Test: `src/components/settings/team/__tests__/TeamManagementPanel.test.jsx`

**Interfaces:**
- Consumes: `MembersTab` (Task 4), `RolesTab` (Task 5) exactly as defined; `DEFAULT_MEMBERS`, `DEFAULT_ROLES`, `PERMISSION_COMPONENTS`, `UNASSIGNED_ROLE_ID` from `./constants` (Task 1); `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs` (existing).
- Produces: default export `TeamManagementPanel()` — no props, owns all state. Root testid `settings-team`. Sub-tab triggers `team-tab-members` / `team-tab-roles`. Relied on by Task 7 (`Settings.jsx`).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/team/__tests__/TeamManagementPanel.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TeamManagementPanel from "../TeamManagementPanel";

describe("TeamManagementPanel", () => {
  it("shows the Team Members tab by default", () => {
    render(<TeamManagementPanel />);
    expect(screen.getByTestId("team-members-tab")).toBeInTheDocument();
  });

  it("switches to the Role Management tab", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    expect(screen.getByTestId("team-roles-tab")).toBeInTheDocument();
  });

  it("an invited member appears in the Team Members table", () => {
    render(<TeamManagementPanel />);
    fireEvent.click(screen.getByTestId("team-invite-btn"));
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "grace@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(screen.getByTestId("team-member-row-grace@x.com")).toBeInTheDocument();
  });

  it("toggling a permission in Role Management persists across tab switches", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    fireEvent.click(screen.getByTestId("role-perm-manager-revenueConfig-createManage"));
    expect(screen.getByTestId("role-perm-manager-revenueConfig-createManage")).toBeChecked();
    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    expect(screen.getByTestId("role-perm-manager-revenueConfig-createManage")).toBeChecked();
  });

  it("deleting a custom role reassigns its members to No role", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-create-btn"));
    fireEvent.change(screen.getByTestId("role-new-name-input"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByTestId("role-new-confirm"));

    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    fireEvent.change(screen.getByTestId("team-member-role-select-riya@tspkarix.com"), { target: { value: "custom-growth" } });

    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    jest.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByTestId("role-delete-custom-growth"));
    window.confirm.mockRestore();

    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    expect(screen.getByTestId("team-member-role-select-riya@tspkarix.com")).toHaveValue("unassigned");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/settings/team/__tests__/TeamManagementPanel.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../TeamManagementPanel'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/team/TeamManagementPanel.jsx
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MembersTab from "./MembersTab";
import RolesTab from "./RolesTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES, PERMISSION_COMPONENTS, UNASSIGNED_ROLE_ID } from "./constants";

function blankPermissions() {
  return PERMISSION_COMPONENTS.reduce((acc, { key }) => {
    acc[key] = { view: false, createManage: false, publish: false };
    return acc;
  }, {});
}

export default function TeamManagementPanel() {
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  function handleAddMembers(newMembers) {
    setMembers((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      newMembers.forEach((m) => byId.set(m.id, m));
      return Array.from(byId.values());
    });
  }

  function handleChangeMemberRole(memberId, roleId) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, roleId } : m)));
  }

  function handleDeleteMember(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  function handleTogglePermission(roleId, componentKey, levelKey, checked) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [componentKey]: { ...r.permissions[componentKey], [levelKey]: checked } } }
          : r
      )
    );
  }

  function handleCreateRole({ id, name }) {
    setRoles((prev) => [...prev, { id, name, type: "custom", locked: false, permissions: blankPermissions() }]);
  }

  function handleDeleteRole(roleId) {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setMembers((prev) => prev.map((m) => (m.roleId === roleId ? { ...m, roleId: UNASSIGNED_ROLE_ID } : m)));
  }

  return (
    <div data-testid="settings-team">
      <h2 className="text-base font-semibold text-text-primary mb-3">Team</h2>
      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members" data-testid="team-tab-members">Team Members</TabsTrigger>
          <TabsTrigger value="roles" data-testid="team-tab-roles">Role Management</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTab
            members={members}
            roles={roles}
            onAddMembers={handleAddMembers}
            onChangeMemberRole={handleChangeMemberRole}
            onDeleteMember={handleDeleteMember}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab
            roles={roles}
            onTogglePermission={handleTogglePermission}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/settings/team/__tests__/TeamManagementPanel.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/team/TeamManagementPanel.jsx src/components/settings/team/__tests__/TeamManagementPanel.test.jsx
git commit -m "feat(settings): wire Team Members and Role Management tabs together"
```

---

### Task 7: Mount `TeamManagementPanel` in `Settings.jsx`

**Files:**
- Modify: `src/pages/Settings.jsx:191-245` (delete `TEAMMATES` and `TeamPanel`), `src/pages/Settings.jsx:323-330` (`PANELS.team`)
- Test: none new — this task is verified by re-running the full existing suite plus a quick manual check (Settings.jsx has no prior test file, confirmed in codebase exploration).

**Interfaces:**
- Consumes: `TeamManagementPanel` (Task 6) exactly as defined, imported as `import TeamManagementPanel from "@/components/settings/team/TeamManagementPanel";`.
- Produces: `Settings.jsx`'s `team` sub-nav renders `TeamManagementPanel` instead of the old static `TeamPanel`.

- [ ] **Step 1: Remove the old mock team code and mount the new panel**

In `src/pages/Settings.jsx`, add the import near the top (after the `lucide-react` import block):

```jsx
import TeamManagementPanel from "@/components/settings/team/TeamManagementPanel";
```

Delete the `TEAMMATES` constant and the entire `TeamPanel` function (lines 191-245 in the current file — the block starting at `const TEAMMATES = [` and ending at the closing `}` of `function TeamPanel() { ... }`, immediately before `function NotificationsPanel()`).

Change the `PANELS` map:

```jsx
const PANELS = {
  account: AccountPanel,
  channels: ChannelsPanel,
  billing: BillingPanel,
  team: TeamManagementPanel,
  notifications: NotificationsPanel,
  api: ApiPanel,
};
```

- [ ] **Step 2: Run the full test suite to confirm nothing else broke**

Run: `npx craco test --watchAll=false`
Expected: PASS — all existing suites plus the 6 new `src/components/settings/team/__tests__/*` suites (28 new tests total across Tasks 1-6).

- [ ] **Step 3: Manual smoke check**

Run: `npm start` (or the project's existing dev-server workflow), navigate to Settings → Team, and confirm:
- The tab defaults to "Team Members" showing Himanshu/Riya/Arjun.
- Search filters the list.
- "Invite team mate" opens the modal; entering 2 emails with different roles and clicking Invite adds 2 new rows.
- Switching to "Role Management" shows Admin (locked, all checked) and the other 4 roles editable.
- "+ Create new role" adds a blank custom role; toggling its checkboxes works; deleting it while assigned to a member falls that member back to "No role".

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat(settings): mount TeamManagementPanel in place of the static Team panel"
```

---

## Self-Review Notes

- **Spec coverage:** §Members tab (search, actions, invite button) → Task 4. §Invite modal (chips, bulk role, per-row override) → Task 3. §Role Management (sidebar, checklist, create role) → Task 5. §Data model / role reconciliation → Task 1. §Edge cases (duplicate emails, unassigned-on-delete) → Tasks 2, 6. §Wiring into Settings.jsx → Task 7. All spec sections have a task.
- **Type consistency checked:** `Member` shape (`id, name, email, initials, color, roleId`) is identical across Tasks 1, 3, 4, 6. `Role` shape (`id, name, type, locked, permissions`) identical across Tasks 1, 5, 6. Callback signatures (`onChangeMemberRole(memberId, roleId)`, `onTogglePermission(roleId, componentKey, levelKey, checked)`, `onCreateRole({id, name})`, `onDeleteRole(roleId)`) match between where they're defined (Task 6) and where they're tested/called (Tasks 4, 5).
- **No placeholders:** every step has full, runnable code — no TBD/TODO markers.
