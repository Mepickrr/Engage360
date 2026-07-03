# Flow Builder Header — Checklist Feature (Static Representation)

## Goal

Represent, as UI only (no wired-up behavior), the full set of header elements requested for
the Flow Builder so the UX can be reviewed quickly. This spec covers **layout and visual
representation only** — popups, confirmation dialogs, and data wiring are explicitly out of
scope for this pass and will be scoped separately once the UX is agreed.

## Current state

Both `src/pages/FlowBuilder.jsx` (v1) and `src/pages/FlowBuilderV2.jsx` (v2) render the same
shared header component: `src/components/flows/builder/BuilderTopbar.jsx` (only difference is
a `basePath` prop for back-navigation). This spec applies identically to both — no divergence
between v1 and v2.

Today's header already has: back button, editable flow name, active/paused toggle, a status
badge (5 states), a save indicator (time only), a "View Analytics" button, Pause/Resume,
a Preview icon (stub), a Test button, a Save Journey button, and a kebab (`⋯`) menu with a
stubbed "Download report" item.

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ←  │ Diwali Sale Flow ✎  │ 🏷 Promotional ▾ │ ⏺ Live │ ⚠ 2     Saved 2m ago · Meenal K.   │
│                                                                                             │
│                              ↺ ↻ │ 🕐 Version History ▾ │ 📊 Analytics │ 💬 Chats │  ⋯     │
│                                                              🧪 Test Mode │ ▶ Preview │ ⏻ Live │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Left group — identity & state
- **Back** — existing, unchanged.
- **Flow Name** — existing, unchanged (click-to-edit inline text).
- **Flow Tag** — new pill with dropdown chevron, next to the name. Options: Transactional,
  Promotional (default), Broadcast, Retention. Static representation shows the pill with the
  current tag; dropdown interaction is out of scope for this pass.
- **Status Badge** — existing component, extended to cover all 11 states: Draft, Live,
  Archive, Test, Paused, Completed, Scheduled, Rerun Completed, DND, Error, Inprogress. A flow
  has exactly one status at a time (no new status logic needed — this pass only extends the
  badge's visual states to match whatever the backend already returns).
- **Flow Warning** — new icon (triangle/alert), rendered only when the flow has open issues.
  Shows a count badge (e.g. `⚠ 2`). Clicking it (future work) opens a list of issues; for this
  pass, just the icon + count.

### Center — autosave
- **Auto Save** — existing `SaveIndicator`, extended to show both relative time and the last
  editor's name: `Saved 2m ago · Meenal K.` Same states as today (`Saving…`, `Save failed`,
  `Saved …`), just with the author appended.

### Right group — history/insight cluster
- **Undo / Redo** — new icon buttons. Scope is **canvas edits only** (node/edge changes on the
  builder canvas) — not header-level edits like rename or tag changes.
- **Version History** — new icon + dropdown (clock icon), for flows that have been live at
  least once. Static representation: dropdown showing a list of past live versions with last
  live date, edited-by, and a way to select one (selection behavior out of scope this pass).
- **View Analytics** — existing, unchanged. Remains inline (not moved to overflow) since it's
  already a primary action for flows that have been live.
- **View all Customer Chat** — new icon button, visible only for flows that have been/are live
  at least once. Opens (future work) the chat log for all users who entered the flow.

### Right group — flow-state actions
- **Test Mode** — existing `Test` button, relabeled/kept as-is visually; confirmation popup on
  enable/disable is future work.
- **Preview Flow** — existing Preview icon; interactive preview popup is future work.
- **Live/Inactive toggle** — existing `ActiveToggle`; confirmation popup on switch is future
  work.

### Overflow (`⋯`) menu
Per direction to keep the bar from getting cluttered, these lower-frequency actions move into
the kebab menu:
- **Download Report** — existing stub, kept in overflow. Popup for email/timeline selection is
  future work.
- **Download Error Report** — new item, added to overflow alongside Download Report. Same
  future popup pattern (email/timeline selection).

## Explicitly out of scope for this pass
- All confirmation popups (Test Mode toggle, Live/Inactive toggle).
- Interactive Preview Flow popup.
- Download Report / Download Error Report popup (email + timeline picker).
- Flow Warning issue list popup.
- Version History selection/restore behavior.
- Customer Chat log viewer.
- Any new status-transition logic — the badge only needs to visually support the 11 states;
  determining which state a flow is in is unchanged.
- Duplicate/Delete flow actions — these already live on the flows home screen and are not part
  of the builder header.
- Responsive/collapse behavior for narrow viewports (flagged for later; not designed here).

## Applies to
`src/components/flows/builder/BuilderTopbar.jsx`, used by both `FlowBuilder.jsx` (v1) and
`FlowBuilderV2.jsx` (v2) identically.
