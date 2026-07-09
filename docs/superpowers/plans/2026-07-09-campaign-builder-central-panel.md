# Campaign Builder Central Panel & Right Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full primary-WhatsApp-step Central Panel config, a real Right Panel template gallery/preview, the follow-up step's behavior selector, and the Header/Save & Schedule actions — per `docs/superpowers/specs/2026-07-09-campaign-builder-central-panel-design.md`.

**Architecture:** Central Panel owns every configuration field (sender number through pricing); Right Panel only ever displays templates (gallery or single preview), reusing `TemplatePreview`/`UnifiedTemplateModal` via a small adapter that reconciles the Templates page's dataset with Flow Builder's node-editor draft shape. `FallbackTemplateSection` is extracted from Flow Builder's `TemplateTab` into a shared, standalone piece so both builders use the identical toggle+picker UI without duplicating it.

**Tech Stack:** React, zustand, Tailwind, `sonner` toast, shadcn `Dialog`, Jest + React Testing Library.

## Global Constraints

- Central Panel hosts every config field for the primary WhatsApp step (sender number, audience, UTM, AI Smart Send, Smart Retry, Fallback + category-change, International Audience, Validity Window, Pricing). The Right Panel never renders a configuration control — only template display (gallery cards, single preview) and the edit modal it launches.
- The gallery's data source is `src/data/mockTemplates.js`'s `MOCK_TEMPLATES` filtered to `channel === "whatsapp"` — the same dataset the existing Templates page renders. This is a different shape from `WhatsAppNode/data/mockTemplates.js`/`templateStyleConfigs.js` (used by the edit modal) and must go through the adapter (`mapCatalogTemplateToDraft`) before reaching `TemplatePreview`, `WhatsAppBubblePreview`, or `UnifiedTemplateModal`.
- `FallbackTemplateSection` extraction must be a pure refactor of `WhatsAppRightPanel.jsx` — zero behavior change for Flow Builder's existing WhatsApp node panel.
- `AI Enhance` and `Upload & Submit` buttons are added to `UnifiedTemplateModal.jsx` (shared) — both mocked (no real AI call, no real Meta submission), consistent with this app's existing `previewToast()`/`toast.success()` mocked-interaction pattern.
- Every follow-up step always shows both the time picker (delay/date, already built) and the "Send to users" behavior selector — never a toggle between them. `trigger_condition.condition_type` is dropped from the data model; `behavior` defaults to `"delivered_not_viewed"`.
- Follow existing codebase conventions: `@/...` import alias, Tailwind utility classes, no TypeScript, `data-testid` on interactive elements, no comments unless explaining a non-obvious constraint.
- Mock data must make the prototype feel populated, not empty: Quality Rating/Messaging Limit per sender number, a suppression list with a plausible count, resolved audience counts wherever a number is displayable.

---

### Task 1: Extract `FallbackTemplateSection` from `TemplateTab` (shared, Flow Builder unaffected)

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx:466-486` (the fallback block inside `TemplateTab`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx` (new)

**Interfaces:**
- Produces: named export `FallbackTemplateSection({ data, patch })` from `WhatsAppRightPanel.jsx` — renders the fallback enable-toggle + template-picker/remove UI. Consumed by Task 7 (`WhatsAppBroadcastDetails.jsx`).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FallbackTemplateSection } from "../WhatsAppRightPanel";

