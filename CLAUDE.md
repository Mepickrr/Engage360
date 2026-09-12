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

## Fastrr Engage 2 (`engage2/`) — shared code boundary with `engage/`

The Fastrr Engage 2 fork (`src/components/engage2/`, `src/pages/*2.jsx`) duplicated the original Fastrr Engage code (`src/components/engage/`) rather than reusing it, so most of `engage2/` is free to change without touching `engage/`. Two imports were correctly left shared instead of forked, because they were never in scope for the fork:

- `WhatsAppBubblePreview` (`src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview`) — a WhatsApp message-bubble preview component. Imported by `src/components/engage2/journey-dashboard/JourneyPreviewModal.jsx`.
- `previewToast` (`src/components/common/PreviewHeader`) — a shared "not wired yet" toast helper. Imported by `src/components/engage2/journey-dashboard/JourneyPreviewModal.jsx`, `src/components/engage2/journey-dashboard/JourneysTable.jsx`, and `src/components/engage2/journey-dashboard/WalletRechargeCard.jsx`.

Editing either of these in place changes both `engage/` and `engage2/` — there is no v1/v2 split for them today. If a change to `WhatsAppBubblePreview` or `previewToast` is meant for `engage2/` alone, fork it first (copy it into `engage2/`'s own tree and repoint only the `engage2/` import), the same rule as the Flow Builder section above. If the change is a real bug fix meant for both, editing the shared file in place is correct.
