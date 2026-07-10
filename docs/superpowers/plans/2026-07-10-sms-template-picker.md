# SMS Node — Template Style & Standardized Template Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring WhatsApp-parity UX to the SMS node's Template tab — Provider → Sender ID → Template Style gate, then a central browse/edit modal with hover Edit/Analytics/Select — by generalizing WhatsApp's existing `UnifiedTemplateModal`/`TemplateAnalyticsPopover` with additive optional props instead of duplicating them.

**Architecture:** `UnifiedTemplateModal.jsx` and `TemplateAnalyticsPopover.jsx` (both in `WhatsAppNode/`) gain new optional props (`configRegistry`, `accentColor`, `PreviewComponent`, `metaInsightsStyleIds`, `getAnalytics`, `analyticsMetrics`, `customFormRenderer`) that all default to today's exact WhatsApp behavior. `SMSRightPanel.jsx` imports `UnifiedTemplateModal` directly (there's precedent — `CampaignContentPanel.jsx` already does this) and passes SMS-specific values for all of them. Three new small SMS-only files supply the bits that are genuinely different: `SMSTemplateForm.jsx` (bespoke fields via `customFormRenderer`), `SMSBubblePreview.jsx` (via `PreviewComponent`), `data/mockSMSAnalytics.js` (via `getAnalytics`/`analyticsMetrics`).

**Tech Stack:** React (JSX, no TypeScript), inline `style={{}}` objects (no Tailwind/CSS modules in this file tree), `lucide-react` icons, Jest + React Testing Library (`craco test`), no backend — all data is static mock arrays.

## Global Constraints

- No new npm dependencies.
- No TypeScript — this is a plain `.jsx` codebase; do not introduce `.ts`/`.tsx` files.
- Every new/modified prop on `UnifiedTemplateModal.jsx` and `TemplateAnalyticsPopover.jsx` must default to reproducing today's exact WhatsApp behavior when omitted — WhatsApp's existing call sites (`WhatsAppRightPanel.jsx`, `CampaignContentPanel.jsx`) must not change behavior and their existing tests must keep passing unmodified.
- Follow existing file conventions: inline styles, hardcoded hex color constants at the top of each file, no comments unless documenting a non-obvious constraint.
- Test everything with Jest + RTL (`render`/`screen`/`fireEvent`), matching the style already used in `WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx` and `builder/__tests__/StatusBadge.test.jsx`.

---

## Task 1: SMS data model — providers, sender IDs, categorized templates, style catalogue

**Files:**
- Modify: `src/components/flows/builder/nodes/SMSNode/data/mockData.js`
- Test: `src/components/flows/builder/nodes/SMSNode/data/__tests__/mockData.test.js`

**Interfaces:**
- Produces: `SMS_PROVIDERS` (`{id, name}[]`), `SMS_SENDER_IDS` (`{id, providerId, senderId, status}[]`), `SMS_TEMPLATE_STYLES` (`{id, label, Icon, desc}[]`), `SMS_TEMPLATE_STYLE_CONFIGS` (`{[styleId]: {defaultDraft, mockTemplates, isValid}}`), `defaultSMSNodeData` (now includes `providerId`, `senderIdId`, `templateStyle`). `MOCK_SMS_TEMPLATES` entries now have `category` instead of `gateway`. `SMS_GATEWAYS` is removed.

- [ ] **Step 1: Write the failing test**

```js
// src/components/flows/builder/nodes/SMSNode/data/__tests__/mockData.test.js
import {
  SMS_PROVIDERS, SMS_SENDER_IDS, SMS_TEMPLATE_STYLES, SMS_TEMPLATE_STYLE_CONFIGS,
  MOCK_SMS_TEMPLATES, defaultSMSNodeData,
} from "../mockData";

describe("SMS data model", () => {
  it("has providers with id and name", () => {
    expect(SMS_PROVIDERS.length).toBeGreaterThan(0);
    SMS_PROVIDERS.forEach((p) => {
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
    });
  });

  it("scopes every sender ID to a real provider", () => {
    const providerIds = SMS_PROVIDERS.map((p) => p.id);
    SMS_SENDER_IDS.forEach((s) => expect(providerIds).toContain(s.providerId));
  });

  it("has exactly two template styles: transactional and promotional", () => {
    expect(SMS_TEMPLATE_STYLES.map((s) => s.id).sort()).toEqual(["promotional", "transactional"]);
    SMS_TEMPLATE_STYLES.forEach((s) => {
      expect(typeof s.label).toBe("string");
      expect(typeof s.desc).toBe("string");
      expect(s.Icon).toBeDefined();
    });
  });

  it("gives every template a category of transactional or promotional, no gateway field", () => {
    expect(MOCK_SMS_TEMPLATES.length).toBeGreaterThan(0);
    MOCK_SMS_TEMPLATES.forEach((t) => {
      expect(["transactional", "promotional"]).toContain(t.category);
      expect(t.gateway).toBeUndefined();
    });
  });

  it("builds a style-config registry keyed by style id, pre-filtered by category", () => {
    expect(Object.keys(SMS_TEMPLATE_STYLE_CONFIGS).sort()).toEqual(["promotional", "transactional"]);
    Object.entries(SMS_TEMPLATE_STYLE_CONFIGS).forEach(([styleId, config]) => {
      expect(config.defaultDraft).toBeDefined();
      config.mockTemplates.forEach((t) => expect(t.category).toBe(styleId));
    });
  });

  it("defaults new SMS nodes to no provider/sender/style chosen", () => {
    expect(defaultSMSNodeData.providerId).toBeNull();
    expect(defaultSMSNodeData.senderIdId).toBeNull();
    expect(defaultSMSNodeData.templateStyle).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test mockData.test.js --watchAll=false`
