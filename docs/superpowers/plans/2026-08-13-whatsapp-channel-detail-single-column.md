# WhatsApp Channel Detail Single-Column Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two-column WhatsApp channel detail view (form + static preview) in `WhatsAppNumberDetail.jsx` into a single column where the WhatsApp profile mockup is itself the editable surface for its own fields.

**Architecture:** No new files, no new state architecture. Everything stays as local `useState` inside `WhatsAppNumberDetail` (`src/components/settings/channels/WhatsAppNumberDetail.jsx`). We add one new local sub-component (`InlineEditableField`, alongside the existing `EditableRow`) for click-to-edit-in-place text/textarea fields inside the big preview mockup, reorder/condense existing JSX blocks, add one new `category` state field, and delete now-duplicated markup (old side-form rows for fields that move into the preview, old small preview card).

**Tech Stack:** React (function components + hooks), Tailwind utility classes, `lucide-react` icons, Jest + React Testing Library.

## Global Constraints

- Follow the design spec exactly: `docs/superpowers/specs/2026-08-13-whatsapp-channel-detail-single-column-design.md`.
- No backend/API wiring — all state stays local mock state (per spec "Out of scope").
- Photo upload stays a visual placeholder (`previewToast()` stub), consistent with existing Brand Logo behavior.
- `previewToast()` (from `@/components/common/PreviewHeader`) stays the stub for Migrate provider / voice call setup / TSP onboarding / A/B testing — do not build real flows for these.
- Reuse the existing `EditableRow` component unchanged for Category/Address/Email/Website — do not fork it.
- Keep all currently-passing `data-testid`s stable wherever the underlying control didn't conceptually change (e.g. `whatsapp-detail-back`, `whatsapp-messages-consumed-refresh`, `whatsapp-catalog-manage`) — only rename testids for controls that fundamentally changed shape (e.g. a disabled `<input>` becoming a click-to-edit button).
- Single file under edit: `src/components/settings/channels/WhatsAppNumberDetail.jsx`. Its test file: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`. Neither is under `src/components/flows/builder/`, so the CLAUDE.md v1/v2 shared-builder-code rule does not apply here.

---

## File Structure

- **Modify:** `src/components/settings/channels/WhatsAppNumberDetail.jsx` — all layout/behavior changes.
- **Modify:** `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx` — updated/added assertions per task; full regression rewrite in Task 6.
- No other files change. `ConnectedChannelsPanel.jsx` passes the same `number`/`onBack`/`onMakeDefault` props unchanged — verified in Task 6.

---

### Task 1: Metadata summary bar (two rows)

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx:104-137` (the `flex items-start justify-between mb-4` header block containing avatar, number, badges, default/migrate buttons)
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `number.provider`, `number.quality`, `number.wabaId`, `number.isDefaultForCampaigns`, `messagingLimit` state (already exists, line 80), `refreshMessagingLimit` (already exists, line 85-88), `onMakeDefault` prop, `previewToast` (existing import), `qualityTone` (existing helper), `Badge` (existing import).
- Produces: no new exports — this is JSX restructuring inside the same default-exported component.

Replace the current avatar/number/badge header block with a two-row summary bar. Keep the avatar+number+username block as its own row above the summary bar (unchanged), then add the new two-row bar directly below it, replacing the old inline badge cluster.

- [ ] **Step 1: Write the failing test for the two-row summary bar**

Add to `WhatsAppNumberDetail.test.jsx`, inside a new `describe` block:

```jsx
describe("WhatsAppNumberDetail — metadata summary bar", () => {
  it("shows Provider, Quality, and WABA ID on the first summary row", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const row1 = screen.getByTestId("whatsapp-summary-row-1");
    expect(row1).toHaveTextContent("Provider: TSP Karix");
    expect(row1).toHaveTextContent("Quality: High");
    expect(row1).toHaveTextContent("WABA ID: 328175003703387");
  });

  it("shows Messaging limit, Default badge, and Migrate provider on the second summary row when default", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const row2 = screen.getByTestId("whatsapp-summary-row-2");
    expect(row2).toHaveTextContent("100000");
    expect(row2).toHaveTextContent("Default for Campaigns");
    expect(within(row2).getByRole("button", { name: /migrate provider/i })).toBeInTheDocument();
  });

  it("shows a Make Default for Campaigns button on the second row when not default", () => {
    const onMakeDefault = jest.fn();
    render(<WhatsAppNumberDetail number={NON_DEFAULT_NUMBER} onBack={jest.fn()} onMakeDefault={onMakeDefault} />);
    const row2 = screen.getByTestId("whatsapp-summary-row-2");
    fireEvent.click(within(row2).getByRole("button", { name: /make default for campaigns/i }));
    expect(onMakeDefault).toHaveBeenCalledWith("wa_2");
  });
});
```

