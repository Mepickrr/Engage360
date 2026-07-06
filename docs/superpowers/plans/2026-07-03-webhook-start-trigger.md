# Webhook Start Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a seller configure a "Webhook trigger" (already listed in the event catalogue but currently non-functional) through a dedicated single-page Step 1 — webhook URL, auth toggle, sample payload paste with client-side variable extraction, a mock "Send Test Event" button, Unique ID mapping, and optional existing-variable mapping — then continue into the existing "Who will enter the flow" Step 2 unchanged, and see the result summarized on the canvas node.

**Architecture:** Pure-logic helpers (`webhookHelpers.js`) are built and tested first, then a new controlled form component (`WebhookTriggerStep1.jsx`) consumes them, then `StartTriggerWizard.jsx` is wired to branch into that form at its existing `"step1"` stage (mirroring how `isDateRelative` already branches), then `triggerNodeUtils.js` gains a `summariseWebhook` branch, then `StartTriggerNode.jsx` renders it. No existing event/broadcast/date-relative code path changes.

**Tech Stack:** React 19, Tailwind CSS, Jest + React Testing Library (`craco test`), lucide-react icons.

## Global Constraints

- Frontend-only mock: no real network calls. `webhookUrl` is generated client-side; "Send Test Event" re-parses the already-pasted sample payload — it does not hit a real endpoint.
- `config.kind === "webhook"` is the sole discriminator for a webhook trigger config, parallel to `"broadcast"`, `"broadcast_source"`, `"date_relative"`.
- Only "Webhook trigger" gets this treatment. "API trigger" is untouched and keeps falling through to `Step1WhenContent`.
- `Step2WhoContent` (audience qualification) is reused unchanged for webhook triggers — do not fork or modify it.
- `uniqueId.type` / `secondaryId.type` come from a single-entry list `["Phone Number"]` — implement as a real `<select>`, not hardcoded text.
- `payloadVariables` is **not** kept as duplicated live state during editing — it's derived from `samplePayload` via `flattenPayload()` on every render, and only snapshotted into the final saved config at `handleFinish`.
- All new interactive elements get a `data-testid` following the existing `kebab-case` convention in this codebase (e.g. `trigger-wizard-next`).
- Match existing Tailwind conventions from `Step1WhenContent.jsx` / `StartTriggerWizard.jsx`: `text-sm`/`text-[12px]` sizing, `rounded-md border border-border bg-surface`, `focus:outline-none focus:border-primary/60`, primary color via `text-primary`/`border-primary/40`.

---

### Task 1: `webhookHelpers.js` — pure logic

**Files:**
- Create: `src/components/flows/builder/trigger/webhookHelpers.js`
- Test: `src/components/flows/builder/trigger/__tests__/webhookHelpers.test.js`

**Interfaces:**
- Produces: `emptyWebhookConfig(flowSlug?: string)`, `generateWebhookUrl(seed: string, flowSlug?: string)`, `flattenPayload(jsonString: string) → { variables: {path, example}[], error: string|null }`, `simulateTestEvent(samplePayload: string, uniqueId: {type,payloadVariable}|null) → { success: boolean, variableCount: number, resolvedIdValue: string|null, error: string|null }`, `MOCK_EXISTING_VARIABLES` (array of `{ category, groups: [{ label, items: [{key, label}] }] }`).

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/__tests__/webhookHelpers.test.js`:

```js
import {
  emptyWebhookConfig,
  generateWebhookUrl,
  flattenPayload,
  simulateTestEvent,
  MOCK_EXISTING_VARIABLES,
} from "../webhookHelpers";

describe("generateWebhookUrl", () => {
  it("builds a URL containing the seed and flow slug", () => {
    const url = generateWebhookUrl("abc123", "my-flow");
    expect(url).toBe("https://bikapi.bikayi.app/chatbot/webhook/abc123?flow=my-flow");
  });

  it("defaults the flow slug when omitted", () => {
    const url = generateWebhookUrl("abc123");
    expect(url).toContain("flow=flow");
  });
});

