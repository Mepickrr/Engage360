# Campaign Builder Entry Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "+ New Campaign" entry flow: a channel-picker modal, a new standalone Campaign Builder page with a 3-column layout (Sequence Panel / Config Panel / Content Preview), and wiring for the primary step plus follow-up steps with trigger conditions.

**Architecture:** A new, self-contained page (`CampaignBuilderPage.jsx`) backed by a new zustand store (`campaignBuilderStore.js`) modeling `sequence: SequenceStep[]` (per `Campaign Builder.md` Section 2) — not Flow Builder's `nodes`/`edges` graph. Per-channel content config reuses Flow Builder's existing `TemplatePicker` component and default-data shape directly (same component, new shell), without modifying Flow Builder's existing files.

**Tech Stack:** React, react-router-dom, zustand, Tailwind, lucide-react icons, shadcn `Dialog` primitive, Jest + React Testing Library (existing `craco test` setup).

## Global Constraints

- Primary channel options are exactly these 5, in this order: WhatsApp, Email, RCS, SMS, AI Voice (`aicallingv2`) — per the approved design spec Section 3.
- WhatsApp is excluded from the follow-up channel picker only when it's already the primary channel; all other channels are repeatable.
- The primary step is never deletable and has no "reference step" concept (`trigger_condition: null`).
- Trigger Condition timing is either/or: `mode: "delay"` XOR `mode: "date"` — switching modes clears the other mode's fields (spec Section 6.1).
- The Broadcast Name field is one piece of state (`store.meta.name`) rendered in two places (header + center panel) — never two separate inputs.
- Follow existing codebase conventions: `@/...` import alias, Tailwind utility classes (no CSS modules), no TypeScript, no comments unless explaining a non-obvious constraint, `data-testid` on interactive elements for testability.
- Do not modify `WhatsAppRightPanel.jsx` or any other Flow Builder node/canvas file — content reuse happens via importing `TemplatePicker` directly, not by editing Flow Builder's panel.

---

### Task 1: Add AI Voice channel metadata to shared channel map

**Files:**
- Modify: `src/lib/flowMeta.js:46-53` (`CHANNEL_META`)
- Test: `src/lib/__tests__/flowMeta.test.js` (new)

**Interfaces:**
- Produces: `CHANNEL_META.aicallingv2 = { label: "AI Voice", color: "#4F46E5", Icon: PhoneCall }`, consumed by Task 6's `StepCard.jsx`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/flowMeta.test.js`:

```js
import { CHANNEL_META } from "../flowMeta";

describe("CHANNEL_META", () => {
  it("includes an AI Voice entry for the aicallingv2 channel", () => {
    expect(CHANNEL_META.aicallingv2).toEqual({
      label: "AI Voice",
      color: "#4F46E5",
      Icon: expect.any(Object),
    });
  });

  it("still includes the original 5 channels", () => {
    expect(Object.keys(CHANNEL_META)).toEqual(
      expect.arrayContaining(["whatsapp", "email", "sms", "push", "inapp", "rcs"]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/lib/__tests__/flowMeta.test.js --watchAll=false`
Expected: FAIL — `CHANNEL_META.aicallingv2` is `undefined`.

- [ ] **Step 3: Add the entry**

