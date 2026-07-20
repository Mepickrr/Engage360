# CLAUDE.md

## Flow Builder v1 vs v2 — shared code boundary

`FlowBuilder.jsx` (`/flows/builder/*`) and `FlowBuilderV2.jsx` (`/flows-v2/builder/*`) share almost their entire component tree: `Canvas.jsx`, every node under `nodes/` (including their right panels), `BuilderTopbar.jsx`, `NodePalette.jsx`, `RightPanel.jsx`, `store/flowBuilderStore.js`, `lib/flowMeta.js`. Editing one of these files in place changes both builders — there is no v1/v2 split for them today.

**Before editing any file under `src/components/flows/builder/` (or `store/flowBuilderStore.js`, `lib/flowMeta.js`) for a v2-only change:**

1. Check every consumer of the file first:
   ```bash
   grep -rln "from \"@/components/flows/builder/<path>\"" src --include="*.jsx" --include="*.js"
   ```
2. If `FlowBuilder.jsx` is a consumer (directly, or transitively via `Canvas.jsx`/`nodes/*`) and the change is meant for v2 only, **do not edit the file in place.** Use one of:
   - **Small behavioral toggle** (hide a tab, restrict a list, swap an icon) → use `FlowVariantContext` (`src/components/flows/FlowVariantContext.jsx`). v2 wraps its tree in `<FlowVariantContext.Provider value={v2Variant}>` (see `FlowBuilderV2.jsx`); v1 never provides it, so `useFlowVariant()` returns `{}` there and the toggle can't leak into v1. Existing consumers: `NodePalette.jsx`, `EventPickerModal.jsx`, `WhatsAppNode`, `EmailNode`.
   - **Structural/sequence rewrite** (different steps, dropped/added UI, different data flow) → fork the file/folder (e.g. `trigger/` → `triggerV2/`), repoint only `FlowBuilderV2.jsx`'s import to the new copy, and leave the original untouched. This is what was done for the Start Trigger wizard: v1 uses `src/components/flows/builder/trigger/`, v2 uses `src/components/flows/builder/triggerV2/`.
3. After the change, run both lockdown suites to catch accidental leakage:
   ```bash
   npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false
   ```

If a change is genuinely meant for both versions (a real bug fix, not a redesign), editing the shared file in place is correct — don't fork just to be safe.
