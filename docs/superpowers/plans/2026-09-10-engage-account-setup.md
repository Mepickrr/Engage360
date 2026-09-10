# Engage Account Setup Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-bleed "Engage Account Setup" page (`/engage/account-setup`) reached from the Fastrr Engage CTA: a left column of static setup instructions and a right column with a large, authentic, live-updating WhatsApp Business profile phone mockup.

**Architecture:** A device-chrome-only `PhoneMockup` wraps a stateful `WhatsAppProfilePreview` (owns all form state via plain `useState`, following this codebase's established convention for setup/settings forms). `WhatsAppProfilePreview` composes a `NumberSetupCard` (3-way segmented control for phone-number setup) and a profile-fields list. A static `SetupInstructions` component fills the left column. The page (`EngageAccountSetup.jsx`) composes all of these and is registered as a **sibling** of the app's `AppShell` route (not nested inside it), so no sidebar/topbar renders.

**Tech Stack:** React 18, react-router-dom v7, shadcn/ui primitives (`Input`, `Textarea`, `Select`, `Button`), lucide-react icons, Jest + React Testing Library (via `craco test`).

**Spec:** `docs/superpowers/specs/2026-09-10-engage-account-setup-design.md`

## Global Constraints

- No backend/API calls, no real Meta Embedded Signup call. The logo "upload" is a purely local preview via `URL.createObjectURL` — never sent anywhere.
- The two bottom CTAs ("Start Meta Embedded Signup", "Set Up With AI Instead") are visually complete, real `<Button>`s, but **must not be wired** — `onClick={() => {}} // TODO: wire up once enablement flow is defined`, matching the convention already used across `FastrrEngagePanel.jsx`/`FastrrEngage.jsx`.
- The left column's numbered steps are static instructional copy — no live progress-tracking logic.
- Route `/engage/account-setup` is added as a **sibling** of `<Route element={<AppShell />}>` in `src/App.js` (not a child of it), so the sidebar/topbar do not render on this page. No entry is added to `src/components/layout/Sidebar.jsx`.
- Inside the phone mockup only, WhatsApp-authentic raw colors are used (header `#075E54`) rather than the app's own design tokens — this intentionally mimics a third-party product's real UI, matching the existing precedent in `WhatsAppBubblePreview.jsx`/`WhatsAppRightPanel.jsx`. Everything outside the phone mockup (left column, top bar) uses the existing Engage 360 Tailwind tokens (`bg-primary`, `bg-primary-tint`, `text-text-primary/secondary`, `border-border`, `bg-app-bg`, `bg-surface`) — no new tokens.
- Mock data only: `MOCK_VIRTUAL_NUMBERS` (3–4 entries, all "₹500/mo") and `BUSINESS_CATEGORIES` (`["Shopping & Retail", "Education", "Ecommerce", "Others"]`, default `"Shopping & Retail"`) — exact values given in Task 1 below.
- Any JSX text that a test asserts via `getByText` must be a single template-literal string (not an expression adjacent to literal text as separate children) — this codebase's test suite has hit RTL's default text matcher not concatenating sibling text/expression nodes reliably. Every code sample below already follows this rule.
- Testing Radix `Select` interaction in jsdom requires this exact `beforeAll` polyfill (verified working in this repo's test setup): `window.HTMLElement.prototype.hasPointerCapture = jest.fn(); window.HTMLElement.prototype.releasePointerCapture = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();`

---

### Task 1: `data.js` + `NumberSetupCard`

**Files:**
- Create: `src/components/engage/account-setup/data.js`
- Create: `src/components/engage/account-setup/NumberSetupCard.jsx`
- Test: `src/components/engage/account-setup/__tests__/NumberSetupCard.test.jsx`

**Interfaces:**
- Produces from `data.js`: `MOCK_VIRTUAL_NUMBERS` (array of `{ number: string, priceLabel: string }`), `BUSINESS_CATEGORIES` (array of strings), `DEFAULT_BUSINESS_CATEGORY` (string). Task 3 imports `BUSINESS_CATEGORIES`/`DEFAULT_BUSINESS_CATEGORY` from this same file.
- Produces `NumberSetupCard` (default export), a fully controlled component with props: `mode` (`"has_number" | "needs_virtual_number" | "has_app"`), `onModeChange(mode)`, `numberValue`, `onNumberValueChange(value)`, `virtualNumberValue`, `onVirtualNumberChange(value)`, `appId`, `onAppIdChange(value)`, `apiKeySecret`, `onApiKeySecretChange(value)`. Task 3 renders this with all 10 props supplied from its own state.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/account-setup/__tests__/NumberSetupCard.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NumberSetupCard from "../NumberSetupCard";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderCard(overrides = {}) {
  const props = {
    mode: "has_number",
    onModeChange: jest.fn(),
    numberValue: "",
    onNumberValueChange: jest.fn(),
    virtualNumberValue: "",
    onVirtualNumberChange: jest.fn(),
    appId: "",
    onAppIdChange: jest.fn(),
    apiKeySecret: "",
    onApiKeySecretChange: jest.fn(),
    ...overrides,
  };
  render(<NumberSetupCard {...props} />);
  return props;
}

describe("NumberSetupCard", () => {
  it("defaults to has_number mode and shows only the phone input", () => {
    renderCard();
    expect(screen.getByTestId("number-setup-has-number-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-virtual-number-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-app-fields")).not.toBeInTheDocument();
  });

  it("typing in the phone input calls onNumberValueChange", () => {
    const props = renderCard();
    fireEvent.change(screen.getByTestId("number-setup-phone-input"), { target: { value: "9876543210" } });
    expect(props.onNumberValueChange).toHaveBeenCalledWith("9876543210");
  });

  it("clicking the 'Need a virtual number' toggle button calls onModeChange", () => {
    const props = renderCard();
    fireEvent.click(screen.getByTestId("number-setup-mode-needs_virtual_number"));
    expect(props.onModeChange).toHaveBeenCalledWith("needs_virtual_number");
  });

  it("in needs_virtual_number mode, shows only the virtual-number Select", () => {
    renderCard({ mode: "needs_virtual_number" });
    expect(screen.getByTestId("number-setup-virtual-number-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-app-fields")).not.toBeInTheDocument();
  });

  it("selecting a virtual number calls onVirtualNumberChange with the chosen number", () => {
    const props = renderCard({ mode: "needs_virtual_number" });
    fireEvent.click(screen.getByTestId("number-setup-virtual-number-select"));
    fireEvent.click(screen.getByText("+91 63001 22456 — ₹500/mo"));
    expect(props.onVirtualNumberChange).toHaveBeenCalledWith("+91 63001 22456");
  });

  it("in has_app mode, shows only the App ID and API Key Secret inputs and calls their handlers", () => {
    const props = renderCard({ mode: "has_app" });
    expect(screen.getByTestId("number-setup-has-app-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-virtual-number-fields")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("number-setup-app-id-input"), { target: { value: "app-123" } });
    expect(props.onAppIdChange).toHaveBeenCalledWith("app-123");

    fireEvent.change(screen.getByTestId("number-setup-api-key-input"), { target: { value: "secret-xyz" } });
    expect(props.onApiKeySecretChange).toHaveBeenCalledWith("secret-xyz");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="NumberSetupCard" --watchAll=false`
Expected: FAIL — cannot find module `../NumberSetupCard` (and `../data`).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/account-setup/data.js`:

```js
// Prototype mock data for the Engage Account Setup page.
export const MOCK_VIRTUAL_NUMBERS = [
  { number: "+91 63001 22456", priceLabel: "₹500/mo" },
  { number: "+91 63001 78821", priceLabel: "₹500/mo" },
  { number: "+91 63001 45903", priceLabel: "₹500/mo" },
  { number: "+91 63001 90217", priceLabel: "₹500/mo" },
];

export const BUSINESS_CATEGORIES = ["Shopping & Retail", "Education", "Ecommerce", "Others"];

export const DEFAULT_BUSINESS_CATEGORY = "Shopping & Retail";
```

Create `src/components/engage/account-setup/NumberSetupCard.jsx`:

```jsx
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_VIRTUAL_NUMBERS } from "./data";

const MODES = [
  { value: "has_number", label: "I have a number" },
  { value: "needs_virtual_number", label: "Need a virtual number" },
  { value: "has_app", label: "I have an app" },
];

export default function NumberSetupCard({
  mode,
  onModeChange,
  numberValue,
  onNumberValueChange,
  virtualNumberValue,
  onVirtualNumberChange,
  appId,
  onAppIdChange,
  apiKeySecret,
  onApiKeySecretChange,
}) {
  return (
    <div
      className="bg-primary-tint border border-primary/20 rounded-lg p-3 mb-4"
      data-testid="number-setup-card"
    >
      <h4 className="text-[13px] font-semibold text-text-primary mb-2">
        Connect Your WhatsApp Number
      </h4>

      <div className="grid grid-cols-3 gap-1 mb-3" data-testid="number-setup-mode-toggle">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            data-testid={`number-setup-mode-${m.value}`}
            onClick={() => onModeChange(m.value)}
            className={`text-[10px] font-medium px-2 py-1.5 rounded-md leading-tight transition-colors ${
              mode === m.value
                ? "bg-primary text-white"
                : "bg-white text-text-secondary border border-border"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "has_number" && (
        <div className="flex items-center gap-2" data-testid="number-setup-has-number-fields">
          <span className="text-[13px] text-text-secondary">+91</span>
          <Input
            value={numberValue}
            onChange={(e) => onNumberValueChange(e.target.value)}
            placeholder="98765 43210"
            data-testid="number-setup-phone-input"
            className="bg-white"
          />
        </div>
      )}

      {mode === "needs_virtual_number" && (
        <div data-testid="number-setup-virtual-number-fields">
          <Select value={virtualNumberValue} onValueChange={onVirtualNumberChange}>
            <SelectTrigger data-testid="number-setup-virtual-number-select" className="bg-white">
              <SelectValue placeholder="Choose a virtual number" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_VIRTUAL_NUMBERS.map((vn) => (
                <SelectItem key={vn.number} value={vn.number}>
                  {`${vn.number} — ${vn.priceLabel}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode === "has_app" && (
        <div className="flex flex-col gap-2" data-testid="number-setup-has-app-fields">
          <Input
            value={appId}
            onChange={(e) => onAppIdChange(e.target.value)}
            placeholder="App ID"
            data-testid="number-setup-app-id-input"
            className="bg-white"
          />
          <Input
            type="password"
            value={apiKeySecret}
            onChange={(e) => onApiKeySecretChange(e.target.value)}
            placeholder="API Key Secret"
            data-testid="number-setup-api-key-input"
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="NumberSetupCard" --watchAll=false`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/account-setup/data.js src/components/engage/account-setup/NumberSetupCard.jsx src/components/engage/account-setup/__tests__/NumberSetupCard.test.jsx
git commit -m "feat(engage-account-setup): add mock data and number setup card

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `PhoneMockup`

**Files:**
- Create: `src/components/engage/account-setup/PhoneMockup.jsx`
- Test: `src/components/engage/account-setup/__tests__/PhoneMockup.test.jsx`

**Interfaces:**
- Produces `PhoneMockup` (default export), props: `children` (rendered inside the device screen area). No other consumer coupling — Task 5 renders `<PhoneMockup><WhatsAppProfilePreview /></PhoneMockup>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/account-setup/__tests__/PhoneMockup.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import PhoneMockup from "../PhoneMockup";

describe("PhoneMockup", () => {
  it("renders the device chrome (status bar, notch) and its children inside the screen area", () => {
    render(
      <PhoneMockup>
        <div data-testid="mock-child">Hello</div>
      </PhoneMockup>
    );
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-status-bar")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-notch")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup-screen")).toContainElement(
      screen.getByTestId("mock-child")
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="PhoneMockup" --watchAll=false`
Expected: FAIL — cannot find module `../PhoneMockup`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/account-setup/PhoneMockup.jsx`:

```jsx
import React from "react";

const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 720;

function StatusBar() {
  return (
    <div
      className="relative h-11 flex items-end justify-between px-5 pb-2 bg-white flex-shrink-0"
      data-testid="phone-mockup-status-bar"
    >
      <span className="text-[11px] font-semibold text-slate-900">9:41</span>
      <div
        className="w-[100px] h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1"
        data-testid="phone-mockup-notch"
      />
      <div className="flex items-center gap-1 text-[10px] text-slate-900">
        <span>●●●</span>
        <span>Wi-Fi</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function PhoneMockup({ children }) {
  return (
    <div className="relative" data-testid="phone-mockup">
      <div
        className="absolute inset-0 -m-8 rounded-[3rem] blur-2xl opacity-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)",
        }}
      />
      <div
        className="relative bg-slate-100 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
      >
        <StatusBar />
        <div className="flex-1 overflow-y-auto bg-white" data-testid="phone-mockup-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="PhoneMockup" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/account-setup/PhoneMockup.jsx src/components/engage/account-setup/__tests__/PhoneMockup.test.jsx
git commit -m "feat(engage-account-setup): add phone mockup device chrome

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `WhatsAppProfilePreview`

**Files:**
- Create: `src/components/engage/account-setup/WhatsAppProfilePreview.jsx`
- Test: `src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx`

**Interfaces:**
- Consumes `NumberSetupCard` (Task 1) with the exact 10 props listed in Task 1's Interfaces block.
- Consumes `BUSINESS_CATEGORIES`, `DEFAULT_BUSINESS_CATEGORY` from `./data` (Task 1).
- Produces `WhatsAppProfilePreview` (default export, no props) — Task 5 renders it as the child of `<PhoneMockup>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppProfilePreview from "../WhatsAppProfilePreview";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  global.URL.createObjectURL = jest.fn(() => "blob:mock-preview");
});

describe("WhatsAppProfilePreview", () => {
  it("renders the header and the number setup card", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByText("Business Profile")).toBeInTheDocument();
    expect(screen.getByTestId("number-setup-card")).toBeInTheDocument();
  });

  it("typing the brand name updates the input and the avatar's fallback initial", () => {
    render(<WhatsAppProfilePreview />);
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Avimee");
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("typing into description, website, email, support number, and address updates each field", () => {
    render(<WhatsAppProfilePreview />);
    fireEvent.change(screen.getByTestId("field-description"), { target: { value: "We sell skincare." } });
    expect(screen.getByTestId("field-description")).toHaveValue("We sell skincare.");

    fireEvent.change(screen.getByTestId("field-website"), { target: { value: "https://avimee.com" } });
    expect(screen.getByTestId("field-website")).toHaveValue("https://avimee.com");

    fireEvent.change(screen.getByTestId("field-email"), { target: { value: "hi@avimee.com" } });
    expect(screen.getByTestId("field-email")).toHaveValue("hi@avimee.com");

    fireEvent.change(screen.getByTestId("field-support-number"), { target: { value: "+91 90000 00000" } });
    expect(screen.getByTestId("field-support-number")).toHaveValue("+91 90000 00000");

    fireEvent.change(screen.getByTestId("field-address"), { target: { value: "123 MG Road, Bengaluru" } });
    expect(screen.getByTestId("field-address")).toHaveValue("123 MG Road, Bengaluru");
  });

  it("defaults the business category to 'Shopping & Retail' and can be changed", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("field-category")).toHaveTextContent("Shopping & Retail");
    fireEvent.click(screen.getByTestId("field-category"));
    fireEvent.click(screen.getByText("Education"));
    expect(screen.getByTestId("field-category")).toHaveTextContent("Education");
  });

  it("selecting a logo file updates the avatar preview image", () => {
    render(<WhatsAppProfilePreview />);
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [file] } });
    expect(screen.getByAltText("Brand logo")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("switching the number setup mode reveals only the corresponding fields", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("number-setup-has-number-fields")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("number-setup-mode-has_app"));
    expect(screen.getByTestId("number-setup-has-app-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppProfilePreview" --watchAll=false`
Expected: FAIL — cannot find module `../WhatsAppProfilePreview`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/account-setup/WhatsAppProfilePreview.jsx`:

```jsx
import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NumberSetupCard from "./NumberSetupCard";
import { BUSINESS_CATEGORIES, DEFAULT_BUSINESS_CATEGORY } from "./data";

export default function WhatsAppProfilePreview() {
  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState("");
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");

  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState(DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState("");
  const [supportNumber, setSupportNumber] = useState("");
  const [address, setAddress] = useState("");

  function handleLogoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  }

  return (
    <div data-testid="whatsapp-profile-preview">
      <div
        className="text-white px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: "#075E54" }}
      >
        <span className="text-lg leading-none">‹</span>
        <span className="text-[15px] font-semibold">Business Profile</span>
      </div>

      <div className="p-4">
        <NumberSetupCard
          mode={numberMode}
          onModeChange={setNumberMode}
          numberValue={numberValue}
          onNumberValueChange={setNumberValue}
          virtualNumberValue={virtualNumberValue}
          onVirtualNumberChange={setVirtualNumberValue}
          appId={appId}
          onAppIdChange={setAppId}
          apiKeySecret={apiKeySecret}
          onApiKeySecretChange={setApiKeySecret}
        />

        <div className="flex flex-col items-center mb-4">
          <label
            htmlFor="engage-setup-logo-input"
            className="relative w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center cursor-pointer overflow-hidden"
            data-testid="logo-picker"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Brand logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {brandName ? brandName.charAt(0).toUpperCase() : "?"}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white">
              <Camera className="w-3 h-3 text-white" />
            </span>
          </label>
          <input
            id="engage-setup-logo-input"
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="logo-file-input"
            onChange={handleLogoChange}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Brand Name
            </label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your brand name"
              data-testid="field-brand-name"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Company Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your business do?"
              data-testid="field-description"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Website URL
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstore.com"
              data-testid="field-website"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Business Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="field-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Contact Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@yourstore.com"
              data-testid="field-email"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Support Number
            </label>
            <Input
              value={supportNumber}
              onChange={(e) => setSupportNumber(e.target.value)}
              placeholder="+91 98765 43210"
              data-testid="field-support-number"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              Office Address
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, PIN"
              data-testid="field-address"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppProfilePreview" --watchAll=false`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/account-setup/WhatsAppProfilePreview.jsx src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx
git commit -m "feat(engage-account-setup): add live WhatsApp business profile preview

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `SetupInstructions`

**Files:**
- Create: `src/components/engage/account-setup/SetupInstructions.jsx`
- Test: `src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx`

**Interfaces:**
- Produces `SetupInstructions` (default export, no props) — Task 5 renders it in the left column.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SetupInstructions from "../SetupInstructions";

describe("SetupInstructions", () => {
  it("renders the heading, both tips, all 3 steps, and both CTAs", () => {
    render(<SetupInstructions />);
    expect(screen.getByText("Let's Get Your WhatsApp Business Ready")).toBeInTheDocument();
    expect(screen.getByTestId("setup-tips").children).toHaveLength(2);
    expect(screen.getByTestId("setup-steps").children).toHaveLength(3);
    expect(screen.getByText("Add Your Business Details")).toBeInTheDocument();
    expect(screen.getByText("Start Embedded Signup")).toBeInTheDocument();
    expect(screen.getByText("Verify & Go Live")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-manual")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-ai")).toBeInTheDocument();
  });

  it("both CTAs are clickable without throwing (no-ops by design)", () => {
    render(<SetupInstructions />);
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    fireEvent.click(screen.getByTestId("setup-cta-ai"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SetupInstructions" --watchAll=false`
Expected: FAIL — cannot find module `../SetupInstructions`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/account-setup/SetupInstructions.jsx`:

```jsx
import React from "react";
import { Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPS = [
  {
    icon: Sparkles,
    text: "No WhatsApp number yet? Grab an SR Virtual Number for just ₹500/month — no SIM required, fully WhatsApp-ready from day one.",
  },
  {
    icon: Link2,
    text: "Setting up a new WABA? Register it directly with your new number — we'll walk you through every screen.",
  },
];

const STEPS = [
  {
    title: "Add Your Business Details",
    desc: "Fill in what WhatsApp needs to approve your account: name, category, and contact info.",
  },
  {
    title: "Start Embedded Signup",
    desc: "Launch Meta's official signup yourself, or let our AI assistant fill it in for you in seconds.",
  },
  {
    title: "Verify & Go Live",
    desc: "Confirm your phone number, business details, and email — then you're ready to message customers.",
  },
];

export default function SetupInstructions() {
  return (
    <div data-testid="setup-instructions">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Let's Get Your WhatsApp Business Ready
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        A few details and you'll be sending your first message today.
      </p>

      <div className="flex flex-col gap-3 mb-8" data-testid="setup-tips">
        {TIPS.map((tip) => (
          <div
            key={tip.text}
            className="flex gap-2 items-start bg-primary-tint border border-primary/20 rounded-lg px-3 py-2.5 text-[13px] text-text-secondary"
          >
            <tip.icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            {tip.text}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 mb-8" data-testid="setup-steps">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">{step.title}</div>
              <div className="text-[13px] text-text-secondary mt-0.5">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="lg"
          data-testid="setup-cta-manual"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Start Meta Embedded Signup
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          data-testid="setup-cta-ai"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Set Up With AI Instead
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SetupInstructions" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/account-setup/SetupInstructions.jsx src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx
git commit -m "feat(engage-account-setup): add left-column setup instructions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `EngageAccountSetup` page + routing

**Files:**
- Create: `src/pages/EngageAccountSetup.jsx`
- Test: `src/pages/__tests__/EngageAccountSetup.test.jsx`
- Modify: `src/App.js`

**Interfaces:**
- Consumes `SetupInstructions` (Task 4), `PhoneMockup` (Task 2), `WhatsAppProfilePreview` (Task 3) — all default exports, no props.
- Produces `EngageAccountSetupPage` (default export) registered at route `/engage/account-setup`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/EngageAccountSetup.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("EngageAccountSetupPage", () => {
  it("renders both columns and an exit-setup link back to /fastrr-engage", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-engage-account-setup")).toBeInTheDocument();
    expect(screen.getByTestId("setup-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByTestId("exit-setup-link")).toHaveAttribute("href", "/fastrr-engage");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageAccountSetup" --watchAll=false`
Expected: FAIL — cannot find module `../EngageAccountSetup`.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/EngageAccountSetup.jsx`:

```jsx
import React from "react";
import { Link } from "react-router-dom";
import SetupInstructions from "@/components/engage/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage/account-setup/WhatsAppProfilePreview";

export default function EngageAccountSetupPage() {
  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-account-setup">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <span className="text-sm font-semibold text-text-primary">Fastrr Engage</span>
        <Link
          to="/fastrr-engage"
          data-testid="exit-setup-link"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Exit setup
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <div>
          <SetupInstructions />
        </div>
        <div className="flex justify-center lg:sticky lg:top-10 lg:self-start">
          <PhoneMockup>
            <WhatsAppProfilePreview />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
```

Modify `src/App.js`:

1. Add the import near the other Fastrr Engage imports (after `import FastrrEngagePanel from "@/components/engage/FastrrEngagePanel";`):

```js
import EngageAccountSetupPage from "@/pages/EngageAccountSetup";
```

2. Add a new route as a **sibling** of the `<Route element={<AppShell />}>` block — immediately after that block's closing `</Route>` tag, still inside `<Routes>`:

```jsx
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/engage/account-setup" element={<EngageAccountSetupPage />} />
        </Routes>
```

(This replaces the previous `</Route>\n        </Routes>` ending — the new route line is inserted between them, matching by content since exact line numbers may have shifted since this plan was written.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageAccountSetup" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full test suite and the CI-mode build to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All previously-passing tests still pass, plus the new tests from Tasks 1–5. (This repo has a known, pre-existing, unrelated baseline of exactly 3 failing suites — `campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx` — those are expected to still fail; nothing else should.)

Run: `CI=true npm run build`
Expected: `Compiled successfully.` (Vercel's build runs with `CI=true`, which turns ESLint warnings into errors — this must be clean.)

- [ ] **Step 6: Commit**

```bash
git add src/pages/EngageAccountSetup.jsx src/pages/__tests__/EngageAccountSetup.test.jsx src/App.js
git commit -m "feat(engage-account-setup): add page and route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Files/routing (sibling route, no sidebar entry) ✅ Task 5; left-column copy/tips/steps/CTAs ✅ Task 4; number setup card (3 modes, mock virtual numbers) ✅ Task 1; profile fields list + logo picker + live preview ✅ Task 3; phone device chrome ✅ Task 2; WhatsApp-authentic colors confined to the mockup, app tokens everywhere else ✅ Tasks 3–5; CTAs left un-wired with the TODO convention ✅ Tasks 3 (NumberSetupCard has no CTA) and 4 (SetupInstructions' two CTAs); testing plan (Radix Select jsdom polyfill, `URL.createObjectURL` mock, page-level MemoryRouter wrapper) ✅ Tasks 1, 3, 5.
- **Placeholder scan:** No "TBD"/"implement later" — every `// TODO` marks an explicitly-deferred item per the spec's Non-goals/Open items, with full working code around it.
- **Type/name consistency:** `NumberSetupCard`'s 10 props are defined once in Task 1 and consumed with the exact same names in Task 3. `data.js`'s three exports (`MOCK_VIRTUAL_NUMBERS`, `BUSINESS_CATEGORIES`, `DEFAULT_BUSINESS_CATEGORY`) are defined in Task 1 and imported with those exact names in Tasks 1 (NumberSetupCard uses `MOCK_VIRTUAL_NUMBERS`) and 3 (`WhatsAppProfilePreview` uses `BUSINESS_CATEGORIES`/`DEFAULT_BUSINESS_CATEGORY`). All `data-testid` values (`number-setup-card`, `number-setup-mode-toggle`, `number-setup-mode-{value}`, `number-setup-has-number-fields`, `number-setup-virtual-number-fields`, `number-setup-has-app-fields`, `number-setup-phone-input`, `number-setup-virtual-number-select`, `number-setup-app-id-input`, `number-setup-api-key-input`, `phone-mockup`, `phone-mockup-status-bar`, `phone-mockup-notch`, `phone-mockup-screen`, `whatsapp-profile-preview`, `field-brand-name`, `field-description`, `field-website`, `field-category`, `field-email`, `field-support-number`, `field-address`, `logo-file-input`, `setup-instructions`, `setup-tips`, `setup-steps`, `setup-cta-manual`, `setup-cta-ai`, `page-engage-account-setup`, `exit-setup-link`) are each defined once and referenced identically everywhere they're used.
