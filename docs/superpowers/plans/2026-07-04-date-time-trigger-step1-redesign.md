# Date & Time Start Trigger — Step 1 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the attribute-condition-row step 1 from every event in the "Date and time" catalogue section, replacing it with a before/on/after + yearly-recurring picker for user-attribute date events, and a simple "X time after the event" picker for system-driven events (Back in Stock, Price Drop).

**Architecture:** Two purpose-built step-1 content components (`DateRelativeTriggerContent`, already built and extended here; `EventOffsetTriggerContent`, new) are conditionally rendered by `StartTriggerWizard` based on catalogue flags (`date_relative`, `system_event_relative`) set on each event card. Canvas summary rendering (`triggerNodeUtils.js` + `StartTriggerNode.jsx`) gets matching support so both trigger kinds render meaningfully on the flow canvas — closing a pre-existing gap where `date_relative` configs rendered blank.

**Tech Stack:** React 19, Tailwind CSS, Jest + React Testing Library (`craco test`), lucide-react icons, Radix UI Select (`@/components/ui/select`).

## Global Constraints

- No backend/API changes — `dateConfig` and `eventOffsetConfig` remain client-side wizard state, consistent with the rest of the trigger wizard's existing mock-data approach.
- Applies identically to Flow Builder V1 (`src/pages/FlowBuilder.jsx`) and Flow Builder V2 (`src/pages/FlowBuilderV2.jsx`) — both import the same `StartTriggerWizard` from `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, so no page-level changes are needed.
- "Repeat annually" defaults to `true` (checked) for user-attribute date events. System-driven events have no recurrence concept at all.
- Step 2 (Who enters the flow) is unchanged for every event in this section — do not modify `skipStep2` logic, `Step2WhoContent.jsx`, or `audience_qualification_allow` handling.
- `triggerNodeUtils.js` has no React dependencies by design (see its file-header comment) — do not import from `.jsx` component files into it; duplicate small label lookups locally instead.
- Test runner: `CI=true npx craco test <path> --watchAll=false`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/data/eventCatalogue.json` | Catalogue data: card names, `date_relative`/`system_event_relative` flags, `attribute_key` |
| `src/components/flows/builder/trigger/DateRelativeTriggerContent.jsx` | Step 1 UI for user-attribute date events (existing, extended) |
| `src/components/flows/builder/trigger/EventOffsetTriggerContent.jsx` | Step 1 UI for system-driven events (new) |
| `src/components/flows/builder/trigger/StartTriggerWizard.jsx` | Routes picked cards to the right step-1 content; owns `eventOffsetConfig` state |
| `src/components/flows/builder/triggerNodeUtils.js` | Derives canvas-card summary objects from wizard config |
| `src/components/flows/builder/nodes/StartTriggerNode.jsx` | Renders the canvas card from the summary object |

---

### Task 1: Catalogue data — rename, dedupe, and flag "Date and time" cards

**Files:**
- Modify: `src/data/eventCatalogue.json` (two blocks: the `"Date and time"` header section, and its mirror inside the `"ALL"` bucket)
- Test: `src/data/__tests__/eventCatalogue.dateTime.test.js`

**Interfaces:**
- Produces: catalogue cards consumed by `EventPickerModal.jsx` (unchanged) and by `StartTriggerWizard.jsx`'s `findEvent()` — cards expose `name`, `date_relative`, `attribute_key`, `system_event_relative`, `attribute_allowed`, `audience_qualification_allow`.

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/eventCatalogue.dateTime.test.js`:

```js
import catalogueData from "../eventCatalogue.json";

function getSection(header, section) {
  return catalogueData.catalogue[header][section];
}