In `src/lib/flowMeta.js`, `PhoneCall` is already imported (line 23, used by `PALETTE_CATALOGUE`'s `aicalling` entry). Edit `CHANNEL_META` (lines 46-53):

```js
export const CHANNEL_META = {
  whatsapp: { label: "WhatsApp", color: "#10B981", Icon: MessageCircle },
  email: { label: "Email", color: "#3B82F6", Icon: Mail },
  sms: { label: "SMS", color: "#8B5CF6", Icon: MessageSquare },
  push: { label: "Push", color: "#F59E0B", Icon: Bell },
  inapp: { label: "InApp", color: "#7C3AED", Icon: Smartphone },
  rcs: { label: "RCS", color: "#6366F1", Icon: MessageCircleMore },
  aicallingv2: { label: "AI Voice", color: "#4F46E5", Icon: PhoneCall },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/lib/__tests__/flowMeta.test.js --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/flowMeta.js src/lib/__tests__/flowMeta.test.js
git commit -m "feat: add AI Voice entry to shared channel metadata"
```

---

### Task 2: Campaign builder store

**Files:**
- Create: `src/store/campaignBuilderStore.js`
- Test: `src/store/__tests__/campaignBuilderStore.test.js`

**Interfaces:**
- Consumes: `defaultDataForPaletteItem` from `@/lib/flowMeta` (existing, Task 1 file).
- Produces: `useCampaignBuilderStore` zustand hook with state `{ campaignId, meta: {name}, sequence, selectedStepId, autosaveStatus }` and actions `{ setCampaignId, hydrate, reset, patchMeta, addPrimaryStep, addFollowupStep, updateStepChannelConfig, updateTriggerCondition, removeStep, selectStep, setAutosaveStatus }`. Every later task (3, 5, 6, 7, 8) consumes this hook and these exact action names.

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/campaignBuilderStore.test.js`:

```js
import { useCampaignBuilderStore } from "../campaignBuilderStore";

const getState = () => useCampaignBuilderStore.getState();

beforeEach(() => {
  getState().reset();
});

describe("campaignBuilderStore", () => {
  it("starts with an empty sequence and default meta", () => {
    expect(getState().sequence).toEqual([]);
    expect(getState().meta.name).toMatch(/^Untitled Broadcast/);
    expect(getState().campaignId).toBeNull();
  });

  it("addPrimaryStep creates a single locked primary step", () => {
    getState().addPrimaryStep("whatsapp");
    const { sequence, selectedStepId } = getState();
    expect(sequence).toHaveLength(1);
    expect(sequence[0].is_primary).toBe(true);
    expect(sequence[0].channel).toBe("whatsapp");
    expect(sequence[0].order_index).toBe(0);
    expect(sequence[0].trigger_condition).toBeNull();
    expect(sequence[0].channel_config.fallback).toEqual({ enabled: false, template: null });
    expect(selectedStepId).toBe(sequence[0].id);
  });

  it("addPrimaryStep is a no-op if a primary step already exists", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addPrimaryStep("email");
    expect(getState().sequence).toHaveLength(1);
    expect(getState().sequence[0].channel).toBe("whatsapp");
  });

  it("addFollowupStep appends a non-primary step referencing the previous one", () => {
    getState().addPrimaryStep("whatsapp");
    const primaryId = getState().sequence[0].id;
    getState().addFollowupStep("sms");
    const followup = getState().sequence[1];
    expect(followup.is_primary).toBe(false);
    expect(followup.order_index).toBe(1);
    expect(followup.trigger_condition.reference_step_id).toBe(primaryId);
    expect(followup.trigger_condition.mode).toBe("delay");
    expect(followup.audience.mode).toBe("computed");
  });

  it("updateStepChannelConfig merges into the step's channel_config", () => {
    getState().addPrimaryStep("whatsapp");
    const id = getState().sequence[0].id;
    getState().updateStepChannelConfig(id, { template: { name: "order_confirm" } });
    expect(getState().sequence[0].channel_config.template).toEqual({ name: "order_confirm" });
  });

  it("updateTriggerCondition merges into the step's trigger_condition", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const id = getState().sequence[1].id;
    getState().updateTriggerCondition(id, { mode: "date", fire_at: "2026-08-01T09:00" });
    expect(getState().sequence[1].trigger_condition.mode).toBe("date");
    expect(getState().sequence[1].trigger_condition.fire_at).toBe("2026-08-01T09:00");
  });

  it("removeStep removes a follow-up but refuses to remove the primary step", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const primaryId = getState().sequence[0].id;
    const followupId = getState().sequence[1].id;
    getState().removeStep(primaryId);
    expect(getState().sequence).toHaveLength(2);
    getState().removeStep(followupId);
    expect(getState().sequence).toHaveLength(1);
    expect(getState().sequence[0].id).toBe(primaryId);
  });

  it("hydrate loads an existing campaign and reset clears it", () => {
    getState().hydrate({ id: "c1", meta: { name: "Diwali Blast" }, sequence: [{ id: "s1", is_primary: true }] });
    expect(getState().campaignId).toBe("c1");
    expect(getState().meta.name).toBe("Diwali Blast");
    getState().reset();
    expect(getState().campaignId).toBeNull();
    expect(getState().sequence).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/store/__tests__/campaignBuilderStore.test.js --watchAll=false`
Expected: FAIL — cannot find module `../campaignBuilderStore`.

- [ ] **Step 3: Write the store**

Create `src/store/campaignBuilderStore.js`:

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
    condition_type: "time_elapsed",
    behavior: null,
    mode: "delay",
    delay: { value: 1, unit: "hours" },
    fire_at: null,
  };
}

const initialState = {
  campaignId: null,
  meta: { name: "Untitled Broadcast 1" },
  sequence: [],
  selectedStepId: null,
  autosaveStatus: "idle",
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
    }),

  reset: () => set({ ...initialState, meta: { ...initialState.meta } }),

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
        channel_config: defaultDataForPaletteItem({ kind: channel }),
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
        channel_config: defaultDataForPaletteItem({ kind: channel }),
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
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/store/__tests__/campaignBuilderStore.test.js --watchAll=false`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/campaignBuilderStore.js src/store/__tests__/campaignBuilderStore.test.js
git commit -m "feat: add campaign builder zustand store"
```

---

### Task 3: Campaigns API (localStorage-backed persistence)

**Files:**
- Create: `src/lib/campaignsApi.js`
- Test: `src/lib/__tests__/campaignsApi.test.js`

**Interfaces:**
- Produces: `createCampaign(body): Promise<doc>`, `fetchCampaign(id): Promise<doc>`, `updateCampaign(id, patch): Promise<doc>`, each `doc = { id, meta, sequence, createdAt, updatedAt }`. Consumed by Task 5's `CampaignBuilderPage.jsx`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/campaignsApi.test.js`:

```js
import { createCampaign, fetchCampaign, updateCampaign } from "../campaignsApi";

beforeEach(() => {
  window.localStorage.clear();
});

describe("campaignsApi", () => {
  it("createCampaign persists a doc with a generated id", async () => {
    const doc = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    expect(doc.id).toBeTruthy();
    expect(doc.meta.name).toBe("Test");
    expect(doc.createdAt).toBeTruthy();
  });

  it("fetchCampaign returns a previously created doc", async () => {
    const created = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    const fetched = await fetchCampaign(created.id);
    expect(fetched).toEqual(created);
  });

  it("fetchCampaign rejects for an unknown id", async () => {
    await expect(fetchCampaign("nope")).rejects.toThrow("Campaign nope not found");
  });

  it("updateCampaign merges a patch and bumps updatedAt", async () => {
    const created = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    const updated = await updateCampaign(created.id, { meta: { name: "Renamed" } });
    expect(updated.meta.name).toBe("Renamed");
    expect(updated.id).toBe(created.id);
    expect(updated.updatedAt).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/lib/__tests__/campaignsApi.test.js --watchAll=false`
Expected: FAIL — cannot find module `../campaignsApi`.

- [ ] **Step 3: Write the API module**

Create `src/lib/campaignsApi.js`:

```js
const STORAGE_KEY = "bitespeed_campaigns_v1";

function readAll() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function createCampaign(body) {
  const all = readAll();
  const id = `campaign-${Object.keys(all).length + 1}-${Math.round(performance.now())}`;
  const doc = { id, ...body, createdAt: new Date().toISOString() };
  all[id] = doc;
  writeAll(all);
  return doc;
}

export async function fetchCampaign(id) {
  const all = readAll();
  const doc = all[id];
  if (!doc) throw new Error(`Campaign ${id} not found`);
  return doc;
}

export async function updateCampaign(id, patch) {
  const all = readAll();
  const existing = all[id];
  if (!existing) throw new Error(`Campaign ${id} not found`);
  const doc = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  all[id] = doc;
  writeAll(all);
  return doc;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/lib/__tests__/campaignsApi.test.js --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaignsApi.js src/lib/__tests__/campaignsApi.test.js
git commit -m "feat: add localStorage-backed campaigns API"
```

---

### Task 4: Channel picker modal

**Files:**
- Create: `src/components/campaigns/builder/ChannelPickerModal.jsx`
- Test: `src/components/campaigns/builder/__tests__/ChannelPickerModal.test.jsx`

**Interfaces:**
- Produces: `<ChannelPickerModal open title excludeChannels onSelect onClose />` and named export `CHANNEL_OPTIONS` (array of `{ channel, label, Icon, color }`, channels: `whatsapp, email, rcs, sms, aicallingv2`). Consumed by Task 5 (initial pick) and Task 6 (follow-up pick).

- [ ] **Step 1: Write the failing test**

Create `src/components/campaigns/builder/__tests__/ChannelPickerModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChannelPickerModal, { CHANNEL_OPTIONS } from "../ChannelPickerModal";

describe("ChannelPickerModal", () => {
  it("lists all 5 channel options by default", () => {
    render(<ChannelPickerModal open onSelect={jest.fn()} onClose={jest.fn()} />);
    CHANNEL_OPTIONS.forEach(({ channel }) => {
      expect(screen.getByTestId(`channel-option-${channel}`)).toBeInTheDocument();
    });
  });

  it("excludes channels listed in excludeChannels", () => {
    render(
      <ChannelPickerModal open excludeChannels={["whatsapp"]} onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.queryByTestId("channel-option-whatsapp")).not.toBeInTheDocument();
    expect(screen.getByTestId("channel-option-sms")).toBeInTheDocument();
  });

  it("disables Continue until a channel is selected, then calls onSelect", () => {
    const onSelect = jest.fn();
    render(<ChannelPickerModal open onSelect={onSelect} onClose={jest.fn()} />);
    expect(screen.getByTestId("channel-picker-continue")).toBeDisabled();
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    expect(screen.getByTestId("channel-picker-continue")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(onSelect).toHaveBeenCalledWith("sms");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/ChannelPickerModal.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../ChannelPickerModal`.

- [ ] **Step 3: Write the component**

Create `src/components/campaigns/builder/ChannelPickerModal.jsx`:

```jsx
import React, { useState } from "react";
import { MessageCircle, Mail, MessageSquare, MessageCircleMore, PhoneCall } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const CHANNEL_OPTIONS = [
  { channel: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "#25D366" },
  { channel: "email", label: "Email", Icon: Mail, color: "#3B82F6" },
  { channel: "rcs", label: "RCS", Icon: MessageCircleMore, color: "#6366F1" },
  { channel: "sms", label: "SMS", Icon: MessageSquare, color: "#F59E0B" },
  { channel: "aicallingv2", label: "AI Voice", Icon: PhoneCall, color: "#4F46E5" },
];

export default function ChannelPickerModal({
  open,
  title = "Choose your primary channel",
  excludeChannels = [],
  onSelect,
  onClose,
}) {
  const [selected, setSelected] = useState(null);
  const options = CHANNEL_OPTIONS.filter((o) => !excludeChannels.includes(o.channel));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="channel-picker-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2">
          {options.map(({ channel, label, Icon, color }) => (
            <button
              key={channel}
              type="button"
              data-testid={`channel-option-${channel}`}
              onClick={() => setSelected(channel)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                selected === channel ? "border-primary bg-primary-tint" : "border-border hover:bg-slate-50"
              }`}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </span>
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="channel-picker-continue"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/ChannelPickerModal.test.jsx --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/campaigns/builder/ChannelPickerModal.jsx src/components/campaigns/builder/__tests__/ChannelPickerModal.test.jsx
git commit -m "feat: add campaign channel picker modal"
```

---

### Task 5: Campaign Builder page, routing, and entry-point wiring

**Files:**
- Create: `src/pages/CampaignBuilderPage.jsx`
- Create: `src/components/campaigns/builder/LeftSequencePanel.jsx` (placeholder shell — real content in Task 6)
- Create: `src/components/campaigns/builder/CenterConfigPanel.jsx` (placeholder shell — real content in Task 7)
- Create: `src/components/campaigns/builder/CampaignContentPanel.jsx` (placeholder shell — real content in Task 8)
- Modify: `src/pages/Campaigns.jsx:1-6,50-60` (wire the "New campaign" button)
- Modify: `src/App.js` (register `/campaigns/builder/new` and `/campaigns/builder/:id`)
- Test: `src/pages/__tests__/CampaignBuilderPage.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (Task 2), `createCampaign`/`fetchCampaign`/`updateCampaign` (Task 3), `ChannelPickerModal` (Task 4).
- Produces: route `/campaigns/builder/new` and `/campaigns/builder/:id` rendering `CampaignBuilderPage`; placeholder components `LeftSequencePanel`, `CenterConfigPanel({ step })`, `CampaignContentPanel({ step })` that Tasks 6-8 replace in place (same file paths, same default export signature).

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/CampaignBuilderPage.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignBuilderPage from "../CampaignBuilderPage";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  window.localStorage.clear();
  useCampaignBuilderStore.getState().reset();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/campaigns/builder/new" element={<CampaignBuilderPage />} />
        <Route path="/campaigns/builder/:id" element={<CampaignBuilderPage />} />
        <Route path="/campaigns" element={<div data-testid="campaigns-list-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CampaignBuilderPage", () => {
  it("opens the channel picker immediately for a new campaign", () => {
    renderAt("/campaigns/builder/new");
    expect(screen.getByTestId("channel-picker-modal")).toBeInTheDocument();
  });

  it("navigates back to /campaigns when the picker is closed without selecting", () => {
    renderAt("/campaigns/builder/new");
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.getByTestId("campaigns-list-page")).toBeInTheDocument();
  });

  it("creates the primary step and campaign on channel selection", async () => {
    renderAt("/campaigns/builder/new");
    fireEvent.click(screen.getByTestId("channel-option-whatsapp"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));

    await waitFor(() => expect(useCampaignBuilderStore.getState().campaignId).toBeTruthy());
    expect(useCampaignBuilderStore.getState().sequence).toHaveLength(1);
    expect(useCampaignBuilderStore.getState().sequence[0].channel).toBe("whatsapp");
    expect(screen.queryByTestId("channel-picker-modal")).not.toBeInTheDocument();
  });

  it("binds the header name input to store.meta.name", () => {
    renderAt("/campaigns/builder/new");
    const input = screen.getByTestId("campaign-name-input");
    fireEvent.change(input, { target: { value: "Diwali Blast" } });
    expect(useCampaignBuilderStore.getState().meta.name).toBe("Diwali Blast");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/pages/__tests__/CampaignBuilderPage.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../CampaignBuilderPage`.

- [ ] **Step 3: Write the placeholder column components**

Create `src/components/campaigns/builder/LeftSequencePanel.jsx`:

```jsx
import React from "react";

export default function LeftSequencePanel() {
  return <div className="w-[280px] shrink-0 border-r border-border bg-white p-3" data-testid="left-sequence-panel" />;
}
```

Create `src/components/campaigns/builder/CenterConfigPanel.jsx`:

```jsx
import React from "react";

export default function CenterConfigPanel({ step }) {
  return (
    <div className="flex-1 border-r border-border bg-white p-4" data-testid="center-config-panel">
      {!step && <p className="text-sm text-text-muted">Select a step to configure it.</p>}
    </div>
  );
}
```

Create `src/components/campaigns/builder/CampaignContentPanel.jsx`:

```jsx
import React from "react";

export default function CampaignContentPanel({ step }) {
  return <div className="w-[320px] shrink-0 bg-white p-4" data-testid="campaign-content-panel" />;
}
```

- [ ] **Step 4: Write the page**

Create `src/pages/CampaignBuilderPage.jsx`:

```jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createCampaign, fetchCampaign, updateCampaign } from "@/lib/campaignsApi";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import ChannelPickerModal from "@/components/campaigns/builder/ChannelPickerModal";
import LeftSequencePanel from "@/components/campaigns/builder/LeftSequencePanel";
import CenterConfigPanel from "@/components/campaigns/builder/CenterConfigPanel";
import CampaignContentPanel from "@/components/campaigns/builder/CampaignContentPanel";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function CampaignBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [pickerOpen, setPickerOpen] = useState(isNew);

  const campaignId = useCampaignBuilderStore((s) => s.campaignId);
  const meta = useCampaignBuilderStore((s) => s.meta);
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const selectedStepId = useCampaignBuilderStore((s) => s.selectedStepId);
  const autosaveStatus = useCampaignBuilderStore((s) => s.autosaveStatus);
  const hydrate = useCampaignBuilderStore((s) => s.hydrate);
  const reset = useCampaignBuilderStore((s) => s.reset);
  const setCampaignId = useCampaignBuilderStore((s) => s.setCampaignId);
  const addPrimaryStep = useCampaignBuilderStore((s) => s.addPrimaryStep);
  const patchMeta = useCampaignBuilderStore((s) => s.patchMeta);
  const setAutosaveStatus = useCampaignBuilderStore((s) => s.setAutosaveStatus);

  useEffect(() => () => reset(), [reset]);

  const hydratedIdRef = useRef(null);
  useEffect(() => {
    if (isNew || hydratedIdRef.current === id) return;
    fetchCampaign(id).then((doc) => {
      hydratedIdRef.current = id;
      hydrate(doc);
    });
  }, [id, isNew, hydrate]);

  const handleChannelPicked = useCallback(
    async (channel) => {
      addPrimaryStep(channel);
      setPickerOpen(false);
      const { meta: m, sequence: seq } = useCampaignBuilderStore.getState();
      const doc = await createCampaign({ meta: m, sequence: seq });
      hydratedIdRef.current = doc.id;
      setCampaignId(doc.id);
      navigate(`/campaigns/builder/${doc.id}`, { replace: true });
    },
    [addPrimaryStep, setCampaignId, navigate],
  );

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false);
    if (isNew) navigate("/campaigns");
  }, [isNew, navigate]);

  const lastSavedRef = useRef(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!campaignId) return;
    const snapshot = JSON.stringify({ meta, sequence });
    if (lastSavedRef.current === null) {
      lastSavedRef.current = snapshot;
      return;
    }
    if (lastSavedRef.current === snapshot) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutosaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      await updateCampaign(campaignId, { meta, sequence });
      lastSavedRef.current = snapshot;
      setAutosaveStatus("saved");
      setTimeout(() => setAutosaveStatus("idle"), 1500);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [campaignId, meta, sequence, setAutosaveStatus]);

  const selectedStep = sequence.find((s) => s.id === selectedStepId) || sequence[0] || null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -m-6 bg-app-bg" data-testid="campaign-builder">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-white">
        <button
          type="button"
          aria-label="Back to campaigns"
          onClick={() => navigate("/campaigns")}
          className="text-text-muted hover:text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={meta.name}
          onChange={(e) => patchMeta({ name: e.target.value })}
          data-testid="campaign-name-input"
          className="text-sm font-medium border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 flex-1 max-w-xs"
        />
        <span className="text-[12px] text-text-muted ml-auto" data-testid="campaign-autosave-status">
          {autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "All changes saved" : ""}
        </span>
      </div>
      <div className="flex-1 flex min-h-0" style={pickerOpen ? { pointerEvents: "none" } : undefined}>
        <LeftSequencePanel />
        <CenterConfigPanel step={selectedStep} />
        <CampaignContentPanel step={selectedStep} />
      </div>
      <ChannelPickerModal
        open={pickerOpen}
        title="Choose your primary channel"
        onSelect={handleChannelPicked}
        onClose={handlePickerClose}
      />
    </div>
  );
}
```

Note: the test's "close without selecting" step clicks a button named `/close/i` — this is the shadcn `DialogContent`'s built-in close button (rendered automatically by the `Dialog` primitive with an accessible "Close" label), consistent with how `BuildAgentModal.jsx` relies on the same primitive.

- [ ] **Step 5: Wire the Campaigns.jsx button**

In `src/pages/Campaigns.jsx`, add the import and replace the button's `onClick` (lines 1-6 and around line 54):

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import ChannelChip from "@/components/flows/ChannelChip";
import StatusPill from "@/components/flows/StatusPill";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
```