describe("emptyWebhookConfig", () => {
  it("returns the zero-state shape with a generated URL", () => {
    const cfg = emptyWebhookConfig();
    expect(cfg.webhookUrl).toMatch(/^https:\/\/bikapi\.bikayi\.app\/chatbot\/webhook\//);
    expect(cfg.authProtected).toBe(false);
    expect(cfg.authConfig).toBeNull();
    expect(cfg.samplePayload).toBe("");
    expect(cfg.uniqueId).toBeNull();
    expect(cfg.secondaryId).toBeNull();
    expect(cfg.variableMappings).toEqual([]);
  });

  it("generates a different URL seed on each call", () => {
    const a = emptyWebhookConfig();
    const b = emptyWebhookConfig();
    expect(a.webhookUrl).not.toBe(b.webhookUrl);
  });
});

describe("flattenPayload", () => {
  it("returns an empty list with no error for an empty string", () => {
    expect(flattenPayload("")).toEqual({ variables: [], error: null });
  });

  it("flattens a flat object into top-level paths", () => {
    const { variables, error } = flattenPayload('{"bikExampleId": 143671, "bikExampleEmail": "abc@bik.ai"}');
    expect(error).toBeNull();
    expect(variables).toEqual([
      { path: "bikExampleId", example: "143671" },
      { path: "bikExampleEmail", example: "abc@bik.ai" },
    ]);
  });

  it("flattens nested objects into dot-paths", () => {
    const { variables, error } = flattenPayload('{"order": {"customer": {"email": "abc@bik.ai"}}}');
    expect(error).toBeNull();
    expect(variables).toEqual([{ path: "order.customer.email", example: "abc@bik.ai" }]);
  });

  it("flattens only the first element of an array, under the array's own path", () => {
    const { variables, error } = flattenPayload('{"items": [{"sku": "A1"}, {"sku": "A2"}]}');
    expect(error).toBeNull();
    expect(variables).toEqual([{ path: "items.sku", example: "A1" }]);
  });

  it("returns an error for invalid JSON without throwing", () => {
    const { variables, error } = flattenPayload("{not json");
    expect(variables).toEqual([]);
    expect(error).not.toBeNull();
  });

  it("returns an error when the top-level payload is not an object", () => {
    const { variables, error } = flattenPayload("5");
    expect(variables).toEqual([]);
    expect(error).not.toBeNull();
  });
});

describe("simulateTestEvent", () => {
  const payload = '{"vas_id": "+919999999999", "order_id": 555}';

  it("succeeds and resolves the unique id value when it matches a payload path", () => {
    const result = simulateTestEvent(payload, { type: "Phone Number", payloadVariable: "vas_id" });
    expect(result.success).toBe(true);
    expect(result.variableCount).toBe(2);
    expect(result.resolvedIdValue).toBe("+919999999999");
    expect(result.error).toBeNull();
  });

  it("succeeds with no resolved id when uniqueId is not yet set", () => {
    const result = simulateTestEvent(payload, null);
    expect(result.success).toBe(true);
    expect(result.resolvedIdValue).toBeNull();
  });

  it("fails on invalid JSON", () => {
    const result = simulateTestEvent("{broken", null);
    expect(result.success).toBe(false);
    expect(result.variableCount).toBe(0);
    expect(result.error).not.toBeNull();
  });
});

describe("MOCK_EXISTING_VARIABLES", () => {
  it("has the four expected categories", () => {
    const categories = MOCK_EXISTING_VARIABLES.map((c) => c.category);
    expect(categories).toEqual([
      "Customer variables",
      "Flow variables",
      "Store variables",
      "Global variables",
    ]);
  });

  it("every item has a unique key across the whole catalogue", () => {
    const keys = MOCK_EXISTING_VARIABLES.flatMap((c) => c.groups.flatMap((g) => g.items.map((i) => i.key)));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/webhookHelpers.test.js --watchAll=false`
Expected: FAIL — `Cannot find module '../webhookHelpers'`

- [ ] **Step 3: Implement `webhookHelpers.js`**

Create `src/components/flows/builder/trigger/webhookHelpers.js`:

```js
// webhookHelpers.js
// Pure, framework-free helpers for the Webhook Start Trigger. No React
// dependencies — independently testable.

export function generateWebhookUrl(seed, flowSlug = "flow") {
  return `https://bikapi.bikayi.app/chatbot/webhook/${seed}?flow=${flowSlug}`;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 12);
}

export function emptyWebhookConfig(flowSlug = "flow") {
  return {
    webhookUrl: generateWebhookUrl(randomSeed(), flowSlug),
    authProtected: false,
    authConfig: null,
    samplePayload: "",
    uniqueId: null,
    secondaryId: null,
    variableMappings: [],
  };
}

// Flattens a JSON sample payload into dot-path variables. Arrays only walk
// their first element (kept under the array's own path) so the variable
// list stays finite regardless of payload size.
export function flattenPayload(jsonString) {
  if (!jsonString || !jsonString.trim()) {
    return { variables: [], error: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { variables: [], error: `Invalid JSON: ${e.message}` };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { variables: [], error: "Sample payload must be a JSON object" };
  }

  const variables = [];
  function walk(node, prefix) {
    if (Array.isArray(node)) {
      if (node.length > 0) walk(node[0], prefix);
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const key of Object.keys(node)) {
        walk(node[key], prefix ? `${prefix}.${key}` : key);
      }
      return;
    }
    if (prefix) variables.push({ path: prefix, example: String(node) });
  }
  walk(parsed, "");
  return { variables, error: null };
}

export function simulateTestEvent(samplePayload, uniqueId) {
  const { variables, error } = flattenPayload(samplePayload);
  if (error) {
    return { success: false, variableCount: 0, resolvedIdValue: null, error };
  }
  if (variables.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedIdValue: null,
      error: "No variables found in payload",
    };
  }
  let resolvedIdValue = null;
  if (uniqueId?.payloadVariable) {
    const match = variables.find((v) => v.path === uniqueId.payloadVariable);
    resolvedIdValue = match ? match.example : null;
  }
  return { success: true, variableCount: variables.length, resolvedIdValue, error: null };
}

export const MOCK_EXISTING_VARIABLES = [
  {
    category: "Customer variables",
    groups: [
      {
        label: "Basic",
        items: [
          { key: "customer.phone", label: "Phone" },
          { key: "customer.email", label: "Email" },
          { key: "customer.first_name", label: "First Name" },
          { key: "customer.last_name", label: "Last Name" },
        ],
      },
      {
        label: "Custom Fields",
        items: [
          { key: "customer.loyalty_tier", label: "Loyalty Tier" },
          { key: "customer.referral_code", label: "Referral Code" },
        ],
      },
    ],
  },
  {
    category: "Flow variables",
    groups: [
      {
        label: "Flow",
        items: [
          { key: "flow.entry_source", label: "Entry Source" },
          { key: "flow.session_id", label: "Session ID" },
        ],
      },
    ],
  },
  {
    category: "Store variables",
    groups: [
      {
        label: "Store",
        items: [
          { key: "store.name", label: "Store Name" },
          { key: "store.currency", label: "Store Currency" },
        ],
      },
    ],
  },
  {
    category: "Global variables",
    groups: [
      {
        label: "Global",
        items: [
          { key: "global.support_email", label: "Support Email" },
          { key: "global.support_phone", label: "Support Phone" },
        ],
      },
    ],
  },
];
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/webhookHelpers.test.js --watchAll=false`
Expected: PASS, all 13 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/webhookHelpers.js src/components/flows/builder/trigger/__tests__/webhookHelpers.test.js
git commit -m "feat: add webhook trigger pure helpers (URL gen, payload flattening, test-event simulation)"
```

---

### Task 2: `WebhookTriggerStep1.jsx` — the single-page form

**Files:**
- Create: `src/components/flows/builder/trigger/WebhookTriggerStep1.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/WebhookTriggerStep1.test.jsx`

**Interfaces:**
- Consumes: `flattenPayload`, `simulateTestEvent`, `MOCK_EXISTING_VARIABLES` from `./webhookHelpers` (Task 1).
- Produces: `WebhookTriggerStep1({ config, setConfig })` (default export) — a fully controlled component. `isWebhookStep1Valid(config)` (named export) — `true` once `samplePayload` parses without error and `uniqueId.type` + `uniqueId.payloadVariable` are both set. Both are consumed by Task 3.
- `config` shape (matches `emptyWebhookConfig()` from Task 1): `{ webhookUrl, authProtected, authConfig, samplePayload, uniqueId, secondaryId, variableMappings }`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/__tests__/WebhookTriggerStep1.test.jsx`:

```jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WebhookTriggerStep1, { isWebhookStep1Valid } from "../WebhookTriggerStep1";
import { emptyWebhookConfig } from "../webhookHelpers";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial || emptyWebhookConfig());
  return <WebhookTriggerStep1 config={config} setConfig={setConfig} />;
}

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

describe("WebhookTriggerStep1", () => {
  it("renders the generated webhook URL", () => {
    const cfg = emptyWebhookConfig();
    render(<Harness initial={cfg} />);
    expect(screen.getByTestId("webhook-url-input")).toHaveValue(cfg.webhookUrl);
  });

  it("copies the URL to the clipboard when Copy is clicked", () => {
    const cfg = emptyWebhookConfig();
    render(<Harness initial={cfg} />);
    fireEvent.click(screen.getByTestId("webhook-url-copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(cfg.webhookUrl);
  });

  it("reveals header/token fields when the auth checkbox is checked", () => {
    render(<Harness />);
    expect(screen.queryByTestId("webhook-auth-header")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("webhook-auth-checkbox"));
    expect(screen.getByTestId("webhook-auth-header")).toBeInTheDocument();
    expect(screen.getByTestId("webhook-auth-token")).toBeInTheDocument();
  });

  it("extracts and displays variables from a valid pasted payload", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    const list = screen.getByTestId("webhook-payload-variables");
    expect(list).toHaveTextContent("{{vas_id}}");
    expect(list).toHaveTextContent("{{order_id}}");
  });

  it("shows a parse error for invalid JSON instead of a variable list", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: "{not valid" },
    });
    expect(screen.getByTestId("webhook-payload-error")).toBeInTheDocument();
    expect(screen.queryByTestId("webhook-payload-variables")).not.toBeInTheDocument();
  });

  it("shows a success panel with variable count when Send Test Event is clicked", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    fireEvent.click(screen.getByTestId("webhook-test-event-btn"));
    expect(screen.getByTestId("webhook-test-result")).toHaveTextContent("2 variable(s) detected");
  });

  it("shows the resolved unique id value in the test result once a unique id is mapped", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999", "order_id": 555}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    fireEvent.click(screen.getByTestId("webhook-test-event-btn"));
    expect(screen.getByTestId("webhook-test-result")).toHaveTextContent("+919999999999");
  });

  it("reveals and can remove a secondary ID row", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.click(screen.getByTestId("webhook-add-secondary-id"));
    expect(screen.getByTestId("webhook-secondary-id-type")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("webhook-remove-secondary-id"));
    expect(screen.queryByTestId("webhook-secondary-id-type")).not.toBeInTheDocument();
  });

  it("adds a variable mapping row and maps it to an existing variable", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.click(screen.getByTestId("webhook-add-var-mapping"));
    const existingSelect = screen.getByTestId("webhook-var-mapping-existing-0");
    fireEvent.change(existingSelect, { target: { value: "customer.phone" } });
    expect(existingSelect).toHaveValue("customer.phone");
  });
});