describe("eventCatalogue — Date and time section", () => {
  it.each(["Date and time", "ALL"])("has exactly 6 date-relative cards with no attribute selection under %s", (header) => {
    const cards = getSection(header, "User date attributes");
    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.name)).toEqual([
      "Birthday",
      "Anniversary",
      "Custom date attribute",
      "Account Created",
      "First Order Date",
      "Subscription Start Date",
    ]);
    cards.forEach((c) => {
      expect(c.date_relative).toBe(true);
      expect(c.attribute_allowed).toBe(false);
      expect(c.audience_qualification_allow).toBe(true);
      expect(typeof c.attribute_key).toBe("string");
      expect(c.attribute_key.length).toBeGreaterThan(0);
    });
  });

  it.each(["Date and time", "ALL"])("maps each date-relative card to a unique attribute_key under %s", (header) => {
    const cards = getSection(header, "User date attributes");
    expect(cards.map((c) => c.attribute_key)).toEqual([
      "date_of_birth",
      "anniversary_date",
      "custom_date_attribute",
      "account_created",
      "first_order_date",
      "subscription_start_date",
    ]);
  });

  it.each(["Date and time", "ALL"])("flags Back in Stock and Price Drop as system_event_relative with no attribute selection under %s", (header) => {
    const cards = getSection(header, "Product");
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(["Back in Stock", "Price Drop"]);
    cards.forEach((c) => {
      expect(c.system_event_relative).toBe(true);
      expect(c.attribute_allowed).toBe(false);
      expect(c.audience_qualification_allow).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/data/__tests__/eventCatalogue.dateTime.test.js --watchAll=false`
Expected: FAIL — card count is 9 (not 6), names still include `date_of_birth_trigger` etc., `attribute_key` is `undefined`, `system_event_relative` is `undefined`.

- [ ] **Step 3: Replace the "Date and time" header block**

In `src/data/eventCatalogue.json`, find the `"Date and time"` top-level key (the block whose cards have `"header": "Date and time"`). Replace its `"User date attributes"` and `"Product"` arrays with:

```json
      "User date attributes": [
        {
          "name": "Birthday",
          "description": "Start this flow a set number of days before, on, or after a user's date of birth",
          "source": "Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "date_of_birth"
        },
        {
          "name": "Anniversary",
          "description": "Start this flow a set number of days before, on, or after a user's anniversary date",
          "source": "Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "anniversary_date"
        },
        {
          "name": "Custom date attribute",
          "description": "Start this flow relative to any date field on the customer's profile",
          "source": "Shopify, Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "custom_date_attribute"
        },
        {
          "name": "Account Created",
          "description": "Start this flow relative to the date a user created their account",
          "source": "Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "account_created"
        },
        {
          "name": "First Order Date",
          "description": "Start this flow relative to the date of a user's first purchase",
          "source": "Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "first_order_date"
        },
        {
          "name": "Subscription Start Date",
          "description": "Start this flow relative to the date a user's subscription was activated",
          "source": "Engage",
          "device_tag": ["Web", "Mobile"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "header": "Date and time",
          "section": "User date attributes",
          "date_relative": true,
          "attribute_key": "subscription_start_date"
        }
      ],
      "Product": [
        {
          "name": "Back in Stock",
          "description": "Flow start when a product is Back in Stock",
          "source": "",
          "device_tag": ["iOS", "Android", "Website"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "Date and time",
          "section": "Product",
          "system_event_relative": true
        },
        {
          "name": "Price Drop",
          "description": "Flow start when a product has a price drop",
          "source": "",
          "device_tag": ["iOS", "Android", "Website"],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "Date and time",
          "section": "Product",
          "system_event_relative": true
        }
      ]
```

(Use the Edit tool with the current 9-card block as `old_string` — read the file first to get exact current formatting/whitespace before editing.)

- [ ] **Step 4: Replace the "ALL" bucket mirror block**

Repeat Step 3's replacement for the mirrored copy inside the `"ALL"` top-level key (the block whose cards have `"header": "ALL"` but `"section": "User date attributes"` / `"Product"`). Same JSON content, except every `"header": "Date and time"` becomes `"header": "ALL"`.

- [ ] **Step 5: Run test to verify it passes**

Run: `CI=true npx craco test src/data/__tests__/eventCatalogue.dateTime.test.js --watchAll=false`
Expected: PASS

- [ ] **Step 6: Validate the JSON file is well-formed**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/eventCatalogue.json', 'utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 7: Commit**

```bash
git add src/data/eventCatalogue.json src/data/__tests__/eventCatalogue.dateTime.test.js
git commit -m "feat: rename and flag Date and time catalogue cards for step1 redesign"
```

---

### Task 2: Extend `DateRelativeTriggerContent` — attribute pre-selection + custom date field

**Files:**
- Modify: `src/components/flows/builder/trigger/DateRelativeTriggerContent.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/DateRelativeTriggerContent.test.jsx`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces:
  - `emptyDateConfig(attribute = "")` → `{ attribute, customFieldKey: "", direction: "before", value: 7, unit: "days", repeat_annually: true }` (used by Task 4)
  - `DATE_ATTRIBUTE_GROUPS` (exported array)
  - `getAttributeLabel(value)` (exported function)
  - default export `DateRelativeTriggerContent({ dateConfig, setDateConfig })` (unchanged prop signature)

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/__tests__/DateRelativeTriggerContent.test.jsx`:

```jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DateRelativeTriggerContent, {
  emptyDateConfig,
  getAttributeLabel,
} from "../DateRelativeTriggerContent";

function Harness({ initial }) {
  const [dateConfig, setDateConfig] = useState(initial);
  return <DateRelativeTriggerContent dateConfig={dateConfig} setDateConfig={setDateConfig} />;
}

describe("emptyDateConfig", () => {
  it("defaults to no attribute selected, before/7/days, repeat annually on", () => {
    expect(emptyDateConfig()).toEqual({
      attribute: "",
      customFieldKey: "",
      direction: "before",
      value: 7,
      unit: "days",
      repeat_annually: true,
    });
  });

  it("pre-selects the given attribute", () => {
    expect(emptyDateConfig("date_of_birth").attribute).toBe("date_of_birth");
  });
});

describe("getAttributeLabel", () => {
  it("resolves known attribute keys to display labels", () => {
    expect(getAttributeLabel("date_of_birth")).toBe("Date of Birth");
    expect(getAttributeLabel("custom_date_attribute")).toBe("Custom date attribute");
  });
});

describe("DateRelativeTriggerContent — custom date field", () => {
  it("shows the custom field key input when attribute is custom_date_attribute", () => {
    render(<Harness initial={emptyDateConfig("custom_date_attribute")} />);
    expect(screen.getByTestId("date-relative-custom-field-key")).toBeInTheDocument();
  });

  it("hides the custom field key input for a standard attribute", () => {
    render(<Harness initial={emptyDateConfig("date_of_birth")} />);
    expect(screen.queryByTestId("date-relative-custom-field-key")).not.toBeInTheDocument();
  });

  it("updates customFieldKey as the seller types", () => {
    render(<Harness initial={emptyDateConfig("custom_date_attribute")} />);
    fireEvent.change(screen.getByTestId("date-relative-custom-field-key"), {
      target: { value: "subscription_renewal_date" },
    });
    expect(screen.getByTestId("date-relative-custom-field-key")).toHaveValue("subscription_renewal_date");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/DateRelativeTriggerContent.test.jsx --watchAll=false`
Expected: FAIL — `emptyDateConfig` doesn't accept a param yet, has no `customFieldKey`; `getAttributeLabel` isn't exported; the custom field testid doesn't exist.

- [ ] **Step 3: Update `emptyDateConfig` and export `getAttributeLabel`/`DATE_ATTRIBUTE_GROUPS`**

In `src/components/flows/builder/trigger/DateRelativeTriggerContent.jsx`, replace:

```js
export function emptyDateConfig() {
  return {
    attribute: "",
    direction: "before",
    value: 7,
    unit: "days",
    repeat_annually: true,
  };
}
```

with:

```js
export function emptyDateConfig(attribute = "") {
  return {
    attribute,
    customFieldKey: "",
    direction: "before",
    value: 7,
    unit: "days",
    repeat_annually: true,
  };
}
```

Replace:

```js
const DATE_ATTRIBUTE_GROUPS = [
  {
    label: "Profile Attributes",
    options: [
      { value: "date_of_birth", label: "Date of Birth" },
      { value: "anniversary_date", label: "Anniversary Date" },
    ],
  },
  {
    label: "Derived Dates",
    options: [
      { value: "account_created", label: "Account Created" },
      { value: "first_order_date", label: "Date of First Order" },
      { value: "subscription_start_date", label: "Date of Subscription Start" },
    ],
  },
];
```

with:

```js
export const DATE_ATTRIBUTE_GROUPS = [
  {
    label: "Profile Attributes",
    options: [
      { value: "date_of_birth", label: "Date of Birth" },
      { value: "anniversary_date", label: "Anniversary Date" },
    ],
  },
  {
    label: "Custom",
    options: [
      { value: "custom_date_attribute", label: "Custom date attribute" },
    ],
  },
  {
    label: "Derived Dates",
    options: [
      { value: "account_created", label: "Account Created" },
      { value: "first_order_date", label: "Date of First Order" },
      { value: "subscription_start_date", label: "Date of Subscription Start" },
    ],
  },
];
```

Replace:

```js
function getAttributeLabel(value) {
```

with:

```js
export function getAttributeLabel(value) {
```

- [ ] **Step 4: Add the conditional custom field-key input**

In the same file, insert the custom-field input immediately after the closing `</Select>` of the "Date attribute select" block (i.e. right after the `</Select>` that closes the attribute selector, before the `{/* Separator */}` comment), inside the same `<div className="flex flex-wrap items-center gap-2 ...">`'s parent — as a new block directly under that row:

```jsx
      </div>

      {/* Custom date field key — only when Custom date attribute is selected */}
      {dateConfig.attribute === "custom_date_attribute" && (
        <div className="mt-3">
          <label className="text-xs text-text-muted block mb-1">
            Which date field?
          </label>
          <input
            type="text"
            value={dateConfig.customFieldKey}
            onChange={(e) => update({ customFieldKey: e.target.value })}
            placeholder="e.g. subscription_renewal_date"
            data-testid="date-relative-custom-field-key"
            className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Separator */}
```

(This replaces the existing `      </div>\n\n      {/* Separator */}` sequence — the closing `</div>` of the main trigger row followed directly by the separator comment.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/DateRelativeTriggerContent.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/trigger/DateRelativeTriggerContent.jsx src/components/flows/builder/trigger/__tests__/DateRelativeTriggerContent.test.jsx
git commit -m "feat: add custom date attribute support to DateRelativeTriggerContent"
```

---

### Task 3: New `EventOffsetTriggerContent` for system-driven events

**Files:**
- Create: `src/components/flows/builder/trigger/EventOffsetTriggerContent.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/EventOffsetTriggerContent.test.jsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  - `emptyEventOffsetConfig(eventName = "")` → `{ event: eventName, value: 1, unit: "Hours" }` (used by Task 4)
  - default export `EventOffsetTriggerContent({ config, setConfig })`
  - root element carries `data-testid="event-offset-step1"` (used by Task 4's wizard test)

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/__tests__/EventOffsetTriggerContent.test.jsx`:

```jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EventOffsetTriggerContent, { emptyEventOffsetConfig } from "../EventOffsetTriggerContent";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial);
  return <EventOffsetTriggerContent config={config} setConfig={setConfig} />;
}

describe("emptyEventOffsetConfig", () => {
  it("defaults to 1 Hour after the given event", () => {
    expect(emptyEventOffsetConfig("Back in Stock")).toEqual({
      event: "Back in Stock",
      value: 1,
      unit: "Hours",
    });
  });
});

describe("EventOffsetTriggerContent", () => {
  it("renders the step1 container and the event name", () => {
    render(<Harness initial={emptyEventOffsetConfig("Back in Stock")} />);
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
    expect(screen.getByText("Back in Stock")).toBeInTheDocument();
  });

  it("updates the value as the seller types a new number", () => {
    render(<Harness initial={emptyEventOffsetConfig("Price Drop")} />);
    fireEvent.change(screen.getByTestId("event-offset-value-input"), { target: { value: "3" } });
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(3);
  });

  it("clamps the value to a minimum of 1", () => {
    render(<Harness initial={emptyEventOffsetConfig("Price Drop")} />);
    fireEvent.change(screen.getByTestId("event-offset-value-input"), { target: { value: "0" } });
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/EventOffsetTriggerContent.test.jsx --watchAll=false`
Expected: FAIL — module `../EventOffsetTriggerContent` does not exist.

- [ ] **Step 3: Create the component**

Create `src/components/flows/builder/trigger/EventOffsetTriggerContent.jsx`:

```jsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function emptyEventOffsetConfig(eventName = "") {
  return { event: eventName, value: 1, unit: "Hours" };
}

const UNIT_OPTIONS = [
  { value: "Hours", label: "Hours" },
  { value: "Days", label: "Days" },
  { value: "Weeks", label: "Weeks" },
];

export default function EventOffsetTriggerContent({ config, setConfig }) {
  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  return (
    <div
      className="border border-border rounded-lg p-4 bg-surface"
      data-testid="event-offset-step1"
    >
      <p className="text-[12px] uppercase tracking-wide text-text-muted font-semibold mb-3">
        Create trigger based on Date &amp; Time
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
        <span className="font-medium">Trigger</span>

        <input
          type="number"
          min={1}
          value={config.value}
          onChange={(e) =>
            update({ value: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
          data-testid="event-offset-value-input"
          className="h-7 w-14 rounded-md border border-border bg-background px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <Select value={config.unit} onValueChange={(v) => update({ unit: v })}>
          <SelectTrigger
            data-testid="event-offset-unit-select"
            className="h-7 text-sm px-2 border-border rounded-md min-w-[90px] w-auto"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-text-muted">
          after <span className="font-medium text-text-primary">{config.event}</span> fires
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/EventOffsetTriggerContent.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/EventOffsetTriggerContent.jsx src/components/flows/builder/trigger/__tests__/EventOffsetTriggerContent.test.jsx
git commit -m "feat: add EventOffsetTriggerContent for system-driven Date and time events"
```

---

### Task 4: Wire `EventOffsetTriggerContent` into `StartTriggerWizard`, pre-select date attributes

**Files:**
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx`

**Interfaces:**
- Consumes: `emptyDateConfig(attribute)` from `DateRelativeTriggerContent.jsx` (Task 2), `emptyEventOffsetConfig(eventName)` and `EventOffsetTriggerContent` from `EventOffsetTriggerContent.jsx` (Task 3), catalogue cards with `date_relative`/`attribute_key`/`system_event_relative` (Task 1).
- Produces: `handleFinish()` emits `{ kind: "event_offset", eventOffsetConfig, audience }` for system-driven events; `{ kind: "date_relative", dateConfig, audience }` continues as before but `dateConfig.attribute` is now pre-populated from the clicked card.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickDateAndTimeCard(cardName) {
  fireEvent.click(screen.getByTestId("event-picker-header-Date and time"));
  fireEvent.click(screen.getByTestId(`event-picker-card-${cardName}`));
}

describe("StartTriggerWizard — Date and time section", () => {
  it("routes user-attribute date cards to DateRelativeTriggerContent, not the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Birthday");
    expect(screen.queryByTestId("trigger-wizard-back")).toBeInTheDocument();
    expect(screen.queryByText(/Add evaluate rule/i)).not.toBeInTheDocument();
  });

  it("pre-selects the clicked card's date attribute and finishes with it", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Birthday");

    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "date_relative",
        dateConfig: expect.objectContaining({ attribute: "date_of_birth" }),
      }),
    );
  });

  it("pre-selects Account Created's attribute distinctly from Birthday's", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Account Created");

    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        dateConfig: expect.objectContaining({ attribute: "account_created" }),
      }),
    );
  });

  it("routes Back in Stock to EventOffsetTriggerContent instead of the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Back in Stock");
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
  });

  it("still shows the Who-enters-the-flow step for Back in Stock, then finishes with kind: event_offset", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Back in Stock");

    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    expect(screen.getByTestId("audience-filter-users")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "event_offset",
        eventOffsetConfig: expect.objectContaining({ event: "Back in Stock", value: 1, unit: "Hours" }),
      }),
    );
  });

  it("hydrates an existing event_offset config back into EventOffsetTriggerContent on edit", () => {
    const initialConfig = {
      kind: "event_offset",
      eventOffsetConfig: { event: "Price Drop", value: 2, unit: "Days" },
      audience: { include_all: true },
    };
    render(<StartTriggerWizard open initialConfig={initialConfig} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx --watchAll=false`
Expected: FAIL — `Back in Stock` still opens the attribute-condition builder (no `event-offset-step1` testid), `dateConfig.attribute` is `""` regardless of which card was clicked, `kind: "event_offset"` is never emitted.

- [ ] **Step 3: Add imports and state**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, replace the import block:

```js
import DateRelativeTriggerContent, { emptyDateConfig } from "./DateRelativeTriggerContent";
```

with:

```js
import DateRelativeTriggerContent, { emptyDateConfig } from "./DateRelativeTriggerContent";
import EventOffsetTriggerContent, { emptyEventOffsetConfig } from "./EventOffsetTriggerContent";
```

Replace:

```js
  const [isDateRelative, setIsDateRelative] = useState(false);
  const [dateConfig, setDateConfig] = useState(emptyDateConfig());
```

with:

```js
  const [isDateRelative, setIsDateRelative] = useState(false);
  const [dateConfig, setDateConfig] = useState(emptyDateConfig());
  const [isEventOffset, setIsEventOffset] = useState(false);
  const [eventOffsetConfig, setEventOffsetConfig] = useState(emptyEventOffsetConfig());
```

- [ ] **Step 4: Hydrate `event_offset` on edit**

Replace:

```js
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
```

with:

```js
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (initialConfig?.kind === "event_offset") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(true);
        setEventOffsetConfig(initialConfig.eventOffsetConfig || emptyEventOffsetConfig());
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
```

- [ ] **Step 5: Reset `isEventOffset` in the other hydration branches and the "no config" reset**

Replace:

```js
        if (ev?.name === "Saved segment" || ev?.name === "CSV upload") {
          setBroadcastSourceType(ev.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(initialConfig.broadcastSourceConfig || emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(initialConfig.broadcastSourceSchedule || emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setStage("step1");
      }
    } else {
      setTriggerGroups([]);
      setGroupsCombinator("AND");
      setExitTrigger(null);
      setAudience(emptyAudience());
      setBroadcast(emptyBroadcast());
      setBroadcastSourceType(null);
      setBroadcastSourceConfig(emptyBroadcastSourceConfig());
      setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
      setIsDateRelative(false);
      setIsWebhook(false);
      setWebhookConfig(emptyWebhookConfig());
      setDateConfig(emptyDateConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
```

with:

```js
        if (ev?.name === "Saved segment" || ev?.name === "CSV upload") {
          setBroadcastSourceType(ev.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(initialConfig.broadcastSourceConfig || emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(initialConfig.broadcastSourceSchedule || emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
        setIsEventOffset(false);
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setStage("step1");
      }
    } else {
      setTriggerGroups([]);
      setGroupsCombinator("AND");
      setExitTrigger(null);
      setAudience(emptyAudience());
      setBroadcast(emptyBroadcast());
      setBroadcastSourceType(null);
      setBroadcastSourceConfig(emptyBroadcastSourceConfig());
      setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
      setIsDateRelative(false);
      setIsEventOffset(false);
      setIsWebhook(false);
      setWebhookConfig(emptyWebhookConfig());
      setDateConfig(emptyDateConfig());
      setEventOffsetConfig(emptyEventOffsetConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
```

- [ ] **Step 6: Route picked cards in `onPickEvent`**

Replace:

```js
      if (card.name === "Webhook trigger") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setWebhookConfig(emptyWebhookConfig());
        setStage("step1");
      } else if (card.header === "Broadcast") {
        setIsWebhook(false);
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
        setIsDateRelative(false);
      } else if (card.date_relative) {
        setIsWebhook(false);
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig());
        setStage("step1");
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setStage("step1");
      }
```

with:

```js
      if (card.name === "Webhook trigger") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setWebhookConfig(emptyWebhookConfig());
        setStage("step1");
      } else if (card.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else if (card.date_relative) {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig(card.attribute_key));
        setStage("step1");
      } else if (card.system_event_relative) {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(true);
        setEventOffsetConfig(emptyEventOffsetConfig(card.name));
        setStage("step1");
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setStage("step1");
      }
```

- [ ] **Step 7: Render `EventOffsetTriggerContent`**

Replace:

```jsx
            {stage === "step1" && isDateRelative && !isWebhook && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isWebhook && (
```

with:

```jsx
            {stage === "step1" && isDateRelative && !isWebhook && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && isEventOffset && !isWebhook && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isEventOffset && !isWebhook && (
```

- [ ] **Step 8: Emit `kind: "event_offset"` in `handleFinish`**

Replace:

```js
    } else if (isDateRelative) {
      config = { kind: "date_relative", dateConfig, audience };
    } else {
```

with:

```js
    } else if (isDateRelative) {
      config = { kind: "date_relative", dateConfig, audience };
    } else if (isEventOffset) {
      config = { kind: "event_offset", eventOffsetConfig, audience };
    } else {
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 10: Run the full trigger test suite to check for regressions**

Run: `CI=true npx craco test src/components/flows/builder/trigger --watchAll=false`
Expected: PASS (including the existing `StartTriggerWizard.webhook.test.jsx`)

- [ ] **Step 11: Commit**

```bash
git add src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx
git commit -m "feat: route Date and time events to attribute/offset step1, pre-select attribute"
```

---

### Task 5: `triggerNodeUtils.js` — summarise `date_relative` and `event_offset` configs

**Files:**
- Modify: `src/components/flows/builder/triggerNodeUtils.js`
- Test: `src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js`

**Interfaces:**
- Consumes: `config.kind === "date_relative"` shape `{ dateConfig: { attribute, customFieldKey, direction, value, unit, repeat_annually }, audience }` (Task 4); `config.kind === "event_offset"` shape `{ eventOffsetConfig: { event, value, unit }, audience }` (Task 4).
- Produces: summary objects with `isDateRelative` / `isEventOffset` booleans, `offsetLine`, `recurrenceLine` — consumed by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js`:

```js
import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — date_relative", () => {
  const baseConfig = {
    kind: "date_relative",
    dateConfig: { attribute: "date_of_birth", direction: "before", value: 7, unit: "days", repeat_annually: true },
    audience: { include_all: true },
  };

  it("marks the summary as date-relative with a human-readable offset line", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isDateRelative).toBe(true);
    expect(summary.isEventOffset).toBe(false);
    expect(summary.isWebhook).toBe(false);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.offsetLine).toBe("7 days before Date of Birth");
  });

  it("shows the recurrence line only when repeat_annually is true", () => {
    expect(summariseTriggerConfig(baseConfig).recurrenceLine).toBe("Repeats yearly");
    const noRepeat = { ...baseConfig, dateConfig: { ...baseConfig.dateConfig, repeat_annually: false } };
    expect(summariseTriggerConfig(noRepeat).recurrenceLine).toBeNull();
  });

  it("uses the custom field key as the label for custom_date_attribute", () => {
    const custom = {
      ...baseConfig,
      dateConfig: { attribute: "custom_date_attribute", customFieldKey: "renewal_date", direction: "after", value: 3, unit: "days", repeat_annually: false },
    };
    expect(summariseTriggerConfig(custom).offsetLine).toBe("3 days after renewal_date");
  });

  it("omits the value/unit for the on-the-date direction", () => {
    const onDate = { ...baseConfig, dateConfig: { ...baseConfig.dateConfig, direction: "on" } };
    expect(summariseTriggerConfig(onDate).offsetLine).toBe("On Date of Birth");
  });

  it("derives audience fields from the shared audience summariser", () => {
    const withAudience = {
      ...baseConfig,
      audience: {
        include_all: false,
        audience_kind: "all",
        include: { blocks: [{ type: "property", conditions: [{ property: "city", operator: "is", value: "Mumbai" }] }] },
      },
    };
    expect(summariseTriggerConfig(withAudience).whoLine).toContain("city");
  });
});

describe("summariseTriggerConfig — event_offset", () => {
  const baseConfig = {
    kind: "event_offset",
    eventOffsetConfig: { event: "Back in Stock", value: 2, unit: "Hours" },
    audience: { include_all: true },
  };

  it("marks the summary as event-offset with no recurrence", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isEventOffset).toBe(true);
    expect(summary.isDateRelative).toBe(false);
    expect(summary.offsetLine).toBe("2 Hours after Back in Stock");
    expect(summary.recurrenceLine).toBeNull();
  });

  it("has no exit condition", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js --watchAll=false`
Expected: FAIL — `summariseTriggerConfig` falls through to `summariseNewFormat`/`summariseOldFormat` for these kinds today, so `isDateRelative`/`isEventOffset`/`offsetLine` are all `undefined`.

- [ ] **Step 3: Add the label map and summary functions**

In `src/components/flows/builder/triggerNodeUtils.js`, insert this immediately before the `function summariseWebhook(config) {` line:

```js
// Local copy of the attribute labels shown in DateRelativeTriggerContent's
// dropdown — duplicated (not imported) to keep this file free of React deps.
const DATE_ATTRIBUTE_LABELS = {
  date_of_birth: "Date of Birth",
  anniversary_date: "Anniversary Date",
  account_created: "Account Created",
  first_order_date: "Date of First Order",
  subscription_start_date: "Date of Subscription Start",
};

function summariseDateRelative(config) {
  const {
    whoLine, whoExtraCount, frequencyLine,
    audienceTypePill, audienceTab, audienceConditions, audienceCombinator,
  } = summariseAudienceNew(config.audience);

  const dc = config.dateConfig || {};
  const attrLabel = dc.attribute === "custom_date_attribute"
    ? (dc.customFieldKey || "custom date field")
    : (DATE_ATTRIBUTE_LABELS[dc.attribute] || dc.attribute || "date attribute");
  const offsetLine = !dc.direction
    ? null
    : dc.direction === "on"
    ? `On ${attrLabel}`
    : `${dc.value} ${dc.unit} ${dc.direction} ${attrLabel}`;

  return {
    headerLabel: "Start Trigger",
    isBroadcast: false,
    isWebhook: false,
    isDateRelative: true,
    isEventOffset: false,
    offsetLine,
    recurrenceLine: dc.repeat_annually ? "Repeats yearly" : null,
    whoLine,
    whoExtraCount,
    frequencyLine,
    audienceTypePill,
    audienceTab,
    audienceConditions,
    audienceCombinator,
    noExitCondition: true,
    exitLine: null,
    exitExtraCount: 0,
    exitEvents: [],
    exitCombinator: "OR",
  };
}

function summariseEventOffset(config) {
  const {
    whoLine, whoExtraCount, frequencyLine,
    audienceTypePill, audienceTab, audienceConditions, audienceCombinator,
  } = summariseAudienceNew(config.audience);

  const ec = config.eventOffsetConfig || {};
  const offsetLine = ec.event ? `${ec.value} ${ec.unit} after ${ec.event}` : null;

  return {
    headerLabel: "Start Trigger",
    isBroadcast: false,
    isWebhook: false,
    isDateRelative: false,
    isEventOffset: true,
    offsetLine,
    recurrenceLine: null,
    whoLine,
    whoExtraCount,
    frequencyLine,
    audienceTypePill,
    audienceTab,
    audienceConditions,
    audienceCombinator,
    noExitCondition: true,
    exitLine: null,
    exitExtraCount: 0,
    exitEvents: [],
    exitCombinator: "OR",
  };
}
```

- [ ] **Step 4: Wire the new kinds into `summariseTriggerConfig`**

Replace:

```js
export function summariseTriggerConfig(config) {
  if (!config) return null;
  if (config.kind === "webhook") return summariseWebhook(config);
```

with:

```js
export function summariseTriggerConfig(config) {
  if (!config) return null;
  if (config.kind === "webhook") return summariseWebhook(config);
  if (config.kind === "date_relative") return summariseDateRelative(config);
  if (config.kind === "event_offset") return summariseEventOffset(config);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js --watchAll=false`
Expected: PASS

- [ ] **Step 6: Run the full triggerNodeUtils suite to check for regressions**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js --watchAll=false`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/triggerNodeUtils.js src/components/flows/builder/__tests__/triggerNodeUtils.dateTime.test.js
git commit -m "feat: add summariseDateRelative and summariseEventOffset to triggerNodeUtils"
```

---

### Task 6: Render the date/offset summary on the canvas card

**Files:**
- Modify: `src/components/flows/builder/nodes/StartTriggerNode.jsx`
- Test: `src/components/flows/builder/nodes/__tests__/StartTriggerNode.dateTime.test.jsx`

**Interfaces:**
- Consumes: `summary.isDateRelative`, `summary.isEventOffset`, `summary.offsetLine`, `summary.recurrenceLine` from Task 5.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/__tests__/StartTriggerNode.dateTime.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const dateRelativeConfig = {
  kind: "date_relative",
  dateConfig: { attribute: "date_of_birth", direction: "before", value: 7, unit: "days", repeat_annually: true },
  audience: { include_all: true },
};

const eventOffsetConfig = {
  kind: "event_offset",
  eventOffsetConfig: { event: "Back in Stock", value: 2, unit: "Hours" },
  audience: { include_all: true },
};

describe("StartTriggerNode — date_relative trigger", () => {
  it("renders the offset line and a recurrence badge", () => {
    render(<StartTriggerNode data={{ config: dateRelativeConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("7 days before Date of Birth")).toBeInTheDocument();
    expect(screen.getByText("Repeats yearly")).toBeInTheDocument();
  });

  it("omits the recurrence badge when repeat_annually is false", () => {
    const noRepeat = { ...dateRelativeConfig, dateConfig: { ...dateRelativeConfig.dateConfig, repeat_annually: false } };
    render(<StartTriggerNode data={{ config: noRepeat, onEdit: () => {} }} selected={false} />);
    expect(screen.queryByText("Repeats yearly")).not.toBeInTheDocument();
  });

  it("still renders the shared Audience section", () => {
    render(<StartTriggerNode data={{ config: dateRelativeConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});

describe("StartTriggerNode — event_offset trigger", () => {
  it("renders the offset line with no recurrence badge", () => {
    render(<StartTriggerNode data={{ config: eventOffsetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("2 Hours after Back in Stock")).toBeInTheDocument();
    expect(screen.queryByText("Repeats yearly")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/nodes/__tests__/StartTriggerNode.dateTime.test.jsx --watchAll=false`
Expected: FAIL — today these configs fall into the generic `triggerGroups.map(...)` branch, which throws (`summary.triggerGroups` is `undefined` for these kinds) or renders nothing matching the expected text.

- [ ] **Step 3: Add the `DateOffsetEntryBlock` component**

In `src/components/flows/builder/nodes/StartTriggerNode.jsx`, insert immediately after the closing brace of `WebhookEntryBlock` (after its `}` on the line before `// ── Inter-group combinator ...`):

```jsx
function DateOffsetEntryBlock({ summary }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
        <span className="text-[11px] font-semibold text-text-primary">{summary.offsetLine}</span>
      </div>
      {summary.recurrenceLine && (
        <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
          {summary.recurrenceLine}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Render it, and guard the generic event-list branch**

Replace:

```jsx
        {summary.isWebhook && <WebhookEntryBlock summary={summary} />}

        {!summary.isBroadcast && !summary.isWebhook && (
```

with:

```jsx
        {summary.isWebhook && <WebhookEntryBlock summary={summary} />}

        {(summary.isDateRelative || summary.isEventOffset) && summary.offsetLine && (
          <DateOffsetEntryBlock summary={summary} />
        )}

        {!summary.isBroadcast && !summary.isWebhook && !summary.isDateRelative && !summary.isEventOffset && (
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/nodes/__tests__/StartTriggerNode.dateTime.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 6: Run the full StartTriggerNode suite to check for regressions**

Run: `CI=true npx craco test src/components/flows/builder/nodes --watchAll=false`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/nodes/StartTriggerNode.jsx src/components/flows/builder/nodes/__tests__/StartTriggerNode.dateTime.test.jsx
git commit -m "feat: render date/offset trigger summary on StartTriggerNode canvas card"
```

---

### Task 7: Full regression pass and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire flow-builder trigger test suite**

Run: `CI=true npx craco test src/components/flows/builder --watchAll=false`
Expected: PASS, no regressions in webhook, broadcast, or evaluate-condition tests.

- [ ] **Step 2: Run the full test suite**

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS.

- [ ] **Step 3: Manual smoke test in the browser**

Start the dev server (`npm start` or the project's existing dev script), open a flow in Flow Builder V2, click the Start Trigger node to open the wizard, and verify:
1. Selecting "Date and time" → "Birthday" opens the before/on/after + "Repeat annually" UI (no attribute-condition rows), with "Date of Birth" pre-selected in the attribute dropdown.
2. Switching the attribute dropdown to "Custom date attribute" reveals the "Which date field?" text input.
3. Going back to the picker and selecting "Back in Stock" opens the simple "Trigger [X] [unit] after Back in Stock fires" row, with no attribute-condition rows and no recurrence checkbox.
4. Clicking Next on either path still reaches the "Who will enter the flow" step, exactly as it does today for other event types.
5. Finishing the wizard renders a canvas card showing the offset line (and, for date-relative, a "Repeats yearly" badge when enabled).
6. Repeat steps 1–5 in Flow Builder V1 to confirm parity.

Report the outcome of this manual pass in your task completion message — do not claim the UI works without having driven it.

---

## Self-Review Notes

- **Spec coverage:** Catalogue rename/dedupe (Task 1), user-attribute date offset + recurring checkbox (Task 2, reusing existing `DateRelativeTriggerContent`), custom date attribute field-key input (Task 2), system-event offset-only UI (Task 3), wizard routing for both (Task 4), Step 2 unchanged (verified via existing `skipStep2` formula and confirmed in Task 4's tests), canvas summary for both kinds (Tasks 5–6) closing the pre-existing `date_relative` blank-summary gap. All spec sections have a corresponding task.
- **No placeholders:** every step includes literal code or an exact command with expected output.
- **Type consistency:** `emptyDateConfig(attribute)`, `emptyEventOffsetConfig(eventName)`, `dateConfig.customFieldKey`, `eventOffsetConfig.{event,value,unit}`, and the summary fields `isDateRelative`/`isEventOffset`/`offsetLine`/`recurrenceLine` are named identically everywhere they appear across Tasks 2–6.