```jsx
export default function CampaignsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
```

```jsx
          <button
            type="button"
            data-testid="campaigns-new-btn"
            onClick={() => navigate("/campaigns/builder/new")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New campaign
          </button>
```

(Leave the row `onClick={() => previewToast()}` untouched — out of scope.)

- [ ] **Step 6: Register the routes**

In `src/App.js`, add the import near the other page imports and the two routes near the existing `/flows-v2/builder/*` routes:

```jsx
import CampaignBuilderPage from "@/pages/CampaignBuilderPage";
```

```jsx
<Route path="/campaigns/builder/new" element={<CampaignBuilderPage />} />
<Route path="/campaigns/builder/:id" element={<CampaignBuilderPage />} />
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx craco test src/pages/__tests__/CampaignBuilderPage.test.jsx --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add src/pages/CampaignBuilderPage.jsx src/pages/__tests__/CampaignBuilderPage.test.jsx \
  src/components/campaigns/builder/LeftSequencePanel.jsx \
  src/components/campaigns/builder/CenterConfigPanel.jsx \
  src/components/campaigns/builder/CampaignContentPanel.jsx \
  src/pages/Campaigns.jsx src/App.js
git commit -m "feat: add Campaign Builder page, routes, and entry-point wiring"
```

---

### Task 6: Left Sequence Panel with step cards and "Add a follow-up"

