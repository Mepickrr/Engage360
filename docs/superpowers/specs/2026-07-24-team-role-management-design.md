# Team & Role Management — Settings › Team tab redesign

Date: 2026-07-24

## Context

`src/pages/Settings.jsx` is a static preview/prototype page (mock data, `previewToast()` stubs for unimplemented actions, no backend). Its `TeamPanel` currently renders a hardcoded 3-row table with an "Invite teammate" button that only fires a fake toast — no modal, no roles UI, no real state exists.

This spec redesigns the Team tab into two sub-tabs — **Team Members** and **Role Management** — with real client-side interactivity (add/search/delete members, edit role permissions) but no backend integration, consistent with the rest of this prototype.

## Goals

1. Split the Team tab into **Team Members** and **Role Management** sub-tabs.
2. Team Members: search by name/email, per-row actions (edit role, delete), "Invite team mate" button top-right.
3. Invite flow: modal with chip-style email input, bulk role assignment, per-invite override table.
4. Role Management: sidebar of roles with an editable permission checklist (View / Create & Manage / Publish) across 8 fixed components, plus custom role creation.

## Out of scope

- Any real API/backend calls (sending invite emails, persisting roles server-side). All state is local React state, seeded from mock data, lost on refresh — matching the rest of `Settings.jsx`.
- Auth/permission enforcement elsewhere in the app based on these roles. This is UI only.
- Multi-tenant/team assignment ("teams" mentioned in the "Assign Role and teams" label refers only to role selection in this iteration — no separate teams concept is modeled.)

## Architecture

New folder: `src/components/settings/team/`

| File | Responsibility |
|---|---|
| `TeamManagementPanel.jsx` | Top-level panel replacing `TeamPanel` in `Settings.jsx`. Renders `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`src/components/ui/tabs.jsx`) for "Team Members" / "Role Management". Owns lifted state: `members`, `roles`. Passes state + setters down as props. |
| `MembersTab.jsx` | Search input, members table, row actions, "Invite team mate" button. |
| `InviteMemberModal.jsx` | Radix `Dialog` (`src/components/ui/dialog.jsx`), same pattern as `NewSegmentModal.jsx`. Email chip input, bulk role select, per-invite override table, Invite/Cancel actions. |
| `EmailChipInput.jsx` | Reusable chip/tag input for comma- or Enter-delimited email entry. New component — no equivalent exists in the codebase today. |
| `RolesTab.jsx` | Left sidebar of roles (+ "Create new role"), right-side permission checklist using `src/components/ui/checkbox.jsx`. |
| `constants.js` | `PERMISSION_COMPONENTS` list, `DEFAULT_ROLES` seed data, `DEFAULT_MEMBERS` seed data (migrated from the old `TEAMMATES` array). |

`src/pages/Settings.jsx` changes: remove `TEAMMATES`, `TeamPanel`; import and map `PANELS.team = TeamManagementPanel`.

## Data model

```js
// Member
{
  id: string,
  name: string,
  email: string,
  initials: string,
  color: string,       // hex, for avatar background
  roleId: string,      // references Role.id
}

