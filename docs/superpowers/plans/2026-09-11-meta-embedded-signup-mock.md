# Meta Embedded Signup Mock Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the two inert CTAs on the Engage Account Setup page to open a small popup tab at `/engage/meta-embedded-signup` that replicates Meta's real WhatsApp Embedded Signup flow as an 8-step mock wizard, fully prefilled from the seller's Account Setup form data.

**Architecture:** A pure-function module (`metaSignupMock.js`) handles the cross-tab data hand-off (build/write/read a payload via `localStorage`, open the popup). Two presentational "chrome" wrappers (Meta top bar vs. a nested "Facebook Login for Business" window) alternate around 8 small step components as a `MetaEmbeddedSignup` page owns a `currentStep` index. `WhatsAppProfilePreview`'s form state is lifted up into `EngageAccountSetup.jsx` so its sibling `SetupInstructions` can read it when its CTAs fire.

**Tech Stack:** React 18, react-router-dom v7, shadcn/ui primitives (`Input`, `Textarea`, `Select`, `Button`), lucide-react icons, Jest + React Testing Library (via `craco test`).

**Spec:** `docs/superpowers/specs/2026-09-11-meta-embedded-signup-mock-design.md`

## Global Constraints

- No real backend/API calls anywhere — this is a visual mock only.
- Both CTAs ("Start Meta Embedded Signup", "Set Up With AI Instead") open the **identical** flow — no manual/AI visual distinction.
- Phone OTP is always prefilled `123456`; email OTP is always prefilled `654321`.
- Fallback phone number (used whenever the seller picked `has_app` mode, or left `has_number`/`needs_virtual_number` empty): `"+91 98765 43210"`.
- Popup dimensions: `window.open("/engage/meta-embedded-signup", "metaEmbeddedSignup", "width=560,height=780")` — exact string, exact name, exact size.
- WABA asset name on the success screen: `` `${brandName || "Your Business"} WhatsApp Account` ``.
- Route `/engage/meta-embedded-signup` is a **sibling** of `<Route element={<AppShell />}>` in `src/App.js` (same pattern as `/engage/account-setup`) — no sidebar/topbar, no `Sidebar.jsx` entry.
- The wizard has exactly 8 steps (0-indexed 0-7). Steps 0, 1, 2 and 7 use `MetaTopBarChrome`; steps 3, 4, 5, 6 use `FbLoginWindowChrome`.
- `WhatsAppProfilePreview.jsx` becomes a **fully controlled** component (all `useState` removed, replaced with props) — this state moves up into `EngageAccountSetup.jsx`.
- Reuse existing UI primitives (`Input`, `Textarea`, `Select`, `Button` from `src/components/ui/`) wherever a screen calls for a real form control.
- Any JSX text a test asserts via `getByText` must be a single template-literal string, not an expression adjacent to separate literal text (this codebase's test suite has hit RTL's default text matcher not reliably concatenating sibling text/expression nodes).
- Testing Radix `Select` interaction in jsdom requires this exact `beforeAll` polyfill: `window.HTMLElement.prototype.hasPointerCapture = jest.fn(); window.HTMLElement.prototype.releasePointerCapture = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();`
- Page-level tests that touch `react-router-dom` must use this repo's established `jest.mock("react-router-dom", () => ({...}), { virtual: true })` workaround (real `react-router-dom` cannot be resolved by Jest in this repo — ESM-only `exports` map) — see `src/pages/__tests__/EngageAccountSetup.test.jsx`'s existing mock for the exact pattern to copy.

---

### Task 1: `metaSignupMock.js` — payload building, storage, popup opener

**Files:**
- Create: `src/lib/metaSignupMock.js`
- Test: `src/lib/__tests__/metaSignupMock.test.js`

**Interfaces:**
- Produces: `STORAGE_KEY` (string constant), `DEFAULT_SIGNUP_PAYLOAD` (object: `{ brandName: "", category: "", website: "", email: "", phoneNumber: "+91 98765 43210" }`), `buildSignupPayload({ brandName, category, website, email, numberMode, numberValue, virtualNumberValue })` → payload object, `writeSignupPayload(payload)` (writes JSON to `localStorage[STORAGE_KEY]`), `readSignupPayload()` (reads and parses, falling back to `DEFAULT_SIGNUP_PAYLOAD` on missing/malformed data), `openSignupPopup()` (calls `window.open` with the exact args from Global Constraints). Tasks 4 and 5 import all of these by name.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/metaSignupMock.test.js`:

```js
import {
  STORAGE_KEY,
  DEFAULT_SIGNUP_PAYLOAD,
  buildSignupPayload,
  writeSignupPayload,
  readSignupPayload,
  openSignupPopup,
} from "../metaSignupMock";

describe("buildSignupPayload", () => {
  it("derives the phone number from has_number mode", () => {
    const payload = buildSignupPayload({
      brandName: "Avimee",
      category: "Shopping & Retail",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      numberMode: "has_number",
      numberValue: "98765 43210",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
    expect(payload.brandName).toBe("Avimee");
    expect(payload.category).toBe("Shopping & Retail");
    expect(payload.website).toBe("https://avimee.com");
    expect(payload.email).toBe("hi@avimee.com");
  });

  it("uses the selected virtual number when in needs_virtual_number mode", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "needs_virtual_number",
      numberValue: "",
      virtualNumberValue: "+91 63001 22456",
    });
    expect(payload.phoneNumber).toBe("+91 63001 22456");
  });

  it("falls back to the placeholder number in has_app mode", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "has_app",
      numberValue: "",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
  });

  it("falls back to the placeholder number when has_number mode has no value typed", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "has_number",
      numberValue: "",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
  });
});

describe("writeSignupPayload / readSignupPayload", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a written payload", () => {
    const payload = buildSignupPayload({
      brandName: "Avimee",
      category: "Ecommerce",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      numberMode: "has_number",
      numberValue: "98765 43210",
      virtualNumberValue: "",
    });
    writeSignupPayload(payload);
    expect(readSignupPayload()).toEqual(payload);
  });

  it("returns the default payload when nothing is stored", () => {
    expect(readSignupPayload()).toEqual(DEFAULT_SIGNUP_PAYLOAD);
  });

  it("returns the default payload when the stored value is malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readSignupPayload()).toEqual(DEFAULT_SIGNUP_PAYLOAD);
  });
});