Expected: FAIL — `SMS_PROVIDERS`/`SMS_SENDER_IDS`/etc. are undefined (module doesn't export them yet).

- [ ] **Step 3: Replace `mockData.js` with the new data model**

```js
// src/components/flows/builder/nodes/SMSNode/data/mockData.js
import { PackageCheck, Megaphone } from "lucide-react";

export const SMS_PROVIDERS = [
  { id: "trustsignal", name: "TrustSignal" },
  { id: "msg91",       name: "MSG91" },
  { id: "kaleyra",     name: "Kaleyra" },
];

export const SMS_SENDER_IDS = [
  { id: "trustsignal_txtind", providerId: "trustsignal", senderId: "TXTIND", status: "active" },
  { id: "trustsignal_shprkt", providerId: "trustsignal", senderId: "SHPRKT", status: "active" },
  { id: "msg91_avimee",       providerId: "msg91",       senderId: "AVIMEE", status: "active" },
  { id: "kaleyra_studdm",     providerId: "kaleyra",     senderId: "STUDDM", status: "inactive" },
];

export const SMS_TEMPLATE_STYLES = [
  { id: "transactional", label: "Transactional", Icon: PackageCheck,
    desc: "Order updates, OTPs, delivery alerts — sent to a specific customer about their own activity." },
  { id: "promotional", label: "Promotional", Icon: Megaphone,
    desc: "Marketing blasts, offers, and sale alerts — sent to customers who've opted in to promotions." },
];

export const MOCK_SMS_TEMPLATES = [
  {
    id: "sms_001",
    name: "product",
    approvedTemplateId: "1707177711975941111",
    category: "promotional",
    body: "Hey! Hurry, %event:productview:item% almost sold out! At Studd Muffyn, use FINAL20 & abhi buy karo: %event:productview:url%",
    variables: ["$1", "$2"],
    status: "Approved",
    lastUpdated: "2025-05-10",
  },
  {
    id: "sms_002",
    name: "cart_recovery_v1",
    approvedTemplateId: "1707177711975940001",
    category: "promotional",
    body: "Hi {{$1}}, you left items in your cart! Complete your order now and get 10% off with code SAVE10: {{$2}}",
    variables: ["$1", "$2"],
    status: "Approved",
    lastUpdated: "2025-04-28",
  },
  {
    id: "sms_003",
    name: "order_shipped",
    approvedTemplateId: "1707177711975940002",
    category: "transactional",
    body: "Your order #{{$1}} has been shipped! Track it here: {{$2}}. Expected delivery: {{$3}}",
    variables: ["$1", "$2", "$3"],
    status: "Approved",
    lastUpdated: "2025-05-02",
  },
  {
    id: "sms_004",
    name: "flash_sale_alert",
    approvedTemplateId: "1707177711975940003",
    category: "promotional",
    body: "FLASH SALE! Up to 50% off on all products at Studd Muffyn for the next 2 hours only. Shop now: {{$1}}",
    variables: ["$1"],
    status: "Approved",
    lastUpdated: "2025-05-08",
  },
  {
    id: "sms_005",
    name: "otp_verification",
    approvedTemplateId: "1707177711975940004",
    category: "transactional",
    body: "Your OTP for verification is {{$1}}. Valid for 10 minutes. Do not share this with anyone.",
    variables: ["$1"],
    status: "Approved",
    lastUpdated: "2025-04-15",
  },
];

function makeStyleConfig(category) {
  return {
    defaultDraft: { name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} },
    mockTemplates: MOCK_SMS_TEMPLATES.filter((t) => t.category === category),
    isValid: (draft) => Boolean(draft.name) && Boolean(draft.body),
  };
}

export const SMS_TEMPLATE_STYLE_CONFIGS = {
  transactional: makeStyleConfig("transactional"),
  promotional: makeStyleConfig("promotional"),
};

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",   example: "Priya"             },
    { key: "customer.lastName",  label: "Last Name",    example: "Sharma"            },
    { key: "customer.name",      label: "Full Name",    example: "Priya Sharma"      },
    { key: "customer.phone",     label: "Phone",        example: "+91 98765 43210"   },
    { key: "customer.email",     label: "Email",        example: "priya@example.com" },
    { key: "customer.id",        label: "Customer ID",  example: "CUST_4821"         },
  ],
  Order: [
    { key: "order.id",           label: "Order ID",       example: "#ORD-7842"                    },
    { key: "order.amount",       label: "Order Amount",   example: "₹1,299"                       },
    { key: "order.items",        label: "Items",          example: "Rosemary Water, Hair Oil"     },
    { key: "order.trackingUrl",  label: "Tracking URL",   example: "https://track.example.com/"  },
    { key: "order.deliveryDate", label: "Delivery Date",  example: "June 3, 2026"                },
    { key: "order.status",       label: "Order Status",   example: "Shipped"                     },
  ],
  Product: [
    { key: "product.name",  label: "Product Name", example: "Rosemary Water"              },
    { key: "product.price", label: "Price",        example: "₹399"                        },
    { key: "product.url",   label: "Product URL",  example: "https://store.com/rosemary"  },
  ],
  Store: [
    { key: "store.name", label: "Store Name", example: "Avimee Herbal"  },
    { key: "store.url",  label: "Store URL",  example: "https://avimee.com" },
  ],
};

export const SMS_DELIVERY_OPTIONS = [
  { id: "next_step", label: "Next Step",       isDefault: true  },
  { id: "sent",      label: "Sent",            isDefault: false },
  { id: "delivered", label: "Delivered",       isDefault: false },
  { id: "failed",    label: "Failed",          isDefault: false },
];

export const defaultSMSNodeData = {
  label: "Send SMS",
  providerId: null,
  senderIdId: null,
  templateStyle: null,
  template: null,
  variableMap: {},
  outputConfig: {
    routingMode:      "next_step",
    deliveryOutputs:  [],
    wiredPorts:       [],
  },
  utm: { enabled: false, source: "sms", medium: "journey", campaign: "" },
  aiBestTime:  false,
  smartRetry:  { enabled: false, mode: "smart" },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test mockData.test.js --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/data/mockData.js src/components/flows/builder/nodes/SMSNode/data/__tests__/mockData.test.js
git commit -m "feat(sms): split provider/sender-id from template category in SMS data model"
```

---

## Task 2: SMS analytics data (Sent/Delivered/Failed)

**Files:**
- Create: `src/components/flows/builder/nodes/SMSNode/data/mockSMSAnalytics.js`
- Test: `src/components/flows/builder/nodes/SMSNode/data/__tests__/mockSMSAnalytics.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `getSMSTemplateAnalytics(template) -> {sent, delivered, deliveredPct, failed, failedPct}` (deterministic per template id), `SMS_ANALYTICS_METRICS` (`{label, value: (data) => string}[]`, 3 entries: Sent, Delivered, Failed) — consumed by Task 4 (`UnifiedTemplateModal`'s `analyticsMetrics`/`getAnalytics` props) and Task 7 (`SMSRightPanel.jsx`).

- [ ] **Step 1: Write the failing test**

```js
// src/components/flows/builder/nodes/SMSNode/data/__tests__/mockSMSAnalytics.test.js
import { getSMSTemplateAnalytics, SMS_ANALYTICS_METRICS } from "../mockSMSAnalytics";

describe("getSMSTemplateAnalytics", () => {
  it("is deterministic for the same template id", () => {
    const a = getSMSTemplateAnalytics({ id: "sms_003" });
    const b = getSMSTemplateAnalytics({ id: "sms_003" });
    expect(a).toEqual(b);
  });

  it("returns sent/delivered/failed counts that add up sensibly", () => {
    const data = getSMSTemplateAnalytics({ id: "sms_003" });
    expect(data.sent).toBeGreaterThan(0);
    expect(data.delivered + data.failed).toBe(data.sent);
    expect(data.deliveredPct).toBeGreaterThanOrEqual(0);
    expect(data.deliveredPct).toBeLessThanOrEqual(100);
  });

  it("varies output by template id", () => {
    const a = getSMSTemplateAnalytics({ id: "sms_001" });
    const b = getSMSTemplateAnalytics({ id: "sms_002" });
    expect(a.sent).not.toBe(b.sent);
  });
});

describe("SMS_ANALYTICS_METRICS", () => {
  it("has exactly Sent, Delivered, Failed rows, no Read/CTR", () => {
    expect(SMS_ANALYTICS_METRICS.map((m) => m.label)).toEqual(["Sent", "Delivered", "Failed"]);
  });

  it("each metric formats a value from analytics data", () => {
    const data = getSMSTemplateAnalytics({ id: "sms_003" });
    SMS_ANALYTICS_METRICS.forEach((m) => {
      expect(typeof m.value(data)).toBe("string");
      expect(m.value(data).length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test mockSMSAnalytics.test.js --watchAll=false`
Expected: FAIL — cannot find module `../mockSMSAnalytics`.

- [ ] **Step 3: Create `mockSMSAnalytics.js`**

```js
// src/components/flows/builder/nodes/SMSNode/data/mockSMSAnalytics.js
// Deterministic mock analytics per template — seeded by template id/name so the
// same template always shows the same numbers (not random-per-render).

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSMSTemplateAnalytics(template) {
  const rand = mulberry32(hashString(template?.id || template?.name || "template"));

  const sent = Math.round(500 + rand() * 3000);
  const deliveredPct = Math.round(88 + rand() * 10); // 88–98%
  const delivered = Math.round((sent * deliveredPct) / 100);
  const failed = sent - delivered;
  const failedPct = Math.round((failed / sent) * 100);

  return { sent, delivered, deliveredPct, failed, failedPct };
}

export const SMS_ANALYTICS_METRICS = [
  { label: "Sent", value: (d) => String(d.sent) },
  { label: "Delivered", value: (d) => `${d.delivered} · ${d.deliveredPct}%` },
  { label: "Failed", value: (d) => `${d.failed} · ${d.failedPct}%` },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test mockSMSAnalytics.test.js --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/data/mockSMSAnalytics.js src/components/flows/builder/nodes/SMSNode/data/__tests__/mockSMSAnalytics.test.js
git commit -m "feat(sms): add deterministic Sent/Delivered/Failed mock analytics"
```

---

## Task 3: Generalize `TemplateAnalyticsPopover` with optional `getAnalytics`/`metrics` props

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/TemplateAnalyticsPopover.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateAnalyticsPopover.test.jsx`

**Interfaces:**
- Consumes: `SMS_ANALYTICS_METRICS`/`getSMSTemplateAnalytics` from Task 2 (used only in the test to prove the generalization works for a non-WhatsApp shape; wired into the real SMS flow in Task 4/7).
- Produces: `TemplateAnalyticsPopover({ anchorRect, template, showMetaInsights, onClose, getAnalytics = getTemplateAnalytics, metrics = DEFAULT_METRICS })` — the two new props are optional and additive.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateAnalyticsPopover.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import TemplateAnalyticsPopover from "../TemplateAnalyticsPopover";

const ANCHOR_RECT = { left: 100, top: 100, right: 200, bottom: 150, width: 100, height: 50 };

describe("TemplateAnalyticsPopover", () => {
  it("shows the default WhatsApp metrics (Sent/Delivered/Read/CTR) when no overrides are passed", () => {
    render(<TemplateAnalyticsPopover anchorRect={ANCHOR_RECT} template={{ id: "wa_1" }} onClose={() => {}} />);
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("CTR")).toBeInTheDocument();
  });

  it("renders a custom metrics list and getAnalytics function when provided", () => {
    const getAnalytics = () => ({ sent: 42, delivered: 40, deliveredPct: 95, failed: 2, failedPct: 5 });
    const metrics = [
      { label: "Sent", value: (d) => String(d.sent) },
      { label: "Delivered", value: (d) => `${d.delivered} · ${d.deliveredPct}%` },
      { label: "Failed", value: (d) => `${d.failed} · ${d.failedPct}%` },
    ];
    render(
      <TemplateAnalyticsPopover
        anchorRect={ANCHOR_RECT}
        template={{ id: "sms_1" }}
        onClose={() => {}}
        getAnalytics={getAnalytics}
        metrics={metrics}
      />
    );
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.queryByText("Read")).not.toBeInTheDocument();
    expect(screen.queryByText("CTR")).not.toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test TemplateAnalyticsPopover.test.jsx --watchAll=false`
Expected: FAIL on the second test — `getAnalytics`/`metrics` props are ignored today, so "Read"/"CTR" still render and "42" doesn't appear as sent count (real random data is shown instead).

- [ ] **Step 3: Add the optional props**

In `TemplateAnalyticsPopover.jsx`, add a default metrics list right before the component definition, and thread the two new props through:

```jsx
const DEFAULT_METRICS = [
  { label: "Sent", value: (d) => fmt(d.sent) },
  { label: "Delivered", value: (d) => `${fmt(d.delivered)} · ${d.deliveredPct}%` },
  { label: "Read", value: (d) => `${fmt(d.read)} · ${d.readPct}%` },
  { label: "CTR", value: (d) => `${fmt(d.clicks)} · ${d.ctrPct}%` },
];

export default function TemplateAnalyticsPopover({
  anchorRect, template, showMetaInsights, onClose,
  getAnalytics = getTemplateAnalytics,
  metrics = DEFAULT_METRICS,
}) {
```

Replace the hardcoded metrics block:

```jsx
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <MetricRow label="Sent" value={fmt(data.sent)} />
        <MetricRow label="Delivered" value={`${fmt(data.delivered)} · ${data.deliveredPct}%`} />
        <MetricRow label="Read" value={`${fmt(data.read)} · ${data.readPct}%`} />
        <MetricRow label="CTR" value={`${fmt(data.clicks)} · ${data.ctrPct}%`} />
      </div>
```

with:

```jsx
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {metrics.map((m) => <MetricRow key={m.label} label={m.label} value={m.value(data)} />)}
      </div>
```

And replace the `const data = getTemplateAnalytics(template);` line with:

```jsx
  const data = getAnalytics(template);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test TemplateAnalyticsPopover.test.jsx --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/TemplateAnalyticsPopover.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateAnalyticsPopover.test.jsx
git commit -m "refactor(whatsapp): generalize TemplateAnalyticsPopover with optional getAnalytics/metrics props"
```

---

## Task 4: Generalize `UnifiedTemplateModal` with optional theming/config/custom-form props

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.generalization.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks directly (this task only proves the generic mechanism with an inline fake config/form — Task 7 wires the real SMS values in).
- Produces: `UnifiedTemplateModal` accepts these new optional props, all defaulting to current WhatsApp behavior: `configRegistry` (default `TEMPLATE_STYLE_CONFIGS`), `accentColor` (default `null`), `PreviewComponent` (default `WhatsAppBubblePreview`), `metaInsightsStyleIds` (default `["standard"]`), `getAnalytics`, `analyticsMetrics`, `customFormRenderer` (`({draft, patch}) => ReactNode`, checked after `config.fields`, before the carousel/list/collect_input hardcoded branches). `config.isValid(draft) -> boolean` is now respected to disable the Save button when present (optional field, absent configs behave as always-valid, matching today).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.generalization.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnifiedTemplateModal from "../UnifiedTemplateModal";

const noop = () => {};

const FAKE_REGISTRY = {
  fake_style: {
    defaultDraft: { name: "", body: "" },
    mockTemplates: [{ id: "fake_1", name: "Fake Template", body: "Fake body" }],
    isValid: (draft) => Boolean(draft.name),
  },
};

function FakePreview({ draft }) {
  return <div data-testid="fake-preview">{draft.body}</div>;
}

describe("UnifiedTemplateModal generalization", () => {
  it("uses a custom configRegistry instead of the WhatsApp TEMPLATE_STYLE_CONFIGS", () => {
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        onSave={noop}
        onClose={noop}
      />
    );
    expect(screen.getByText("Fake Template")).toBeInTheDocument();
  });

  it("renders customFormRenderer instead of the generic field form, and PreviewComponent instead of WhatsAppBubblePreview", () => {
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        PreviewComponent={FakePreview}
        customFormRenderer={({ draft, patch }) => (
          <input
            placeholder="fake name field"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        )}
        onSave={noop}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByPlaceholderText("fake name field")).toBeInTheDocument();
    expect(screen.getByTestId("fake-preview")).toBeInTheDocument();
  });

  it("disables Save until config.isValid passes, and calls onSave with the draft once valid", () => {
    const onSave = jest.fn();
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        customFormRenderer={({ draft, patch }) => (
          <input
            placeholder="fake name field"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        )}
        onSave={onSave}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("fake name field"), { target: { value: "Named" } });
    expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Named" }));
  });

  it("still resolves styleId through the default TEMPLATE_STYLE_CONFIGS when configRegistry is omitted (WhatsApp path unchanged)", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    expect(screen.getByText("TRUST_NOTE_J")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test UnifiedTemplateModal.generalization.test.jsx --watchAll=false`
Expected: FAIL — `configRegistry`, `PreviewComponent`, `customFormRenderer`, and `isValid`-gated Save are all ignored today (component hardcodes `TEMPLATE_STYLE_CONFIGS`/`WhatsAppBubblePreview`, has no custom-form branch, and Save is never disabled).

- [ ] **Step 3: Generalize `UnifiedTemplateModal.jsx`**

Change the function signature:

```jsx
export default function UnifiedTemplateModal({
  open, styleId, styleLabel, presetInputType, initialTemplate, customTemplates = [], onSave, onClose,
  configRegistry = TEMPLATE_STYLE_CONFIGS,
  accentColor = null,
  PreviewComponent = WhatsAppBubblePreview,
  metaInsightsStyleIds = ["standard"],
  getAnalytics,
  analyticsMetrics,
  customFormRenderer,
}) {
  const config = configRegistry[styleId];
  const greenAccent = accentColor || WA_GREEN;
  const purpleAccent = accentColor || PRIMARY;
```

(`WA_GREEN` and `PRIMARY` stay as the existing module-level constant and import — this is additive, not a rename.)

Update the "browse" branch to pass the new props through to `BrowseView`:

```jsx
        {mode === "browse" ? (
          <div style={{ width: "100%" }}>
            <BrowseView
              styleId={styleId}
              styleLabel={styleLabel}
              templates={allTemplates}
              onQuickSelect={handleSave}
              onEdit={openExisting}
              onCreateNew={openBlankDraft}
              onClose={onClose}
              accentColor={accentColor}
              showMetaInsights={metaInsightsStyleIds.includes(styleId)}
              getAnalytics={getAnalytics}
              analyticsMetrics={analyticsMetrics}
            />
          </div>
```

Update the edit-mode branching — replace the existing `config.fields ? (...) : ( ...carousel/list/collect_input... )` block with a three-way branch that inserts `customFormRenderer` between them, computes `canSave`, and uses `PreviewComponent`/`greenAccent`:

```jsx
        ) : config.fields || customFormRenderer ? (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{initialTemplate ? "Edit Template" : `Create ${styleLabel} Template`}</div>
              {config.fields ? (
                <GenericEditForm fields={config.fields} draft={draft} onPatch={patch} />
              ) : (
                customFormRenderer({ draft, patch })
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 9, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={config.isValid ? !config.isValid(draft) : false}
                  style={{ flex: 2, padding: 9, border: "none", borderRadius: 8, background: greenAccent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (config.isValid && !config.isValid(draft)) ? 0.5 : 1 }}
                >Save</button>
              </div>
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <PreviewComponent draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, borderRight: `1px solid ${BORDER}` }}>
              {styleId === "carousel" && <CarouselForm initial={draft.isCarousel ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "list" && <ListMessageForm initial={draft.isListMessage ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "collect_input" && <CollectInputForm initial={draft.isCollectInput ? draft : null} defaultInputType={draft.inputType} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <PreviewComponent draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        )}
```

Now update `BrowseView`, `TemplateCard`, and `HoverActionButton` to accept and use `accentColor` and to forward the analytics props:

```jsx
function HoverActionButton({ icon: Icon, label, onClick, primary, accentColor }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        padding: "6px 4px", border: "none", borderRight: `1px solid rgba(255,255,255,0.15)`,
        background: primary ? (accentColor || WA_GREEN) : "transparent", color: "#fff",
        fontSize: 10, fontWeight: 600, cursor: "pointer",
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function TemplateCard({ template, onQuickSelect, onEdit, onViewAnalytics, accentColor }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  const handleViewAnalytics = () => {
    onViewAnalytics(cardRef.current?.getBoundingClientRect() || null);
  };

  return (
    <div
      ref={cardRef}
      onClick={onQuickSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", border: `1px solid ${hovered ? (accentColor || WA_GREEN) : BORDER}`, borderRadius: 10, padding: 12, cursor: "pointer", background: "#fff", transition: "border-color 0.15s", overflow: "hidden" }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{template.name}</div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {templateSummaryText(template)}
      </p>

      {hovered && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", background: "rgba(15,23,42,0.92)" }}>
          <HoverActionButton icon={Pencil} label="Edit" onClick={onEdit} accentColor={accentColor} />
          <HoverActionButton icon={BarChart3} label="Analytics" onClick={handleViewAnalytics} accentColor={accentColor} />
          <HoverActionButton icon={Check} label="Select" onClick={onQuickSelect} primary accentColor={accentColor} />
        </div>
      )}
    </div>
  );
}

function BrowseView({ styleId, styleLabel, templates, onQuickSelect, onEdit, onCreateNew, onClose, accentColor, showMetaInsights, getAnalytics, analyticsMetrics }) {
  const [search, setSearch] = useState("");
  const [analyticsTarget, setAnalyticsTarget] = useState(null); // { template, anchorRect }
  const filtered = templates.filter((t) => (t.name || "").toLowerCase().includes(search.toLowerCase()) || templateSummaryText(t).toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select a {styleLabel} template</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} style={{ color: "#64748B" }} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="button" onClick={onCreateNew} style={{ padding: "8px 16px", background: accentColor || PRIMARY, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Create new
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No templates found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onQuickSelect={() => onQuickSelect(t)}
                onEdit={() => onEdit(t)}
                onViewAnalytics={(rect) => setAnalyticsTarget({ template: t, anchorRect: rect })}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: MUTED }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</span>
        <button onClick={onClose} style={{ padding: "7px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>Cancel</button>
      </div>

      {analyticsTarget && (
        <TemplateAnalyticsPopover
          anchorRect={analyticsTarget.anchorRect}
          template={analyticsTarget.template}
          showMetaInsights={showMetaInsights}
          getAnalytics={getAnalytics}
          metrics={analyticsMetrics}
          onClose={() => setAnalyticsTarget(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the new test and the existing suite to verify everything passes**

Run: `npx craco test UnifiedTemplateModal --watchAll=false`
Expected: PASS — both `UnifiedTemplateModal.test.jsx` (existing, unmodified) and `UnifiedTemplateModal.generalization.test.jsx` (new) pass. If any existing test fails, the generalization broke a default — stop and fix before proceeding (do not touch the test file).

- [ ] **Step 5: Run the full WhatsApp template test suite for regression**

Run: `npx craco test WhatsAppNode --watchAll=false`
Expected: PASS — `TemplateTabCarousel.test.jsx`, `TemplateTabCollectInput.test.jsx`, `TemplateTabListMessage.test.jsx`, `FallbackTemplateSection.test.jsx`, and all others under `WhatsAppNode/__tests__/` still pass unmodified.

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.generalization.test.jsx
git commit -m "refactor(whatsapp): generalize UnifiedTemplateModal with optional theme/config/custom-form props"
```

---

## Task 5: `SMSBubblePreview` — live preview for the SMS edit form

**Files:**
- Create: `src/components/flows/builder/nodes/SMSNode/SMSBubblePreview.jsx`
- Test: `src/components/flows/builder/nodes/SMSNode/__tests__/SMSBubblePreview.test.jsx`

**Interfaces:**
- Consumes: `SYSTEM_VARIABLES` from `SMSNode/data/mockData.js` (Task 1).
- Produces: `SMSBubblePreview({ draft })` where `draft` is `{ body, variableMap }` — matches the `PreviewComponent` contract `UnifiedTemplateModal` calls with `<PreviewComponent draft={draft} previewKind={config.previewKind} />` (Task 4); `previewKind` is accepted and ignored since SMS has only one preview shape.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/SMSNode/__tests__/SMSBubblePreview.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import SMSBubblePreview from "../SMSBubblePreview";

describe("SMSBubblePreview", () => {
  it("shows a placeholder when the body is empty", () => {
    render(<SMSBubblePreview draft={{ body: "", variableMap: {} }} />);
    expect(screen.getByText(/your message will appear here/i)).toBeInTheDocument();
  });

  it("renders the raw body when it has no variable tokens", () => {
    render(<SMSBubblePreview draft={{ body: "Hello there", variableMap: {} }} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("substitutes a {{$1}} token using variableMap's mapped system-variable example", () => {
    render(
      <SMSBubblePreview
        draft={{ body: "Hi {{$1}}, thanks!", variableMap: { $1: "customer.firstName" } }}
      />
    );
    expect(screen.getByText("Hi Priya, thanks!")).toBeInTheDocument();
  });

  it("leaves an unmapped token as-is", () => {
    render(<SMSBubblePreview draft={{ body: "Code: {{$9}}", variableMap: {} }} />);
    expect(screen.getByText("Code: {{$9}}")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test SMSBubblePreview.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../SMSBubblePreview`.

- [ ] **Step 3: Create `SMSBubblePreview.jsx`**

```jsx
// src/components/flows/builder/nodes/SMSNode/SMSBubblePreview.jsx
import React from "react";
import { SYSTEM_VARIABLES } from "./data/mockData";

const MUTED = "#94A3B8";

const ALL_SYSTEM_VARS = Object.values(SYSTEM_VARIABLES).flat();

function substituteVars(body, variableMap = {}) {
  if (!body) return "";
  return body.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
    const mapped = variableMap[token];
    const key = Array.isArray(mapped) ? mapped.find(Boolean) : mapped;
    const found = key && ALL_SYSTEM_VARS.find((v) => v.key === key);
    return found ? found.example : match;
  });
}

export default function SMSBubblePreview({ draft }) {
  const text = substituteVars(draft?.body, draft?.variableMap);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        SMS Preview
      </div>
      <div style={{ background: "#F1F5F9", borderRadius: 14, padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: "14px 14px 14px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: "10px 12px", fontSize: 13, color: "#0F172A", lineHeight: 1.6 }}>
          {text || <span style={{ color: MUTED, fontStyle: "italic" }}>Your message will appear here…</span>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test SMSBubblePreview.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/SMSBubblePreview.jsx src/components/flows/builder/nodes/SMSNode/__tests__/SMSBubblePreview.test.jsx
git commit -m "feat(sms): add SMSBubblePreview live preview for the template edit form"
```

---

## Task 6: `SMSTemplateForm` — bespoke field form for the modal's `customFormRenderer`

**Files:**
- Create: `src/components/flows/builder/nodes/SMSNode/SMSTemplateForm.jsx`
- Test: `src/components/flows/builder/nodes/SMSNode/__tests__/SMSTemplateForm.test.jsx`

**Interfaces:**
- Consumes: `SYSTEM_VARIABLES` from `SMSNode/data/mockData.js` (Task 1).
- Produces: `SMSTemplateForm({ draft, patch })` — matches the `customFormRenderer({ draft, patch })` contract from Task 4. `draft` shape: `{ name, approvedTemplateId, body, shortenUrl, variableMap }` (no `gateway` field — provider/sender is chosen upstream in Task 7's Step-0 gate). `patch(partial)` merges into the draft, same contract as `UnifiedTemplateModal`'s internal `patch`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/SMSNode/__tests__/SMSTemplateForm.test.jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SMSTemplateForm from "../SMSTemplateForm";

function Wrapper({ initial }) {
  const [draft, setDraft] = useState(initial);
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  return <SMSTemplateForm draft={draft} patch={patch} />;
}

describe("SMSTemplateForm", () => {
  it("has no SMS Gateway field (provider/sender is chosen upstream, not per-template)", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    expect(screen.queryByText(/select sms gateway/i)).not.toBeInTheDocument();
  });

  it("updates the name field via patch", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    fireEvent.change(screen.getByPlaceholderText(/cart_recovery_v1/i), { target: { value: "my_template" } });
    expect(screen.getByDisplayValue("my_template")).toBeInTheDocument();
  });

  it("shows a character/segment count that updates as the body changes", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} }} />);
    fireEvent.change(screen.getByPlaceholderText(/almost done/i), { target: { value: "Hello" } });
    expect(screen.getByText(/Characters: 5\/160/)).toBeInTheDocument();
  });

  it("adds a variable mapping row for each {{$n}} token in the body", () => {
    render(<Wrapper initial={{ name: "", approvedTemplateId: "", body: "Hi {{$1}}", shortenUrl: "", variableMap: {} }} />);
    expect(screen.getByText("{{$1}}")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test SMSTemplateForm.test.jsx --watchAll=false`
Expected: FAIL — cannot find module `../SMSTemplateForm`.

- [ ] **Step 3: Create `SMSTemplateForm.jsx`** (adapted from today's `InlineSMSTemplateForm` in `SMSRightPanel.jsx`, minus the gateway select)

```jsx
// src/components/flows/builder/nodes/SMSNode/SMSTemplateForm.jsx
import React from "react";
import { Sparkles, Link } from "lucide-react";
import { SYSTEM_VARIABLES } from "./data/mockData";

const SMS_PURPLE = "#6366F1";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function extractVars(body) {
  const seen = new Set();
  return [...(body || "").matchAll(/\{\{([^}]+)\}\}/g)]
    .map((m) => m[1])
    .filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

function charCount(text) {
  const len = (text || "").length;
  const msgs = Math.ceil(len / 160) || 1;
  return { len, msgs };
}

export default function SMSTemplateForm({ draft, patch }) {
  const vars = extractVars(draft.body);
  const { len, msgs } = charCount(draft.body);

  const insertVar = () => {
    const next  = vars.length + 1;
    const token = `{{$${next}}}`;
    patch({ body: (draft.body || "") + token });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <div>
        <Label>Template Name</Label>
        <input
          value={draft.name || ""}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. cart_recovery_v1"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div>
        <Label>Approved Template ID</Label>
        <input
          value={draft.approvedTemplateId || ""}
          onChange={(e) => patch({ approvedTemplateId: e.target.value })}
          placeholder="e.g. 1707177711975941111"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Text Message</Label>
          <button
            type="button"
            onClick={insertVar}
            style={{ fontSize: 10, color: SMS_PURPLE, fontWeight: 600, background: "none", border: `1px solid ${SMS_PURPLE}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
          >
            + Add Variables
          </button>
        </div>
        <textarea
          value={draft.body || ""}
          onChange={(e) => patch({ body: e.target.value })}
          placeholder="Hey {{$1}}, your order is almost done…"
          rows={5}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>
            Characters: {len}/160 (No. of SMS to be sent: {msgs})
          </span>
        </div>
      </div>

      {vars.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Variable Mapping</Label>
            <span style={{ fontSize: 10, color: MUTED }}>First non-empty value is used</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vars.map((v) => {
              const rawVal  = (draft.variableMap || {})[v];
              const chain   = Array.isArray(rawVal) ? rawVal : rawVal ? [rawVal] : [""];
              const updateChain = (newChain) =>
                patch({ variableMap: { ...(draft.variableMap || {}), [v]: newChain } });

              return (
                <div key={v} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: SMS_PURPLE }}>{`{{${v}}}`}</span>
                    <span style={{ fontSize: 10, color: MUTED }}>OR chain</span>
                  </div>
                  {chain.map((entry, idx) => (
                    <div key={idx}>
                      {idx > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, padding: "1px 6px", borderRadius: 10, background: "#F1F5F9", letterSpacing: 1 }}>OR</span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <select
                          value={entry || ""}
                          onChange={(e) => { const c = [...chain]; c[idx] = e.target.value; updateChain(c); }}
                          style={{ flex: 1, padding: "7px 8px", fontSize: 12, border: "none", background: "transparent", outline: "none", cursor: "pointer", minWidth: 0 }}
                        >
                          <option value="">Select attribute…</option>
                          {Object.entries(SYSTEM_VARIABLES).map(([group, svars]) => (
                            <optgroup key={group} label={group}>
                              {svars.map((sv) => <option key={sv.key} value={sv.key}>{sv.label} · {sv.example}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {chain.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateChain(chain.filter((_, j) => j !== idx))}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "4px 8px", fontSize: 13, lineHeight: 1 }}
                          >×</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button
                      type="button"
                      onClick={() => updateChain([...chain, ""])}
                      style={{ width: "100%", padding: "6px 10px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: SMS_PURPLE, fontWeight: 600, textAlign: "left" }}
                    >+ Add fallback</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <Label>Shorten URL</Label>
          <Link size={11} color={MUTED} style={{ marginTop: -6 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={draft.shortenUrl || ""}
            onChange={(e) => patch({ shortenUrl: e.target.value })}
            placeholder="Example https://app-engage.shiprocket.in"
            style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", color: "#64748B" }}
          />
          <button
            type="button"
            onClick={() => alert("Shorten URL — coming soon")}
            style={{ padding: "7px 12px", fontSize: 12, fontWeight: 500, background: "#F1F5F9", color: "#64748B", border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Shorten URL
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert("AI Enhance: generates Friendly / Persuasive / Urgent tone variants — coming soon")}
        style={{ width: "100%", padding: "9px", border: `1px solid ${SMS_PURPLE}`, borderRadius: 8, background: "#EEF2FF", color: SMS_PURPLE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <Sparkles size={13} />
        AI Enhance — Generate tone variants
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test SMSTemplateForm.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/SMSTemplateForm.jsx src/components/flows/builder/nodes/SMSNode/__tests__/SMSTemplateForm.test.jsx
git commit -m "feat(sms): add SMSTemplateForm for the modal's customFormRenderer slot"
```

---

## Task 7: `SMSRightPanel` — Step-0 gate, Template Style cards, modal wiring

**Files:**
- Modify: `src/components/flows/builder/nodes/SMSNode/SMSRightPanel.jsx`
- Test: `src/components/flows/builder/nodes/SMSNode/__tests__/SMSRightPanel.test.jsx`

**Interfaces:**
- Consumes: `SMS_PROVIDERS`, `SMS_SENDER_IDS`, `SMS_TEMPLATE_STYLES`, `SMS_TEMPLATE_STYLE_CONFIGS` (Task 1); `getSMSTemplateAnalytics`, `SMS_ANALYTICS_METRICS` (Task 2); `UnifiedTemplateModal` with its generalized props (Task 4); `SMSBubblePreview` (Task 5); `SMSTemplateForm` (Task 6).
- Produces: `TemplateTab` — same external contract as today (`{ data, patch }`), so `SMSRightPanel`'s `DeliveryTab`/`OutputTab`/main export need no changes.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/SMSNode/__tests__/SMSRightPanel.test.jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SMSRightPanel from "../SMSRightPanel";
import { defaultSMSNodeData } from "../data/mockData";

function makeNode(dataOverrides = {}) {
  return { id: "n1", data: { ...defaultSMSNodeData, ...dataOverrides } };
}

describe("SMSRightPanel — Template tab Step 0 gate", () => {
  it("shows Provider first, with no Sender ID or Template Style until a provider is chosen", () => {
    render(<SMSRightPanel node={makeNode()} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.queryByText("Sender ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Choose Template Style")).not.toBeInTheDocument();
  });

  it("shows Sender ID scoped to the chosen provider, with inactive sender IDs disabled", () => {
    const updateNodeData = jest.fn();
    render(<SMSRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByRole("combobox", { name: "" }), { target: { value: "trustsignal" } });
    // re-render with providerId set, as the real panel would after patch()
    render(<SMSRightPanel node={makeNode({ providerId: "trustsignal" })} updateNodeData={updateNodeData} removeNode={() => {}} />);
    expect(screen.getAllByText("Sender ID")[0]).toBeInTheDocument();
    const kaleyraSenderOption = screen.queryByText(/STUDDM/);
    expect(kaleyraSenderOption).not.toBeInTheDocument(); // kaleyra's sender, not trustsignal's
  });

  it("shows the Template Style cards (Transactional/Promotional) with always-visible descriptions once provider+sender are chosen", () => {
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind" })}
        updateNodeData={() => {}}
        removeNode={() => {}}
      />
    );
    expect(screen.getByText("Choose Template Style")).toBeInTheDocument();
    expect(screen.getByText("Transactional")).toBeInTheDocument();
    expect(screen.getByText("Promotional")).toBeInTheDocument();
    expect(screen.getByText(/order updates, otps, delivery alerts/i)).toBeInTheDocument();
  });

  it("opens the template modal filtered to the chosen style once a style card is clicked", () => {
    const updateNodeData = jest.fn();
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind" })}
        updateNodeData={updateNodeData}
        removeNode={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Transactional"));
    expect(updateNodeData).toHaveBeenCalledWith("n1", { templateStyle: "transactional" });
  });

  it("shows the selected template's browse-modal card and lets the seller change provider/sender after a style is chosen", () => {
    render(
      <SMSRightPanel
        node={makeNode({ providerId: "trustsignal", senderIdId: "trustsignal_txtind", templateStyle: "transactional" })}
        updateNodeData={() => {}}
        removeNode={() => {}}
      />
    );
    expect(screen.getByText("Transactional")).toBeInTheDocument(); // style chip
    expect(screen.getAllByText("Provider").length).toBeGreaterThan(0); // still-editable summary select
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test SMSRightPanel.test.jsx --watchAll=false`
Expected: FAIL — today's `TemplateTab` has no Provider/Sender ID/Template Style step at all.

- [ ] **Step 3: Rewrite `TemplateTab` (and its supporting `SMSStyleCard`/`SMSTemplateStylePicker`) in `SMSRightPanel.jsx`**

Replace the imports at the top of the file:

```jsx
import React, { useState } from "react";
import { MessageSquare, Sparkles, Link } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  SMS_PROVIDERS, SMS_SENDER_IDS, SMS_TEMPLATE_STYLES, SMS_TEMPLATE_STYLE_CONFIGS,
  SMS_DELIVERY_OPTIONS, defaultSMSNodeData,
} from "./data/mockData";
import { getSMSTemplateAnalytics, SMS_ANALYTICS_METRICS } from "./data/mockSMSAnalytics";
import UnifiedTemplateModal from "../WhatsAppNode/UnifiedTemplateModal";
import SMSTemplateForm from "./SMSTemplateForm";
import SMSBubblePreview from "./SMSBubblePreview";
```

(Drop `Sparkles`/`Link` if no longer referenced elsewhere in this file after the inline form is removed — check with a final read-through in Step 3's last pass. `useFlowBuilderStore` stays since `DeliveryTab`/`OutputTab` are untouched and the import may already be otherwise-unused; keep it only if still referenced, otherwise remove it too — verify with `grep -n "useFlowBuilderStore" SMSRightPanel.jsx` before finishing this step.)

Delete these three now-unused functions entirely: `extractVars`, `charCount`, `SMSTemplatePicker`, `InlineSMSTemplateForm` (all moved into `SMSTemplateForm.jsx` in Task 6, minus the gateway field).

Add the new style-card components (local to this file — its always-visible-description, 2-card, non-grouped layout differs enough from WhatsApp's tooltip-driven `StyleCard` that generalizing it isn't worth it for 2 items):

```jsx
function SMSStyleCard({ style, onSelect }) {
  const Icon = style.Icon;
  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 14,
        border: `1.5px solid ${BORDER}`, borderRadius: 12, cursor: "pointer", background: "#fff",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.background = "#EEF2FF"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "#fff"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color="#4338CA" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{style.label}</div>
      </div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{style.desc}</p>
    </div>
  );
}

function SMSTemplateStylePicker({ onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Choose Template Style</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, marginBottom: 12 }}>Select the type of SMS you want to send</div>
      <div style={{ display: "flex", gap: 10 }}>
        {SMS_TEMPLATE_STYLES.map((style) => (
          <SMSStyleCard key={style.id} style={style} onSelect={() => onSelect(style)} />
        ))}
      </div>
    </div>
  );
}
```

Replace the entire `TemplateTab` function with:

```jsx
function TemplateTab({ data, patch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [customTemplatesByStyle, setCustomTemplatesByStyle] = useState({});

  const { providerId, senderIdId, templateStyle, template } = data;
  const styleInfo = SMS_TEMPLATE_STYLES.find((s) => s.id === templateStyle);
  const senderOptions = SMS_SENDER_IDS.filter((s) => s.providerId === providerId);

  if (!providerId || !senderIdId || !templateStyle) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label>Provider</Label>
          <select
            value={providerId || ""}
            onChange={(e) => patch({ providerId: e.target.value, senderIdId: null })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select a provider</option>
            {SMS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {providerId && (
          <div>
            <Label>Sender ID</Label>
            <select
              value={senderIdId || ""}
              onChange={(e) => patch({ senderIdId: e.target.value })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              <option value="" disabled>Select a sender ID</option>
              {senderOptions.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "inactive"}>
                  {s.senderId}{s.status === "inactive" ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {senderIdId && (
          <SMSTemplateStylePicker onSelect={(style) => patch({ templateStyle: style.id })} />
        )}
      </div>
    );
  }

  const handleModalSave = (tpl) => {
    const { variableMap, ...templateFields } = tpl;
    const withId = templateFields.id
      ? templateFields
      : { ...templateFields, id: `sms_new_${Date.now()}`, category: templateStyle, status: "Draft" };
    setCustomTemplatesByStyle((prev) => {
      const existing = prev[templateStyle] || [];
      const already = existing.find((t) => t.id === withId.id);
      return { ...prev, [templateStyle]: already ? existing.map((t) => (t.id === withId.id ? withId : t)) : [...existing, withId] };
    });
    patch({ template: withId, variableMap: variableMap || {} });
    setModalOpen(false);
  };

  return (
    <>
      {modalOpen && (
        <UnifiedTemplateModal
          open
          styleId={templateStyle}
          styleLabel={styleInfo?.label || "Template"}
          customTemplates={customTemplatesByStyle[templateStyle] || []}
          configRegistry={SMS_TEMPLATE_STYLE_CONFIGS}
          accentColor={SMS_PURPLE}
          PreviewComponent={SMSBubblePreview}
          metaInsightsStyleIds={[]}
          getAnalytics={getSMSTemplateAnalytics}
          analyticsMetrics={SMS_ANALYTICS_METRICS}
          customFormRenderer={({ draft, patch: patchDraft }) => <SMSTemplateForm draft={draft} patch={patchDraft} />}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {styleInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#EEF2FF", borderRadius: 20, border: "1px solid #C7D2FE", alignSelf: "flex-start" }}>
            <styleInfo.Icon size={13} color="#4338CA" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4338CA" }}>{styleInfo.label}</span>
            <span style={{ fontSize: 11, color: MUTED }}>·</span>
            <span
              onClick={() => patch({ templateStyle: null, template: null })}
              style={{ fontSize: 11, color: SMS_PURPLE, cursor: "pointer", fontWeight: 500 }}
            >Change</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label>Provider</Label>
            <select
              value={providerId}
              onChange={(e) => patch({ providerId: e.target.value, senderIdId: null })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              {SMS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Sender ID</Label>
            <select
              value={senderIdId}
              onChange={(e) => patch({ senderIdId: e.target.value })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              {senderOptions.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "inactive"}>
                  {s.senderId}{s.status === "inactive" ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Template</Label>
            {template && (
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setModalOpen(true)} style={{ fontSize: 11, color: SMS_PURPLE, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                <button type="button" onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
              </div>
            )}
          </div>

          {!template ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{ width: "100%", padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.color = SMS_PURPLE; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Select or create a template
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", background: "#F8FAFC" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{template.name}</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {template.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

Finally, delete any leftover unused imports/helpers by grepping the file:

```bash
grep -n "useFlowBuilderStore\|MOCK_SMS_TEMPLATES\|Sparkles\|Link\b" src/components/flows/builder/nodes/SMSNode/SMSRightPanel.jsx
```

Remove any import that no longer has a matching usage in the file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test SMSRightPanel.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/SMSRightPanel.jsx src/components/flows/builder/nodes/SMSNode/__tests__/SMSRightPanel.test.jsx
git commit -m "feat(sms): add Provider/Sender ID/Template Style Step-0 gate, wire up standardized modal"
```

---

## Task 8: Fix `SMSNode/index.jsx`'s canvas chip — sender ID instead of removed gateway field

**Files:**
- Modify: `src/components/flows/builder/nodes/SMSNode/index.jsx`
- Test: `src/components/flows/builder/nodes/SMSNode/__tests__/SMSNode.test.jsx`

**Interfaces:**
- Consumes: `SMS_SENDER_IDS` from Task 1 (replaces the now-deleted `SMS_GATEWAYS`).
- Produces: no external API change — this is an internal rendering fix so the canvas card doesn't crash/no-op after Task 1 removes `SMS_GATEWAYS/gateway`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/SMSNode/__tests__/SMSNode.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import SMSNode from "../index";

jest.mock("../shared/NodeHoverActions", () => () => null, { virtual: true });
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null, { virtual: true });

function renderNode(data) {
  return render(
    <ReactFlowProvider>
      <SMSNode id="n1" data={data} selected={false} />
    </ReactFlowProvider>
  );
}

describe("SMSNode canvas card", () => {
  it("shows the sender ID chip (not a crash) when a node has a senderIdId and a template", () => {
    renderNode({
      label: "Send SMS",
      senderIdId: "trustsignal_txtind",
      template: { name: "order_shipped", status: "Approved", body: "Your order shipped" },
    });
    expect(screen.getByText("TXTIND")).toBeInTheDocument();
  });

  it("renders the empty state with no chip when there's no template yet", () => {
    renderNode({ label: "Send SMS", senderIdId: null, template: null });
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test SMSNode.test.jsx --watchAll=false`
Expected: FAIL — `index.jsx` still imports `SMS_GATEWAYS` (removed in Task 1), so the module fails to import `SMS_GATEWAYS` (undefined) and `.find` on it throws, or the chip renders nothing/wrong text.

- [ ] **Step 3: Fix the import and chip lookup**

Change line 5:

```jsx
import { SMS_DELIVERY_OPTIONS, SMS_GATEWAYS } from "./data/mockData";
```
to:
```jsx
import { SMS_DELIVERY_OPTIONS, SMS_SENDER_IDS } from "./data/mockData";
```

Change line 86:

```jsx
  const gateway     = SMS_GATEWAYS.find((g) => g.id === template?.gateway);
```
to:
```jsx
  const senderId    = SMS_SENDER_IDS.find((s) => s.id === data?.senderIdId);
```

Change the chip render block:

```jsx
            {gateway && (
              <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {gateway.label.split(" - ")[0]}
              </span>
            )}
```
to:
```jsx
            {senderId && (
              <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {senderId.senderId}
              </span>
            )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test SMSNode.test.jsx --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/SMSNode/index.jsx src/components/flows/builder/nodes/SMSNode/__tests__/SMSNode.test.jsx
git commit -m "fix(sms): render sender-ID chip on canvas card instead of removed gateway field"
```

---

## Task 9: Full regression pass and manual verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npx craco test --watchAll=false`
Expected: PASS — every test file in the repo, including all pre-existing `WhatsAppNode/__tests__/*`, `CampaignContentPanel.test.jsx`, and every new/modified file from Tasks 1–8.

- [ ] **Step 2: Start the dev server and manually verify the SMS node**

Run: `npm start` (or the project's existing dev-server command), open a flow with an SMS node.

Verify, in order:
1. Provider → Sender ID → Template Style sequencing gates correctly; picking Kaleyra's provider only offers Kaleyra's sender IDs, and the inactive one (`STUDDM`) is disabled/greyed.
2. Picking "Transactional" opens the modal showing only `order_shipped` and `otp_verification` (the two `category: "transactional"` mock templates).
3. Hovering a template card shows Edit / Analytics / Select; Analytics opens a popover with exactly Sent/Delivered/Failed (no Read/CTR/benchmarks); Edit opens the form pre-filled; Select quick-saves and closes.
4. "+ Create new" opens a blank form (no gateway field) with a live `SMSBubblePreview` on the right that updates as you type, and Save is disabled until both Name and Text Message are filled.
5. After saving, the SMS canvas node shows the sender-ID chip and the template body preview.
6. Clicking "Change" on the style chip resets to Step 0 without losing the Provider/Sender ID selections.
7. Open a WhatsApp node's template picker in the same flow and confirm it looks and behaves exactly as it did before this change (green accents, 4-column style groups, hover tooltip descriptions, Sent/Delivered/Read/CTR analytics, Meta insights section on "standard" style) — this is the regression check on the generalized `UnifiedTemplateModal`/`TemplateAnalyticsPopover`.

- [ ] **Step 3: Report results**

If all checks pass, the feature is complete. If step 2.7 reveals any WhatsApp regression, stop and fix the relevant optional-prop default in `UnifiedTemplateModal.jsx`/`TemplateAnalyticsPopover.jsx` (Tasks 3–4) before considering this done — do not patch around it in the SMS files.