describe("isWebhookStep1Valid", () => {
  it("is false with no payload or unique id", () => {
    expect(isWebhookStep1Valid(emptyWebhookConfig())).toBe(false);
  });

  it("is false with a valid payload but no unique id set", () => {
    const cfg = { ...emptyWebhookConfig(), samplePayload: '{"a": 1}' };
    expect(isWebhookStep1Valid(cfg)).toBe(false);
  });

  it("is true once payload parses and both unique id fields are set", () => {
    const cfg = {
      ...emptyWebhookConfig(),
      samplePayload: '{"vas_id": "1"}',
      uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    };
    expect(isWebhookStep1Valid(cfg)).toBe(true);
  });

  it("is false when the payload fails to parse even if unique id is set", () => {
    const cfg = {
      ...emptyWebhookConfig(),
      samplePayload: "{broken",
      uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    };
    expect(isWebhookStep1Valid(cfg)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/WebhookTriggerStep1.test.jsx --watchAll=false`
Expected: FAIL — `Cannot find module '../WebhookTriggerStep1'`

- [ ] **Step 3: Implement `WebhookTriggerStep1.jsx`**

Create `src/components/flows/builder/trigger/WebhookTriggerStep1.jsx`:

```jsx
import React, { useState } from "react";
import { Plus, Copy, Check, X } from "lucide-react";
import { flattenPayload, simulateTestEvent, MOCK_EXISTING_VARIABLES } from "./webhookHelpers";

const ID_TYPES = ["Phone Number"];

export function isWebhookStep1Valid(config) {
  const { error } = flattenPayload(config?.samplePayload);
  return !error && !!config?.samplePayload && !!config?.uniqueId?.type && !!config?.uniqueId?.payloadVariable;
}

function findExistingVariable(key) {
  for (const cat of MOCK_EXISTING_VARIABLES) {
    for (const grp of cat.groups) {
      const item = grp.items.find((i) => i.key === key);
      if (item) return { category: cat.category, group: grp.label, key: item.key, label: item.label };
    }
  }
  return null;
}

export default function WebhookTriggerStep1({ config, setConfig }) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const update = (patch) => setConfig({ ...config, ...patch });

  const { variables: payloadVariables, error: parseError } = flattenPayload(config.samplePayload);

  const handleCopy = () => {
    navigator.clipboard?.writeText(config.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePayloadChange = (value) => {
    setTestResult(null);
    update({ samplePayload: value });
  };

  const handleTestEvent = () => {
    setTestResult(simulateTestEvent(config.samplePayload, config.uniqueId));
  };

  const toggleAuth = (checked) => {
    update({
      authProtected: checked,
      authConfig: checked ? config.authConfig || { headerName: "", token: "" } : null,
    });
  };

  const updateUniqueId = (patch) =>
    update({ uniqueId: { type: "Phone Number", payloadVariable: "", ...(config.uniqueId || {}), ...patch } });
  const updateSecondaryId = (patch) =>
    update({ secondaryId: { type: "Phone Number", payloadVariable: "", ...(config.secondaryId || {}), ...patch } });

  const addVariableMappingRow = () => {
    update({
      variableMappings: [
        ...(config.variableMappings || []),
        { payloadVariable: payloadVariables[0]?.path || "", existingVariable: null },
      ],
    });
  };
  const updateVariableMappingRow = (idx, patch) =>
    update({ variableMappings: config.variableMappings.map((m, i) => (i === idx ? { ...m, ...patch } : m)) });
  const removeVariableMappingRow = (idx) =>
    update({ variableMappings: config.variableMappings.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6" data-testid="webhook-step1">
      {/* Webhook URL */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Webhook URL</div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={config.webhookUrl}
            data-testid="webhook-url-input"
            className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-slate-50 text-text-secondary"
          />
          <button
            type="button"
            onClick={handleCopy}
            data-testid="webhook-url-copy"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Auth */}
      <div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={config.authProtected}
            onChange={(e) => toggleAuth(e.target.checked)}
            data-testid="webhook-auth-checkbox"
            className="w-3.5 h-3.5 accent-primary rounded"
          />
          Protect the Webhook with an authentication token
        </label>
        {config.authProtected && (
          <div className="mt-2 ml-5 flex items-center gap-2">
            <input
              placeholder="Header name"
              value={config.authConfig?.headerName || ""}
              onChange={(e) => update({ authConfig: { ...config.authConfig, headerName: e.target.value } })}
              data-testid="webhook-auth-header"
              className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-40 focus:outline-none focus:border-primary/60"
            />
            <input
              placeholder="Token value"
              value={config.authConfig?.token || ""}
              onChange={(e) => update({ authConfig: { ...config.authConfig, token: e.target.value } })}
              data-testid="webhook-auth-token"
              className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-48 focus:outline-none focus:border-primary/60"
            />
          </div>
        )}
      </div>

      {/* Sample payload */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Paste Sample Payload</div>
        <textarea
          rows={6}
          value={config.samplePayload}
          onChange={(e) => handlePayloadChange(e.target.value)}
          placeholder='{"order_id": 12345, "customer": {"phone": "+919999999999"}}'
          data-testid="webhook-sample-payload"
          className="w-full px-3 py-2 text-sm font-mono rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        {parseError && (
          <div className="mt-1 text-xs text-rose-600" data-testid="webhook-payload-error">
            {parseError}
          </div>
        )}
        {!parseError && payloadVariables.length > 0 && (
          <div
            className="mt-2 border border-border rounded-md divide-y divide-border"
            data-testid="webhook-payload-variables"
          >
            {payloadVariables.map((v) => (
              <div key={v.path} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className="font-mono text-primary">{`{{${v.path}}}`}</span>
                <span className="text-text-muted">{v.example}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test event */}
      <div>
        <button
          type="button"
          onClick={handleTestEvent}
          disabled={!config.samplePayload || !!parseError}
          data-testid="webhook-test-event-btn"
          className="px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Test Event
        </button>
        {testResult && (
          <div
            data-testid="webhook-test-result"
            className={`mt-2 px-3 py-2 rounded-md text-sm border ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {testResult.success
              ? `Test event received — ${testResult.variableCount} variable(s) detected${
                  testResult.resolvedIdValue ? ` · Unique ID resolved to ${testResult.resolvedIdValue}` : ""
                }`
              : testResult.error}
          </div>
        )}
      </div>

      {/* Unique ID */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Enter Unique ID</div>
        <div className="flex items-center gap-3">
          <select
            value={config.uniqueId?.type || ""}
            onChange={(e) => updateUniqueId({ type: e.target.value })}
            data-testid="webhook-unique-id-type"
            className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
          >
            <option value="">Select an option</option>
            {ID_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={config.uniqueId?.payloadVariable || ""}
            onChange={(e) => updateUniqueId({ payloadVariable: e.target.value })}
            disabled={payloadVariables.length === 0}
            data-testid="webhook-unique-id-var"
            className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60 disabled:opacity-40"
          >
            <option value="">Payload Variable</option>
            {payloadVariables.map((v) => (
              <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
            ))}
          </select>
        </div>

        {!config.secondaryId ? (
          <button
            type="button"
            onClick={() => update({ secondaryId: { type: "Phone Number", payloadVariable: "" } })}
            data-testid="webhook-add-secondary-id"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
          >
            <Plus className="w-3.5 h-3.5" />
            Secondary ID (optional)
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <select
              value={config.secondaryId?.type || ""}
              onChange={(e) => updateSecondaryId({ type: e.target.value })}
              data-testid="webhook-secondary-id-type"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              <option value="">Select an option</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={config.secondaryId?.payloadVariable || ""}
              onChange={(e) => updateSecondaryId({ payloadVariable: e.target.value })}
              data-testid="webhook-secondary-id-var"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              <option value="">Payload Variable</option>
              {payloadVariables.map((v) => (
                <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => update({ secondaryId: null })}
              data-testid="webhook-remove-secondary-id"
              className="p-1 text-text-muted hover:text-rose-600 rounded-md"
              aria-label="Remove secondary ID"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Variable mapping */}
      {payloadVariables.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-text-primary mb-1">
            Map Payload Variables to Existing Variables (Optional)
          </div>
          <div className="space-y-2">
            {(config.variableMappings || []).map((m, idx) => (
              <div key={idx} className="flex items-center gap-2" data-testid={`webhook-var-mapping-row-${idx}`}>
                <select
                  value={m.payloadVariable}
                  onChange={(e) => updateVariableMappingRow(idx, { payloadVariable: e.target.value })}
                  data-testid={`webhook-var-mapping-payload-${idx}`}
                  className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                >
                  {payloadVariables.map((v) => (
                    <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
                  ))}
                </select>
                <span className="text-text-muted">→</span>
                <select
                  value={m.existingVariable?.key || ""}
                  onChange={(e) => updateVariableMappingRow(idx, { existingVariable: findExistingVariable(e.target.value) })}
                  data-testid={`webhook-var-mapping-existing-${idx}`}
                  className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                >
                  <option value="">Select existing variable…</option>
                  {MOCK_EXISTING_VARIABLES.map((cat) => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.groups.map((grp) =>
                        grp.items.map((item) => (
                          <option key={item.key} value={item.key}>{`${grp.label} — ${item.label}`}</option>
                        )),
                      )}
                    </optgroup>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeVariableMappingRow(idx)}
                  data-testid={`webhook-var-mapping-remove-${idx}`}
                  className="p-1 text-text-muted hover:text-rose-600 rounded-md"
                  aria-label="Remove mapping"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariableMappingRow}
            data-testid="webhook-add-var-mapping"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/WebhookTriggerStep1.test.jsx --watchAll=false`
Expected: PASS, all 13 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/WebhookTriggerStep1.jsx src/components/flows/builder/trigger/__tests__/WebhookTriggerStep1.test.jsx
git commit -m "feat: add WebhookTriggerStep1 form (URL, auth, payload, test event, unique id, variable mapping)"
```

---

### Task 3: Wire `WebhookTriggerStep1` into `StartTriggerWizard.jsx`

**Files:**
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx`

**Interfaces:**
- Consumes: `WebhookTriggerStep1`, `isWebhookStep1Valid` from `./WebhookTriggerStep1` (Task 2); `emptyWebhookConfig`, `flattenPayload` from `./webhookHelpers` (Task 1).
- Produces: on Finish, a config with `{ kind: "webhook", webhookUrl, authProtected, authConfig, samplePayload, payloadVariables, uniqueId, secondaryId, variableMappings, audience }` — consumed by Task 4's `summariseWebhook`.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

function pickWebhookTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Webhook trigger"));
}

describe("StartTriggerWizard — Webhook trigger", () => {
  it("routes to WebhookTriggerStep1 instead of Step1WhenContent when picked", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("webhook-step1")).toBeInTheDocument();
  });

  it("disables Next until the webhook config is valid, then enables it", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("trigger-wizard-next")).toBeDisabled();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    expect(screen.getByTestId("trigger-wizard-next")).not.toBeDisabled();
  });

  it("advances to the shared Who-enters-the-flow step and finishes with a kind: webhook config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickWebhookTrigger();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    fireEvent.click(screen.getByTestId("trigger-wizard-next"));

    expect(screen.getByTestId("audience-type-block")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "webhook",
        uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
        payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx --watchAll=false`
Expected: FAIL — `webhook-step1` testid never appears (still routes to `Step1WhenContent`).

- [ ] **Step 3: Wire `StartTriggerWizard.jsx`**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, add imports after the existing `triggerHelpers` import (currently line 12):

```js
import WebhookTriggerStep1, { isWebhookStep1Valid } from "./WebhookTriggerStep1";
import { emptyWebhookConfig, flattenPayload } from "./webhookHelpers";
```

Add state after the existing `dateConfig` state (currently line 79):

```js
  const [isWebhook, setIsWebhook] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState(emptyWebhookConfig());
```

Replace the hydration `useEffect` (currently lines 85–127) with:

```js
  useEffect(() => {
    if (!open) return;
    if (initialConfig) {
      const ev = findEvent(initialConfig.triggerGroups?.[0]?.event);
      setTriggerGroups(initialConfig.triggerGroups || []);
      setGroupsCombinator(initialConfig.groupsCombinator || "AND");
      setExitTrigger(initialConfig.exitTrigger || null);
      setAudience(initialConfig.audience || emptyAudience());
      setBroadcast(initialConfig.broadcast || emptyBroadcast());
      if (initialConfig?.kind === "webhook") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setWebhookConfig({
          webhookUrl: initialConfig.webhookUrl,
          authProtected: initialConfig.authProtected || false,
          authConfig: initialConfig.authConfig || null,
          samplePayload: initialConfig.samplePayload || "",
          uniqueId: initialConfig.uniqueId || null,
          secondaryId: initialConfig.secondaryId || null,
          variableMappings: initialConfig.variableMappings || [],
        });
        setStage("step1");
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
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
    setCount(null);
  }, [open, initialConfig]);
```

In `onPickEvent` (currently lines 141–181), change the primary-pick branch (`if (pickingForGroupIdx == null) { ... }`) to:

```js
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      setTriggerGroups([emptyGroup(card.name)]);
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
    } else {
      const idx = pickingForGroupIdx;
      setTriggerGroups((prev) => {
        const next = [...prev];
        if (idx < next.length) {
          const patch = { ...next[idx], event: card.name };
          if (!card.advance_evaluate) {
            patch.evaluateTime = undefined;
            patch.evaluate = [];
          }
          next[idx] = patch;
        } else {
          next.push(emptyGroup(card.name));
        }
        return next;
      });
      setPickingForGroupIdx(null);
      setStage("step1");
    }
  };
```

Replace `handleFinish` (currently lines 191–216) with:

```js
  const handleFinish = () => {
    let config;
    if (isWebhook) {
      config = {
        kind: "webhook",
        ...webhookConfig,
        payloadVariables: flattenPayload(webhookConfig.samplePayload).variables,
        audience,
      };
    } else if (isBroadcastSource) {
      config = {
        kind: "broadcast_source",
        sourceType: broadcastSourceType,
        broadcastSourceConfig,
        broadcastSourceSchedule,
        audience,
        triggerGroups,
      };
    } else if (isBroadcast) {
      config = { kind: "broadcast", triggerGroups, broadcast };
    } else if (isDateRelative) {
      config = { kind: "date_relative", dateConfig, audience };
    } else {
      config = {
        kind: "event",
        triggerGroups,
        groupsCombinator,
        exitTrigger,
        audience: skipStep2 ? null : audience,
      };
    }
    onComplete(config);
  };
```

Update the `stepperLabel` computation (currently lines 229–236):

```js
  const sourceStepLabel =
    broadcastSourceType === "csv" ? "Select CSV files" : "Select segments";
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : stage === "broadcast-source-1" || stage === "broadcast-source-2"
      ? `1. ${sourceStepLabel} → 2. Schedule & audience`
      : isWebhook
      ? "1. Configure Webhook → 2. Who will enter the flow"
      : "1. When will users enter the flow → 2. Who will enter the flow";
```

Update the step-dot block's `label="When"` (currently around line 261) to swap for webhook:

```jsx
              <StepDot n={1} active={stage === "step1"} done={stage === "step2"} label={isWebhook ? "Configure Webhook" : "When"} />
```

In the stage-1 content block (currently lines 292–311), add the webhook branch before the date-relative branch and guard the other two with `!isWebhook`:

```jsx
            {stage === "step1" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "step1" && isDateRelative && !isWebhook && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isWebhook && (
              <Step1WhenContent
                triggerGroups={triggerGroups}
                setTriggerGroups={setTriggerGroups}
                groupsCombinator={groupsCombinator}
                setGroupsCombinator={setGroupsCombinator}
                exitTrigger={exitTrigger}
                setExitTrigger={setExitTrigger}
                onPickEventForGroup={(idx) => {
                  setPickingForGroupIdx(idx);
                  setStage("picker");
                }}
              />
            )}
```

Update the Step 1 "Next" button (currently around lines 356–367) to gate on webhook validity:

```jsx
              {stage === "step1" && !skipStep2 && (
                <button
                  type="button"
                  onClick={() => setStage("step2")}
                  disabled={isWebhook && !isWebhookStep1Valid(webhookConfig)}
                  data-testid="trigger-wizard-next"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx --watchAll=false`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Run the full trigger test suite to check for regressions**

Run: `CI=true npx craco test src/components/flows/builder/trigger --watchAll=false`
Expected: PASS — no existing test broken.

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx
git commit -m "feat: wire WebhookTriggerStep1 into StartTriggerWizard step1 stage"
```

---

### Task 4: `summariseWebhook` in `triggerNodeUtils.js`

**Files:**
- Modify: `src/components/flows/builder/triggerNodeUtils.js`
- Test: `src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js`

**Interfaces:**
- Consumes: `config.kind === "webhook"` shape produced by Task 3's `handleFinish` — `{ webhookUrl, uniqueId, variableMappings, audience }`.
- Produces: `summariseTriggerConfig(config)` for `kind: "webhook"` returns `{ headerLabel: "Start Trigger", isWebhook: true, isBroadcast: false, webhookUrl, uniqueIdType, uniqueIdVar, mappedVarCount, whoLine, whoExtraCount, frequencyLine, audienceTypePill, audienceTab, audienceConditions, audienceCombinator, noExitCondition: true, exitLine: null, exitExtraCount: 0, exitEvents: [], exitCombinator: "OR" }` — consumed by Task 5's `StartTriggerNode`.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js`:

```js
import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — webhook", () => {
  const baseConfig = {
    kind: "webhook",
    webhookUrl: "https://bikapi.bikayi.app/chatbot/webhook/abc123?flow=test",
    authProtected: false,
    authConfig: null,
    samplePayload: '{"vas_id": "+919999999999"}',
    payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
    uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    secondaryId: null,
    variableMappings: [
      { payloadVariable: "vas_id", existingVariable: { category: "Customer variables", group: "Basic", key: "customer.phone", label: "Phone" } },
    ],
    audience: { include_all: true },
  };

  it("marks the summary as a webhook trigger with URL and unique id fields", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isWebhook).toBe(true);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.webhookUrl).toBe(baseConfig.webhookUrl);
    expect(summary.uniqueIdType).toBe("Phone Number");
    expect(summary.uniqueIdVar).toBe("vas_id");
  });

  it("counts only mapped variable rows that have an existingVariable set", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.mappedVarCount).toBe(1);

    const unmapped = { ...baseConfig, variableMappings: [{ payloadVariable: "vas_id", existingVariable: null }] };
    expect(summariseTriggerConfig(unmapped).mappedVarCount).toBe(0);
  });

  it("has no exit condition and derives audience fields from the shared audience summariser", () => {
    const withAudience = {
      ...baseConfig,
      audience: {
        include_all: false,
        audience_kind: "all",
        include: { blocks: [{ type: "property", conditions: [{ property: "city", operator: "is", value: "Mumbai" }] }] },
      },
    };
    const summary = summariseTriggerConfig(withAudience);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
    expect(summary.whoLine).toContain("city");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js --watchAll=false`
Expected: FAIL — `summary.isWebhook` is `undefined` (falls through to `summariseNewFormat`/`summariseOldFormat` today).

- [ ] **Step 3: Add `summariseWebhook` and wire it in**

In `src/components/flows/builder/triggerNodeUtils.js`, add this function directly above the `// ── legacy format support` comment (after `summariseNewFormat`, currently ending around line 241):

```js
function summariseWebhook(config) {
  const {
    whoLine, whoExtraCount, frequencyLine,
    audienceTypePill, audienceTab, audienceConditions, audienceCombinator,
  } = summariseAudienceNew(config.audience);

  return {
    headerLabel: "Start Trigger",
    isWebhook: true,
    isBroadcast: false,
    webhookUrl: config.webhookUrl,
    uniqueIdType: config.uniqueId?.type || null,
    uniqueIdVar: config.uniqueId?.payloadVariable || null,
    mappedVarCount: (config.variableMappings || []).filter((m) => m.existingVariable).length,
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

Replace the `summariseTriggerConfig` export (currently lines 387–393) with:

```js
export function summariseTriggerConfig(config) {
  if (!config) return null;
  if (config.kind === "webhook") return summariseWebhook(config);
  // Detect new wizard format: triggerGroups have a string `.event` field
  const isNewFormat = config.kind != null ||
    (config.triggerGroups?.[0] != null && typeof config.triggerGroups[0].event === "string");
  return isNewFormat ? summariseNewFormat(config) : summariseOldFormat(config);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js --watchAll=false`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/triggerNodeUtils.js src/components/flows/builder/__tests__/triggerNodeUtils.webhook.test.js
git commit -m "feat: add summariseWebhook branch to triggerNodeUtils"
```

---

### Task 5: `StartTriggerNode.jsx` — canvas rendering

**Files:**
- Modify: `src/components/flows/builder/nodes/StartTriggerNode.jsx`
- Test: `src/components/flows/builder/nodes/__tests__/StartTriggerNode.webhook.test.jsx`

**Interfaces:**
- Consumes: the `summariseWebhook` output shape from Task 4 (`isWebhook`, `webhookUrl`, `uniqueIdType`, `uniqueIdVar`, `mappedVarCount`, plus the shared audience fields).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/__tests__/StartTriggerNode.webhook.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const webhookConfig = {
  kind: "webhook",
  webhookUrl: "https://bikapi.bikayi.app/chatbot/webhook/abcdefghijklmnop?flow=test",
  authProtected: false,
  authConfig: null,
  samplePayload: '{"vas_id": "+919999999999"}',
  payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
  uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
  secondaryId: null,
  variableMappings: [
    { payloadVariable: "vas_id", existingVariable: { category: "Customer variables", group: "Basic", key: "customer.phone", label: "Phone" } },
  ],
  audience: { include_all: true },
};

describe("StartTriggerNode — webhook trigger", () => {
  it("renders the webhook URL and unique id badge instead of the event entry list", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Unique ID: Phone Number/)).toBeInTheDocument();
    expect(screen.getByText(/vas_id/)).toBeInTheDocument();
  });

  it("shows the mapped variable count when at least one mapping exists", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/1 variable mapped/)).toBeInTheDocument();
  });

  it("does not render a mapped-variable line when there are no mappings", () => {
    const noMappings = { ...webhookConfig, variableMappings: [] };
    render(<StartTriggerNode data={{ config: noMappings, onEdit: () => {} }} selected={false} />);
    expect(screen.queryByText(/variable.*mapped/)).not.toBeInTheDocument();
  });

  it("still renders the shared Audience section for a webhook trigger", () => {
    render(<StartTriggerNode data={{ config: webhookConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/nodes/__tests__/StartTriggerNode.webhook.test.jsx --watchAll=false`
Expected: FAIL — the webhook config currently falls through to the normal `triggerGroups` rendering path and no "Unique ID" text appears.

- [ ] **Step 3: Add the webhook rendering branch**

In `src/components/flows/builder/nodes/StartTriggerNode.jsx`, add `Link2` to the lucide-react import list (currently lines 4–11):

```js
import {
  Zap, Radio, ShoppingBag, ShoppingCart, CreditCard, Package,
  Receipt, PackageCheck, Truck, XCircle, RefreshCcw, CornerUpLeft,
  Search, UserPlus, Heart, Star, AlertCircle, Users, UserMinus,
  CheckCircle, LogOut, MessageCircle, Hash, MessageSquare, Mail,
  Cake, Gift, RefreshCw, TrendingDown, Headphones, CheckSquare,
  Pencil, Clock, Link2,
} from "lucide-react";
```

Add a `truncMid` helper and `WebhookEntryBlock` component after the `SectionLabel` component (currently ending around line 71):

```jsx
function truncMid(str, keep = 18) {
  if (!str) return "";
  if (str.length <= keep * 2 + 3) return str;
  return `${str.slice(0, keep)}…${str.slice(-keep)}`;
}

function WebhookEntryBlock({ summary }) {
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(summary.webhookUrl || "");
  };
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Link2 className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
        <span
          className="text-[10px] font-mono text-text-secondary truncate flex-1"
          title={summary.webhookUrl}
        >
          {truncMid(summary.webhookUrl)}
        </span>
        <button
          onClick={handleCopy}
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-text-muted hover:text-primary flex-shrink-0"
        >
          Copy
        </button>
      </div>
      {summary.uniqueIdType && (
        <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
          {`Unique ID: ${summary.uniqueIdType} ({{${summary.uniqueIdVar}}})`}
        </div>
      )}
      {summary.mappedVarCount > 0 && (
        <div className="mt-1 text-[10px] text-text-muted">
          {summary.mappedVarCount} variable{summary.mappedVarCount > 1 ? "s" : ""} mapped
        </div>
      )}
    </div>
  );
}
```

In the main `StartTriggerNode` component, update the Entry section (currently lines 264–297) to branch on `summary.isWebhook` before the `!summary.isBroadcast` branch:

```jsx
      {/* ── Entry ── */}
      <div className="px-3 pt-2.5 pb-2">
        <SectionLabel>Entry</SectionLabel>

        {summary.isWebhook && <WebhookEntryBlock summary={summary} />}

        {!summary.isBroadcast && !summary.isWebhook && (
          <div>
            {summary.triggerGroups.map((group, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <GroupCombinator label={summary.groupCombinator} />}
                <TriggerGroupRow group={group} />
              </React.Fragment>
            ))}
            {summary.extraGroupCount > 0 && (
              <div className="text-[10px] text-text-muted mt-1.5">
                +{summary.extraGroupCount} more trigger group{summary.extraGroupCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {summary.isBroadcast && hasBroadcast && (
          <div className="space-y-1">
            {summary.scheduleLine && (
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
                <span className="text-[11px] font-semibold text-text-primary">{summary.scheduleLine}</span>
              </div>
            )}
            {summary.audienceLine && (
              <div className="text-[10px] text-text-muted">{summary.audienceLine}</div>
            )}
          </div>
        )}
      </div>
```

No changes are needed to the Audience or Exit sections — `summary.noExitCondition: true` (set by Task 4) already suppresses the Exit block via the existing `hasExit` computation, and the Audience section already reads generic `summary.*` fields that `summariseWebhook` populates correctly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/nodes/__tests__/StartTriggerNode.webhook.test.jsx --watchAll=false`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Run the full nodes test suite to check for regressions**

Run: `CI=true npx craco test src/components/flows/builder/nodes --watchAll=false`
Expected: PASS — no existing test broken.

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/StartTriggerNode.jsx src/components/flows/builder/nodes/__tests__/StartTriggerNode.webhook.test.jsx
git commit -m "feat: render webhook trigger summary on StartTriggerNode canvas card"
```

---

### Task 6: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — every existing test plus all new webhook tests green, no snapshot or regression failures anywhere in the app.

- [ ] **Step 2: Manually verify in the running app**

Run: `npm start` (or the project's existing dev-server skill/command if one exists), open a flow in the Flow Builder, click the Start Trigger node, pick "Webhook trigger" from the catalogue, and confirm:
- The URL, auth checkbox, sample payload, and unique-ID sections all appear on one page.
- Pasting `{"vas_id": "+919999999999", "order_id": 555}` shows two extracted variables.
- "Send Test Event" shows a success panel.
- Setting Unique ID → Type "Phone Number", Variable `{{vas_id}}` enables Next.
- Clicking Next shows the existing "Who will enter the flow" step.
- Clicking Finish closes the wizard and the canvas node shows the truncated URL and "Unique ID: Phone Number ({{vas_id}})".
- Re-opening the node returns to the same webhook form with the same values restored.

No commit for this task — it's a verification checkpoint.