describe("openSignupPopup", () => {
  it("opens the signup route as a named popup with fixed dimensions", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    openSignupPopup();
    expect(openSpy).toHaveBeenCalledWith(
      "/engage/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
    openSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="metaSignupMock" --watchAll=false`
Expected: FAIL — cannot find module `../metaSignupMock`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/metaSignupMock.js`:

```js
// Prototype mock: builds and hands off the payload the Meta Embedded
// Signup mock tab prefills itself from. No real Meta/Facebook API is
// involved anywhere in this file.

export const STORAGE_KEY = "fastrr-engage-signup-mock-payload";

const FALLBACK_PHONE = "+91 98765 43210";

export const DEFAULT_SIGNUP_PAYLOAD = {
  brandName: "",
  category: "",
  website: "",
  email: "",
  phoneNumber: FALLBACK_PHONE,
};

export function buildSignupPayload({
  brandName,
  category,
  website,
  email,
  numberMode,
  numberValue,
  virtualNumberValue,
}) {
  let phoneNumber = FALLBACK_PHONE;
  if (numberMode === "has_number" && numberValue) {
    phoneNumber = `+91 ${numberValue}`;
  } else if (numberMode === "needs_virtual_number" && virtualNumberValue) {
    phoneNumber = virtualNumberValue;
  }

  return {
    brandName: brandName || "",
    category: category || "",
    website: website || "",
    email: email || "",
    phoneNumber,
  };
}

export function writeSignupPayload(payload) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readSignupPayload() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SIGNUP_PAYLOAD;
  try {
    return { ...DEFAULT_SIGNUP_PAYLOAD, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SIGNUP_PAYLOAD;
  }
}

export function openSignupPopup() {
  window.open(
    "/engage/meta-embedded-signup",
    "metaEmbeddedSignup",
    "width=560,height=780"
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="metaSignupMock" --watchAll=false`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/metaSignupMock.js src/lib/__tests__/metaSignupMock.test.js
git commit -m "feat(meta-signup): add payload build/storage/popup-opener helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Chrome wrappers + step rail

**Files:**
- Create: `src/components/engage/meta-signup/MetaTopBarChrome.jsx`
- Create: `src/components/engage/meta-signup/FbLoginWindowChrome.jsx`
- Create: `src/components/engage/meta-signup/StepRail.jsx`
- Test: `src/components/engage/meta-signup/__tests__/chrome.test.jsx`

**Interfaces:**
- Produces `MetaTopBarChrome` (default export, prop: `children`), `FbLoginWindowChrome` (default export, prop: `children`), `StepRail` (default export, props: `activeIndex` (number), `count` (number, default 3)). Task 4 imports all three by these exact names.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/meta-signup/__tests__/chrome.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import MetaTopBarChrome from "../MetaTopBarChrome";
import FbLoginWindowChrome from "../FbLoginWindowChrome";
import StepRail from "../StepRail";

describe("MetaTopBarChrome", () => {
  it("renders its children inside the chrome", () => {
    render(
      <MetaTopBarChrome>
        <div data-testid="mock-child">Hello</div>
      </MetaTopBarChrome>
    );
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("mock-child")).toBeInTheDocument();
  });
});

describe("FbLoginWindowChrome", () => {
  it("renders its children inside the chrome", () => {
    render(
      <FbLoginWindowChrome>
        <div data-testid="mock-child-2">World</div>
      </FbLoginWindowChrome>
    );
    expect(screen.getByTestId("fb-login-window-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("mock-child-2")).toBeInTheDocument();
  });
});

describe("StepRail", () => {
  it("renders `count` dots, marking indices before activeIndex as done", () => {
    render(<StepRail activeIndex={1} count={4} />);
    expect(screen.getByTestId("step-rail-dot-0")).toBeInTheDocument();
    expect(screen.getByTestId("step-rail-dot-3")).toBeInTheDocument();
    expect(screen.queryByTestId("step-rail-dot-4")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/meta-signup/__tests__/chrome" --watchAll=false`
Expected: FAIL — cannot find modules `../MetaTopBarChrome`, `../FbLoginWindowChrome`, `../StepRail`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/meta-signup/MetaTopBarChrome.jsx`:

```jsx
import React from "react";
import { Infinity as InfinityIcon, RefreshCw, User } from "lucide-react";

export default function MetaTopBarChrome({ children }) {
  return (
    <div className="flex flex-col h-full" data-testid="meta-top-bar-chrome">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <InfinityIcon className="w-5 h-5 text-primary" />
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/FbLoginWindowChrome.jsx`:

```jsx
import React from "react";
import { Facebook, Minus, Square, X } from "lucide-react";

export default function FbLoginWindowChrome({ children }) {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="fb-login-window-chrome">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
          <span className="text-[11px] text-slate-700">Facebook Login for Business - Google Chrome</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Minus className="w-3 h-3" />
          <Square className="w-3 h-3" />
          <X className="w-3 h-3" />
        </div>
      </div>
      <div className="px-3 py-1 bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 flex-shrink-0">
        facebook.com/v18.0/dialog/oauth?app_id=2158101317955389&c...
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/StepRail.jsx`:

```jsx
import React from "react";
import { Check } from "lucide-react";

export default function StepRail({ activeIndex, count = 3 }) {
  return (
    <div className="flex flex-col items-center gap-1 pt-6 px-3" data-testid="step-rail">
      {Array.from({ length: count }, (_, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                isDone ? "bg-success border-success" : isActive ? "border-primary" : "border-slate-300"
              }`}
              data-testid={`step-rail-dot-${i}`}
            >
              {isDone && <Check className="w-3 h-3 text-white" />}
            </div>
            {i < count - 1 && <div className="w-px h-4 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/meta-signup/__tests__/chrome" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/meta-signup/MetaTopBarChrome.jsx src/components/engage/meta-signup/FbLoginWindowChrome.jsx src/components/engage/meta-signup/StepRail.jsx src/components/engage/meta-signup/__tests__/chrome.test.jsx
git commit -m "feat(meta-signup): add chrome wrappers and step rail

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: The 8 step screen components

**Files:**
- Create: `src/components/engage/meta-signup/steps/IntroStep.jsx`
- Create: `src/components/engage/meta-signup/steps/PhoneNumberStep.jsx`
- Create: `src/components/engage/meta-signup/steps/VerifyPhoneStep.jsx`
- Create: `src/components/engage/meta-signup/steps/SelectAssetsStep.jsx`
- Create: `src/components/engage/meta-signup/steps/BusinessInfoStep.jsx`
- Create: `src/components/engage/meta-signup/steps/ConnectingStep.jsx`
- Create: `src/components/engage/meta-signup/steps/EmailVerifyStep.jsx`
- Create: `src/components/engage/meta-signup/steps/SuccessStep.jsx`
- Test: `src/components/engage/meta-signup/steps/__tests__/steps.test.jsx`

**Interfaces:**
- `IntroStep` — props: `onCancel`, `onContinue`.
- `PhoneNumberStep` — props: `phoneNumber` (string, e.g. `"+91 98765 43210"`), `onBack`, `onNext`. Renders the digits with the `+91 ` prefix stripped.
- `VerifyPhoneStep` — props: `phoneNumber`, `onBack`, `onNext`. Owns its own local `showResent` boolean (not lifted).
- `SelectAssetsStep` — props: `onBack`, `onNext`. No data props (fixed content).
- `BusinessInfoStep` — props: `brandName`, `category`, `website`, `onBack`, `onNext`.
- `ConnectingStep` — props: `onAutoAdvance` (called once, ~1.5s after mount, via `useEffect`+`setTimeout`).
- `EmailVerifyStep` — props: `email`, `onNext`. Renders a `fixed inset-0` modal overlay.
- `SuccessStep` — props: `brandName`, `onFinish`.
- Task 4 imports all 8 by these exact names and prop shapes.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/meta-signup/steps/__tests__/steps.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IntroStep from "../IntroStep";
import PhoneNumberStep from "../PhoneNumberStep";
import VerifyPhoneStep from "../VerifyPhoneStep";
import SelectAssetsStep from "../SelectAssetsStep";
import BusinessInfoStep from "../BusinessInfoStep";
import ConnectingStep from "../ConnectingStep";
import EmailVerifyStep from "../EmailVerifyStep";
import SuccessStep from "../SuccessStep";

describe("IntroStep", () => {
  it("renders the consent copy and calls onCancel/onContinue", () => {
    const onCancel = jest.fn();
    const onContinue = jest.fn();
    render(<IntroStep onCancel={onCancel} onContinue={onContinue} />);
    expect(screen.getByText(/Seamlessly connect your account/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("intro-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("PhoneNumberStep", () => {
  it("shows the prefilled phone number digits and calls onNext/onBack", () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    render(<PhoneNumberStep phoneNumber="+91 98765 43210" onBack={onBack} onNext={onNext} />);
    expect(screen.getByTestId("phone-number-input")).toHaveValue("98765 43210");
    fireEvent.click(screen.getByTestId("phone-number-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("phone-number-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe("VerifyPhoneStep", () => {
  it("shows the destination phone number and the prefilled OTP", () => {
    render(<VerifyPhoneStep phoneNumber="+91 98765 43210" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText(/\+91 98765 43210/)).toBeInTheDocument();
    expect(screen.getByTestId("verify-phone-otp-0")).toHaveTextContent("1");
    expect(screen.getByTestId("verify-phone-otp-5")).toHaveTextContent("6");
  });

  it("shows the resent toast after clicking Resend Code", () => {
    render(<VerifyPhoneStep phoneNumber="+91 98765 43210" onBack={() => {}} onNext={() => {}} />);
    expect(screen.queryByTestId("verify-phone-resent-toast")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("verify-phone-resend"));
    expect(screen.getByTestId("verify-phone-resent-toast")).toBeInTheDocument();
  });
});

describe("SelectAssetsStep", () => {
  it("shows the fixed business portfolio and WABA creation option", () => {
    render(<SelectAssetsStep onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText("Shiprocket")).toBeInTheDocument();
    expect(screen.getByText("Create a WhatsApp Business account")).toBeInTheDocument();
  });
});

describe("BusinessInfoStep", () => {
  it("prefills name, category, and website from props, with fixed country/timezone", () => {
    render(
      <BusinessInfoStep brandName="Avimee" category="Ecommerce" website="https://avimee.com" onBack={() => {}} onNext={() => {}} />
    );
    expect(screen.getByTestId("business-info-name")).toHaveValue("Avimee");
    expect(screen.getByTestId("business-info-category")).toHaveTextContent("Ecommerce");
    expect(screen.getByTestId("business-info-website")).toHaveValue("https://avimee.com");
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("(GMT+05:30) Asia/Kolkata")).toBeInTheDocument();
  });
});

describe("ConnectingStep", () => {
  it("calls onAutoAdvance after the delay", () => {
    jest.useFakeTimers();
    const onAutoAdvance = jest.fn();
    render(<ConnectingStep onAutoAdvance={onAutoAdvance} />);
    expect(onAutoAdvance).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    expect(onAutoAdvance).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

describe("EmailVerifyStep", () => {
  it("masks the given email and shows the prefilled OTP", () => {
    render(<EmailVerifyStep email="seller@avimee.com" onNext={() => {}} />);
    expect(screen.getByTestId("email-verify-otp-0")).toHaveTextContent("6");
    expect(screen.getByText(/s\*+@a\*+\.com/)).toBeInTheDocument();
  });

  it("calls onNext when clicked", () => {
    const onNext = jest.fn();
    render(<EmailVerifyStep email="seller@avimee.com" onNext={onNext} />);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe("SuccessStep", () => {
  it("shows the derived asset name and calls onFinish", () => {
    const onFinish = jest.fn();
    render(<SuccessStep brandName="Avimee" onFinish={onFinish} />);
    expect(screen.getByText("Avimee WhatsApp Account")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("success-finish"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/meta-signup/steps" --watchAll=false`
Expected: FAIL — cannot find the 8 step modules.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/meta-signup/steps/IntroStep.jsx`:

```jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, TrendingUp, ChevronDown } from "lucide-react";

const CAPABILITIES = [
  { icon: MessageCircle, label: "Communicate with customers at scale" },
  { icon: TrendingUp, label: "Send messages with optimisations" },
];

export default function IntroStep({ onCancel, onContinue }) {
  return (
    <div className="p-6" data-testid="intro-step">
      <div className="h-32 rounded-lg mb-5 bg-gradient-to-br from-primary-tint to-success-bg" />
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Seamlessly connect your account to Shiprocket Communication and Karix Mobile Pvt Ltd
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        This onboarding process will walk you through registering and connecting your business account to your partner.
      </p>
      <h3 className="text-sm font-semibold text-text-primary mb-2">You'll be able to:</h3>
      <div className="flex flex-col gap-2 mb-6">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="flex items-center justify-between border-t border-border pt-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <c.icon className="w-4 h-4 text-text-muted" />
              {c.label}
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mb-4">
        By continuing, you agree to the{" "}
        <a href="#" className="text-primary underline">Marketing Messages API for WhatsApp Terms</a>; you agree to share event
        activity data with Meta to help optimise marketing messages. You also agree to the{" "}
        <a href="#" className="text-primary underline">WhatsApp Business Platform Cloud API Terms</a>.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" data-testid="intro-cancel" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" data-testid="intro-continue" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/PhoneNumberStep.jsx`:

```jsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PhoneNumberStep({ phoneNumber, onBack, onNext }) {
  const digits = phoneNumber.replace(/^\+91\s*/, "");
  return (
    <div className="p-6 flex flex-col h-full" data-testid="phone-number-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Add your WhatsApp phone number</h2>
      <p className="text-sm text-text-secondary mb-4">Choose how you want to be identified when sending messages.</p>
      <label className="text-[13px] font-semibold text-text-primary mb-1 block">Phone number</label>
      <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary mb-2">
        Enter a new phone number
      </div>
      <div className="flex gap-2 mb-6">
        <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary">IN +91</div>
        <Input value={digits} readOnly data-testid="phone-number-input" className="flex-1" />
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="phone-number-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="phone-number-next">Next</Button>
      </div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/VerifyPhoneStep.jsx`:

```jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const OTP_DIGITS = "123456".split("");

export default function VerifyPhoneStep({ phoneNumber, onBack, onNext }) {
  const [showResent, setShowResent] = useState(false);

  return (
    <div className="p-6 flex flex-col h-full relative" data-testid="verify-phone-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Verify your phone number</h2>
      <p className="text-sm text-text-secondary mb-4">
        {`We sent a code via text message to ${phoneNumber}`}
      </p>
      <label className="text-[13px] font-semibold text-text-primary mb-2 block">Verification code</label>
      <div className="flex gap-2 mb-4">
        {OTP_DIGITS.map((d, i) => (
          <div
            key={i}
            className="w-9 h-11 border border-border rounded-md flex items-center justify-center text-sm font-medium"
            data-testid={`verify-phone-otp-${i}`}
          >
            {d}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="text-sm text-primary underline text-left mb-4 w-fit"
        onClick={() => setShowResent(true)}
        data-testid="verify-phone-resend"
      >
        Resend Code
      </button>
      <p className="text-[13px] font-semibold text-text-primary mb-2">Choose how you would like to verify your number</p>
      <div className="flex items-center gap-4 text-sm text-text-secondary mb-6">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked readOnly /> Text message
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" readOnly /> Phone call
        </label>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="verify-phone-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="verify-phone-next">Next</Button>
      </div>
      {showResent && (
        <div
          className="absolute bottom-4 right-4 bg-success-bg border border-success/30 text-success text-sm px-3 py-2 rounded-md shadow"
          data-testid="verify-phone-resent-toast"
        >
          Code sent successfully.
        </div>
      )}
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/SelectAssetsStep.jsx`:

```jsx
import React from "react";
import { Button } from "@/components/ui/button";

export default function SelectAssetsStep({ onBack, onNext }) {
  return (
    <div className="p-6 flex flex-col h-full" data-testid="select-assets-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Select the business assets to share with TSP Karix</h2>
      <p className="text-sm text-text-secondary mb-5">You can use existing assets or create new ones.</p>

      <label className="text-[13px] font-semibold text-text-primary mb-1 block">Business portfolio</label>
      <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary mb-4">
        Shiprocket
      </div>

      <label className="text-[13px] font-semibold text-text-primary mb-1 block">WhatsApp Business account</label>
      <div className="border border-primary rounded-md px-3 py-2 text-sm text-text-primary mb-6">
        Create a WhatsApp Business account
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="select-assets-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="select-assets-next">Next</Button>
      </div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/BusinessInfoStep.jsx`:

```jsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BusinessInfoStep({ brandName, category, website, onBack, onNext }) {
  return (
    <div className="p-6 flex flex-col h-full overflow-y-auto" data-testid="business-info-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Enter business information for new assets</h2>
      <p className="text-sm text-text-secondary mb-5">Any changes will only affect new assets.</p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Name</label>
          <Input value={brandName || "Your Business"} readOnly data-testid="business-info-name" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Category</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary" data-testid="business-info-category">
            {category || "Others"}
          </div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Country</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-muted bg-app-bg">India</div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Website</label>
          <Input value={website} readOnly data-testid="business-info-website" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Time zone</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary">
            (GMT+05:30) Asia/Kolkata
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="business-info-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="business-info-next">Next</Button>
      </div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/ConnectingStep.jsx`:

```jsx
import React, { useEffect } from "react";
import { Loader2, UserRound } from "lucide-react";

export default function ConnectingStep({ onAutoAdvance }) {
  useEffect(() => {
    const timer = setTimeout(onAutoAdvance, 1500);
    return () => clearTimeout(timer);
  }, [onAutoAdvance]);

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full text-center" data-testid="connecting-step">
      <div className="w-20 h-20 rounded-full bg-primary-tint flex items-center justify-center mb-4">
        <UserRound className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-base font-bold text-text-primary mb-1">Connecting your account</h2>
      <p className="text-sm text-text-secondary flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        This may take a few moments...
      </p>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/EmailVerifyStep.jsx`:

```jsx
import React from "react";
import { Button } from "@/components/ui/button";

const OTP_DIGITS = "654321".split("");

function maskEmail(email) {
  if (!email || !email.includes("@")) return "s************1@s********.com";
  const [local, domain] = email.split("@");
  const maskedLocal = local.charAt(0) + "*".repeat(Math.max(local.length - 1, 3));
  const domainName = domain.split(".")[0];
  const maskedDomain = domainName.charAt(0) + "*".repeat(Math.max(domainName.length - 1, 3));
  const ext = domain.includes(".") ? domain.slice(domain.indexOf(".")) : "";
  return `${maskedLocal}@${maskedDomain}${ext}`;
}

export default function EmailVerifyStep({ email, onNext }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" data-testid="email-verify-step">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <p className="text-[11px] text-text-muted mb-1">Facebook</p>
        <h2 className="text-lg font-bold text-text-primary mb-2">Enter confirmation code</h2>
        <p className="text-sm text-text-secondary mb-4">
          {`We've sent a confirmation code to ${maskEmail(email)}.`}
        </p>
        <div className="flex gap-2 mb-3">
          {OTP_DIGITS.map((d, i) => (
            <div
              key={i}
              className="w-9 h-11 border border-border rounded-md flex items-center justify-center text-sm font-medium"
              data-testid={`email-verify-otp-${i}`}
            >
              {d}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mb-6">We can send a new code in 00:29</p>
        <Button type="button" className="w-full" onClick={onNext} data-testid="email-verify-next">
          Next
        </Button>
      </div>
    </div>
  );
}
```

Create `src/components/engage/meta-signup/steps/SuccessStep.jsx`:

```jsx
import React from "react";
import { PartyPopper, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessStep({ brandName, onFinish }) {
  const assetName = `${brandName || "Your Business"} WhatsApp Account`;
  return (
    <div className="p-6 flex flex-col items-center text-center" data-testid="success-step">
      <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-4">
        <PartyPopper className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Your account is connected to Shiprocket Communication
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        We'll review your business to ensure it complies with the WhatsApp Business Messaging Policy and get in touch within 24 hours if there's an issue.
      </p>
      <h3 className="text-sm font-semibold text-text-primary mb-2 self-start">Assets successfully created</h3>
      <div className="flex items-center gap-2 self-start mb-8">
        <MessageCircle className="w-4 h-4 text-success" />
        <span className="text-sm text-primary underline">{assetName}</span>
      </div>
      <Button type="button" className="w-full" onClick={onFinish} data-testid="success-finish">
        Finish
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/meta-signup/steps" --watchAll=false`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/meta-signup/steps/
git commit -m "feat(meta-signup): add the 8 mock wizard step screens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `MetaEmbeddedSignup` page (the wizard)

**Files:**
- Create: `src/pages/MetaEmbeddedSignup.jsx`
- Test: `src/pages/__tests__/MetaEmbeddedSignup.test.jsx`

**Interfaces:**
- Consumes `MetaTopBarChrome`, `FbLoginWindowChrome`, `StepRail` (Task 2) and all 8 step components (Task 3) with the exact prop names documented in their Interfaces blocks.
- Consumes `readSignupPayload`, `writeSignupPayload` (Task 1) — the latter only in this task's test, to seed `localStorage` before rendering.
- Produces `MetaEmbeddedSignup` (default export, no props) — Task 5 registers it as the element for route `/engage/meta-embedded-signup`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/MetaEmbeddedSignup.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MetaEmbeddedSignup from "../MetaEmbeddedSignup";
import { writeSignupPayload } from "@/lib/metaSignupMock";

beforeEach(() => {
  window.localStorage.clear();
});

describe("MetaEmbeddedSignup", () => {
  it("renders the intro step by default inside the Meta top bar chrome", () => {
    render(<MetaEmbeddedSignup />);
    expect(screen.getByTestId("page-meta-embedded-signup")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("intro-step")).toBeInTheDocument();
  });

  it("advances through steps 1-3 via Continue/Next, swapping to the FB Login chrome at step 4", () => {
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(screen.getByTestId("phone-number-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("phone-number-next"));
    expect(screen.getByTestId("verify-phone-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("verify-phone-next"));
    expect(screen.getByTestId("select-assets-step")).toBeInTheDocument();
    expect(screen.getByTestId("fb-login-window-chrome")).toBeInTheDocument();
  });

  it("Back on the phone number step returns to the intro step", () => {
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-back"));
    expect(screen.getByTestId("intro-step")).toBeInTheDocument();
  });

  it("the connecting step auto-advances to the email verify step", () => {
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    expect(screen.getByTestId("connecting-step")).toBeInTheDocument();
    jest.advanceTimersByTime(1500);
    expect(screen.getByTestId("email-verify-step")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("reaches the success step after email verify, back in the Meta top bar chrome, and Finish closes the window", () => {
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => {});
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(screen.getByTestId("success-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("success-finish"));
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();
    jest.useRealTimers();
  });

  it("prefills the phone number from a payload written to localStorage before mount", () => {
    writeSignupPayload({
      brandName: "Avimee",
      category: "Ecommerce",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      phoneNumber: "+91 98765 43210",
    });
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(screen.getByTestId("phone-number-input")).toHaveValue("98765 43210");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/MetaEmbeddedSignup" --watchAll=false`
Expected: FAIL — cannot find module `../MetaEmbeddedSignup`.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/MetaEmbeddedSignup.jsx`:

```jsx
import React, { useCallback, useState } from "react";
import MetaTopBarChrome from "@/components/engage/meta-signup/MetaTopBarChrome";
import FbLoginWindowChrome from "@/components/engage/meta-signup/FbLoginWindowChrome";
import StepRail from "@/components/engage/meta-signup/StepRail";
import IntroStep from "@/components/engage/meta-signup/steps/IntroStep";
import PhoneNumberStep from "@/components/engage/meta-signup/steps/PhoneNumberStep";
import VerifyPhoneStep from "@/components/engage/meta-signup/steps/VerifyPhoneStep";
import SelectAssetsStep from "@/components/engage/meta-signup/steps/SelectAssetsStep";
import BusinessInfoStep from "@/components/engage/meta-signup/steps/BusinessInfoStep";
import ConnectingStep from "@/components/engage/meta-signup/steps/ConnectingStep";
import EmailVerifyStep from "@/components/engage/meta-signup/steps/EmailVerifyStep";
import SuccessStep from "@/components/engage/meta-signup/steps/SuccessStep";
import { readSignupPayload } from "@/lib/metaSignupMock";

const TOTAL_STEPS = 8;

export default function MetaEmbeddedSignup() {
  const [payload] = useState(() => readSignupPayload());
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);
  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);
  const handleFinish = useCallback(() => {
    window.close();
  }, []);

  let Chrome;
  let content;

  switch (currentStep) {
    case 0:
      Chrome = MetaTopBarChrome;
      content = <IntroStep onCancel={handleFinish} onContinue={goNext} />;
      break;
    case 1:
      Chrome = MetaTopBarChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={0} count={2} />
          <div className="flex-1">
            <PhoneNumberStep phoneNumber={payload.phoneNumber} onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 2:
      Chrome = MetaTopBarChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={1} count={2} />
          <div className="flex-1">
            <VerifyPhoneStep phoneNumber={payload.phoneNumber} onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 3:
      Chrome = FbLoginWindowChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={0} count={4} />
          <div className="flex-1">
            <SelectAssetsStep onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 4:
      Chrome = FbLoginWindowChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={1} count={4} />
          <div className="flex-1">
            <BusinessInfoStep
              brandName={payload.brandName}
              category={payload.category}
              website={payload.website}
              onBack={goBack}
              onNext={goNext}
            />
          </div>
        </div>
      );
      break;
    case 5:
      Chrome = FbLoginWindowChrome;
      content = <ConnectingStep onAutoAdvance={goNext} />;
      break;
    case 6:
      Chrome = FbLoginWindowChrome;
      content = <EmailVerifyStep email={payload.email} onNext={goNext} />;
      break;
    case 7:
    default:
      Chrome = MetaTopBarChrome;
      content = <SuccessStep brandName={payload.brandName} onFinish={handleFinish} />;
      break;
  }

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4" data-testid="page-meta-embedded-signup">
      <div
        className="bg-white rounded-lg shadow-2xl overflow-hidden w-full"
        style={{ maxWidth: 560, height: 740 }}
        data-testid="meta-signup-card"
      >
        <Chrome>{content}</Chrome>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/MetaEmbeddedSignup" --watchAll=false`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/MetaEmbeddedSignup.jsx src/pages/__tests__/MetaEmbeddedSignup.test.jsx
git commit -m "feat(meta-signup): add the 8-step wizard page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Wire the CTAs — lift state, control WhatsAppProfilePreview, add the route

**Files:**
- Modify: `src/components/engage/account-setup/WhatsAppProfilePreview.jsx`
- Modify: `src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx`
- Modify: `src/components/engage/account-setup/SetupInstructions.jsx`
- Modify: `src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx`
- Modify: `src/pages/EngageAccountSetup.jsx`
- Modify: `src/pages/__tests__/EngageAccountSetup.test.jsx`
- Modify: `src/App.js`

**Interfaces:**
- Consumes `buildSignupPayload`, `writeSignupPayload`, `openSignupPopup`, `STORAGE_KEY` (Task 1) and `MetaEmbeddedSignup` (Task 4, default export, no props).
- `WhatsAppProfilePreview` changes from an uncontrolled component to fully controlled — see the exact prop list in Step 3 below. `EngageAccountSetup.jsx` becomes its sole owner of state, and passes a new `onStart` prop to `SetupInstructions`.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppProfilePreview from "../WhatsAppProfilePreview";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderPreview(overrides = {}) {
  const props = {
    numberMode: "has_number",
    onNumberModeChange: jest.fn(),
    numberValue: "",
    onNumberValueChange: jest.fn(),
    virtualNumberValue: "",
    onVirtualNumberChange: jest.fn(),
    appId: "",
    onAppIdChange: jest.fn(),
    apiKeySecret: "",
    onApiKeySecretChange: jest.fn(),
    logoUrl: null,
    onLogoFileChange: jest.fn(),
    brandName: "",
    onBrandNameChange: jest.fn(),
    description: "",
    onDescriptionChange: jest.fn(),
    website: "",
    onWebsiteChange: jest.fn(),
    category: "Shopping & Retail",
    onCategoryChange: jest.fn(),
    email: "",
    onEmailChange: jest.fn(),
    supportNumber: "",
    onSupportNumberChange: jest.fn(),
    address: "",
    onAddressChange: jest.fn(),
    ...overrides,
  };
  render(<WhatsAppProfilePreview {...props} />);
  return props;
}

describe("WhatsAppProfilePreview", () => {
  it("renders the header and the number setup card", () => {
    renderPreview();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByText("Business Profile")).toBeInTheDocument();
    expect(screen.getByTestId("number-setup-card")).toBeInTheDocument();
  });

  it("typing the brand name calls onBrandNameChange", () => {
    const props = renderPreview();
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(props.onBrandNameChange).toHaveBeenCalledWith("Avimee");
  });

  it("shows the avatar fallback initial derived from brandName", () => {
    renderPreview({ brandName: "Avimee" });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("typing into description, website, email, support number, and address calls each handler", () => {
    const props = renderPreview();
    fireEvent.change(screen.getByTestId("field-description"), { target: { value: "We sell skincare." } });
    expect(props.onDescriptionChange).toHaveBeenCalledWith("We sell skincare.");

    fireEvent.change(screen.getByTestId("field-website"), { target: { value: "https://avimee.com" } });
    expect(props.onWebsiteChange).toHaveBeenCalledWith("https://avimee.com");

    fireEvent.change(screen.getByTestId("field-email"), { target: { value: "hi@avimee.com" } });
    expect(props.onEmailChange).toHaveBeenCalledWith("hi@avimee.com");

    fireEvent.change(screen.getByTestId("field-support-number"), { target: { value: "+91 90000 00000" } });
    expect(props.onSupportNumberChange).toHaveBeenCalledWith("+91 90000 00000");

    fireEvent.change(screen.getByTestId("field-address"), { target: { value: "123 MG Road, Bengaluru" } });
    expect(props.onAddressChange).toHaveBeenCalledWith("123 MG Road, Bengaluru");
  });

  it("shows the given category", () => {
    renderPreview({ category: "Shopping & Retail" });
    expect(screen.getByTestId("field-category")).toHaveTextContent("Shopping & Retail");
  });

  it("selecting a logo file calls onLogoFileChange", () => {
    const props = renderPreview();
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [file] } });
    expect(props.onLogoFileChange).toHaveBeenCalledTimes(1);
  });

  it("renders the given logoUrl as the avatar image", () => {
    renderPreview({ logoUrl: "blob:mock-preview" });
    expect(screen.getByAltText("Brand logo")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("switching the number setup mode calls onNumberModeChange", () => {
    const props = renderPreview();
    fireEvent.click(screen.getByTestId("number-setup-mode-has_app"));
    expect(props.onNumberModeChange).toHaveBeenCalledWith("has_app");
  });
});
```

Replace the full contents of `src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SetupInstructions from "../SetupInstructions";

describe("SetupInstructions", () => {
  it("renders the heading, both tips, all 3 steps, and both CTAs", () => {
    render(<SetupInstructions onStart={() => {}} />);
    expect(screen.getByText("Let's Get Your WhatsApp Business Ready")).toBeInTheDocument();
    expect(screen.getByTestId("setup-tips").children).toHaveLength(2);
    expect(screen.getByTestId("setup-steps").children).toHaveLength(3);
    expect(screen.getByText("Add Your Business Details")).toBeInTheDocument();
    expect(screen.getByText("Start Embedded Signup")).toBeInTheDocument();
    expect(screen.getByText("Verify & Go Live")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-manual")).toBeInTheDocument();
    expect(screen.getByTestId("setup-cta-ai")).toBeInTheDocument();
  });

  it("both CTAs call the onStart prop when clicked", () => {
    const onStart = jest.fn();
    render(<SetupInstructions onStart={onStart} />);
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    fireEvent.click(screen.getByTestId("setup-cta-ai"));
    expect(onStart).toHaveBeenCalledTimes(2);
  });
});
```

Replace the full contents of `src/pages/__tests__/EngageAccountSetup.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup";
import { STORAGE_KEY } from "@/lib/metaSignupMock";

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
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

  it("clicking either signup CTA writes the current form snapshot to localStorage and opens the signup popup", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    fireEvent.click(screen.getByTestId("setup-cta-manual"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.brandName).toBe("Avimee");
    expect(stored.phoneNumber).toBe("+91 98765 43210");
    expect(openSpy).toHaveBeenCalledWith(
      "/engage/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
    openSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="WhatsAppProfilePreview|SetupInstructions|pages/__tests__/EngageAccountSetup" --watchAll=false`
Expected: FAIL — `WhatsAppProfilePreview` renders with all fields empty/uncontrolled regardless of the props passed (old implementation ignores them), `SetupInstructions`'s CTAs are still no-ops (old implementation), `EngageAccountSetup`'s test can't find a payload in `localStorage` and `window.open` is never called (old implementation has no `handleStartSignup`).

- [ ] **Step 3: Write the implementation**

Replace the full contents of `src/components/engage/account-setup/WhatsAppProfilePreview.jsx`:

```jsx
import React from "react";
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
import { BUSINESS_CATEGORIES } from "./data";

export default function WhatsAppProfilePreview({
  numberMode,
  onNumberModeChange,
  numberValue,
  onNumberValueChange,
  virtualNumberValue,
  onVirtualNumberChange,
  appId,
  onAppIdChange,
  apiKeySecret,
  onApiKeySecretChange,
  logoUrl,
  onLogoFileChange,
  brandName,
  onBrandNameChange,
  description,
  onDescriptionChange,
  website,
  onWebsiteChange,
  category,
  onCategoryChange,
  email,
  onEmailChange,
  supportNumber,
  onSupportNumberChange,
  address,
  onAddressChange,
}) {
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
            onChange={onLogoFileChange}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="field-brand-name-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Brand Name
            </label>
            <Input
              id="field-brand-name-input"
              value={brandName}
              onChange={(e) => onBrandNameChange(e.target.value)}
              placeholder="Your brand name"
              data-testid="field-brand-name"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-secondary mb-1 block">
              WhatsApp Number
            </label>
            <NumberSetupCard
              mode={numberMode}
              onModeChange={onNumberModeChange}
              numberValue={numberValue}
              onNumberValueChange={onNumberValueChange}
              virtualNumberValue={virtualNumberValue}
              onVirtualNumberChange={onVirtualNumberChange}
              appId={appId}
              onAppIdChange={onAppIdChange}
              apiKeySecret={apiKeySecret}
              onApiKeySecretChange={onApiKeySecretChange}
            />
          </div>

          <div>
            <label htmlFor="field-description-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Company Description
            </label>
            <Textarea
              id="field-description-input"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="What does your business do?"
              data-testid="field-description"
            />
          </div>

          <div>
            <label htmlFor="field-website-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Website URL
            </label>
            <Input
              id="field-website-input"
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder="https://yourstore.com"
              data-testid="field-website"
            />
          </div>

          <div>
            <label htmlFor="field-category-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Business Category
            </label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger id="field-category-input" data-testid="field-category">
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
            <label htmlFor="field-email-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Contact Email
            </label>
            <Input
              id="field-email-input"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="hello@yourstore.com"
              data-testid="field-email"
            />
          </div>

          <div>
            <label htmlFor="field-support-number-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Support Number
            </label>
            <Input
              id="field-support-number-input"
              value={supportNumber}
              onChange={(e) => onSupportNumberChange(e.target.value)}
              placeholder="+91 98765 43210"
              data-testid="field-support-number"
            />
          </div>

          <div>
            <label htmlFor="field-address-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Office Address
            </label>
            <Textarea
              id="field-address-input"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
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

Modify `src/components/engage/account-setup/SetupInstructions.jsx`: add an `onStart` param to the component signature (`export default function SetupInstructions({ onStart }) {`), and change both CTA buttons' `onClick={() => {}} // TODO: wire up once enablement flow is defined` to `onClick={onStart}` (remove the TODO comment on both — they are now genuinely wired). Nothing else in this file changes.

Replace the full contents of `src/pages/EngageAccountSetup.jsx`:

```jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import SetupInstructions from "@/components/engage/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage/account-setup/data";
import { buildSignupPayload, writeSignupPayload, openSignupPopup } from "@/lib/metaSignupMock";

export default function EngageAccountSetupPage() {
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

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  }

  function handleStartSignup() {
    const payload = buildSignupPayload({
      brandName,
      category,
      website,
      email,
      numberMode,
      numberValue,
      virtualNumberValue,
    });
    writeSignupPayload(payload);
    openSignupPopup();
  }

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
          <SetupInstructions onStart={handleStartSignup} />
        </div>
        <div className="flex justify-center lg:sticky lg:top-10 lg:self-start">
          <PhoneMockup>
            <WhatsAppProfilePreview
              numberMode={numberMode}
              onNumberModeChange={setNumberMode}
              numberValue={numberValue}
              onNumberValueChange={setNumberValue}
              virtualNumberValue={virtualNumberValue}
              onVirtualNumberChange={setVirtualNumberValue}
              appId={appId}
              onAppIdChange={setAppId}
              apiKeySecret={apiKeySecret}
              onApiKeySecretChange={setApiKeySecret}
              logoUrl={logoUrl}
              onLogoFileChange={handleLogoFileChange}
              brandName={brandName}
              onBrandNameChange={setBrandName}
              description={description}
              onDescriptionChange={setDescription}
              website={website}
              onWebsiteChange={setWebsite}
              category={category}
              onCategoryChange={setCategory}
              email={email}
              onEmailChange={setEmail}
              supportNumber={supportNumber}
              onSupportNumberChange={setSupportNumber}
              address={address}
              onAddressChange={setAddress}
            />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
```

Modify `src/App.js`:

1. Add the import near the other Engage imports (after `import EngageAccountSetupPage from "@/pages/EngageAccountSetup";`):

```js
import MetaEmbeddedSignup from "@/pages/MetaEmbeddedSignup";
```

2. Add the new route immediately after the existing `<Route path="/engage/account-setup" .../>` sibling route (still a sibling of the `AppShell` block, still before `</Routes>`):

```jsx
<Route path="/engage/meta-embedded-signup" element={<MetaEmbeddedSignup />} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="WhatsAppProfilePreview|SetupInstructions|pages/__tests__/EngageAccountSetup" --watchAll=false`
Expected: PASS (all tests across the three suites).

- [ ] **Step 5: Run the full test suite and the CI-mode build to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All previously-passing tests still pass, plus every new test from Tasks 1-5. This repo has a known, pre-existing, unrelated baseline of exactly 3 failing suites (`campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`) — those are expected to still fail; nothing else should.

Run: `CI=true npm run build`
Expected: `Compiled successfully.` (Vercel's build runs with `CI=true`, which turns ESLint warnings into errors — this must be clean.)

- [ ] **Step 6: Commit**

```bash
git add src/components/engage/account-setup/WhatsAppProfilePreview.jsx src/components/engage/account-setup/__tests__/WhatsAppProfilePreview.test.jsx src/components/engage/account-setup/SetupInstructions.jsx src/components/engage/account-setup/__tests__/SetupInstructions.test.jsx src/pages/EngageAccountSetup.jsx src/pages/__tests__/EngageAccountSetup.test.jsx src/App.js
git commit -m "feat(meta-signup): wire setup CTAs to open the mock signup popup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Data hand-off (state lift + localStorage + popup open) ✅ Tasks 1, 5; 8-step wizard with the chrome swap at the steps-3/8 boundary ✅ Tasks 2-4; prefill mapping (phone/brand/category/website/email) ✅ Tasks 1, 3, 4; dummy OTP codes, masked email, WABA asset name ✅ Task 3; identical mock for both CTAs (no manual/AI distinction) ✅ Task 5 (`onStart` passed identically to both buttons); Finish closes the window ✅ Task 4; route as `AppShell` sibling, no `Sidebar.jsx` entry ✅ Task 5.
- **Placeholder scan:** No "TBD"/"implement later" anywhere — every deferred item from the spec's Open Items section is explicitly out of scope for this plan, not a gap within it.
- **Type/name consistency:** `buildSignupPayload`'s parameter names (`numberMode`, `numberValue`, `virtualNumberValue`, `brandName`, `category`, `website`, `email`) match exactly what `EngageAccountSetup.jsx` passes in Task 5. `readSignupPayload()`'s returned shape (`brandName`, `category`, `website`, `email`, `phoneNumber`) matches exactly what `MetaEmbeddedSignup.jsx` destructures via `payload.*` in Task 4. All 8 step components' prop names match exactly between their Task 3 definitions and their Task 4 call sites (verified: `IntroStep{onCancel,onContinue}`, `PhoneNumberStep{phoneNumber,onBack,onNext}`, `VerifyPhoneStep{phoneNumber,onBack,onNext}`, `SelectAssetsStep{onBack,onNext}`, `BusinessInfoStep{brandName,category,website,onBack,onNext}`, `ConnectingStep{onAutoAdvance}`, `EmailVerifyStep{email,onNext}`, `SuccessStep{brandName,onFinish}`). `WhatsAppProfilePreview`'s 24 props are defined once in Task 5's replacement file and passed with those exact names from `EngageAccountSetup.jsx` in the same task. All `data-testid` values introduced across Tasks 1-5 are each defined once and referenced identically wherever consumed (verified end-to-end, not just pairwise, across chrome/steps/page/wiring).