**Files:**
- Create: `src/components/campaigns/builder/StepCard.jsx`
- Modify: `src/components/campaigns/builder/LeftSequencePanel.jsx` (replace Task 5's placeholder body)
- Test: `src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (Task 2), `ChannelPickerModal` (Task 4), `CHANNEL_META` (Task 1).
- Produces: `<StepCard step selected onSelect />`; `LeftSequencePanel` keeps its existing no-prop signature from Task 5.

- [ ] **Step 1: Write the failing test**

Create `src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LeftSequencePanel from "../LeftSequencePanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("LeftSequencePanel", () => {
  it("renders the primary step card with a PRIMARY badge and NO TEMPLATE SELECTED state", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    expect(screen.getByText("PRIMARY")).toBeInTheDocument();
    expect(screen.getByText("NO TEMPLATE SELECTED")).toBeInTheDocument();
  });

  it("selects a step on click", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const primaryId = useCampaignBuilderStore.getState().sequence[0].id;
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId(`step-card-${primaryId}`));
    expect(useCampaignBuilderStore.getState().selectedStepId).toBe(primaryId);
  });

  it("adding a follow-up excludes WhatsApp from the picker when it's already primary", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    expect(screen.queryByTestId("channel-option-whatsapp")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(useCampaignBuilderStore.getState().sequence).toHaveLength(2);
    expect(useCampaignBuilderStore.getState().sequence[1].channel).toBe("sms");
  });

  it("shows a relative-delay badge on a new follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("email");
    render(<LeftSequencePanel />);
    fireEvent.click(screen.getByTestId("add-followup-btn"));
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(screen.getByText("+1h DELAY")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx --watchAll=false`
Expected: FAIL — `screen.getByText("PRIMARY")` not found (placeholder panel renders nothing).

- [ ] **Step 3: Write StepCard**

Create `src/components/campaigns/builder/StepCard.jsx`:

```jsx
import React from "react";
import { CHANNEL_META } from "@/lib/flowMeta";

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

export default function StepCard({ step, selected, onSelect }) {
  const meta = CHANNEL_META[step.channel] || { label: step.channel, color: "#64748B" };
  const Icon = meta.Icon;
  const hasContent = Boolean(step.channel_config?.template);

  return (
    <button
      type="button"
      data-testid={`step-card-${step.id}`}
      onClick={() => onSelect(step.id)}
      className={`w-full text-left rounded-lg border p-3 mb-3 transition-colors ${
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
          {Icon && <Icon className="w-3 h-3" />}
          {meta.label}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          {badgeFor(step)}
        </span>
      </div>
      <div className="text-[13px] font-medium text-text-primary">
        {step.name || `${meta.label} Broadcast`}
      </div>
      <div className="text-[11px] mt-1" style={{ color: hasContent ? "#64748B" : "#B45309" }}>
        {hasContent ? step.channel_config.template.name : "NO TEMPLATE SELECTED"}
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Rewrite LeftSequencePanel**

Replace `src/components/campaigns/builder/LeftSequencePanel.jsx` in full:

```jsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import StepCard from "./StepCard";
import ChannelPickerModal from "./ChannelPickerModal";

export default function LeftSequencePanel() {
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const selectedStepId = useCampaignBuilderStore((s) => s.selectedStepId);
  const selectStep = useCampaignBuilderStore((s) => s.selectStep);
  const addFollowupStep = useCampaignBuilderStore((s) => s.addFollowupStep);
  const [followupPickerOpen, setFollowupPickerOpen] = useState(false);

  const primaryChannel = sequence.find((s) => s.is_primary)?.channel;

  return (
    <div className="w-[280px] shrink-0 border-r border-border bg-white p-3 overflow-y-auto" data-testid="left-sequence-panel">
      {sequence.map((step) => (
        <StepCard key={step.id} step={step} selected={step.id === selectedStepId} onSelect={selectStep} />
      ))}
      <button
        type="button"
        data-testid="add-followup-btn"
        onClick={() => setFollowupPickerOpen(true)}
        className="w-full border-2 border-dashed border-border rounded-lg py-3 text-[12px] font-medium text-text-muted hover:border-primary/50 hover:text-primary flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add a follow-up
      </button>
      <ChannelPickerModal
        open={followupPickerOpen}
        title="Add a follow-up channel"
        excludeChannels={primaryChannel === "whatsapp" ? ["whatsapp"] : []}
        onSelect={(channel) => {
          addFollowupStep(channel);
          setFollowupPickerOpen(false);
        }}
        onClose={() => setFollowupPickerOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/campaigns/builder/StepCard.jsx src/components/campaigns/builder/LeftSequencePanel.jsx \
  src/components/campaigns/builder/__tests__/LeftSequencePanel.test.jsx
git commit -m "feat: render sequence step cards with add-follow-up flow"
```

---

### Task 7: Center Config Panel with Trigger Condition editor

**Files:**
- Create: `src/components/campaigns/builder/TriggerConditionEditor.jsx`
- Modify: `src/components/campaigns/builder/CenterConfigPanel.jsx` (replace Task 5's placeholder body)
- Test: `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (Task 2).
- Produces: `<TriggerConditionEditor step />`; `CenterConfigPanel` keeps its `{ step }` prop signature from Task 5.

- [ ] **Step 1: Write the failing test**

Create `src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CenterConfigPanel from "../CenterConfigPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

beforeEach(() => {
  useCampaignBuilderStore.getState().reset();
});

describe("CenterConfigPanel", () => {
  it("shows the Broadcast Name field bound to store.meta.name for the primary step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    render(<CenterConfigPanel step={step} />);
    const input = screen.getByTestId("broadcast-name-field");
    fireEvent.change(input, { target: { value: "Diwali Blast" } });
    expect(useCampaignBuilderStore.getState().meta.name).toBe("Diwali Blast");
  });

  it("shows the Trigger Condition editor for a follow-up step", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    expect(screen.getByTestId("trigger-condition-editor")).toBeInTheDocument();
  });

  it("switching to 'On a specific date & time' clears the delay fields", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("date");
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.delay).toBeNull();
  });

  it("switching back to delay mode clears fire_at", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    useCampaignBuilderStore.getState().addFollowupStep("sms");
    const step = useCampaignBuilderStore.getState().sequence[1];
    render(<CenterConfigPanel step={step} />);
    fireEvent.click(screen.getByTestId("tc-mode-date"));
    fireEvent.click(screen.getByTestId("tc-mode-delay"));
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.mode).toBe("delay");
    expect(useCampaignBuilderStore.getState().sequence[1].trigger_condition.fire_at).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx --watchAll=false`
Expected: FAIL — `broadcast-name-field` / `trigger-condition-editor` not found (placeholder panel renders nothing for a step).

- [ ] **Step 3: Write TriggerConditionEditor**

Create `src/components/campaigns/builder/TriggerConditionEditor.jsx`:

```jsx
import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

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
        <div className="flex gap-2">
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
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite CenterConfigPanel**

Replace `src/components/campaigns/builder/CenterConfigPanel.jsx` in full:

```jsx
import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TriggerConditionEditor from "./TriggerConditionEditor";

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
      ) : (
        <TriggerConditionEditor step={step} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/campaigns/builder/TriggerConditionEditor.jsx src/components/campaigns/builder/CenterConfigPanel.jsx \
  src/components/campaigns/builder/__tests__/CenterConfigPanel.test.jsx
git commit -m "feat: add Broadcast Name and Trigger Condition editing to config panel"
```

---

### Task 8: Campaign Content Panel reusing WhatsApp's TemplatePicker

**Files:**
- Modify: `src/components/campaigns/builder/CampaignContentPanel.jsx` (replace Task 5's placeholder body)
- Test: `src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx`

**Interfaces:**
- Consumes: `useCampaignBuilderStore` (Task 2), `TemplatePicker` from `@/components/flows/builder/nodes/WhatsAppNode/TemplatePicker` (existing, unmodified — `onSelect(template)` / `onClose()` props).
- Produces: `CampaignContentPanel` keeps its `{ step }` prop signature from Task 5. This is the final task; no further tasks consume this file.

- [ ] **Step 1: Write the failing test**

Create `src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignContentPanel from "../CampaignContentPanel";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

jest.mock("@/components/flows/builder/nodes/WhatsAppNode/TemplatePicker", () => (props) => (
  <div data-testid="mock-template-picker">
    <button type="button" onClick={() => props.onSelect({ name: "order_confirm" })}>
      pick order_confirm
    </button>
    <button type="button" onClick={props.onClose}>close picker</button>
  </div>
));

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

  it("opens the shared TemplatePicker and stores the selected template for WhatsApp", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    fireEvent.click(screen.getByTestId("select-template-btn"));
    expect(screen.getByTestId("mock-template-picker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("pick order_confirm"));
    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.template).toEqual({ name: "order_confirm" });
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByText("order_confirm")).toBeInTheDocument();
  });

  it("toggles the fallback template setting", () => {
    useCampaignBuilderStore.getState().addPrimaryStep("whatsapp");
    const step = useCampaignBuilderStore.getState().sequence[0];
    const { rerender } = render(<CampaignContentPanel step={step} />);
    fireEvent.click(screen.getByTestId("fallback-toggle"));
    const updated = useCampaignBuilderStore.getState().sequence[0];
    expect(updated.channel_config.fallback.enabled).toBe(true);
    rerender(<CampaignContentPanel step={updated} />);
    expect(screen.getByTestId("select-fallback-template-btn")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx --watchAll=false`
Expected: FAIL — placeholder panel renders no matching elements.

- [ ] **Step 3: Rewrite CampaignContentPanel**

Replace `src/components/campaigns/builder/CampaignContentPanel.jsx` in full:

```jsx
import React, { useState } from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TemplatePicker from "@/components/flows/builder/nodes/WhatsAppNode/TemplatePicker";

export default function CampaignContentPanel({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);
  const [showPicker, setShowPicker] = useState(false);
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);

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

  const { template, fallback = { enabled: false, template: null } } = step.channel_config || {};

  return (
    <div className="w-[320px] shrink-0 bg-white p-4 overflow-y-auto" data-testid="campaign-content-panel">
      <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>

      {template ? (
        <div className="border border-border rounded-lg p-3 mb-4">
          <div className="text-[12px] font-mono text-text-secondary">{template.name}</div>
          <button
            type="button"
            data-testid="change-template-btn"
            onClick={() => setShowPicker(true)}
            className="mt-2 text-[12px] text-primary font-medium"
          >
            Change Template
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="select-template-btn"
          onClick={() => setShowPicker(true)}
          className="w-full border-2 border-dashed border-border rounded-lg py-6 text-[12px] font-medium text-amber-700 bg-amber-50/50 mb-4"
        >
          NO TEMPLATE SELECTED — click to choose
        </button>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-text-secondary">Fallback Template</span>
        <button
          type="button"
          data-testid="fallback-toggle"
          onClick={() =>
            updateStepChannelConfig(step.id, { fallback: { ...fallback, enabled: !fallback.enabled } })
          }
          className={`w-9 h-5 rounded-full transition-colors ${fallback.enabled ? "bg-primary" : "bg-slate-300"}`}
        >
          <span
            className={`block w-4 h-4 bg-white rounded-full transition-transform ${
              fallback.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {fallback.enabled && (
        <button
          type="button"
          data-testid="select-fallback-template-btn"
          onClick={() => setShowFallbackPicker(true)}
          className="mt-2 w-full border border-border rounded-md py-2 text-[12px] text-text-secondary"
        >
          {fallback.template ? fallback.template.name : "Choose fallback template"}
        </button>
      )}

      {showPicker && (
        <TemplatePicker
          onSelect={(tpl) => {
            updateStepChannelConfig(step.id, { template: tpl });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showFallbackPicker && (
        <TemplatePicker
          onSelect={(tpl) => {
            updateStepChannelConfig(step.id, { fallback: { ...fallback, template: tpl } });
            setShowFallbackPicker(false);
          }}
          onClose={() => setShowFallbackPicker(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full new test suite together**

Run: `npx craco test src/lib/__tests__/flowMeta.test.js src/lib/__tests__/campaignsApi.test.js src/store/__tests__/campaignBuilderStore.test.js src/pages/__tests__/CampaignBuilderPage.test.jsx src/components/campaigns/builder/__tests__ --watchAll=false`
Expected: PASS (all tests across every task in this plan).

- [ ] **Step 6: Commit**

```bash
git add src/components/campaigns/builder/CampaignContentPanel.jsx \
  src/components/campaigns/builder/__tests__/CampaignContentPanel.test.jsx
git commit -m "feat: reuse WhatsApp TemplatePicker for campaign content and fallback config"
```

---

## Manual verification (after all tasks)

1. `npm start`, navigate to `/campaigns`, click "New campaign".
2. Confirm the channel picker opens, pick "WhatsApp", click Continue — lands on `/campaigns/builder/<id>` with a `PRIMARY` WhatsApp card, `NO TEMPLATE SELECTED` states in the left card and right content panel.
3. Click "Select Template" in the right panel, pick any template from the picker grid — left card and right panel both update to show the template name.
4. Toggle "Fallback Template" on — a "Choose fallback template" button appears; pick a template — persists.
5. Click "Add a follow-up", confirm WhatsApp is absent from the picker, pick SMS — new follow-up card appears with a `+1h DELAY` badge.
6. Select the follow-up card, in the center panel switch to "On a specific date & time" — delay fields disappear, a datetime picker appears; switch back — datetime clears, delay fields return with defaults.
7. Edit the Broadcast Name in the header — confirm the same value appears if you select the primary step (center panel Broadcast Name field shows the identical value).
8. Reload the page at `/campaigns/builder/<id>` — confirm the campaign rehydrates from `localStorage` with the same sequence and name.