// Role
{
  id: string,
  name: string,
  type: 'default' | 'custom',
  locked: boolean,      // true only for Admin — checklist fully checked & disabled, not deletable
  permissions: {
    [componentKey]: { view: boolean, createManage: boolean, publish: boolean }
  }
}
```

`PERMISSION_COMPONENTS` (8 fixed keys, replacing the current app's `Coupons / Recommendations & Catalog / Dashboard & analyze / Segments / Imports / Campaigns / Drafts` list entirely):

```js
[
  { key: 'campaignJourney', label: 'Campaign & Journey Management' },
  { key: 'segments',        label: 'Segments' },
  { key: 'userProfile',     label: 'User Profile' },
  { key: 'channelConfig',   label: 'Channel Configuration' },
  { key: 'revenueConfig',   label: 'Revenue Configuration' },
  { key: 'dataImports',     label: 'Data Imports' },
  { key: 'dataUpload',      label: 'Data Upload' },
  { key: 'couponCode',      label: 'Coupon Code' },
]
```

**Role list reconciliation:** the invite dropdown's role set (`Admin, Manager, Developer, Analyst, Support`) and the Role Management screenshot's set (`..., Marketer`) are unified into one list so every assignable role is manageable in the same place: **Admin, Manager, Developer, Analyst, Support**. "Marketer" is dropped.

- **Admin**: `locked: true`, all permissions `true`, checkboxes rendered disabled, no delete affordance.
- **Manager, Developer, Analyst, Support**: `type: 'default'`, seeded with reasonable non-trivial permission defaults, fully editable, not deletable (defaults are permanent, only their checklists are editable).
- **Custom roles**: `type: 'custom'`, created via "+ Create new role" with a blank checklist (all `false`), fully editable, deletable.

## Behavior

### Team Members tab

- Search input (styled like the search pattern in `src/pages/Segments.jsx`) filters the table client-side by case-insensitive substring match on `name` or `email`.
- Table columns: Member (avatar + name), Email, Role (badge showing `roles.find(r => r.id === roleId).name`), Actions.
- Row actions:
  - **Edit role**: inline Radix `Select` (or a small popover containing one) listing all current role names; selecting one updates `member.roleId` in local state immediately.
  - **Delete**: opens a Radix `AlertDialog` confirmation; on confirm, removes the member from local state.
- "Invite team mate" button (top-right of the tab) opens `InviteMemberModal`.

### Invite Member modal

- `EmailChipInput`: typing and pressing Enter or `,` commits the current text as a chip (trimmed, deduped against existing chips); Backspace on an empty input removes the last chip.
- "Assign Role and teams" section: a `Select` of the 5 roles, used as the **default role** applied to all chips currently entered.
- Below that, a live table with one row per email chip: an optional free-text Name field (blank by default), the email (read-only), and a per-row role `Select` initialized to the bulk-selected role but independently overridable.
- **Invite** button: requires at least one email chip and a role resolved for every row (bulk default satisfies this unless overridden to something invalid — since the select always has a valid default, this is effectively always satisfiable once ≥1 email exists). On click: for each row, create a new `Member` (name falls back to the email's local-part if left blank, a fresh `id`, a deterministic avatar color/initials) and append to the `members` list in `TeamManagementPanel`'s state. Show a confirmation toast (`previewToast()`, consistent with the rest of the app's non-critical feedback). Close the modal and reset its internal state.
- **Cancel**: closes without changes.

### Role Management tab

- Left sidebar lists all roles (`DEFAULT_ROLES` + any session-created custom roles), each row clickable to select it for editing on the right. A "+ Create new role" affordance sits at the bottom of the sidebar.
- Right panel for the selected role:
  - Role name (editable text field for custom roles; static label for defaults, since defaults keep their name in this iteration).
  - A small type badge: "Default" or "Custom".
  - Permission checklist: one row per `PERMISSION_COMPONENTS` entry, three `Checkbox`es per row (View, Create & Manage, Publish). Toggling a checkbox updates that role's `permissions[key][level]` in local state immediately — no separate Save button, since this is real interactive state rather than a stub.
  - If the selected role is Admin: all checkboxes rendered `checked` and `disabled`.
  - If the selected role is custom: a "Delete role" action is available (with a confirm dialog); deleting a role that's currently assigned to any member reassigns those members to... **not handled automatically** — see Edge cases below.
- "+ Create new role": prompts for a role name (simple inline text input, not a separate modal — keep it lightweight), creates a new `Role` with `type: 'custom'`, `locked: false`, all permissions `false`, and selects it in the sidebar for immediate editing.

## Edge cases

- **Deleting a role assigned to existing members**: since there's no backend and no cross-tab validation requirement was specified, deleting an in-use custom role will fall back those members' `roleId` to a sentinel "Unassigned" state (rendered as a muted "No role" badge in the Members table) rather than silently breaking the UI. This is the simplest safe behavior and avoids needing a blocking-deletion confirmation flow.
- **Duplicate email chips**: silently deduped on entry (no error toast — keeps the input frictionless).
- **Invalid email format**: not strictly validated (no regex enforcement) — this is a prototype seed-data flow, not a real invite system. Chips are free text.
- **Empty invite (no chips) or clicking Invite with zero rows**: the Invite button is disabled until at least one chip exists.

## Testing

No existing automated test suite covers `Settings.jsx` or its panels. Verification will be manual: run the dev server, exercise the Team tab (switch sub-tabs, search/filter, invite a member with 2+ emails and mixed roles, edit a member's role, delete a member, create a custom role, toggle its permissions, delete the custom role while a member is assigned to it) and confirm behavior matches this spec.
