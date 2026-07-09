# Start-trigger lockdown for first-time flow setup

## Problem

In both flow builders (`FlowBuilder.jsx` / v1 and `FlowBuilderV2.jsx` / v2), the
start-trigger wizard (`StartTriggerWizard.jsx`) that opens for a brand-new flow
can be dismissed without configuring a trigger:

- The wizard's `Dialog` closes on Escape or backdrop click
  (`onOpenChange={(o) => !o && onClose()}` in `StartTriggerWizard.jsx`).
- `BuilderTopbar`'s back-arrow button (`data-testid="builder-back"`) sits
  outside the canvas's pointer-events-blocked wrapper, so it stays clickable
  and can navigate away regardless of wizard state.
- Today, closing without configuring on a `/new` route calls `navigate(-1)`,
  which silently abandons the attempt with no confirmation and no way to
  explicitly save or delete.

There is currently no way to reach a *saved* flow with no start-trigger node
(no duplicate/template/clone feature exists), so the only real gap is the
in-progress `/new` session — but the fix introduces a new "Save draft" exit
that itself produces a trigger-less saved flow, so re-opening that draft must
also be handled.

## Goal

During first-time trigger setup (no trigger configured yet), the user must
either finish configuring the trigger, or explicitly choose to **save a
draft** or **delete the flow**. There is no other way to leave the wizard.

Editing an *already-configured* trigger (via the pencil/edit icon on the
start-trigger node) is unaffected — normal cancel/close behavior is preserved
there.

## Design

### 1. Auto-open condition

Replace the wizard's auto-open condition from "route is `/new`" to:

```js
const hasTriggerNode = nodes?.some((n) => n.id === "start-trigger-node");
const [triggerModalOpen, setTriggerModalOpen] = useState(!hasTriggerNode);
```

and keep it in sync as `nodes` hydrates from the server (existing
`hydrate`/`serverFlow` effect) — if a loaded flow has no `start-trigger` node,
force `triggerModalOpen` to `true`. This covers:

- Brand-new flows (`/new`, zero nodes).
- Drafts saved via the new "Save draft" action before a trigger was
  configured (see below) — reopening them re-triggers lockdown.

### 2. Lockdown flag

```js
const lockdown = !existingTriggerConfig; // true only when no trigger exists yet
```

Passed into `StartTriggerWizard` as a new `lockdown` prop.

### 3. `StartTriggerWizard` changes

When `lockdown` is `true`:

- `Dialog`'s `onOpenChange` becomes a no-op (drop the `!o && onClose()` call)
  so Escape and backdrop-click do nothing.
- The header's X close button is replaced by two text actions, top-right:
  - **"Save draft"** (muted/secondary style)
  - **"Delete flow"** (destructive/red style)
- Internal navigation (trigger-select → step-1 → step-2, and the
  back-chevron between them) is unchanged — that's navigation within setup,
  not an exit.

When `lockdown` is `false` (editing an existing trigger): header renders
exactly as today (X button, `onOpenChange` closes as before).

### 4. "Save draft" action

New handler passed into the wizard (e.g. `onSaveDraft`):

- If no flow doc exists yet (`flowId` is null): call
  `createFlow({ name: "Untitled flow", nodes: [], edges: [] })` (defaults to
  `status: "draft"` per `flowsApi.js`), then `navigate(basePath)`.
- If a flow doc already exists (re-opened draft): just `navigate(basePath)` —
  autosave already persists canvas state.

### 5. "Delete flow" action

New handler passed into the wizard (e.g. `onDeleteFlow`):

- If no flow doc exists yet: no API call, just `navigate(basePath)`.
- If a flow doc exists: call `deleteFlow(flowId)`, then `navigate(basePath)`.

### 6. `BuilderTopbar` back-arrow

Add a `locked` prop to `BuilderTopbar`. While `true`:

- The back-arrow button (`data-testid="builder-back"`) is disabled
  (greyed out, `onClick` no-op) so it can't bypass the wizard's own
  Save draft / Delete flow actions.

`FlowBuilder.jsx` and `FlowBuilderV2.jsx` both pass `locked={triggerModalOpen && lockdown}`.

### Unaffected

- `handleTriggerComplete` (Finish button flow), `placeTriggerNode`, autosave,
  and the AI Calling / AI Chatbot global wizards are untouched.
- Both v1 (`FlowBuilder.jsx`) and v2 (`FlowBuilderV2.jsx`) get this fix
  identically since they share `StartTriggerWizard` and `BuilderTopbar`.

## Out of scope

- Detecting/handling a saved flow with no trigger created via a
  duplicate/clone/template feature — no such feature exists today.
- Any "needs setup" badge on the Flows list for draft flows — not requested.