Add `within` to the RTL import at the top of the test file:

```jsx
import { render, screen, fireEvent, within } from "@testing-library/react";
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — `whatsapp-summary-row-1` / `whatsapp-summary-row-2` testids don't exist yet.

- [ ] **Step 3: Implement the two-row summary bar**

Replace lines 104-137 (the `<div className="flex items-start justify-between mb-4">...</div>` block) with:

```jsx
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <UserRound className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-semibold text-text-primary">{number.number}</span>
                <button type="button" onClick={() => navigator.clipboard?.writeText(number.number)} data-testid="whatsapp-copy-number" className="text-text-muted hover:text-text-primary">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {number.username && <span className="text-[13px] text-text-muted">{`@${number.username}`}</span>}
            </div>
          </div>

          <div className="py-3 border-b border-border flex items-center gap-2 flex-wrap" data-testid="whatsapp-summary-row-1">
            <Badge tone="slate">Provider: {number.provider}</Badge>
            <Badge tone={qualityTone(number.quality)}>Quality: {number.quality}</Badge>
            <Badge tone="slate">WABA ID: {number.wabaId}</Badge>
          </div>

          <div className="py-3 border-b border-border mb-4 flex items-center gap-2 flex-wrap justify-between" data-testid="whatsapp-summary-row-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-primary" data-testid="whatsapp-messaging-limit-value">{messagingLimit}</span>
              <span className="text-[12px] text-text-muted">messages per day</span>
              <button type="button" onClick={refreshMessagingLimit} data-testid="whatsapp-messaging-limit-refresh" className="text-text-muted hover:text-text-primary">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {number.isDefaultForCampaigns ? (
                <>
                  <Badge tone="emerald">Default for Campaigns</Badge>
                  <button type="button" onClick={() => previewToast()} data-testid="whatsapp-migrate-provider"
                    className="px-3 py-1.5 text-[12px] rounded-md border border-primary text-primary font-medium">
                    Migrate provider
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => onMakeDefault(number.id)} data-testid="whatsapp-make-default"
                  className="px-3 py-1.5 text-[12px] rounded-md bg-primary text-white font-medium">
                  Make Default for Campaigns
                </button>
              )}
            </div>
          </div>
```

Also **delete** the now-duplicate old "Messaging limit" row further down (original lines 167-176, `data-testid="whatsapp-messaging-limit"`) since it's superseded by the one now in `whatsapp-summary-row-2`. Leave `whatsapp-messaging-limit-value` and `whatsapp-messaging-limit-refresh` testids exactly as before (moved, not renamed) — the test in Task 1 Step 1 already checks for the value through `whatsapp-summary-row-2`, and existing Task-0 tests (`WhatsAppNumberDetail — message consumed / messaging limit refresh`) already query those two testids directly by id, so they keep passing without modification.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: All tests PASS, including the pre-existing `Provider: TSP Karix` / `Quality: High` / messaging-limit-refresh tests (unchanged assertions, relocated markup).

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat(whatsapp-detail): collapse header badges into a two-row metadata summary bar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Secondary details block (condensed)

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx` (voice call row ~139-148, messages-consumed row ~156-165, account overview block ~202-249, minus Display Name/Messaging Limit/Brand Name/Brand Logo which are handled in Task 4)
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `messagesConsumed` state + `refreshMessagesConsumed` (existing, lines 79/84), `number.businessPortfolioId`, `number.wabaProvider`, `number.number`, `previewToast` (existing import).
- Produces: nothing new consumed by later tasks except that this block must render **before** the Catalog linking card (Task 3) and **before** the big preview (Task 4) in DOM order — later tasks' ordering test depends on this.

This task relocates and condenses: WhatsApp voice call row, Messages consumed row, the amber compliance banner, the emerald/violet "MM Lite" banner, TSP Onboarding/A-B testing links, and the three read-only "Available"-pill fields (Business Portfolio ID, Phone Number, WABA Provider — **not** WABA ID, which now lives only in the Task 1 summary bar). No behavior changes — same handlers, same testids, just moved into one compact wrapper positioned right after the summary bar.