describe("FallbackTemplateSection", () => {
  it("toggles fallback.enabled via patch", () => {
    const patch = jest.fn();
    render(<FallbackTemplateSection data={{ fallback: { enabled: false, template: null } }} patch={patch} />);
    fireEvent.click(screen.getByText("Fallback Template").closest("div").querySelector("div[style]"));
    expect(patch).toHaveBeenCalledWith({ fallback: { enabled: true, template: null } });
  });

  it("shows the fallback template name and a Remove action once one is set", () => {
    const patch = jest.fn();
    render(
      <FallbackTemplateSection
        data={{ fallback: { enabled: true, template: { name: "std_fallback_v1" } } }}
        patch={patch}
      />,
    );
    expect(screen.getByText("std_fallback_v1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Remove"));
    expect(patch).toHaveBeenCalledWith({ fallback: { enabled: true, template: null } });
  });

  it("shows a picker prompt when enabled with no template chosen yet", () => {
    render(<FallbackTemplateSection data={{ fallback: { enabled: true, template: null } }} patch={jest.fn()} />);
    expect(screen.getByText("Click to select approved fallback template")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx --watchAll=false`
Expected: FAIL — `FallbackTemplateSection` is not exported from `WhatsAppRightPanel.jsx`.

- [ ] **Step 3: Extract the component**

In `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx`, the `TemplateTab` function currently (around lines 311-490) ends with this block for the fallback section (lines 466-486):

```jsx
        {/* Fallback template */}
        {template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Fallback Template</Label>
              <Toggle on={!!fallback?.enabled} onChange={(v) => patch({ fallback: { ...fallback, enabled: v } })} />
            </div>
            {fallback?.enabled && (
              !fallback.template ? (
                <button onClick={() => setFallbackModalOpen(true)} style={{ width: "100%", padding: "12px", border: `2px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12, textAlign: "center" }}>
                  Click to select approved fallback template
                </button>
              ) : (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{fallback.template.name}</span>
                  <button onClick={() => patch({ fallback: { ...fallback, template: null } })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              )
            )}
          </div>
        )}
```

The `Click to select...` button currently calls local state `setFallbackModalOpen(true)` — the extracted component needs its own local modal-open state since it's now standalone. Replace that whole block with a call to a new extracted component, and define the extracted component right above `TemplateTab` (before line 311):

```jsx
export function FallbackTemplateSection({ data, patch }) {
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);
  const { fallback = {} } = data;

  const handleFallbackSave = (tpl) => {
    const withId = tpl.id ? tpl : { ...tpl, id: `tpl_standard_${Date.now()}` };
    patch({ fallback: { ...fallback, template: withId } });
    setFallbackModalOpen(false);
  };

  return (
    <>
      {fallbackModalOpen && (
        <UnifiedTemplateModal
          open
          styleId="standard"
          styleLabel="Template"
          initialTemplate={null}
          onSave={handleFallbackSave}
          onClose={() => setFallbackModalOpen(false)}
        />
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Fallback Template</Label>
          <Toggle on={!!fallback?.enabled} onChange={(v) => patch({ fallback: { ...fallback, enabled: v } })} />
        </div>
        {fallback?.enabled && (
          !fallback.template ? (
            <button onClick={() => setFallbackModalOpen(true)} style={{ width: "100%", padding: "12px", border: `2px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12, textAlign: "center" }}>
              Click to select approved fallback template
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{fallback.template.name}</span>
              <button onClick={() => patch({ fallback: { ...fallback, template: null } })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          )
        )}
      </div>
    </>
  );
}
```

Then, inside `TemplateTab`, replace the removed inline block (same location, lines 466-486) with:

```jsx
        {template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input" && (
          <FallbackTemplateSection data={data} patch={patch} />
        )}
```

`TemplateTab` no longer needs its own `fallbackModalOpen` state or `handleFallbackModalSave`/`customTemplatesByStyle.standard` wiring for the fallback modal specifically — remove the `fallbackModalOpen` `useState` declaration (line 316) and the `handleFallbackModalSave` function and the `{fallbackModalOpen && <UnifiedTemplateModal .../>}` block (lines 396-406) from `TemplateTab`, since `FallbackTemplateSection` now owns that modal itself. Leave `customTemplatesByStyle`/`handleModalSave`/the main template modal untouched — those are for the primary template, not fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the existing WhatsAppNode suite to confirm zero regression**

Run: `npx craco test src/components/flows/builder/nodes/WhatsAppNode --watchAll=false`
Expected: PASS, same count as before this change (Flow Builder's fallback UI must behave identically — same toggle, same picker, same Remove button, just internally delegating to the extracted component).

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx \
  src/components/flows/builder/nodes/WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx
git commit -m "refactor: extract FallbackTemplateSection from TemplateTab as a standalone export"
```

---

### Task 2: Add AI Enhance and Upload & Submit buttons to `UnifiedTemplateModal`

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx` (existing file — add tests, do not remove any)

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature change to `UnifiedTemplateModal`'s props — purely additive UI inside the existing edit-view left pane.

- [ ] **Step 1: Write the failing tests**

Read the existing test file first (`src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx`) to match its existing render/setup pattern, then append:

```jsx
describe("AI Enhance and Upload & Submit", () => {
  it("AI Enhance rewrites the body field with a mocked variant", () => {
    const onSave = jest.fn();
    render(
      <UnifiedTemplateModal
        open
        styleId="standard"
        styleLabel="Template"
        initialTemplate={{ name: "t1", category: "Marketing", language: "en", header: { type: "none" }, body: "Hello there", footer: "", buttons: [] }}
        onSave={onSave}
        onClose={jest.fn()}
      />,
    );
    const before = screen.getByDisplayValue("Hello there");
    fireEvent.click(screen.getByTestId("ai-enhance-btn"));
    expect(screen.queryByDisplayValue("Hello there")).not.toBeInTheDocument();
    expect(before).not.toBeInTheDocument();
  });

  it("Upload & Submit sets a pending-review status and saves", () => {
    const onSave = jest.fn();
    render(
      <UnifiedTemplateModal
        open
        styleId="standard"
        styleLabel="Template"
        initialTemplate={{ name: "t1", category: "Marketing", language: "en", status: "Active", header: { type: "none" }, body: "Hi", footer: "", buttons: [] }}
        onSave={onSave}
        onClose={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("upload-submit-btn"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "In Review" }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx --watchAll=false`
Expected: FAIL — `ai-enhance-btn`/`upload-submit-btn` test ids don't exist yet.

- [ ] **Step 3: Add the two buttons**

In `UnifiedTemplateModal.jsx`, the edit-view left pane's field-mode branch (the `config.fields ?` branch, currently rendering `GenericEditForm` then a Cancel/Save button row) is:

```jsx
        ) : config.fields ? (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{initialTemplate ? "Edit Template" : `Create ${styleLabel} Template`}</div>
              <GenericEditForm fields={config.fields} draft={draft} onPatch={patch} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 9, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => handleSave()} style={{ flex: 2, padding: 9, border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
              </div>
            </div>
```

Replace it with (adds an "AI Enhance" button above the field form's body area — placed right after `GenericEditForm` since it targets the body field broadly — and an "Upload & Submit" button alongside Cancel/Save):

```jsx
        ) : config.fields ? (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{initialTemplate ? "Edit Template" : `Create ${styleLabel} Template`}</div>
              <GenericEditForm fields={config.fields} draft={draft} onPatch={patch} />
              <button
                type="button"
                data-testid="ai-enhance-btn"
                onClick={() => patch({ body: `${draft.body || ""}\n\n✨ Don't miss out — limited time only!` })}
                style={{ alignSelf: "flex-start", padding: "6px 12px", border: `1px solid ${PRIMARY}`, borderRadius: 8, background: "#fff", color: PRIMARY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                ✨ AI Enhance
              </button>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 9, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => handleSave()} style={{ flex: 1, padding: 9, border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
                <button
                  type="button"
                  data-testid="upload-submit-btn"
                  onClick={() => handleSave({ ...draft, status: "In Review" })}
                  style={{ flex: 1, padding: 9, border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Upload & Submit
                </button>
              </div>
            </div>
```

`handleSave` already accepts an optional `finalDraft` override (`const handleSave = (finalDraft) => onSave(finalDraft || draft);`), so `handleSave({ ...draft, status: "In Review" })` works with no other change needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx --watchAll=false`
Expected: PASS (all existing tests + the 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx \
  src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx
git commit -m "feat: add AI Enhance and Upload & Submit buttons to UnifiedTemplateModal"
```

---

### Task 3: Store extensions — audience action, createdAt/status/schedule, campaign channel_config defaults, drop condition_type

**Files:**
- Modify: `src/store/campaignBuilderStore.js`
- Modify: `src/store/__tests__/campaignBuilderStore.test.js`

**Interfaces:**
- Produces: new state `createdAt`, `status` (default `"draft"`), `schedule` (default `{ mode: null, datetime: null }`); new actions `updateStepAudience(stepId, patch)`, `setCreatedAt(createdAt)`, `setStatus(status)`, `setSchedule(schedule)`. `addPrimaryStep`/`addFollowupStep` now give whatsapp steps additional `channel_config` fields: `suppressionList`, `utm` (overridden defaults), `aiSmartSend`, `campaignSmartRetry`, `internationalAudience`, `validityWindow`, `fallback.categoryChangeEnabled`. `defaultTriggerCondition` drops `condition_type`, defaults `behavior` to `"delivered_not_viewed"`. Consumed by Tasks 4-9.

- [ ] **Step 1: Write the failing tests**

Add to `src/store/__tests__/campaignBuilderStore.test.js` (append inside the existing `describe` block, after the existing tests):

```js
  it("addPrimaryStep gives whatsapp steps campaign-specific channel_config defaults", () => {
    getState().addPrimaryStep("whatsapp");
    const cc = getState().sequence[0].channel_config;
    expect(cc.suppressionList).toBe("wa_default");
    expect(cc.utm).toEqual({ enabled: false, source: "Engage 360", medium: "WhatsApp", campaign: "Untitled Broadcast 1" });
    expect(cc.aiSmartSend).toBe(false);
    expect(cc.campaignSmartRetry).toEqual({ enabled: false, windowHours: 72 });
    expect(cc.internationalAudience).toBe(false);
    expect(cc.validityWindow).toEqual({ custom: false, minutes: 10 });
    expect(cc.fallback).toEqual({ enabled: false, template: null, categoryChangeEnabled: false });
  });

  it("addFollowupStep defaults behavior to delivered_not_viewed and has no condition_type", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const tc = getState().sequence[1].trigger_condition;
    expect(tc.behavior).toBe("delivered_not_viewed");
    expect(tc.condition_type).toBeUndefined();
  });

  it("updateStepAudience merges into the step's audience field", () => {
    getState().addPrimaryStep("whatsapp");
    const id = getState().sequence[0].id;
    getState().updateStepAudience(id, { sourceType: "segment", broadcastSourceConfig: { selectedSegments: [{ id: "s1", userCount: 500 }] } });
    expect(getState().sequence[0].audience.sourceType).toBe("segment");
    expect(getState().sequence[0].audience.broadcastSourceConfig.selectedSegments).toHaveLength(1);
  });

  it("createdAt/status/schedule default and can be set", () => {
    expect(getState().createdAt).toBeNull();
    expect(getState().status).toBe("draft");
    expect(getState().schedule).toEqual({ mode: null, datetime: null });
    getState().setCreatedAt("2026-07-09T00:00:00.000Z");
    getState().setStatus("scheduled");
    getState().setSchedule({ mode: "scheduled", datetime: "2026-07-10T09:00" });
    expect(getState().createdAt).toBe("2026-07-09T00:00:00.000Z");
    expect(getState().status).toBe("scheduled");
    expect(getState().schedule).toEqual({ mode: "scheduled", datetime: "2026-07-10T09:00" });
  });

  it("hydrate restores createdAt/status/schedule, reset clears them", () => {
    getState().hydrate({
      id: "c1", meta: { name: "X" }, sequence: [],
      createdAt: "2026-07-01T00:00:00.000Z", status: "scheduled", schedule: { mode: "now", datetime: null },
    });
    expect(getState().createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(getState().status).toBe("scheduled");
    getState().reset();
    expect(getState().createdAt).toBeNull();
    expect(getState().status).toBe("draft");
    expect(getState().schedule).toEqual({ mode: null, datetime: null });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/store/__tests__/campaignBuilderStore.test.js --watchAll=false`
Expected: FAIL — `cc.suppressionList`/`cc.aiSmartSend`/etc. are `undefined`; `updateStepAudience`/`setCreatedAt`/`setStatus`/`setSchedule` are not functions.

- [ ] **Step 3: Update the store**

Replace `src/store/campaignBuilderStore.js` in full:

```js
import { create } from "zustand";
import { defaultDataForPaletteItem } from "@/lib/flowMeta";

let stepCounter = 0;
function nextStepId() {
  stepCounter += 1;
  return `step-${stepCounter}`;
}

function defaultTriggerCondition(referenceStepId) {
  return {
    reference_step_id: referenceStepId,
    behavior: "delivered_not_viewed",
    mode: "delay",
    delay: { value: 1, unit: "hours" },
    fire_at: null,
  };
}

function whatsappCampaignConfigDefaults(broadcastName) {
  return {
    suppressionList: "wa_default",
    utm: { enabled: false, source: "Engage 360", medium: "WhatsApp", campaign: broadcastName },
    aiSmartSend: false,
    campaignSmartRetry: { enabled: false, windowHours: 72 },
    internationalAudience: false,
    validityWindow: { custom: false, minutes: 10 },
  };
}

function channelConfigFor(channel, broadcastName) {
  const base = defaultDataForPaletteItem({ kind: channel });
  if (channel !== "whatsapp") return base;
  return {
    ...base,
    ...whatsappCampaignConfigDefaults(broadcastName),
    fallback: { ...base.fallback, categoryChangeEnabled: false },
  };
}

const initialState = {
  campaignId: null,
  meta: { name: "Untitled Broadcast 1" },
  sequence: [],
  selectedStepId: null,
  autosaveStatus: "idle",
  createdAt: null,
  status: "draft",
  schedule: { mode: null, datetime: null },
};

export const useCampaignBuilderStore = create((set, get) => ({
  ...initialState,

  setCampaignId: (id) => set({ campaignId: id }),

  hydrate: (campaign) =>
    set({
      campaignId: campaign.id,
      meta: campaign.meta ?? { name: "Untitled Broadcast" },
      sequence: campaign.sequence ?? [],
      selectedStepId: campaign.sequence?.[0]?.id ?? null,
      createdAt: campaign.createdAt ?? null,
      status: campaign.status ?? "draft",
      schedule: campaign.schedule ?? { mode: null, datetime: null },
    }),

  reset: () => set({ ...initialState, meta: { ...initialState.meta }, schedule: { ...initialState.schedule } }),

  patchMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),

  addPrimaryStep: (channel) =>
    set((s) => {
      if (s.sequence.some((step) => step.is_primary)) return s;
      const step = {
        id: nextStepId(),
        order_index: 0,
        channel,
        is_primary: true,
        trigger_condition: null,
        audience: { mode: "manual", segments_or_lists: [], suppression_lists: [] },
        channel_config: channelConfigFor(channel, s.meta.name),
      };
      return { sequence: [step], selectedStepId: step.id };
    }),

  addFollowupStep: (channel) =>
    set((s) => {
      const previous = s.sequence[s.sequence.length - 1];
      const step = {
        id: nextStepId(),
        order_index: s.sequence.length,
        channel,
        is_primary: false,
        trigger_condition: defaultTriggerCondition(previous?.id ?? null),
        audience: { mode: "computed", segments_or_lists: [], suppression_lists: [] },
        channel_config: channelConfigFor(channel, s.meta.name),
      };
      return { sequence: [...s.sequence, step], selectedStepId: step.id };
    }),

  updateStepChannelConfig: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, channel_config: { ...step.channel_config, ...patch } }
          : step,
      ),
    })),

  updateStepAudience: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, audience: { ...step.audience, ...patch } }
          : step,
      ),
    })),

  updateTriggerCondition: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, trigger_condition: { ...step.trigger_condition, ...patch } }
          : step,
      ),
    })),

  removeStep: (stepId) =>
    set((s) => ({
      sequence: s.sequence.filter((step) => step.is_primary || step.id !== stepId),
      selectedStepId: s.selectedStepId === stepId ? null : s.selectedStepId,
    })),

  selectStep: (stepId) => set({ selectedStepId: stepId }),

  setAutosaveStatus: (status) => set({ autosaveStatus: status }),
  setCreatedAt: (createdAt) => set({ createdAt }),
  setStatus: (status) => set({ status }),
  setSchedule: (schedule) => set({ schedule }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/store/__tests__/campaignBuilderStore.test.js --watchAll=false`
Expected: PASS (all 13 tests — 8 original + 5 new).

- [ ] **Step 5: Run the full campaign builder suite to check for regressions from the data model change**

Run: `npx craco test src/components/campaigns/builder/__tests__ src/pages/__tests__/CampaignBuilderPage.test.jsx --watchAll=false`
Expected: `LeftSequencePanel.test.jsx`'s `"shows a relative-delay badge on a new follow-up step"` test will FAIL now (it asserts `screen.getByText("+1h DELAY")`, but the default `behavior` is now `"delivered_not_viewed"` — Task 6 fixes `StepCard`'s badge logic and this test). This single expected failure is fine to leave until Task 6; do not attempt to fix it in this task.

- [ ] **Step 6: Commit**

```bash
git add src/store/campaignBuilderStore.js src/store/__tests__/campaignBuilderStore.test.js
git commit -m "feat: extend campaign store with audience action, schedule state, and campaign-specific channel_config defaults"
```

---

### Task 4: Template catalog adapter + Right Panel gallery

**Files:**
- Create: `src/components/campaigns/builder/templateCatalog.js`
- Create: `src/components/campaigns/builder/TemplateGalleryPanel.jsx`
- Test: `src/components/campaigns/builder/__tests__/templateCatalog.test.js`
- Test: `src/components/campaigns/builder/__tests__/TemplateGalleryPanel.test.jsx`

**Interfaces:**
- Consumes: `MOCK_TEMPLATES` from `@/data/mockTemplates` (existing, unmodified).
- Produces: `WHATSAPP_CATALOG_TEMPLATES` (array), `mapCatalogTemplateToDraft(entry)` from `templateCatalog.js`; `<TemplateGalleryPanel onSelect onEdit />` (no other props). Consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

Create `src/components/campaigns/builder/__tests__/templateCatalog.test.js`:

```js
import { WHATSAPP_CATALOG_TEMPLATES, mapCatalogTemplateToDraft } from "../templateCatalog";

describe("templateCatalog", () => {
  it("WHATSAPP_CATALOG_TEMPLATES only contains whatsapp channel entries", () => {
    expect(WHATSAPP_CATALOG_TEMPLATES.length).toBeGreaterThan(0);
    WHATSAPP_CATALOG_TEMPLATES.forEach((t) => expect(t.channel).toBe("whatsapp"));
  });

  it("mapCatalogTemplateToDraft flattens preview.* into top-level fields and normalizes casing", () => {
    const entry = WHATSAPP_CATALOG_TEMPLATES[0];
    const draft = mapCatalogTemplateToDraft(entry);
    expect(draft.name).toBe(entry.name);
    expect(draft.header).toEqual(entry.preview.header);
    expect(draft.body).toBe(entry.preview.body);
    expect(draft.footer).toBe(entry.preview.footer);
    draft.buttons.forEach((b) => expect(b.type).toEqual(b.type.toUpperCase()));
  });

  it("mapCatalogTemplateToDraft normalizes type and status to the capitalized labels TemplatePreview expects", () => {
    const entry = { ...WHATSAPP_CATALOG_TEMPLATES[0], type: "marketing", status: "active" };
    const draft = mapCatalogTemplateToDraft(entry);
    expect(draft.type).toBe("Marketing");
    expect(draft.status).toBe("Active");
  });
});
```

Create `src/components/campaigns/builder/__tests__/TemplateGalleryPanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplateGalleryPanel from "../TemplateGalleryPanel";
import { WHATSAPP_CATALOG_TEMPLATES } from "../templateCatalog";

describe("TemplateGalleryPanel", () => {
  it("renders a card for every catalog template", () => {
    render(<TemplateGalleryPanel onSelect={jest.fn()} onEdit={jest.fn()} />);
    WHATSAPP_CATALOG_TEMPLATES.forEach((t) => {
      expect(screen.getByTestId(`gallery-card-${t.id}`)).toBeInTheDocument();
    });
  });

  it("calls onSelect with the raw catalog entry when Confirm is clicked", () => {
    const onSelect = jest.fn();
    render(<TemplateGalleryPanel onSelect={onSelect} onEdit={jest.fn()} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));
    expect(onSelect).toHaveBeenCalledWith(first);
  });

  it("calls onEdit with the raw catalog entry when Edit is clicked", () => {
    const onEdit = jest.fn();
    render(<TemplateGalleryPanel onSelect={jest.fn()} onEdit={onEdit} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-edit-${first.id}`));
    expect(onEdit).toHaveBeenCalledWith(first);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/templateCatalog.test.js src/components/campaigns/builder/__tests__/TemplateGalleryPanel.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../templateCatalog` / `../TemplateGalleryPanel`.

- [ ] **Step 3: Write the adapter**

Create `src/components/campaigns/builder/templateCatalog.js`:

```js
import { MOCK_TEMPLATES } from "@/data/mockTemplates";

export const WHATSAPP_CATALOG_TEMPLATES = MOCK_TEMPLATES.filter((t) => t.channel === "whatsapp");

const BUTTON_TYPE_MAP = { url: "URL", quick_reply: "QUICK_REPLY" };
const TYPE_LABEL_MAP = { marketing: "Marketing", utility: "Utility", authentication: "Authentication" };
const STATUS_LABEL_MAP = {
  active: "Active",
  draft: "Draft",
  rejected: "Rejected",
  in_review: "In Review",
  disabled: "Disabled",
  paused: "Paused",
};

export function mapCatalogTemplateToDraft(entry) {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    language: entry.language,
    type: TYPE_LABEL_MAP[entry.type] || entry.type,
    status: STATUS_LABEL_MAP[entry.status] || entry.status,
    header: entry.preview.header,
    body: entry.preview.body,
    footer: entry.preview.footer,
    buttons: (entry.preview.buttons || []).map((b) => ({
      type: BUTTON_TYPE_MAP[b.type] || b.type,
      label: b.label,
      url: b.url,
    })),
    variables: [],
  };
}
```

- [ ] **Step 4: Write the gallery panel**

Create `src/components/campaigns/builder/TemplateGalleryPanel.jsx`:

```jsx
import React from "react";
import { WHATSAPP_CATALOG_TEMPLATES } from "./templateCatalog";

const QUALITY_DOT = { high: "#15803D", medium: "#D97706", low: "#DC2626", unknown: "#64748B" };

export default function TemplateGalleryPanel({ onSelect, onEdit }) {
  return (
    <div data-testid="template-gallery-panel">
      <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>
      <div className="grid grid-cols-1 gap-3">
        {WHATSAPP_CATALOG_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            data-testid={`gallery-card-${tpl.id}`}
            className="group relative border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-semibold text-text-primary truncate">{tpl.name}</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: QUALITY_DOT[tpl.quality.tier] || QUALITY_DOT.unknown }}
                title={tpl.quality.label}
              />
            </div>
            <div className="text-[11px] text-text-muted mb-2">{tpl.category}</div>
            <div className="text-[11px] text-text-secondary line-clamp-2 mb-2">{tpl.preview.body}</div>
            <div className="text-[10px] text-text-muted">
              {tpl.analytics.read.pct}% read · {tpl.analytics.sent.toLocaleString("en-IN")} sent
            </div>
            <div className="hidden group-hover:flex absolute inset-0 bg-white/95 items-center justify-center gap-2 rounded-lg">
              <button
                type="button"
                data-testid={`gallery-confirm-${tpl.id}`}
                onClick={() => onSelect(tpl)}
                className="px-3 py-1.5 rounded-md bg-primary text-white text-[12px] font-medium"
              >
                Confirm
              </button>
              <button
                type="button"
                data-testid={`gallery-edit-${tpl.id}`}
                onClick={() => onEdit(tpl)}
                className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/templateCatalog.test.js src/components/campaigns/builder/__tests__/TemplateGalleryPanel.test.jsx --watchAll=false`
Expected: PASS (3 + 3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/campaigns/builder/templateCatalog.js src/components/campaigns/builder/TemplateGalleryPanel.jsx \
  src/components/campaigns/builder/__tests__/templateCatalog.test.js src/components/campaigns/builder/__tests__/TemplateGalleryPanel.test.jsx
git commit -m "feat: add template catalog adapter and Right Panel gallery"
```

---

### Task 5: Rewrite `CampaignContentPanel` — gallery/preview switch, no more `TemplateTab`

**Files:**
- Modify: `src/components/campaigns/builder/CampaignContentPanel.jsx` (full rewrite)
- Modify: `src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx` (full rewrite — the existing 3 tests assert on `TemplateTab`'s "Sender Number"/"Choose Template Style" UI, which no longer appears here)

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (Task 3's `updateStepChannelConfig`, unchanged signature), `TemplateGalleryPanel`/`templateCatalog` (Task 4), `TemplatePreview` from `@/components/flows/builder/nodes/WhatsAppNode/TemplatePreview` (existing, unmodified), `UnifiedTemplateModal` (Task 2, additive changes only).
- Produces: `CampaignContentPanel` keeps its `{ step }` prop signature.

- [ ] **Step 1: Write the failing tests**

Replace `src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx` in full:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignContentPanel from "../CampaignContentPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import { WHATSAPP_CATALOG_TEMPLATES } from "../templateCatalog";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("CampaignContentPanel", () => {
  it("shows NO TEMPLATE SELECTED for a non-WhatsApp channel", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("shows the template gallery for a WhatsApp step with no template yet", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Confirm on a gallery card sets channel_config.template and switches to preview mode", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));

    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-preview-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("template-gallery-panel")).not.toBeInTheDocument();
  });

  it("Change returns to gallery mode", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));
    let updated = useCampaignBuilderStore.getState().sequence[0];
    rerender(<CampaignContentPanel step={updated} />);

    fireEvent.click(screen.getByTestId("change-template-btn"));
    updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template).toBeNull();
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("template-gallery-panel")).toBeInTheDocument();
  });

  it("Edit from the gallery opens UnifiedTemplateModal pre-filled, and Save writes the edited draft", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CampaignContentPanel step={step} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-edit-${first.id}`));

    expect(screen.getByDisplayValue(first.name)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));

    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template.name).toBe(first.name);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx --watchAll=false`
Expected: FAIL — current implementation still renders `TemplateTab`'s "Sender Number" UI, none of the new test ids exist.

- [ ] **Step 3: Rewrite the component**

Replace `src/components/campaigns/builder/CampaignContentPanel.jsx` in full:

```jsx
import React, { useState } from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TemplateGalleryPanel from "./TemplateGalleryPanel";
import TemplatePreview from "@/components/flows/builder/nodes/WhatsAppNode/TemplatePreview";
import UnifiedTemplateModal from "@/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal";
import { mapCatalogTemplateToDraft } from "./templateCatalog";

export default function CampaignContentPanel({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);
  const [editingTemplate, setEditingTemplate] = useState(null);

  if (!step) {
    return <div className="w-[320px] shrink-0 bg-white p-4" data-testid="campaign-content-panel" />;
  }

  if (step.channel !== "whatsapp") {
    return (
      <div className="w-[320px] shrink-0 bg-white p-4" data-testid="campaign-content-panel">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>
        <div className="text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          NO TEMPLATE SELECTED
        </div>
      </div>
    );
  }

  const template = step.channel_config?.template;

  const handleGallerySelect = (catalogEntry) => {
    updateStepChannelConfig(step.id, { template: mapCatalogTemplateToDraft(catalogEntry) });
  };

  const handleGalleryEdit = (catalogEntry) => {
    setEditingTemplate(mapCatalogTemplateToDraft(catalogEntry));
  };

  const handleModalSave = (draft) => {
    updateStepChannelConfig(step.id, { template: draft });
    setEditingTemplate(null);
  };

  return (
    <div className="w-[320px] shrink-0 bg-white p-4 overflow-y-auto" data-testid="campaign-content-panel">
      {template ? (
        <div data-testid="template-preview-mode">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary truncate">{template.name}</h3>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                data-testid="change-template-btn"
                onClick={() => updateStepChannelConfig(step.id, { template: null })}
                className="text-[11px] text-text-secondary font-medium"
              >
                Change
              </button>
              <button
                type="button"
                data-testid="edit-template-btn"
                onClick={() => setEditingTemplate(template)}
                className="text-[11px] text-primary font-medium"
              >
                Edit
              </button>
            </div>
          </div>
          <TemplatePreview template={template} />
        </div>
      ) : (
        <TemplateGalleryPanel onSelect={handleGallerySelect} onEdit={handleGalleryEdit} />
      )}

      {editingTemplate && (
        <UnifiedTemplateModal
          open
          styleId="standard"
          styleLabel="Template"
          initialTemplate={editingTemplate}
          onSave={handleModalSave}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx --watchAll=false`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/campaigns/builder/CampaignContentPanel.jsx src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx
git commit -m "refactor: rewrite CampaignContentPanel as a pure gallery/preview switcher"
```

---

### Task 6: Follow-up "Send to users" behavior selector + StepCard badge fix

**Files:**
- Modify: `src/components/campaigns/builder/TriggerConditionEditor.jsx`
- Modify: `src/components/campaigns/builder/StepCard.jsx`
- Modify: `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx` (add a test)
- Modify: `src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx` (fix the now-broken assertion)

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (`updateTriggerCondition`, unchanged).
- Produces: no signature change to `TriggerConditionEditor`/`StepCard`.

- [ ] **Step 1: Write the failing test**

In `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx`, add this test to the existing `describe` block:

```jsx
  it("shows the behavior selector alongside the timing UI, single-select", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);

    expect(screen.getByTestId("tc-behavior-delivered_not_viewed")).toBeChecked();
    expect(screen.getByTestId("tc-behavior-failed")).not.toBeChecked();

    fireEvent.click(screen.getByTestId("tc-behavior-failed"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.behavior).toBe("failed");
    expect(screen.getByTestId("tc-mode-delay")).toBeInTheDocument();
  });
```

In `src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx`, fix the existing test that will break from Task 3's data model change — change:

```jsx
  it("shows a relative-delay badge on a new follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("email");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(screen.getByText("+1h DELAY")).toBeInTheDocument();
  });
```

to:

```jsx
  it("shows a behavior badge on a new follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("email");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(screen.getByText("ON NOT VIEWED")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx --watchAll=false`
Expected: FAIL — `tc-behavior-*` test ids don't exist; `"ON NOT VIEWED"` isn't rendered yet (current badge logic still checks the dropped `condition_type`).

- [ ] **Step 3: Add the behavior selector to `TriggerConditionEditor`**

Replace `src/components/campaigns/builder/TriggerConditionEditor.jsx` in full:

```jsx
import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

const BEHAVIOR_OPTIONS = [
  { value: "delivered_not_viewed", label: "Primary broadcast received, but not viewed" },
  { value: "viewed_not_clicked", label: "Primary broadcast viewed, but CTA not clicked" },
  { value: "clicked", label: "Primary broadcast CTA clicked" },
  { value: "failed", label: "Primary broadcast failed" },
];

export default function TriggerConditionEditor({ step }) {
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const updateTriggerCondition = useCampaignBuilderStore((s) => s.updateTriggerCondition);
  const tc = step.trigger_condition;
  const priorSteps = sequence.filter((s) => s.order_index < step.order_index);

  const setMode = (mode) => {
    if (mode === "delay") {
      updateTriggerCondition(step.id, {
        mode,
        fire_at: null,
        delay: tc.delay ?? { value: 1, unit: "hours" },
      });
    } else {
      updateTriggerCondition(step.id, { mode, delay: null });
    }
  };

  return (
    <div data-testid="trigger-condition-editor">
      <label className="block text-[12px] font-medium text-text-secondary mb-1">Reference step</label>
      <select
        data-testid="tc-reference-step"
        value={tc.reference_step_id || ""}
        onChange={(e) => updateTriggerCondition(step.id, { reference_step_id: e.target.value })}
        className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4"
      >
        {priorSteps.map((s) => (
          <option key={s.id} value={s.id}>{s.name || s.channel}</option>
        ))}
      </select>

      <label className="block text-[12px] font-medium text-text-secondary mb-1">Set follow-up time</label>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          data-testid="tc-mode-delay"
          onClick={() => setMode("delay")}
          className={`flex-1 px-3 py-1.5 rounded-md text-[12px] font-medium border ${
            tc.mode === "delay" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"
          }`}
        >
          Delay after previous step
        </button>
        <button
          type="button"
          data-testid="tc-mode-date"
          onClick={() => setMode("date")}
          className={`flex-1 px-3 py-1.5 rounded-md text-[12px] font-medium border ${
            tc.mode === "date" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"
          }`}
        >
          On a specific date & time
        </button>
      </div>

      {tc.mode === "delay" ? (
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min={1}
            data-testid="tc-delay-value"
            value={tc.delay?.value ?? 1}
            onChange={(e) =>
              updateTriggerCondition(step.id, { delay: { ...tc.delay, value: Number(e.target.value) } })
            }
            className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
          />
          <select
            data-testid="tc-delay-unit"
            value={tc.delay?.unit ?? "hours"}
            onChange={(e) => updateTriggerCondition(step.id, { delay: { ...tc.delay, unit: e.target.value } })}
            className="border border-border rounded-md px-2 py-1.5 text-sm"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      ) : (
        <input
          type="datetime-local"
          data-testid="tc-fire-at"
          value={tc.fire_at || ""}
          onChange={(e) => updateTriggerCondition(step.id, { fire_at: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4"
        />
      )}

      <label className="block text-[12px] font-medium text-text-secondary mb-1">Send to users</label>
      <div className="space-y-2">
        {BEHAVIOR_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
            <input
              type="checkbox"
              data-testid={`tc-behavior-${opt.value}`}
              checked={tc.behavior === opt.value}
              onChange={() => updateTriggerCondition(step.id, { behavior: opt.value })}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Fix `StepCard`'s badge logic**

In `src/components/campaigns/builder/StepCard.jsx`, replace the `formatDate`/`badgeFor` functions:

```js
function formatDate(iso) {
  if (!iso) return "DATE";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase();
}

function badgeFor(step) {
  if (step.is_primary) return "PRIMARY";
  const tc = step.trigger_condition;
  if (tc.mode === "date") return `ON ${formatDate(tc.fire_at)}`;
  if (tc.condition_type === "behavior" && tc.behavior) {
    return `ON ${tc.behavior.toUpperCase().replace(/_/g, " ")}`;
  }
  const unit = (tc.delay?.unit ?? "hours")[0];
  return `+${tc.delay?.value ?? 0}${unit} DELAY`;
}
```

with:

```js
const BEHAVIOR_BADGE_LABELS = {
  delivered_not_viewed: "ON NOT VIEWED",
  viewed_not_clicked: "ON NOT CLICKED",
  clicked: "ON CLICK",
  failed: "ON FAILED",
};

function badgeFor(step) {
  if (step.is_primary) return "PRIMARY";
  return BEHAVIOR_BADGE_LABELS[step.trigger_condition.behavior] || "ON FAILED";
}
```

(`formatDate` is now unused and removed entirely — confirm no other reference to it in the file before deleting.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx --watchAll=false`
Expected: PASS (5 + 4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/campaigns/builder/TriggerConditionEditor.jsx src/components/campaigns/builder/StepCard.jsx \
  src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx
git commit -m "feat: add follow-up behavior selector, fix StepCard badge for the new data model"
```

---

### Task 7: `WhatsAppBroadcastDetails` — full primary-step Central Panel config

**Files:**
- Create: `src/components/campaigns/builder/WhatsAppBroadcastDetails.jsx`
- Test: `src/components/campaigns/builder/__tests__/WhatsAppBroadcastDetails.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (`updateStepChannelConfig`, `updateStepAudience` from Task 3), `FallbackTemplateSection` (Task 1) from `@/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel`, `WABA_NUMBERS` from `@/components/flows/builder/nodes/WhatsAppNode/data/mockTemplates` (existing, unmodified), `BroadcastSourceStep1` from `@/components/flows/builder/trigger/BroadcastSourceStep1` (existing, unmodified).
- Produces: `<WhatsAppBroadcastDetails step />`. Consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Create `src/components/campaigns/builder/__tests__/WhatsAppBroadcastDetails.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppBroadcastDetails from "../WhatsAppBroadcastDetails";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

function getStep() {
  return useCampaignBuilderStore.getState().sequence[0];
}

describe("WhatsAppBroadcastDetails", () => {
  it("shows the Quality Rating / Messaging Limit strip only once a sender number is picked", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.queryByTestId("quality-limit-strip")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("sender-number-select"), { target: { value: "waba_1" } });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("quality-limit-strip")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
  });

  it("shows the audience resolved count once a segment is selected via BroadcastSourceStep1", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);

    fireEvent.click(screen.getByTestId("source-type-segment"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);

    // BroadcastSourceStep1's SegmentSourceConfig renders one sr-only checkbox per mock segment.
    const firstSegmentCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstSegmentCheckbox);
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("resolved-audience-count")).toBeInTheDocument();
  });

  it("toggles UTM Tracking and edits the fields", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(getStep().channel_config.utm.source).toBe("Engage 360");

    fireEvent.click(screen.getByTestId("utm-enabled-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.change(screen.getByTestId("utm-campaign-field"), { target: { value: "Diwali Blast" } });
    expect(getStep().channel_config.utm.campaign).toBe("Diwali Blast");
  });

  it("Smart Retry toggle reveals a capped retry-window input", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.click(screen.getByTestId("smart-retry-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    fireEvent.change(screen.getByTestId("smart-retry-window"), { target: { value: "999" } });
    expect(getStep().channel_config.campaignSmartRetry.windowHours).toBe(72);
  });

  it("Fallback section only renders once a template is selected, and Category Change only once fallback is enabled", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.queryByText("Fallback Template")).not.toBeInTheDocument();

    useCampaignBuilderStore.getState().updateStepChannelConfig(getStep().id, { template: { name: "t1" } });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByText("Fallback Template")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback-category-change-toggle")).not.toBeInTheDocument();

    useCampaignBuilderStore.getState().updateStepChannelConfig(getStep().id, {
      fallback: { ...getStep().channel_config.fallback, enabled: true },
    });
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("fallback-category-change-toggle")).toBeInTheDocument();
  });

  it("Validity Window defaults to standard 10 minutes and switches to a custom input", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const { rerender } = render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByText(/Standard 10-minute/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("validity-window-custom-toggle"));
    rerender(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("validity-window-minutes")).toBeInTheDocument();
  });

  it("Pricing view computes rate times resolved audience", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<WhatsAppBroadcastDetails step={getStep()} />);
    expect(screen.getByTestId("pricing-view")).toHaveTextContent("₹1.5");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/WhatsAppBroadcastDetails.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../WhatsAppBroadcastDetails`.

- [ ] **Step 3: Write the component**

Create `src/components/campaigns/builder/WhatsAppBroadcastDetails.jsx`:

```jsx
import React, { useState } from "react";
import { WABA_NUMBERS } from "@/components/flows/builder/nodes/WhatsAppNode/data/mockTemplates";
import { FallbackTemplateSection } from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel";
import BroadcastSourceStep1 from "@/components/flows/builder/trigger/BroadcastSourceStep1";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

const WABA_QUALITY_META = {
  waba_1: { quality: "Green", limit: "Unlimited" },
  waba_2: { quality: "Yellow", limit: "1,000/day" },
  waba_3: { quality: "Red", limit: "Paused" },
};

const SUPPRESSION_LISTS = [
  { id: "wa_default", label: "WhatsApp suppression list (128)" },
  { id: "none", label: "None" },
];

function resolveAudienceCount(sourceType, config) {
  if (sourceType === "csv") {
    return (config.selectedHistoricalCsvs || []).reduce((a, c) => a + c.rowCount, 0);
  }
  return (config.selectedSegments || []).reduce((a, s) => a + s.userCount, 0);
}

export default function WhatsAppBroadcastDetails({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);
  const updateStepAudience = useCampaignBuilderStore((s) => s.updateStepAudience);
  const [sourceType, setSourceType] = useState(step.audience?.sourceType || "segment");

  const cc = step.channel_config || {};
  const patch = (p) => updateStepChannelConfig(step.id, p);

  const audienceConfig = step.audience?.broadcastSourceConfig || {};
  const setAudienceConfig = (updater) => {
    const nextConfig = typeof updater === "function" ? updater(audienceConfig) : updater;
    updateStepAudience(step.id, { sourceType, broadcastSourceConfig: nextConfig });
  };

  const resolvedCount = resolveAudienceCount(sourceType, audienceConfig);

  return (
    <div data-testid="whatsapp-broadcast-details" className="space-y-6">
      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Sender Number</label>
        <select
          data-testid="sender-number-select"
          value={cc.wabaNumberId || ""}
          onChange={(e) => patch({ wabaNumberId: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          <option value="" disabled>Select a phone number</option>
          {WABA_NUMBERS.map((n) => (
            <option key={n.id} value={n.id} disabled={n.status === "inactive"}>
              {n.nickname} · ····{n.number.slice(-4)}
            </option>
          ))}
        </select>
        {cc.wabaNumberId && (
          <div
            data-testid="quality-limit-strip"
            className="mt-2 flex items-center gap-4 text-[12px] bg-blue-50 border border-blue-100 rounded-md px-3 py-2"
          >
            <span>Quality Rating: <strong>{WABA_QUALITY_META[cc.wabaNumberId]?.quality || "—"}</strong></span>
            <span>Messaging Limit: <strong>{WABA_QUALITY_META[cc.wabaNumberId]?.limit || "—"}</strong></span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Template</label>
        <div className="text-[13px]" data-testid="template-summary">
          {cc.template ? cc.template.name : (
            <span className="text-amber-700 font-medium">NO TEMPLATE SELECTED — choose from the right panel</span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-medium text-text-secondary">Send To</label>
          {resolvedCount > 0 && (
            <span className="text-[12px] text-text-secondary" data-testid="resolved-audience-count">
              ~{resolvedCount.toLocaleString("en-IN")} users
            </span>
          )}
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            data-testid="source-type-segment"
            onClick={() => setSourceType("segment")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${sourceType === "segment" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"}`}
          >
            Use Segment
          </button>
          <button
            type="button"
            data-testid="source-type-csv"
            onClick={() => setSourceType("csv")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${sourceType === "csv" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"}`}
          >
            Upload CSV
          </button>
        </div>
        <BroadcastSourceStep1 sourceType={sourceType} config={audienceConfig} setConfig={setAudienceConfig} />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Don&apos;t Send To</label>
        <select
          data-testid="suppression-list-select"
          value={cc.suppressionList || "wa_default"}
          onChange={(e) => patch({ suppressionList: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          {SUPPRESSION_LISTS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary mb-2">
          <input
            type="checkbox"
            data-testid="utm-enabled-toggle"
            checked={!!cc.utm?.enabled}
            onChange={(e) => patch({ utm: { ...cc.utm, enabled: e.target.checked } })}
            className="accent-primary"
          />
          Add UTM Tracking
        </label>
        {cc.utm?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              data-testid="utm-source-field"
              value={cc.utm?.source || ""}
              onChange={(e) => patch({ utm: { ...cc.utm, source: e.target.value } })}
              placeholder="UTM Source"
              className="border border-border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="text"
              data-testid="utm-medium-field"
              value={cc.utm?.medium || ""}
              onChange={(e) => patch({ utm: { ...cc.utm, medium: e.target.value } })}
              placeholder="UTM Medium"
              className="border border-border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="text"
              data-testid="utm-campaign-field"
              value={cc.utm?.campaign || ""}
              onChange={(e) => patch({ utm: { ...cc.utm, campaign: e.target.value } })}
              placeholder="UTM Campaign"
              className="col-span-2 border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <label className="flex items-center justify-between text-[13px] font-medium text-text-primary">
        AI Smart Send
        <input
          type="checkbox"
          data-testid="ai-smart-send-toggle"
          checked={!!cc.aiSmartSend}
          onChange={(e) => patch({ aiSmartSend: e.target.checked })}
          className="accent-primary"
        />
      </label>

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-2">
          Smart Retry
          <input
            type="checkbox"
            data-testid="smart-retry-toggle"
            checked={!!cc.campaignSmartRetry?.enabled}
            onChange={(e) => patch({ campaignSmartRetry: { ...cc.campaignSmartRetry, enabled: e.target.checked } })}
            className="accent-primary"
          />
        </label>
        {cc.campaignSmartRetry?.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={72}
              data-testid="smart-retry-window"
              value={cc.campaignSmartRetry?.windowHours ?? 72}
              onChange={(e) =>
                patch({ campaignSmartRetry: { ...cc.campaignSmartRetry, windowHours: Math.min(72, Number(e.target.value)) } })
              }
              className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-[12px] text-text-muted">hours (max 72)</span>
          </div>
        )}
      </div>

      {cc.template && (
        <div>
          <FallbackTemplateSection data={cc} patch={patch} />
          {cc.fallback?.enabled && (
            <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mt-2">
              Fallback Template Category Change
              <input
                type="checkbox"
                data-testid="fallback-category-change-toggle"
                checked={!!cc.fallback?.categoryChangeEnabled}
                onChange={(e) => patch({ fallback: { ...cc.fallback, categoryChangeEnabled: e.target.checked } })}
                className="accent-primary"
              />
            </label>
          )}
        </div>
      )}

      <label className="flex items-center justify-between text-[13px] font-medium text-text-primary">
        Enable International Audience
        <input
          type="checkbox"
          data-testid="international-audience-toggle"
          checked={!!cc.internationalAudience}
          onChange={(e) => patch({ internationalAudience: e.target.checked })}
          className="accent-primary"
        />
      </label>

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-2">
          Set Validity Window
          <input
            type="checkbox"
            data-testid="validity-window-custom-toggle"
            checked={!!cc.validityWindow?.custom}
            onChange={(e) => patch({ validityWindow: { ...cc.validityWindow, custom: e.target.checked } })}
            className="accent-primary"
          />
        </label>
        {cc.validityWindow?.custom ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              data-testid="validity-window-minutes"
              value={cc.validityWindow?.minutes ?? 10}
              onChange={(e) => patch({ validityWindow: { ...cc.validityWindow, minutes: Number(e.target.value) } })}
              className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-[12px] text-text-muted">minutes</span>
          </div>
        ) : (
          <p className="text-[12px] text-text-muted">Standard 10-minute WhatsApp message validity period applies.</p>
        )}
      </div>

      <div className="text-[12px] text-text-secondary" data-testid="pricing-view">
        Estimated cost: ₹1.5 × {resolvedCount.toLocaleString("en-IN")} = ₹{(1.5 * resolvedCount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/WhatsAppBroadcastDetails.test.jsx --watchAll=false`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/campaigns/builder/WhatsAppBroadcastDetails.jsx src/components/campaigns/builder/__tests__/WhatsAppBroadcastDetails.test.jsx
git commit -m "feat: add full primary-step Broadcast Details config to Central Panel"
```

---

### Task 8: Wire `CenterConfigPanel` to render `WhatsAppBroadcastDetails`

**Files:**
- Modify: `src/components/campaigns/builder/CenterConfigPanel.jsx`
- Modify: `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx`

**Interfaces:**
- Consumes: `WhatsAppBroadcastDetails` (Task 7).
- Produces: no change to `CenterConfigPanel`'s `{ step }` signature.

- [ ] **Step 1: Write the failing test**

Add to `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx`:

```jsx
  it("renders WhatsAppBroadcastDetails below the Broadcast Name field for a primary WhatsApp step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("broadcast-name-field")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-broadcast-details")).toBeInTheDocument();
  });

  it("does not render WhatsAppBroadcastDetails for a non-WhatsApp primary step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    expect(screen.queryByTestId("whatsapp-broadcast-details")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx --watchAll=false`
Expected: FAIL — `whatsapp-broadcast-details` test id not rendered yet.

- [ ] **Step 3: Update the component**

Replace `src/components/campaigns/builder/CenterConfigPanel.jsx` in full:

```jsx
import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TriggerConditionEditor from "./TriggerConditionEditor";
import WhatsAppBroadcastDetails from "./WhatsAppBroadcastDetails";

export default function CenterConfigPanel({ step }) {
  const meta = useCampaignBuilderStore((s) => s.meta);
  const patchMeta = useCampaignBuilderStore((s) => s.patchMeta);

  if (!step) {
    return (
      <div className="flex-1 border-r border-border bg-white p-4" data-testid="center-config-panel">
        <p className="text-sm text-text-muted">Select a step to configure it.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 border-r border-border bg-white p-4 overflow-y-auto" data-testid="center-config-panel">
      {step.is_primary ? (
        <div className="space-y-6">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Broadcast Name</label>
            <input
              type="text"
              value={meta.name}
              onChange={(e) => patchMeta({ name: e.target.value })}
              data-testid="broadcast-name-field"
              className="w-full border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          {step.channel === "whatsapp" && <WhatsAppBroadcastDetails step={step} />}
        </div>
      ) : (
        <TriggerConditionEditor step={step} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx --watchAll=false`
Expected: PASS (8 tests — 4 original + Task 6's + these 2).

- [ ] **Step 5: Commit**

```bash
git add src/components/campaigns/builder/CenterConfigPanel.jsx src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx
git commit -m "feat: wire WhatsAppBroadcastDetails into the Central Panel for primary WhatsApp steps"
```

---

### Task 9: Header actions (created-at, Switch to Flow Builder, Test Mode) + Save & Schedule modal

**Files:**
- Create: `src/components/campaigns/builder/TestModeModal.jsx`
- Create: `src/components/campaigns/builder/SaveAndScheduleModal.jsx`
- Modify: `src/pages/CampaignBuilderPage.jsx`
- Test: `src/components/campaigns/builder/__tests__/TestModeModal.test.jsx`
- Test: `src/components/campaigns/builder/__tests__/SaveAndScheduleModal.test.jsx`
- Modify: `src/pages/__tests__/CampaignBuilderPage.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (`createdAt`, `status`, `schedule`, `setCreatedAt`, `setStatus`, `setSchedule` from Task 3), `updateCampaign` from `@/lib/campaignsApi` (existing, unmodified).
- Produces: `<TestModeModal open onClose />`, `<SaveAndScheduleModal open onClose />`. This is the final task; nothing downstream consumes these.

- [ ] **Step 1: Write the failing tests**

Create `src/components/campaigns/builder/__tests__/TestModeModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestModeModal from "../TestModeModal";

describe("TestModeModal", () => {
  it("disables Send Test until a phone number is entered, then calls onClose after sending", () => {
    const onClose = jest.fn();
    render(<TestModeModal open onClose={onClose} />);
    expect(screen.getByTestId("test-mode-send-btn")).toBeDisabled();
    fireEvent.change(screen.getByTestId("test-mode-phone-input"), { target: { value: "+919876543210" } });
    expect(screen.getByTestId("test-mode-send-btn")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("test-mode-send-btn"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

Create `src/components/campaigns/builder/__tests__/SaveAndScheduleModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SaveAndScheduleModal from "../SaveAndScheduleModal";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });

jest.mock("@/lib/campaignsApi", () => ({
  updateCampaign: jest.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
  useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
  useCampaignBuilderStore.getState().setCampaignId("c1");
});

function renderModal(onClose = jest.fn()) {
  return render(
    <MemoryRouter>
      <SaveAndScheduleModal open onClose={onClose} />
    </MemoryRouter>,
  );
}

describe("SaveAndScheduleModal", () => {
  it("shows Estimated Audience Size and an AI Suggestion card", () => {
    renderModal();
    expect(screen.getByTestId("estimated-audience-size")).toBeInTheDocument();
    expect(screen.getByTestId("ai-suggestion-card")).toBeInTheDocument();
  });

  it("Confirm & Schedule is disabled until a schedule mode is chosen", () => {
    renderModal();
    expect(screen.getByTestId("confirm-schedule-btn")).toBeDisabled();
    fireEvent.click(screen.getByTestId("schedule-now-radio"));
    expect(screen.getByTestId("confirm-schedule-btn")).not.toBeDisabled();
  });

  it("choosing Schedule for reveals a datetime input", () => {
    renderModal();
    fireEvent.click(screen.getByTestId("schedule-later-radio"));
    expect(screen.getByTestId("schedule-datetime-input")).toBeInTheDocument();
  });

  it("Confirm & Schedule sets status and closes the modal", async () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByTestId("schedule-now-radio"));
    fireEvent.click(screen.getByTestId("confirm-schedule-btn"));
    await new Promise((r) => setTimeout(r, 0));
    expect(useCampaignBuilderStore.getState().status).toBe("sending");
    expect(onClose).toHaveBeenCalled();
  });

  it("opens Test Mode as a secondary action without closing the modal", () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByTestId("save-schedule-test-mode-btn"));
    expect(screen.getByTestId("test-mode-modal")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/TestModeModal.test.jsx src/components/campaigns/builder/__tests__/SaveAndScheduleModal.test.jsx --watchAll=false`
Expected: FAIL — cannot find modules `../TestModeModal` / `../SaveAndScheduleModal`.

- [ ] **Step 3: Write `TestModeModal`**

Create `src/components/campaigns/builder/TestModeModal.jsx`:

```jsx
import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TestModeModal({ open, onClose }) {
  const [phone, setPhone] = useState("");

  const handleSend = () => {
    if (!phone.trim()) return;
    toast.success(`Test message sent to ${phone}`);
    setPhone("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="test-mode-modal" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send a test message</DialogTitle>
        </DialogHeader>
        <input
          type="tel"
          data-testid="test-mode-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-3"
        />
        <button
          type="button"
          data-testid="test-mode-send-btn"
          disabled={!phone.trim()}
          onClick={handleSend}
          className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40"
        >
          Send Test
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Write `SaveAndScheduleModal`**

Create `src/components/campaigns/builder/SaveAndScheduleModal.jsx`:

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import { updateCampaign } from "@/lib/campaignsApi";
import TestModeModal from "./TestModeModal";

function resolveAudienceCount(step) {
  if (!step) return 0;
  const sourceType = step.audience?.sourceType || "segment";
  const config = step.audience?.broadcastSourceConfig || {};
  if (sourceType === "csv") {
    return (config.selectedHistoricalCsvs || []).reduce((a, c) => a + c.rowCount, 0);
  }
  return (config.selectedSegments || []).reduce((a, s) => a + s.userCount, 0);
}

export default function SaveAndScheduleModal({ open, onClose }) {
  const navigate = useNavigate();
  const campaignId = useCampaignBuilderStore((s) => s.campaignId);
  const meta = useCampaignBuilderStore((s) => s.meta);
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const schedule = useCampaignBuilderStore((s) => s.schedule);
  const setSchedule = useCampaignBuilderStore((s) => s.setSchedule);
  const setStatus = useCampaignBuilderStore((s) => s.setStatus);
  const [testModeOpen, setTestModeOpen] = useState(false);

  const primaryStep = sequence.find((s) => s.is_primary);
  const resolvedCount = resolveAudienceCount(primaryStep);

  const handleConfirm = async () => {
    const status = schedule.mode === "now" ? "sending" : "scheduled";
    setStatus(status);
    await updateCampaign(campaignId, { meta, sequence, status, schedule });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent data-testid="save-schedule-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save & Schedule</DialogTitle>
          </DialogHeader>

          <div className="mb-3" data-testid="estimated-audience-size">
            <span className="text-[12px] text-text-secondary">Estimated Audience Size</span>
            <div className="text-[20px] font-semibold text-text-primary">{resolvedCount.toLocaleString("en-IN")}</div>
          </div>

          <div className="mb-4 bg-primary-tint border border-primary/20 rounded-md px-3 py-2 text-[12px] text-text-secondary" data-testid="ai-suggestion-card">
            AI Suggestion: Sending between 6–9 PM typically improves open rates for this audience.
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              data-testid="save-schedule-test-mode-btn"
              onClick={() => setTestModeOpen(true)}
              className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
            >
              Test Mode
            </button>
            <button
              type="button"
              data-testid="save-schedule-switch-flow-btn"
              onClick={() => navigate("/flows-v2/builder/new")}
              className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
            >
              Switch to Flow Builder
            </button>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="schedule-mode"
                data-testid="schedule-now-radio"
                checked={schedule.mode === "now"}
                onChange={() => setSchedule({ mode: "now", datetime: null })}
              />
              Send now
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="schedule-mode"
                data-testid="schedule-later-radio"
                checked={schedule.mode === "scheduled"}
                onChange={() => setSchedule({ ...schedule, mode: "scheduled" })}
              />
              Schedule for
            </label>
            {schedule.mode === "scheduled" && (
              <input
                type="datetime-local"
                data-testid="schedule-datetime-input"
                value={schedule.datetime || ""}
                onChange={(e) => setSchedule({ ...schedule, datetime: e.target.value })}
                className="mt-2 w-full border border-border rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>

          <button
            type="button"
            data-testid="confirm-schedule-btn"
            disabled={!schedule.mode}
            onClick={handleConfirm}
            className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40"
          >
            Confirm & Schedule
          </button>
        </DialogContent>
      </Dialog>
      <TestModeModal open={testModeOpen} onClose={() => setTestModeOpen(false)} />
    </>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/TestModeModal.test.jsx src/components/campaigns/builder/__tests__/SaveAndScheduleModal.test.jsx --watchAll=false`
Expected: PASS (1 + 5 tests).

- [ ] **Step 6: Wire the header in `CampaignBuilderPage.jsx`**

In `src/pages/CampaignBuilderPage.jsx`, add imports:

```jsx
import TestModeModal from "@/components/campaigns/builder/TestModeModal";
import SaveAndScheduleModal from "@/components/campaigns/builder/SaveAndScheduleModal";
```

Add store selectors and local state (alongside the existing `useCampaignBuilderStore` selectors near the top of the component):

```jsx
  const createdAt = useCampaignBuilderStore((s) => s.createdAt);
  const setCreatedAt = useCampaignBuilderStore((s) => s.setCreatedAt);
  const [testModeOpen, setTestModeOpen] = useState(false);
  const [saveScheduleOpen, setSaveScheduleOpen] = useState(false);
```

In `handleChannelPicked`, after `const doc = await createCampaign(...)`, add:

```jsx
      setCreatedAt(doc.createdAt);
```

Replace the header `<div className="flex items-center gap-3 ...">...</div>` block with:

```jsx
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-white">
        <button
          type="button"
          aria-label="Back to campaigns"
          onClick={() => navigate("/campaigns")}
          className="text-text-muted hover:text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <input
            type="text"
            value={meta.name}
            onChange={(e) => patchMeta({ name: e.target.value })}
            data-testid="campaign-name-input"
            className="text-sm font-medium border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 max-w-xs"
          />
          {createdAt && (
            <span className="text-[10px] text-text-muted px-2" data-testid="campaign-created-at">
              Created {new Date(createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
        <span className="text-[12px] text-text-muted ml-auto" data-testid="campaign-autosave-status">
          {autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "All changes saved" : ""}
        </span>
        <button
          type="button"
          data-testid="switch-to-flow-builder-btn"
          onClick={() => navigate("/flows-v2/builder/new")}
          className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
        >
          Switch to Flow Builder
        </button>
        <button
          type="button"
          data-testid="header-test-mode-btn"
          onClick={() => setTestModeOpen(true)}
          className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
        >
          Test Mode
        </button>
        <button
          type="button"
          data-testid="header-save-schedule-btn"
          onClick={() => setSaveScheduleOpen(true)}
          className="px-4 py-2 rounded-md bg-primary text-white text-[12px] font-medium"
        >
          Save & Schedule
        </button>
      </div>
```

Add the two modals right after the existing `<ChannelPickerModal ... />` element, before the component's closing tag:

```jsx
      <TestModeModal open={testModeOpen} onClose={() => setTestModeOpen(false)} />
      <SaveAndScheduleModal open={saveScheduleOpen} onClose={() => setSaveScheduleOpen(false)} />
```

- [ ] **Step 7: Add header tests to `CampaignBuilderPage.test.jsx`**

Read the existing test file's `react-router-dom` virtual mock first (it needs `Route`/`Routes`/`MemoryRouter`/`useNavigate`/`useParams` — confirm it already supports rendering at `/campaigns/builder/:id` after a create, since these new tests interact with the header on an already-created campaign). Add:

```jsx
  it("shows created-at once the campaign exists, and opens Test Mode / Save & Schedule from the header", async () => {
    renderAt("/campaigns/builder/new");
    fireEvent.click(screen.getByTestId("channel-option-whatsapp"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    await waitFor(() => expect(useCampaignBuilderStore.getState().campaignId).toBeTruthy());

    expect(screen.getByTestId("campaign-created-at")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("header-test-mode-btn"));
    expect(screen.getByTestId("test-mode-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("header-save-schedule-btn"));
    expect(screen.getByTestId("save-schedule-modal")).toBeInTheDocument();
  });
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx craco test src/pages/__tests__/CampaignBuilderPage.test.jsx --watchAll=false`
Expected: PASS (6 tests — 5 original + this one).

- [ ] **Step 9: Run the full campaign builder suite one final time**

Run: `npx craco test src/lib/__tests__ src/store/__tests__ src/pages/__tests__/CampaignBuilderPage.test.jsx src/components/campaigns/builder/__tests__ src/components/flows/builder/nodes/WhatsAppNode --watchAll=false`
Expected: PASS — everything across this plan and Flow Builder's WhatsApp node suite (confirming Tasks 1-2's shared-file changes caused zero regressions there).

- [ ] **Step 10: Commit**

```bash
git add src/components/campaigns/builder/TestModeModal.jsx src/components/campaigns/builder/SaveAndScheduleModal.jsx \
  src/components/campaigns/builder/__tests__/TestModeModal.test.jsx src/components/campaigns/builder/__tests__/SaveAndScheduleModal.test.jsx \
  src/pages/CampaignBuilderPage.jsx src/pages/__tests__/CampaignBuilderPage.test.jsx
git commit -m "feat: add header actions (created-at, Switch to Flow Builder, Test Mode) and Save & Schedule modal"
```

---

## Manual verification (after all tasks)

1. `npm start`, navigate to `/campaigns`, click "New campaign", pick WhatsApp.
2. Central Panel: pick a sender number — Quality/Limit strip appears. Pick "Use Segment", select a couple of mock segments — resolved count and Pricing view update.
3. Toggle UTM Tracking, AI Smart Send, Smart Retry (set a window > 72 and confirm it clamps to 72), Enable International Audience, Set Validity Window (custom, e.g. 30 minutes).
4. Right Panel: confirm the gallery shows all 7 catalog WhatsApp templates with quality dots and read-rate/sent stats. Hover a card — Confirm/Edit appear. Click Confirm — panel switches to a single full preview with the template name up top; Central Panel's "Fallback Template" section appears (was hidden before), and the "Template" summary line updates.
5. Click "Change" — back to gallery. Click "Edit" on a card — `UnifiedTemplateModal` opens pre-filled with that template's fields and live preview; click "✨ AI Enhance" — body text changes; click "Upload & Submit" — modal closes, template shows with status "In Review" in the Central Panel summary.
6. Enable Fallback Template in Central Panel, pick a fallback template via the same modal mechanism — confirm "Fallback Template Category Change" toggle appears once enabled.
7. Add a follow-up (SMS) — its Central Panel shows both the delay/date timing (unchanged) and the new "Send to users" checkbox group, defaulting to "Primary broadcast received, but not viewed"; its Left Panel card badge reads "ON NOT VIEWED". Switch the behavior to "Primary broadcast failed" — badge updates to "ON FAILED".
8. Header: confirm the created-at date shows next to the name. Click "Switch to Flow Builder" — navigates to `/flows-v2/builder/new`. Click "Test Mode" — enter a phone number, send — toast confirms, modal closes. Click "Save & Schedule" — confirm Estimated Audience Size matches what Central Panel resolved, AI Suggestion card is visible, choose "Send now", click "Confirm & Schedule" — modal closes; reloading the page shows the campaign's status persisted.