- [ ] **Step 1: Write the failing test for de-duplicated WABA ID**

Add to `WhatsAppNumberDetail.test.jsx`, replacing the existing test named `"renders WABA ID, Business Portfolio ID, and WABA Provider with Available pills"` (in the `describe("WhatsAppNumberDetail — account overview and Facebook Catalog")` block) with:

```jsx
  it("renders Business Portfolio ID and WABA Provider with Available pills, and does not duplicate WABA ID here", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByDisplayValue("1379257819643222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TSPENGAGE")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("328175003703387")).not.toBeInTheDocument();
    expect(screen.getAllByText("Available").length).toBe(2);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — old code still renders WABA ID as a third disabled input with an "Available" pill, so `getAllByText("Available").length` is `3` and `queryByDisplayValue("328175003703387")` finds a match.

- [ ] **Step 3: Implement the condensed secondary details block**

Replace the whole account-overview block (original lines 202-249, from `<div className="pt-6">` through the closing `</div>` right before `<p className="text-[13px] font-semibold ... Following details ...">`) — and also move the voice-call row (original lines 139-148) and messages-consumed row (original lines 156-165) to live inside this same wrapper, directly after the two summary rows from Task 1:

```jsx
          <div className="py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-text-primary">WhatsApp voice call</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">BETA</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Connect with customers instantly via WhatsApp voice calls in the Helpdesk.</p>
            </div>
            <button type="button" onClick={() => previewToast()} data-testid="whatsapp-voice-call-setup" className="text-[13px] text-primary font-medium flex-shrink-0">Setup</button>
          </div>

          <div className="py-4 border-b border-border flex items-center justify-between" data-testid="whatsapp-messages-consumed">
            <span className="text-[13px] font-semibold text-text-primary">Message consumed</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-primary" data-testid="whatsapp-messages-consumed-value">{messagesConsumed}</span>
              <span className="text-[12px] text-text-muted">messages consumed</span>
              <button type="button" onClick={refreshMessagesConsumed} data-testid="whatsapp-messages-consumed-refresh" className="text-text-muted hover:text-text-primary">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="py-4 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-[13px] font-semibold text-text-primary">Account overview</span>
              <div className="flex items-center gap-4 text-[12px]">
                <span className="text-text-secondary">WhatsApp TSP Onboarding Status - <button type="button" onClick={() => previewToast()} className="text-primary font-medium" data-testid="whatsapp-tsp-view-details">View Details</button></span>
                <span className="text-text-secondary">WhatsApp A/B Testing - <button type="button" onClick={() => previewToast()} className="text-primary font-medium" data-testid="whatsapp-ab-test-now">Test Now</button></span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800 mb-3">
              Meta enforces daily WhatsApp Business messaging limits for quality, compliance, and tier-based improvements.
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-violet-50 border border-emerald-200 rounded-lg p-3 text-[12px] text-emerald-800 mb-4 flex items-center gap-2">
              Your account is powered by MM Lite API. <span className="text-emerald-600">✓</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Business Portfolio ID", value: number.businessPortfolioId },
                { label: "Phone Number", value: number.number.replace(/\D/g, "") },
              ].map((f) => (
                <div key={f.label} className="flex items-end gap-2">
                  <label className="block flex-1">
                    <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{f.label}</span>
                    <input type="text" defaultValue={f.value} disabled data-testid={`whatsapp-field-${f.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
                  </label>
                  <span className="mb-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">Available</span>
                </div>
              ))}
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">WABA Provider</span>
                <input type="text" defaultValue={number.wabaProvider} disabled data-testid="whatsapp-waba-provider"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
              </label>
            </div>
          </div>
```

Remove the original standalone voice-call row (old lines 139-148) and messages-consumed row (old lines 156-165) from their prior positions — they now live only inside this new block. Also remove the "WABA ID" entry from the `.map()` array (it stays only in `whatsapp-summary-row-1` from Task 1) — note the array above only has "Business Portfolio ID" and "Phone Number" now, matching the failing test's expectation of 2 "Available" pills.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS — including the earlier-existing `"renders the TSP onboarding and A/B testing links, and the MM Lite banner"` test (untouched assertions, relocated markup).

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat(whatsapp-detail): condense voice call, messages consumed, and account overview into one secondary block

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Reposition Catalog linking card (pure relocation)

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx` (Catalog card, original lines 278-312)
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `catalogAllowAccess`/`removeOutOfStock` state + setters (existing, lines 81-82/290-302), `number.catalogId` (existing).
- Produces: DOM ordering guarantee — Catalog card must render after the Task 2 secondary block and before the Task 4 big preview. Later tasks' final ordering test (Task 6) depends on this.

The Catalog linking card's JSX is unchanged — only its position in the file moves (it currently sits inside the old two-column form div; it now sits directly in the single-column flow, right after the Task 2 secondary block).

- [ ] **Step 1: Write the failing test for section order**

Add to `WhatsAppNumberDetail.test.jsx`:

```jsx
describe("WhatsAppNumberDetail — single-column section order", () => {
  it("renders the summary bar before the Catalog card, and the Catalog card before the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const summary = screen.getByTestId("whatsapp-summary-row-1");
    const catalog = screen.getByTestId("whatsapp-catalog-manage");
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(summary.compareDocumentPosition(catalog) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(catalog.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
```

Note: `whatsapp-big-preview` doesn't exist yet — this test intentionally fails until Task 4 lands too, since it needs both the moved catalog card AND the new preview container. Skip running this test at the end of Task 3 with `.skip` and un-skip it in Task 4:

```jsx
  it.skip("renders the summary bar before the Catalog card, and the Catalog card before the big preview", () => {
```

- [ ] **Step 2: Run the test to verify no regressions**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS (the new ordering test is skipped; nothing else should break from a pure JSX relocation).

- [ ] **Step 3: Move the Catalog card**

Cut the Catalog card block (original lines 278-312, the `<div className="mt-6 bg-surface border border-border rounded-lg p-4">...</div>` containing Catalog Id, Manage link, and the two checkboxes) from its current position (end of the old form column) and paste it immediately after the Task 2 secondary details block, still inside the same top-level column `<div>`. No JSX inside the block changes.

- [ ] **Step 4: Run the test to verify it still passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "refactor(whatsapp-detail): reposition Catalog linking card into single-column flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `InlineEditableField` component + big editable preview (photo, brand name, about)

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx`
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Produces: `InlineEditableField({ value, onSave, testId, placeholder, as, className, inputClassName })` — a new local (not exported) component defined next to `EditableRow`, same file. `as` is `"text"` (default) or `"textarea"`. Renders a clickable `<button>` showing `value || placeholder` when not editing; renders an `<input>` (or `<textarea>` when `as="textarea"`) when editing. Commits via blur or Enter (Enter only for `as="text"`; textarea commits on blur only, since Enter should insert a newline); Escape cancels back to the last saved `value`.
- Consumes (in this task): `number.brandName`, `about`/`setAbout` (existing state, line 75), `previewToast` (existing import).
- Consumed by later tasks: Task 5 reuses `InlineEditableField` for `businessDescription`.

This task also deletes: the old small preview card (original lines 315-336), the old "Display Name" input (part of original lines 220-224, already removed structurally in Task 2's rewrite — confirm it's gone), the old "Brand Name" input + tooltip + "Brand Logo" placeholder (original lines 253-274), and the old "About" `EditableRow` (original lines 178-182) since About now lives only inline in the big preview.

- [ ] **Step 1: Write the failing test for the big preview**

Add to `WhatsAppNumberDetail.test.jsx`, and un-skip the Task 3 ordering test:

```jsx
describe("WhatsAppNumberDetail — big editable preview", () => {
  it("renders the brand name and about text inside the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(within(preview).getByText("herbal-roots")).toBeInTheDocument();
    expect(within(preview).getByText("Hey, there! I am using WhatsApp.")).toBeInTheDocument();
  });

  it("edits the brand name in place by clicking it in the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-brand-name"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-brand-name-input"), { target: { value: "Herbal Roots Co" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-brand-name-input"));
    expect(screen.getByTestId("whatsapp-preview-brand-name")).toHaveTextContent("Herbal Roots Co");
  });

  it("edits About in place by clicking it in the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-about"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-about-input"), { target: { value: "New about text" } });
    fireEvent.keyDown(screen.getByTestId("whatsapp-preview-about-input"), { key: "Enter" });
    expect(screen.getByTestId("whatsapp-preview-about")).toHaveTextContent("New about text");
  });

  it("shows a photo edit affordance that triggers the placeholder stub", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-preview-photo-edit")).toBeInTheDocument();
  });
});
```

Update the previously-passing test `"edits Business description and updates the live preview"` (in `describe("WhatsAppNumberDetail — editable rows and live preview")`) — the `whatsapp-about-*` testids it used no longer exist since About moved into the preview. Replace it with:

```jsx
  it("edits About via the preview and reflects the new value", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-about"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-about-input"), { target: { value: "New about text" } });
    fireEvent.keyDown(screen.getByTestId("whatsapp-preview-about-input"), { key: "Enter" });
    expect(screen.getAllByText("New about text").length).toBeGreaterThan(0);
  });
```

And delete the test `"shows an Add about button when about is empty, and a value with edit/delete icons once set"` — `whatsapp-about-add` no longer exists; About in the preview always renders (falls back to a placeholder string), it's never an "empty state with an add button" the way side-form `EditableRow` fields are. Also delete `"does not render a preview line for empty fields (business address is empty in the fixture)"` — `whatsapp-preview-address` moves to Task 5's edit-in-place list, which is covered there instead.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — `whatsapp-big-preview` and the `whatsapp-preview-*` testids don't exist yet.

- [ ] **Step 3: Implement `InlineEditableField` and the big preview**

Add `Camera` to the `lucide-react` import at the top of the file:

```jsx
import { ArrowLeft, Copy, Pencil, Trash2, Plus, RefreshCw, UserRound, HelpCircle, Camera } from "lucide-react";
```

Add `InlineEditableField` right after the existing `EditableRow` function (after line 71):

```jsx
function InlineEditableField({ value, onSave, testId, placeholder, as = "text", className = "", inputClassName = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => { onSave(draft.trim()); setEditing(false); };
  const cancel = () => { setDraft(value || ""); setEditing(false); };

  if (editing) {
    if (as === "textarea") {
      return (
        <textarea
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
          data-testid={`${testId}-input`} className={inputClassName}
        />
      );
    }
    return (
      <input
        type="text" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        data-testid={`${testId}-input`} className={inputClassName}
      />
    );
  }

  return (
    <button type="button" onClick={() => { setDraft(value || ""); setEditing(true); }} data-testid={testId} className={className}>
      {value || placeholder}
    </button>
  );
}
```

Add a `brandName` state alongside the other `useState` declarations (near line 74-78):

```jsx
  const [brandName, setBrandName] = useState(number.brandName || "");
```

Replace the old small preview card (`<div className="w-64 flex-shrink-0">...</div>`, original lines 315-336) with the new big preview, placed after the Catalog card from Task 3:

```jsx
          <div className="mt-6 max-w-md mx-auto border-4 border-slate-900 rounded-[2rem] overflow-hidden bg-white" data-testid="whatsapp-big-preview">
            <div className="p-6 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserRound className="w-9 h-9 text-slate-400" />
                </div>
                <button type="button" onClick={() => previewToast()} data-testid="whatsapp-preview-photo-edit"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <InlineEditableField
                value={brandName} onSave={setBrandName} testId="whatsapp-preview-brand-name"
                placeholder={number.number} className="mt-3 block w-full text-[17px] font-semibold text-text-primary"
                inputClassName="mt-3 block w-full text-[17px] font-semibold text-text-primary text-center border border-border rounded-md px-2 py-1"
              />
              <div className="text-[11px] text-text-muted mt-1">Official business account</div>
              <InlineEditableField
                value={about} onSave={setAbout} testId="whatsapp-preview-about"
                placeholder="Hey there! I am using WhatsApp." className="mt-3 block w-full text-[12px] text-text-secondary"
                inputClassName="mt-3 block w-full text-[12px] text-text-secondary text-center border border-border rounded-md px-2 py-1"
              />
            </div>
          </div>
```

Remove the old Brand Name/Brand Logo block (original lines 253-274, the `<div className="space-y-3">...</div>` with the tooltip and logo placeholder) and its preceding heading (`<p className="text-[13px] font-semibold ... Following details ...">`, original line 251) — both are superseded by the preview above. Remove the old "About" `EditableRow` call (original lines 178-182) — About is now edited only through `whatsapp-preview-about`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS — including the now-unskipped Task 3 ordering test.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat(whatsapp-detail): build big click-to-edit preview for photo, brand name, and about

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Business description inline in preview + edit-in-place list (category, address, email, website)

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx`
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `InlineEditableField` (from Task 4), `EditableRow` (existing), `businessDescription`/`setBusinessDescription` (existing state, line 74), `businessAddress`/`businessEmail`/`businessWebsite` + setters (existing state, lines 76-78).
- Produces: new `category`/`setCategory` state (default `number.category || "Shopping and Retail"`).

- [ ] **Step 1: Write the failing test**

Add to `WhatsAppNumberDetail.test.jsx`:

```jsx
describe("WhatsAppNumberDetail — description, category, and edit-in-place list", () => {
  it("edits Business description inline inside the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-description"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-description-input"), { target: { value: "New description" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-description-input"));
    expect(screen.getByTestId("whatsapp-preview-description")).toHaveTextContent("New description");
  });

  it("defaults Category to Shopping and Retail and allows editing it as an EditableRow", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-category")).toHaveTextContent("Shopping and Retail");
    fireEvent.click(screen.getByTestId("whatsapp-category-edit"));
    fireEvent.change(screen.getByTestId("whatsapp-category-input"), { target: { value: "Health and Beauty" } });
    fireEvent.click(screen.getByTestId("whatsapp-category-save"));
    expect(screen.getByTestId("whatsapp-category")).toHaveTextContent("Health and Beauty");
  });

  it("renders Business address, Email, and Website as edit-in-place rows below the preview, positioned after the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    const address = screen.getByTestId("whatsapp-address");
    const email = screen.getByTestId("whatsapp-email");
    const website = screen.getByTestId("whatsapp-website");
    expect(preview.compareDocumentPosition(address) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("support@herbalroots.com")).toBeInTheDocument();
    expect(screen.getByText("https://herbalroots.com/")).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(website).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — `whatsapp-preview-description`, `whatsapp-category` don't exist yet; `whatsapp-address`/`whatsapp-email`/`whatsapp-website` still exist but are positioned before the preview (inside the old form column), so the ordering assertion fails too.

- [ ] **Step 3: Implement**

Add `category` state near the other `useState` declarations:

```jsx
  const [category, setCategory] = useState(number.category || "Shopping and Retail");
```

Inside the big preview `data-testid="whatsapp-big-preview"` div from Task 4, add the description field right after the About `InlineEditableField`, still inside the `p-6 text-center` wrapper:

```jsx
              <InlineEditableField
                value={businessDescription} onSave={setBusinessDescription} as="textarea"
                testId="whatsapp-preview-description" placeholder="Add a business description"
                className="mt-3 block w-full text-[11px] text-text-muted"
                inputClassName="mt-3 block w-full text-[11px] text-text-muted border border-border rounded-md px-2 py-1"
              />
```

Delete the old "Business description" `EditableRow` call (original lines 150-154) — it's superseded by the field above.

Immediately after the big preview `<div data-testid="whatsapp-big-preview">...</div>` (and after the Catalog card from Task 3, which stays where Task 3 placed it — the big preview comes last per the approved section order, so this new list is the very last thing in the component), add:

```jsx
          <div className="mt-6">
            <EditableRow
              label="Category" description="The business category shown on your WhatsApp Business profile."
              value={category} onSave={setCategory} onDelete={() => setCategory("")}
              testId="whatsapp-category" emptyLabel="Add category"
            />
            <EditableRow
              label="Business address" description="Edit your business's physical address."
              value={businessAddress} onSave={setBusinessAddress} onDelete={() => setBusinessAddress("")}
              testId="whatsapp-address" emptyLabel="Add address"
            />
            <EditableRow
              label="Email for business contact" description="Edit your business email as an additional point of contact for you customers."
              value={businessEmail} onSave={setBusinessEmail} onDelete={() => setBusinessEmail("")}
              testId="whatsapp-email" emptyLabel="Add email"
            />
            <EditableRow
              label="Business website" description="Edit your business website. You must include the http:// or https:// portion of the URL."
              value={businessWebsite} onSave={setBusinessWebsite} onDelete={() => setBusinessWebsite("")}
              testId="whatsapp-website" emptyLabel="Add website"
            />
          </div>
```

Delete the old "Business address", "Email for business contact", and "Business website" `EditableRow` calls from their original positions in the old form column (original lines 184-200) — they're relocated to the block above.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat(whatsapp-detail): move description into preview, add Category, relocate address/email/website below preview

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Final cleanup and full regression pass

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx`
- Modify: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`
- Test (verify only, no changes expected): `src/components/settings/channels/__tests__/ConnectedChannelsPanel.test.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this task only removes dead code and confirms the whole suite is green.

- [ ] **Step 1: Remove the old two-column wrapper and dead code**

Open `WhatsAppNumberDetail.jsx` and confirm/remove:
- The outer `<div className="flex gap-6">` / `<div className="flex-1 min-w-0">` two-column wrapper (original lines 102-103 and their matching closing tags at the end of the old form column and old preview column) — replace with a single top-level `<div>` (no `flex gap-6`) wrapping every section in order: avatar/number row → summary row 1 → summary row 2 → voice call → messages consumed → account overview → Catalog card → big preview → Category/Address/Email/Website list.
- Any now-unused variables: `messagesConsumed`'s original standalone location is gone but the state/handler are still used (confirm still referenced in Task 2's block — yes). Confirm `businessDescription` state is still used (now feeds `whatsapp-preview-description`, not deleted). Confirm no leftover reference to a deleted testid string anywhere (search the file for `whatsapp-about-add`, `whatsapp-about-edit`, `whatsapp-display-name`, `whatsapp-overview-limit`, `whatsapp-brand-name` — none of these testids should remain in the file).
- Run: `grep -n "whatsapp-about-add\|whatsapp-about-edit\|whatsapp-display-name\|whatsapp-overview-limit\|whatsapp-brand-name\|whatsapp-field-waba-id" src/components/settings/channels/WhatsAppNumberDetail.jsx`
  Expected: no output (all removed).

- [ ] **Step 2: Rewrite the test file's obsolete assertions**

In `WhatsAppNumberDetail.test.jsx`:
- Confirm the `NUMBER`/`NON_DEFAULT_NUMBER` fixtures at the top don't need changes (they don't — `category` is intentionally absent so the default-value test from Task 5 exercises the fallback).
- Remove the `it("shows the number, username, provider, and quality badges", ...)` test's assertions on `"Provider: TSP Karix"` / `"Quality: High"` being findable via plain `getByText` if they now render inside `whatsapp-summary-row-1` — `getByText` still works since the text content is unchanged and unique; no change needed there. Verify by running the suite (next step) rather than guessing.

- [ ] **Step 3: Run the full component test suite**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS, 0 failures. If any test fails because of a testid or text query that moved, fix the query in the test file (not the component) to match the new location, then re-run.

- [ ] **Step 4: Run the ConnectedChannelsPanel suite to confirm no integration breakage**

Run: `npx craco test --testPathPattern="ConnectedChannelsPanel" --watchAll=false`
Expected: PASS — this suite navigates into `WhatsAppNumberDetail` via row clicks but only asserts on the list view and navigation, not the detail internals, so it should be unaffected. If it fails, read the failure — it means `WhatsAppNumberDetail` is now throwing on mount (e.g. a missing `number.category` isn't the issue since the state has a fallback) — fix the root cause in the component.

- [ ] **Step 5: Run the full settings test suite as a final check**

Run: `npx craco test --testPathPattern="components/settings" --watchAll=false`
Expected: PASS, 0 failures across the whole `settings` directory.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(whatsapp-detail): remove dead two-column markup, finish regression pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Header (unchanged, Task 1) → metadata summary bar (Task 1) → secondary details block (Task 2) → Catalog linking retained (Task 3) → big editable preview: photo/brand name/about (Task 4), description (Task 5) → edit-in-place list: category/address/email/website (Task 5) → cleanup + full regression (Task 6). Every spec section maps to a task.
- **Placeholder scan:** no TBD/TODO; every step has literal code.
- **Type consistency:** `InlineEditableField` props (`value`, `onSave`, `testId`, `placeholder`, `as`, `className`, `inputClassName`) introduced in Task 4 are used identically in Task 5 for the description field (`as="textarea"`). `EditableRow` props match its existing signature unchanged (`label`, `description`, `value`, `onSave`, `onDelete`, `testId`, `emptyLabel`).
- **Scope:** single file + single test file, six tasks, each independently testable and committable. No sub-decomposition needed.
