# Connected Channels Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat "Channels" tab and the WhatsApp/RCS/SMS/Email stub nav items in Settings with one consolidated "Connected channels" section: a grouped list of connected channels, a "Connect channel" modal for adding new ones, and detail/edit pages for Shopify and per-WhatsApp-number settings (with a live profile preview), plus a lightweight detail view for every other channel type.

**Architecture:** New `src/components/settings/channels/` folder holding a list panel, a generic row component, a connect modal, three detail components, and a data module. Navigation between list and detail views is local component state in `ConnectedChannelsPanel` (no new routes), matching how the rest of the Settings page works.

**Tech Stack:** React function components + hooks, Tailwind utility classes (no CSS modules), shadcn `Dialog`/`Tabs`/`Tooltip` primitives from `@/components/ui/*` (the only shadcn primitives already used elsewhere in Settings/Team), `lucide-react` icons, Jest + React Testing Library.

## Global Constraints

- No real backend/API integration anywhere — every action is local mock state, using `previewToast()` (from `@/components/common/PreviewHeader`) for genuinely non-functional actions, matching every other Settings panel.
- Visual style: raw Tailwind utility classes using this codebase's existing tokens (`text-text-primary`, `text-text-secondary`, `text-text-muted`, `border-border`, `bg-surface`, `bg-primary`/`hover:bg-primary-hover`, `bg-primary-tint`) — not shadcn `Button`/`Input`/`Select` (Settings/Team code uses raw `<button>`/`<input>` styled with utility classes throughout).
- `data-testid` on every interactive element and every major container, matching the codebase-wide convention.
- Do not use the word "Avimee" anywhere in new mock data or copy.
- SMS is dropped entirely — not a connectable type, no nav item, no stub.
- Shopify is not offered in the Connect-channel modal (it's shown already-connected in the list only).
- One shared icon/color map (`channelIcons.js`) is used for every icon in this feature; the three other pre-existing, inconsistent icon/color mappings elsewhere in the codebase are left untouched (out of scope).

---

### Task 1: Data module + shared primitives (`channelIcons.js`, `Badge.jsx`, `data/mockChannels.js`)

**Files:**
- Create: `src/components/settings/channels/channelIcons.js`
- Create: `src/components/settings/channels/Badge.jsx`
- Create: `src/components/settings/channels/data/mockChannels.js`
- Test: `src/components/settings/channels/data/__tests__/mockChannels.test.js`
- Test: `src/components/settings/channels/__tests__/Badge.test.jsx`

**Interfaces:**
- Produces: `CHANNEL_TYPES` — object keyed by `shopify|email|webpush|whatsapp|facebook|instagram|emails|emailmarketing|livechat|rcs`, each `{ label, Icon, color }`.
- Produces: `Badge({ tone, children, testId })` default export — tone in `amber|emerald|violet|slate|rose`.
- Produces: `SHOPIFY_STORE`, `WHATSAPP_NUMBERS`, `FACEBOOK_PAGES`, `INSTAGRAM_ACCOUNTS`, `EMAIL_ADDRESSES`, `WEB_PUSH_CHANNEL`, `EMAIL_MARKETING_CHANNEL`, `CONNECT_CHANNEL_GROUPS` from `data/mockChannels.js`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/settings/channels/__tests__/Badge.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "../Badge";

describe("Badge", () => {
  it("renders its children with a tone-specific class", () => {
    render(<Badge tone="emerald">Default for Campaigns</Badge>);
    const badge = screen.getByText("Default for Campaigns");
    expect(badge).toHaveClass("bg-emerald-50");
  });

  it("defaults to the slate tone", () => {
    render(<Badge>Plain</Badge>);
    expect(screen.getByText("Plain")).toHaveClass("bg-slate-100");
  });
});
```

Create `src/components/settings/channels/data/__tests__/mockChannels.test.js`:

```js
import {
  SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
  EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL, CONNECT_CHANNEL_GROUPS,
} from "../mockChannels";

describe("mockChannels", () => {
  it("has no 'Avimee' anywhere in the mock content", () => {
    const blob = JSON.stringify({
      SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
      EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL,
    });
    expect(blob.toLowerCase()).not.toContain("avimee");
  });

  it("has exactly one default-for-campaigns WhatsApp number", () => {
    const defaults = WHATSAPP_NUMBERS.filter((n) => n.isDefaultForCampaigns);
    expect(defaults.length).toBe(1);
  });

  it("has 4 WhatsApp numbers with provider and quality fields", () => {
    expect(WHATSAPP_NUMBERS.length).toBe(4);
    WHATSAPP_NUMBERS.forEach((n) => {
      expect(typeof n.provider).toBe("string");
      expect(["High", "Medium", "Low"]).toContain(n.quality);
    });
  });

  it("does not include shopify as a connectable type", () => {
    const allTypeIds = CONNECT_CHANNEL_GROUPS.flatMap((g) => g.types.map((t) => t.id));
    expect(allTypeIds).not.toContain("shopify");
    expect(allTypeIds).not.toContain("sms");
  });

  it("every connect type has a formField with key/label/placeholder", () => {
    CONNECT_CHANNEL_GROUPS.forEach((g) => {
      g.types.forEach((t) => {
        expect(t.formField.key).toBeTruthy();
        expect(t.formField.label).toBeTruthy();
        expect(t.formField.placeholder).toBeTruthy();
      });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="channels/data/__tests__/mockChannels|channels/__tests__/Badge" --watchAll=false`
Expected: FAIL — cannot find modules `../mockChannels` / `../Badge`.

- [ ] **Step 3: Write `channelIcons.js`**

```js
// src/components/settings/channels/channelIcons.js
import { ShoppingBag, Mail, Globe, MessageCircle, Facebook, Instagram, Radio, MessageCircleHeart } from "lucide-react";

export const CHANNEL_TYPES = {
  shopify:        { label: "Shopify",         Icon: ShoppingBag,        color: "#96BF48" },
  email:          { label: "Email",           Icon: Mail,               color: "#3B82F6" },
  webpush:        { label: "Web push",        Icon: Globe,              color: "#6366F1" },
  whatsapp:       { label: "WhatsApp",        Icon: MessageCircle,      color: "#25D366" },
  facebook:       { label: "Facebook",        Icon: Facebook,           color: "#1877F2" },
  instagram:      { label: "Instagram",       Icon: Instagram,          color: "#E1306C" },
  emails:         { label: "Emails",          Icon: Mail,               color: "#3B82F6" },
  emailmarketing: { label: "Email marketing", Icon: Mail,               color: "#F59E0B" },
  livechat:       { label: "Live Chat",       Icon: MessageCircleHeart, color: "#8B5CF6" },
  rcs:            { label: "RCS",             Icon: Radio,              color: "#EF4444" },
};
```

- [ ] **Step 4: Write `Badge.jsx`**

```jsx
// src/components/settings/channels/Badge.jsx
import React from "react";

const TONES = {
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  rose:    "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Badge({ tone = "slate", children, testId }) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Write `data/mockChannels.js`**

```js
// src/components/settings/channels/data/mockChannels.js
export const SHOPIFY_STORE = {
  id: "shopify_1",
  name: "Herbal Roots",
  domain: "https://herbalroots.com",
  webhookStatus: "Live",
  customers: 921681,
  orders: 858226,
  products: 111,
  shortCode: "",
  websiteEventsScopeGranted: true,
  websiteEventsTrackerEnabled: true,
};

export const EMAIL_MARKETING_CHANNEL = { id: "em_mkt_1", name: "Email marketing" };
export const WEB_PUSH_CHANNEL = { id: "wp_1", name: "Web push notification" };

export const WHATSAPP_NUMBERS = [
  {
    id: "wa_1", number: "+91 74360 36062", username: "herbalroots",
    isExistingNumber: true, isDefaultForCampaigns: true,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false,
    businessDescription: "Grow naturally, feel beautifully.",
    messagesConsumed: 0, messagingLimit: 100000,
    about: "Hey, there! I am using WhatsApp.",
    businessAddress: "", businessEmail: "support@herbalroots.com", businessWebsite: "https://herbalroots.com/",
    catalogId: "1175317264111343", catalogAllowAccess: true, removeOutOfStock: false,
    brandName: "herbal-roots", brandLogoUrl: "",
    wabaId: "328175003703387", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_2", number: "+91 74360 36067", username: "herbalroots_support",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703388", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_3", number: "+91 74360 36065", username: "",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "Medium",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703389", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_4", number: "+91 98244 45471", username: "",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 25000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703390", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
];

export const FACEBOOK_PAGES = [
  { id: "fb_1", name: "Herbal Roots", url: "https://facebook.com/105513214301140" },
  { id: "fb_2", name: "Herbal Roots Hair", url: "https://facebook.com/541617399033389" },
];

export const INSTAGRAM_ACCOUNTS = [
  { id: "ig_1", name: "Herbal Roots", handle: "herbalroots" },
  { id: "ig_2", name: "herbalroots.hair", handle: "herbalroots.hair" },
];

export const EMAIL_ADDRESSES = [
  { id: "em_1", address: "support@herbalroots.com" },
  { id: "em_2", address: "business@herbalroots.com" },
  { id: "em_3", address: "marketing@herbalroots.com" },
];

// Drives the Connect-channel modal's picker step. Shopify is intentionally
// absent (real Shopify connections happen via app install, not this flow).
// SMS is intentionally absent (dropped from this feature entirely).
export const CONNECT_CHANNEL_GROUPS = [
  { group: "Business messaging", types: [
    { id: "whatsapp", desc: "Businesses can use the WhatsApp Business API to improve customer service.", formField: { key: "number", label: "Phone number", placeholder: "+91 98765 43210" } },
    { id: "instagram", desc: "Connect Instagram to automate customer comments, DMs, and reaction responses.", formField: { key: "handle", label: "Instagram handle", placeholder: "yourbrand" } },
    { id: "facebook", desc: "Connect Facebook to manage DMs and comments.", formField: { key: "url", label: "Facebook Page URL", placeholder: "https://facebook.com/yourbrand" } },
    { id: "webpush", desc: "Configure web push to send notifications across a user's device(s).", formField: { key: "name", label: "Website name", placeholder: "e.g. My Store" } },
    { id: "livechat", desc: "Manage real-time customer conversations via live chat.", formField: { key: "name", label: "Widget name", placeholder: "e.g. Support Chat" } },
    { id: "rcs", desc: "Leverage RCS for smart, automated, and broadcast messaging.", formField: { key: "number", label: "Phone number", placeholder: "+91 98765 43210" } },
  ]},
  { group: "Email", types: [
    { id: "emails", desc: "Connect email providers through SMTP to streamline your email communication.", formField: { key: "address", label: "Email address", placeholder: "you@yourstore.com" } },
    { id: "emailmarketing", desc: "Enables businesses to connect with their audience, deliver targeted messages, and drive results.", formField: { key: "name", label: "Sender name", placeholder: "e.g. Marketing Team" } },
  ]},
];
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="channels/data/__tests__/mockChannels|channels/__tests__/Badge" --watchAll=false`
Expected: PASS, 7 tests total.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/channels/channelIcons.js \
        src/components/settings/channels/Badge.jsx \
        src/components/settings/channels/data/mockChannels.js \
        src/components/settings/channels/data/__tests__/mockChannels.test.js \
        src/components/settings/channels/__tests__/Badge.test.jsx
git commit -m "feat: add channel icons map, Badge component, and mock channel data"
```

---

### Task 2: `ChannelRow.jsx`

**Files:**
- Create: `src/components/settings/channels/ChannelRow.jsx`
- Test: `src/components/settings/channels/__tests__/ChannelRow.test.jsx`

**Interfaces:**
- Consumes: nothing from Task 1 directly (pure presentational component).
- Produces: `ChannelRow({ title, subtitle, metadata, onClick, testId })` default export — a clickable list row with title, optional subtitle, optional right-aligned `metadata` node, and a trailing chevron.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/ChannelRow.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChannelRow from "../ChannelRow";

describe("ChannelRow", () => {
  it("renders title, subtitle, and metadata, and fires onClick", () => {
    const onClick = jest.fn();
    render(
      <ChannelRow
        title="+91 74360 36062"
        subtitle="@herbalroots"
        metadata={<span>Existing number</span>}
        onClick={onClick}
        testId="row-1"
      />
    );

    expect(screen.getByText("+91 74360 36062")).toBeInTheDocument();
    expect(screen.getByText("@herbalroots")).toBeInTheDocument();
    expect(screen.getByText("Existing number")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("row-1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders without a subtitle when none is given", () => {
    render(<ChannelRow title="Herbal Roots" onClick={jest.fn()} testId="row-2" />);
    expect(screen.getByText("Herbal Roots")).toBeInTheDocument();
  });

  it("fires onClick on Enter key for keyboard accessibility", () => {
    const onClick = jest.fn();
    render(<ChannelRow title="Herbal Roots" onClick={onClick} testId="row-3" />);
    fireEvent.keyDown(screen.getByTestId("row-3"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ChannelRow" --watchAll=false`
Expected: FAIL — cannot find module `../ChannelRow`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/ChannelRow.jsx
import React from "react";
import { ChevronRight } from "lucide-react";

export default function ChannelRow({ title, subtitle, metadata, onClick, testId }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      data-testid={testId}
      className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-text-muted truncate">{subtitle}</div>}
      </div>
      {metadata && <div className="flex items-center gap-2 flex-shrink-0">{metadata}</div>}
      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ChannelRow" --watchAll=false`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/ChannelRow.jsx \
        src/components/settings/channels/__tests__/ChannelRow.test.jsx
git commit -m "feat: add ChannelRow list-row component"
```

---

### Task 3: `SimpleChannelDetail.jsx`

**Files:**
- Create: `src/components/settings/channels/SimpleChannelDetail.jsx`
- Test: `src/components/settings/channels/__tests__/SimpleChannelDetail.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone, tested via direct props).
- Produces: `SimpleChannelDetail({ item, groupLabel, Icon, iconColor, identifierLabel, identifierKey, onBack, onUpdate, onDisconnect })` default export. `item` is `{ id, name, [identifierKey]: value, ... }`. `onUpdate(id, patch)` fires when the Name field loses focus. `onDisconnect(id)` fires from the Disconnect button. `onBack()` fires from the back arrow.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/SimpleChannelDetail.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Facebook } from "lucide-react";
import SimpleChannelDetail from "../SimpleChannelDetail";

const ITEM = { id: "fb_1", name: "Herbal Roots", url: "https://facebook.com/105513214301140" };

describe("SimpleChannelDetail", () => {
  it("renders the group label, name, and read-only identifier", () => {
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={jest.fn()} onDisconnect={jest.fn()}
      />
    );
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Herbal Roots")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://facebook.com/105513214301140")).toBeDisabled();
  });

  it("calls onUpdate with the new name on blur", () => {
    const onUpdate = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={onUpdate} onDisconnect={jest.fn()}
      />
    );
    const nameInput = screen.getByTestId("simple-detail-name");
    fireEvent.change(nameInput, { target: { value: "Herbal Roots Official" } });
    fireEvent.blur(nameInput);
    expect(onUpdate).toHaveBeenCalledWith("fb_1", { name: "Herbal Roots Official" });
  });

  it("calls onDisconnect with the item id", () => {
    const onDisconnect = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={jest.fn()} onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByTestId("simple-detail-disconnect"));
    expect(onDisconnect).toHaveBeenCalledWith("fb_1");
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={onBack} onUpdate={jest.fn()} onDisconnect={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("simple-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SimpleChannelDetail" --watchAll=false`
Expected: FAIL — cannot find module `../SimpleChannelDetail`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/SimpleChannelDetail.jsx
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function SimpleChannelDetail({ item, groupLabel, Icon, iconColor, identifierLabel, identifierKey, onBack, onUpdate, onDisconnect }) {
  const [name, setName] = useState(item.name || "");

  return (
    <div data-testid="simple-channel-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="simple-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
          <span className="text-sm font-semibold text-text-primary">{groupLabel}</span>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onUpdate(item.id, { name })}
            data-testid="simple-detail-name"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{identifierLabel}</span>
          <input
            type="text"
            defaultValue={item[identifierKey]}
            disabled
            data-testid="simple-detail-identifier"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          onClick={() => onDisconnect(item.id)}
          data-testid="simple-detail-disconnect"
          className="px-3 py-2 rounded-md border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SimpleChannelDetail" --watchAll=false`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/SimpleChannelDetail.jsx \
        src/components/settings/channels/__tests__/SimpleChannelDetail.test.jsx
git commit -m "feat: add SimpleChannelDetail generic detail view"
```

---

### Task 4: `ShopifyDetail.jsx`

**Files:**
- Create: `src/components/settings/channels/ShopifyDetail.jsx`
- Test: `src/components/settings/channels/__tests__/ShopifyDetail.test.jsx`

**Interfaces:**
- Consumes: `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`; `KpiTile, previewToast` from `@/components/common/PreviewHeader`.
- Produces: `ShopifyDetail({ store, onBack, onUpdate })` default export. `store` matches the `SHOPIFY_STORE` shape from Task 1. `onUpdate(patch)` fires on short-code Save and on the tracker toggle.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/ShopifyDetail.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopifyDetail from "../ShopifyDetail";

const STORE = {
  id: "shopify_1", name: "Herbal Roots", domain: "https://herbalroots.com",
  webhookStatus: "Live", customers: 921681, orders: 858226, products: 111,
  shortCode: "", websiteEventsScopeGranted: true, websiteEventsTrackerEnabled: true,
};

describe("ShopifyDetail", () => {
  it("renders the Details tab by default with store info and stat tiles", () => {
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={jest.fn()} />);
    expect(screen.getByText("Herbal Roots")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("921,681")).toBeInTheDocument();
    expect(screen.getByText("858,226")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
  });

  it("switches to the Others tab and shows the short code and tracker toggle", () => {
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={jest.fn()} />);
    fireEvent.click(screen.getByTestId("shopify-tab-others"));
    expect(screen.getByTestId("shopify-shortcode-input")).toBeInTheDocument();
    expect(screen.getByText("Scopes for website events")).toBeInTheDocument();
  });

  it("disables Save until a short code is typed, then calls onUpdate", () => {
    const onUpdate = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("shopify-tab-others"));

    const saveBtn = screen.getByTestId("shopify-shortcode-save");
    expect(saveBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId("shopify-shortcode-input"), { target: { value: "HR-UK" } });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onUpdate).toHaveBeenCalledWith({ shortCode: "HR-UK" });
  });

  it("toggles the website events tracker and calls onUpdate", () => {
    const onUpdate = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("shopify-tab-others"));
    fireEvent.click(screen.getByLabelText(/enable website events tracker/i));
    expect(onUpdate).toHaveBeenCalledWith({ websiteEventsTrackerEnabled: false });
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(<ShopifyDetail store={STORE} onBack={onBack} onUpdate={jest.fn()} />);
    fireEvent.click(screen.getByTestId("shopify-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ShopifyDetail" --watchAll=false`
Expected: FAIL — cannot find module `../ShopifyDetail`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/ShopifyDetail.jsx
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiTile, previewToast } from "@/components/common/PreviewHeader";

function DisabledField({ label, value, testId }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
      <input
        type="text"
        defaultValue={value}
        disabled
        data-testid={testId}
        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
      />
    </label>
  );
}

function ToggleSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-label={label}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function ShopifyDetail({ store, onBack, onUpdate }) {
  const [shortCode, setShortCode] = useState("");
  const [trackerEnabled, setTrackerEnabled] = useState(store.websiteEventsTrackerEnabled);

  const handleTrackerToggle = (next) => {
    setTrackerEnabled(next);
    onUpdate({ websiteEventsTrackerEnabled: next });
  };

  const handleSaveShortCode = () => onUpdate({ shortCode });

  const initials = store.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div data-testid="shopify-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="shopify-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-sm">🛍️</span>
          <span className="text-sm font-semibold text-text-primary">Shopify</span>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" data-testid="shopify-tab-details">Details</TabsTrigger>
          <TabsTrigger value="others" data-testid="shopify-tab-others">Others</TabsTrigger>
        </TabsList>

        <TabsContent value="details" data-testid="shopify-details-panel">
          <div className="flex gap-4 mt-2">
            <div className="flex-1 bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-text-secondary">
                  {initials}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-text-primary">{store.name}</div>
                  <a href={store.domain} target="_blank" rel="noreferrer" className="text-[12px] text-primary">{store.domain}</a>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-text-primary">Webhook connection status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">{store.webhookStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <KpiTile label="Customer" value={store.customers.toLocaleString("en-IN")} testId="shopify-kpi-customers" />
                <KpiTile label="Orders" value={store.orders.toLocaleString("en-IN")} testId="shopify-kpi-orders" />
                <KpiTile label="Products" value={store.products.toLocaleString("en-IN")} testId="shopify-kpi-products" />
              </div>
            </div>
            <div className="w-64 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
              Bik's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="others" data-testid="shopify-others-panel">
          <div className="max-w-xl space-y-4 mt-2">
            <DisabledField label="Store name" value={store.name} testId="shopify-others-name" />
            <DisabledField label="Store domain" value={store.domain} testId="shopify-others-domain" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Short code</span>
                <span className="text-[11px] text-text-muted">{shortCode.length}/7</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={shortCode}
                  maxLength={7}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="eg: BIK-UK"
                  data-testid="shopify-shortcode-input"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md text-text-primary"
                />
                <button
                  type="button"
                  disabled={shortCode.length === 0}
                  onClick={handleSaveShortCode}
                  data-testid="shopify-shortcode-save"
                  className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Use a short code to identify the store</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">Scopes for website events</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px]">✓</span>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[13px] font-semibold text-text-primary">Enable/Disable website events tracker</span>
                <p className="text-[11px] text-text-muted mt-1">
                  Your website events tracker permissions can also be tied with cookie consent settings. Please{" "}
                  <button type="button" onClick={() => previewToast()} className="text-primary underline">contact support</button> for more on this.
                </p>
              </div>
              <ToggleSwitch on={trackerEnabled} onChange={handleTrackerToggle} label="Enable website events tracker" />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">Scopes for syncing orders beyond 60 days</span>
              <button type="button" onClick={() => previewToast()} data-testid="shopify-request-access" className="text-[13px] text-primary font-medium">Request access</button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ShopifyDetail" --watchAll=false`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/ShopifyDetail.jsx \
        src/components/settings/channels/__tests__/ShopifyDetail.test.jsx
git commit -m "feat: add ShopifyDetail settings page (Details/Others tabs)"
```

---

### Task 5: `WhatsAppNumberDetail.jsx` — core settings + live preview

**Files:**
- Create: `src/components/settings/channels/WhatsAppNumberDetail.jsx`
- Test: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `Badge` from `./Badge`; `previewToast` from `@/components/common/PreviewHeader`.
- Produces: `WhatsAppNumberDetail({ number, onBack, onMakeDefault })` default export. `number` matches one `WHATSAPP_NUMBERS` entry from Task 1. `onMakeDefault(id)` fires when "Make Default for Campaigns" is clicked — the parent is responsible for unsetting the flag on every other number (this component doesn't know about siblings). All other editable fields (business description, about, business address, business email, business website, message consumed, messaging limit) are local component state, initialized from `number`, and do NOT propagate back to the parent — none of them are shown on the list view, so there's nothing to keep in sync, and re-opening this number after navigating away resets to the original mock values (acceptable for a mock/demo, avoids unnecessary prop-drilling).
- This task builds everything except the "Account overview" sub-section and the Facebook Catalog card (added in Task 6) — leave a comment marker `{/* Account overview + Facebook Catalog card added in a later task */}` at the bottom of the left column so Task 6 knows exactly where to insert.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppNumberDetail from "../WhatsAppNumberDetail";

const NUMBER = {
  id: "wa_1", number: "+91 74360 36062", username: "herbalroots",
  isExistingNumber: true, isDefaultForCampaigns: true,
  apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
  voiceCallEnabled: false, businessDescription: "Grow naturally, feel beautifully.",
  messagesConsumed: 0, messagingLimit: 100000,
  about: "Hey, there! I am using WhatsApp.",
  businessAddress: "", businessEmail: "support@herbalroots.com", businessWebsite: "https://herbalroots.com/",
  catalogId: "1175317264111343", catalogAllowAccess: true, removeOutOfStock: false,
  brandName: "herbal-roots", brandLogoUrl: "",
  wabaId: "328175003703387", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
};

const NON_DEFAULT_NUMBER = { ...NUMBER, id: "wa_2", isDefaultForCampaigns: false, quality: "Medium" };

describe("WhatsAppNumberDetail — header and badges", () => {
  it("shows the number, username, provider, and quality badges", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("+91 74360 36062")).toBeInTheDocument();
    expect(screen.getByText("@herbalroots")).toBeInTheDocument();
    expect(screen.getByText("Provider: TSP Karix")).toBeInTheDocument();
    expect(screen.getByText("Quality: High")).toBeInTheDocument();
  });

  it("shows a Default for Campaigns badge and a Migrate provider button when this number is the default", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("Default for Campaigns")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /migrate provider/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /make default for campaigns/i })).not.toBeInTheDocument();
  });

  it("shows a Make Default for Campaigns button when this number is not the default, and calls onMakeDefault", () => {
    const onMakeDefault = jest.fn();
    render(<WhatsAppNumberDetail number={NON_DEFAULT_NUMBER} onBack={jest.fn()} onMakeDefault={onMakeDefault} />);
    expect(screen.queryByText("Default for Campaigns")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /migrate provider/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /make default for campaigns/i }));
    expect(onMakeDefault).toHaveBeenCalledWith("wa_2");
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(<WhatsAppNumberDetail number={NUMBER} onBack={onBack} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("WhatsAppNumberDetail — message consumed / messaging limit refresh", () => {
  let randomSpy;
  beforeEach(() => { randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5); });
  afterEach(() => { randomSpy.mockRestore(); });

  it("changes the displayed messages-consumed value when its refresh icon is clicked", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-messages-consumed-value")).toHaveTextContent("0");
    fireEvent.click(screen.getByTestId("whatsapp-messages-consumed-refresh"));
    expect(screen.getByTestId("whatsapp-messages-consumed-value")).toHaveTextContent("250");
  });

  it("changes the displayed messaging-limit value when its refresh icon is clicked", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-messaging-limit-refresh"));
    expect(screen.getByTestId("whatsapp-messaging-limit-value")).toHaveTextContent("50000");
  });
});

describe("WhatsAppNumberDetail — editable rows and live preview", () => {
  it("shows an Add about button when about is empty, and a value with edit/delete icons once set", () => {
    render(<WhatsAppNumberDetail number={{ ...NUMBER, about: "" }} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-about-add")).toBeInTheDocument();
  });

  it("edits Business description and updates the live preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);

    fireEvent.click(screen.getByTestId("whatsapp-about-edit"));
    fireEvent.change(screen.getByTestId("whatsapp-about-input"), { target: { value: "New about text" } });
    fireEvent.click(screen.getByTestId("whatsapp-about-save"));

    expect(screen.getAllByText("New about text").length).toBeGreaterThan(0);
  });

  it("does not render a preview line for empty fields (business address is empty in the fixture)", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.queryByTestId("whatsapp-preview-address")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — cannot find module `../WhatsAppNumberDetail`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/WhatsAppNumberDetail.jsx
import React, { useState } from "react";
import { ArrowLeft, Copy, Pencil, Trash2, Plus, RefreshCw, UserRound } from "lucide-react";
import Badge from "./Badge";
import { previewToast } from "@/components/common/PreviewHeader";

function qualityTone(quality) {
  if (quality === "High") return "emerald";
  if (quality === "Medium") return "amber";
  return "rose";
}

function maskedNumber(num) {
  const digits = (num || "").replace(/\D/g, "");
  return `+${digits.slice(0, 2)}${"X".repeat(Math.max(digits.length - 2, 0))}`;
}

function EditableRow({ label, description, value, onSave, onDelete, testId, emptyLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  if (editing) {
    return (
      <div className="py-4 border-b border-border" data-testid={testId}>
        <div className="text-[13px] font-semibold text-text-primary mb-1">{label}</div>
        {description && <p className="text-[11px] text-text-muted mb-2">{description}</p>}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          data-testid={`${testId}-input`}
          className="w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
        />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => { onSave(draft); setEditing(false); }} data-testid={`${testId}-save`}
            className="px-3 py-1.5 text-[12px] rounded-md bg-primary text-white">Save</button>
          <button type="button" onClick={() => { setDraft(value || ""); setEditing(false); }} data-testid={`${testId}-cancel`}
            className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-border" data-testid={testId}>
      <div className="text-[13px] font-semibold text-text-primary mb-1">{label}</div>
      {description && <p className="text-[11px] text-text-muted mb-2">{description}</p>}
      {value ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-text-primary flex-1">&ldquo;{value}&rdquo;</p>
          <div className="flex gap-1 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} data-testid={`${testId}-edit`}
              className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-text-secondary hover:bg-slate-50">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onDelete} data-testid={`${testId}-delete`}
              className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-text-secondary hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} data-testid={`${testId}-add`}
          className="px-3 py-1.5 text-[12px] rounded-md border border-dashed border-border text-text-secondary hover:bg-slate-50 inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> {emptyLabel}
        </button>
      )}
    </div>
  );
}

export default function WhatsAppNumberDetail({ number, onBack, onMakeDefault }) {
  const [businessDescription, setBusinessDescription] = useState(number.businessDescription || "");
  const [about, setAbout] = useState(number.about || "");
  const [businessAddress, setBusinessAddress] = useState(number.businessAddress || "");
  const [businessEmail, setBusinessEmail] = useState(number.businessEmail || "");
  const [businessWebsite, setBusinessWebsite] = useState(number.businessWebsite || "");
  const [messagesConsumed, setMessagesConsumed] = useState(number.messagesConsumed);
  const [messagingLimit, setMessagingLimit] = useState(number.messagingLimit);

  const refreshMessagesConsumed = () => setMessagesConsumed(Math.floor(Math.random() * 500));
  const refreshMessagingLimit = () => {
    const tiers = [25000, 50000, 100000];
    setMessagingLimit(tiers[Math.floor(Math.random() * tiers.length)]);
  };

  return (
    <div data-testid="whatsapp-number-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="whatsapp-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px]">✓</div>
          <span className="text-sm font-semibold text-text-primary">Whatsapp</span>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
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
                {number.username && <span className="text-[13px] text-text-muted">@{number.username}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge tone="slate">Provider: {number.provider}</Badge>
              <Badge tone={qualityTone(number.quality)}>Quality: {number.quality}</Badge>
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

          <div className="py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-text-primary">WhatsApp voice call</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">BETA</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Connect with customers instantly via WhatsApp voice calls in the Helpdesk.</p>
            </div>
            <button type="button" onClick={() => previewToast()} className="text-[13px] text-primary font-medium flex-shrink-0">Setup</button>
          </div>

          <EditableRow
            label="Business description" description="Edit your WhatsApp Business account description."
            value={businessDescription} onSave={setBusinessDescription} onDelete={() => setBusinessDescription("")}
            testId="whatsapp-business-description" emptyLabel="Add description"
          />

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

          <div className="py-4 border-b border-border flex items-center justify-between" data-testid="whatsapp-messaging-limit">
            <span className="text-[13px] font-semibold text-text-primary">Messaging limit</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-primary" data-testid="whatsapp-messaging-limit-value">{messagingLimit}</span>
              <span className="text-[12px] text-text-muted">messages per day</span>
              <button type="button" onClick={refreshMessagingLimit} data-testid="whatsapp-messaging-limit-refresh" className="text-text-muted hover:text-text-primary">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <EditableRow
            label="About" description="Add your about section to be displayed on your whatsapp business profile."
            value={about} onSave={setAbout} onDelete={() => setAbout("")}
            testId="whatsapp-about" emptyLabel="Add about"
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

          {/* Account overview + Facebook Catalog card added in a later task */}
        </div>

        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4 mx-auto border-4 border-slate-900 rounded-[2rem] w-60 overflow-hidden bg-white">
            <div className="p-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-200 flex items-center justify-center">
                <UserRound className="w-7 h-7 text-slate-400" />
              </div>
              <div className="mt-2 text-[13px] font-semibold text-text-primary">{maskedNumber(number.number)}</div>
              <div className="text-[11px] text-text-muted">Shopping and Retail</div>
              <div className="mt-3 text-[11px] text-text-secondary">Official business account</div>
              <div className="mt-3 text-left space-y-1 text-[11px] text-emerald-700">
                {about && <p>{about}</p>}
                {businessAddress && <p data-testid="whatsapp-preview-address">{businessAddress}</p>}
                {businessEmail && <p>{businessEmail}</p>}
                {businessWebsite && <p>{businessWebsite}</p>}
              </div>
            </div>
            <div className="border-t border-border p-3 text-left">
              <div className="text-[10px] text-text-muted">About and phone number</div>
              <div className="text-[12px] text-text-primary">{about || "Hey there! I am using WhatsApp."}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Note: with `Math.random` mocked to always return `0.5` in the refresh tests, `Math.floor(0.5 * 500) === 250` and `tiers[Math.floor(0.5 * 3)] === tiers[1] === 50000` — matching the test's expected values exactly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx \
        src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat: add WhatsAppNumberDetail core settings and live preview"
```

---

### Task 6: `WhatsAppNumberDetail.jsx` — Account overview + Facebook Catalog card

**Files:**
- Modify: `src/components/settings/channels/WhatsAppNumberDetail.jsx`
- Modify: `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`

**Interfaces:**
- Consumes: `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` from `@/components/ui/tooltip` (for the Brand Name info icon).
- Produces: no new exports — extends the same `WhatsAppNumberDetail` component from Task 5 with additional left-column sections. `number`/`onBack`/`onMakeDefault` props are unchanged.

- [ ] **Step 1: Write the failing test**

Append to `WhatsAppNumberDetail.test.jsx`:

```jsx
describe("WhatsAppNumberDetail — account overview and Facebook Catalog", () => {
  it("renders the TSP onboarding and A/B testing links, and the MM Lite banner", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/test now/i)).toBeInTheDocument();
    expect(screen.getByText(/powered by mm lite api/i)).toBeInTheDocument();
  });

  it("renders WABA ID, Business Portfolio ID, and WABA Provider with Available pills", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByDisplayValue("328175003703387")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1379257819643222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TSPENGAGE")).toBeInTheDocument();
    expect(screen.getAllByText("Available").length).toBe(3);
  });

  it("renders the Facebook Catalog card with catalog id and access toggle", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("1175317264111343")).toBeInTheDocument();
    expect(screen.getByLabelText(/allow customer to access catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/remove out of stock products/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: FAIL — the 3 new tests can't find the account-overview/catalog content.

- [ ] **Step 3: Insert the account overview and Facebook Catalog sections**

In `WhatsAppNumberDetail.jsx`, add the import:

```jsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
```

Add local state for the catalog toggle and out-of-stock checkbox, near the other `useState` calls:

```jsx
  const [catalogAllowAccess, setCatalogAllowAccess] = useState(number.catalogAllowAccess);
  const [removeOutOfStock, setRemoveOutOfStock] = useState(number.removeOutOfStock);
```

Replace the `{/* Account overview + Facebook Catalog card added in a later task */}` marker with:

```jsx
          <div className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-[13px] font-semibold text-text-primary">WhatsApp Account Overview</span>
              <div className="flex items-center gap-4 text-[12px]">
                <span className="text-text-secondary">WhatsApp TSP Onboarding Status - <button type="button" onClick={() => previewToast()} className="text-primary font-medium">View Details</button></span>
                <span className="text-text-secondary">WhatsApp A/B Testing - <button type="button" onClick={() => previewToast()} className="text-primary font-medium">Test Now</button></span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800 mb-3">
              Meta enforces daily WhatsApp Business messaging limits for quality, compliance, and tier-based improvements.
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-violet-50 border border-emerald-200 rounded-lg p-3 text-[12px] text-emerald-800 mb-4 flex items-center gap-2">
              Your account is powered by MM Lite API. <span className="text-emerald-600">✓</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Display Name</span>
                <input type="text" defaultValue={number.brandName || number.number} disabled data-testid="whatsapp-display-name"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Messaging Limit</span>
                <input type="text" defaultValue={`${messagingLimit}`} disabled data-testid="whatsapp-overview-limit"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
              </label>
              {[
                { label: "WABA ID", value: number.wabaId },
                { label: "Phone Number", value: number.number.replace(/\D/g, "") },
                { label: "Business Portfolio ID", value: number.businessPortfolioId },
              ].map((f) => (
                <div key={f.label} className="flex items-end gap-2">
                  <label className="block flex-1">
                    <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{f.label}</span>
                    <input type="text" defaultValue={f.value} disabled data-testid={`whatsapp-field-${f.label}`}
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

            <p className="text-[13px] font-semibold text-text-primary mt-5 mb-3">Following details will be displayed on your WhatsApp Business Account profile.</p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium inline-flex items-center gap-1">
                  Brand Name
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="top">The name shown to customers on your WhatsApp Business profile.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <input type="text" defaultValue={number.brandName} data-testid="whatsapp-brand-name"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary" />
              </label>
              <div>
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Brand Logo</span>
                <div className="mt-1 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">f</div>
                <span className="text-[13px] font-semibold text-text-primary">Catalog Id:</span>
                <span className="text-[13px] text-text-primary">{number.catalogId}</span>
              </div>
              <a href="https://business.facebook.com/commerce/catalogs" target="_blank" rel="noreferrer" className="text-[12px] text-primary font-medium">Manage ↗</a>
            </div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={catalogAllowAccess}
                onChange={(e) => setCatalogAllowAccess(e.target.checked)}
                aria-label="Allow customer to access catalog"
                className="w-4 h-4"
              />
              <span className="text-[12px] text-text-secondary">Allow your customer to access above connected catalog anytime on WhatsApp</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeOutOfStock}
                onChange={(e) => setRemoveOutOfStock(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-[12px] text-text-secondary">Remove Out of Stock products from the catalog</span>
            </label>
            <div className="mt-3 bg-violet-50 border border-violet-100 rounded-md p-2 text-[11px] text-violet-700">
              Catalog will be synced regularly at an interval of 24 hours. Any changes made in the catalog will be reflected here after some time.
            </div>
          </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="WhatsAppNumberDetail" --watchAll=false`
Expected: PASS, 12 tests (9 from Task 5 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/WhatsAppNumberDetail.jsx \
        src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx
git commit -m "feat: add account overview and Facebook Catalog card to WhatsAppNumberDetail"
```

---

### Task 7: `ConnectChannelModal.jsx` — picker step

**Files:**
- Create: `src/components/settings/channels/ConnectChannelModal.jsx`
- Test: `src/components/settings/channels/__tests__/ConnectChannelModal.test.jsx`

**Interfaces:**
- Consumes: `Dialog, DialogContent, DialogHeader, DialogTitle` from `@/components/ui/dialog`; `CHANNEL_TYPES` from `./channelIcons`; `CONNECT_CHANNEL_GROUPS` from `./data/mockChannels`.
- Produces: `ConnectChannelModal({ open, onClose, onConnect })` default export. This task builds only the picker grid; clicking a type's Connect button is wired to a `step` state but the form step itself is added in Task 8 — for now, clicking Connect just calls a placeholder that will be replaced (write it to already call `setStep({ type: "form", typeId: t.id })`, and add a minimal fallback render for `step.type === "form"` that shows just the type label and a "Cancel" button, so this task's own tests can verify the step transition without depending on Task 8's form).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/ConnectChannelModal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectChannelModal from "../ConnectChannelModal";

describe("ConnectChannelModal — picker step", () => {
  it("renders both groups with every channel type", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.getByText("Business messaging")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-instagram")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-facebook")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-webpush")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-livechat")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-rcs")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-emails")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-emailmarketing")).toBeInTheDocument();
  });

  it("does not offer Shopify or SMS as connectable types", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.queryByTestId("connect-type-shopify")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-type-sms")).not.toBeInTheDocument();
  });

  it("moves to the form step when a type's Connect button is clicked", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    expect(screen.getByText(/connect whatsapp/i)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<ConnectChannelModal open={false} onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.queryByText("Business messaging")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ConnectChannelModal" --watchAll=false`
Expected: FAIL — cannot find module `../ConnectChannelModal`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/ConnectChannelModal.jsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHANNEL_TYPES } from "./channelIcons";
import { CONNECT_CHANNEL_GROUPS } from "./data/mockChannels";

function findType(typeId) {
  for (const group of CONNECT_CHANNEL_GROUPS) {
    const found = group.types.find((t) => t.id === typeId);
    if (found) return found;
  }
  return null;
}

export default function ConnectChannelModal({ open, onClose, onConnect }) {
  const [step, setStep] = useState({ type: "picker" });

  const handleClose = () => {
    setStep({ type: "picker" });
    onClose();
  };

  const selectedType = step.type === "form" ? findType(step.typeId) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl" data-testid="connect-channel-modal">
        {step.type === "picker" ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect channels</DialogTitle>
              <p className="text-[13px] text-text-secondary">Please choose a channel and the type of message you'd like to send</p>
            </DialogHeader>
            <div className="space-y-6">
              {CONNECT_CHANNEL_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="text-[13px] font-semibold text-text-primary mb-2">{group.group}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {group.types.map((t) => {
                      const meta = CHANNEL_TYPES[t.id];
                      const Icon = meta.Icon;
                      return (
                        <div key={t.id} data-testid={`connect-type-${t.id}`} className="border border-border rounded-lg p-4 flex flex-col gap-2">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                          </div>
                          <div className="text-[13px] font-semibold text-text-primary">{meta.label}</div>
                          <p className="text-[11px] text-text-muted flex-1">{t.desc}</p>
                          <button
                            type="button"
                            onClick={() => setStep({ type: "form", typeId: t.id })}
                            data-testid={`connect-type-${t.id}-btn`}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-primary text-primary hover:bg-primary-tint"
                          >
                            Connect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button type="button" onClick={() => setStep({ type: "picker" })} data-testid="connect-form-back" className="text-[12px] text-text-secondary mb-1 text-left">← Back</button>
              <DialogTitle>Connect {CHANNEL_TYPES[selectedType.id].label}</DialogTitle>
            </DialogHeader>
            <button type="button" onClick={handleClose} className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary w-fit">Cancel</button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ConnectChannelModal" --watchAll=false`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/ConnectChannelModal.jsx \
        src/components/settings/channels/__tests__/ConnectChannelModal.test.jsx
git commit -m "feat: add ConnectChannelModal picker step"
```

---

### Task 8: `ConnectChannelModal.jsx` — mini form step

**Files:**
- Modify: `src/components/settings/channels/ConnectChannelModal.jsx`
- Modify: `src/components/settings/channels/__tests__/ConnectChannelModal.test.jsx`

**Interfaces:**
- Produces: no new exports — replaces the Task 7 placeholder form-step markup with a real `ConnectForm` sub-component in the same file. `onConnect(typeId, values)` fires with `values` shaped `{ [formField.key]: enteredValue }` when the mini form is submitted; the modal then resets to the picker step and calls `onClose()`.

- [ ] **Step 1: Write the failing test**

Append to `ConnectChannelModal.test.jsx`:

```jsx
describe("ConnectChannelModal — form step", () => {
  it("renders the field for the selected type with its placeholder", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    expect(screen.getByPlaceholderText("+91 98765 43210")).toBeInTheDocument();
  });

  it("disables Connect until the field has a value, then calls onConnect and closes", () => {
    const onConnect = jest.fn();
    const onClose = jest.fn();
    render(<ConnectChannelModal open onClose={onClose} onConnect={onConnect} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));

    const submitBtn = screen.getByTestId("connect-form-submit");
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "+91 90000 00000" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(onConnect).toHaveBeenCalledWith("whatsapp", { number: "+91 90000 00000" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("goes back to the picker step from the form", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-instagram-btn"));
    fireEvent.click(screen.getByTestId("connect-form-back"));
    expect(screen.getByText("Business messaging")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ConnectChannelModal" --watchAll=false`
Expected: FAIL — the 3 new tests can't find `connect-form-input`/`connect-form-submit` (the Task 7 placeholder has neither).

- [ ] **Step 3: Replace the placeholder form step with `ConnectForm`**

In `ConnectChannelModal.jsx`, replace:

```jsx
        ) : (
          <>
            <DialogHeader>
              <button type="button" onClick={() => setStep({ type: "picker" })} data-testid="connect-form-back" className="text-[12px] text-text-secondary mb-1 text-left">← Back</button>
              <DialogTitle>Connect {CHANNEL_TYPES[selectedType.id].label}</DialogTitle>
            </DialogHeader>
            <button type="button" onClick={handleClose} className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary w-fit">Cancel</button>
          </>
        )}
```

with:

```jsx
        ) : (
          <ConnectForm
            type={selectedType}
            onBack={() => setStep({ type: "picker" })}
            onConnect={(values) => { onConnect(step.typeId, values); handleClose(); }}
            onCancel={handleClose}
          />
        )}
```

Then add, below the default-exported `ConnectChannelModal` function in the same file:

```jsx
function ConnectForm({ type, onBack, onConnect, onCancel }) {
  const [value, setValue] = useState("");
  const meta = CHANNEL_TYPES[type.id];

  return (
    <>
      <DialogHeader>
        <button type="button" onClick={onBack} data-testid="connect-form-back" className="text-[12px] text-text-secondary mb-1 text-left">← Back</button>
        <DialogTitle>Connect {meta.label}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 max-w-sm">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{type.formField.label}</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type.formField.placeholder}
            data-testid="connect-form-input"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary">Cancel</button>
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => onConnect({ [type.formField.key]: value.trim() })}
            data-testid="connect-form-submit"
            className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ConnectChannelModal" --watchAll=false`
Expected: PASS, 7 tests (4 from Task 7 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/ConnectChannelModal.jsx \
        src/components/settings/channels/__tests__/ConnectChannelModal.test.jsx
git commit -m "feat: add ConnectChannelModal mini connect form step"
```

---

### Task 9: `ConnectedChannelsPanel.jsx` — full integration

**Files:**
- Create: `src/components/settings/channels/ConnectedChannelsPanel.jsx`
- Test: `src/components/settings/channels/__tests__/ConnectedChannelsPanel.test.jsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8 — `CHANNEL_TYPES` (`./channelIcons`), `Badge` (`./Badge`), `ChannelRow` (`./ChannelRow`), `ConnectChannelModal` (`./ConnectChannelModal`), `ShopifyDetail` (`./ShopifyDetail`), `WhatsAppNumberDetail` (`./WhatsAppNumberDetail`), `SimpleChannelDetail` (`./SimpleChannelDetail`), and all the mock data exports (`./data/mockChannels`).
- Produces: `ConnectedChannelsPanel()` default export, no props — this is what `Settings.jsx`'s `PANELS.channels` will point to (Task 10).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/settings/channels/__tests__/ConnectedChannelsPanel.test.jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ConnectedChannelsPanel from "../ConnectedChannelsPanel";

describe("ConnectedChannelsPanel — list view", () => {
  it("renders the header and one section per connected group with the right row counts", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.getByText("Connected channels")).toBeInTheDocument();
    expect(screen.getByTestId("connect-channel-btn")).toBeInTheDocument();

    const shopify = screen.getByTestId("channel-group-shopify");
    expect(within(shopify).getByText("Herbal Roots")).toBeInTheDocument();

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    expect(within(whatsapp).getAllByText("+91 74360 36062").length).toBeGreaterThan(0);
    expect(within(whatsapp).getByText("Default for Campaigns")).toBeInTheDocument();
    expect(within(whatsapp).getByText("Facebook Catalog")).toBeInTheDocument();

    const facebook = screen.getByTestId("channel-group-facebook");
    expect(within(facebook).getByText("Herbal Roots Hair")).toBeInTheDocument();

    const emails = screen.getByTestId("channel-group-emails");
    expect(within(emails).getByText("marketing@herbalroots.com")).toBeInTheDocument();
  });

  it("does not render a section for groups with zero connected items (Live Chat, RCS)", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.queryByTestId("channel-group-livechat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("channel-group-rcs")).not.toBeInTheDocument();
  });
});

describe("ConnectedChannelsPanel — navigation to detail views", () => {
  it("opens ShopifyDetail on click and returns to the list on back", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getByText("Herbal Roots").closest('[role="button"]'));
    expect(screen.getByTestId("shopify-detail")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("shopify-detail-back"));
    expect(screen.getByTestId("channel-group-shopify")).toBeInTheDocument();
  });

  it("opens WhatsAppNumberDetail for the clicked number", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getAllByText("+91 74360 36065")[0].closest('[role="button"]'));
    expect(screen.getByTestId("whatsapp-number-detail")).toBeInTheDocument();
    expect(screen.getByText("Quality: Medium")).toBeInTheDocument();
  });

  it("making a number default in its detail view is reflected back in the list", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getAllByText("+91 74360 36065")[0].closest('[role="button"]'));
    fireEvent.click(screen.getByTestId("whatsapp-make-default"));
    fireEvent.click(screen.getByTestId("whatsapp-detail-back"));

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    const row65 = within(whatsapp).getAllByText("+91 74360 36065")[0].closest('[data-testid^="channel-row-"]');
    expect(within(row65).getByText("Default for Campaigns")).toBeInTheDocument();
  });

  it("opens SimpleChannelDetail for a Facebook page and disconnecting it removes the row", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getByText("Herbal Roots Hair").closest('[role="button"]'));
    expect(screen.getByTestId("simple-channel-detail")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("simple-detail-disconnect"));
    expect(screen.queryByText("Herbal Roots Hair")).not.toBeInTheDocument();
  });
});

describe("ConnectedChannelsPanel — connecting a new channel", () => {
  it("opens the modal, connects a new WhatsApp number, and shows it in the list", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getByTestId("connect-channel-btn"));
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "+91 90000 00000" } });
    fireEvent.click(screen.getByTestId("connect-form-submit"));

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    expect(within(whatsapp).getByText("+91 90000 00000")).toBeInTheDocument();
  });

  it("connecting a Live Chat widget creates a new Live Chat section", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.queryByTestId("channel-group-livechat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("connect-channel-btn"));
    fireEvent.click(screen.getByTestId("connect-type-livechat-btn"));
    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "Support Chat" } });
    fireEvent.click(screen.getByTestId("connect-form-submit"));

    expect(screen.getByTestId("channel-group-livechat")).toBeInTheDocument();
    expect(within(screen.getByTestId("channel-group-livechat")).getByText("Support Chat")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ConnectedChannelsPanel" --watchAll=false`
Expected: FAIL — cannot find module `../ConnectedChannelsPanel`.

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/settings/channels/ConnectedChannelsPanel.jsx
import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { CHANNEL_TYPES } from "./channelIcons";
import Badge from "./Badge";
import ChannelRow from "./ChannelRow";
import ConnectChannelModal from "./ConnectChannelModal";
import ShopifyDetail from "./ShopifyDetail";
import WhatsAppNumberDetail from "./WhatsAppNumberDetail";
import SimpleChannelDetail from "./SimpleChannelDetail";
import {
  SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
  EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL,
} from "./data/mockChannels";

function qualityTone(quality) {
  if (quality === "High") return "emerald";
  if (quality === "Medium") return "amber";
  return "rose";
}

const SIMPLE_IDENTIFIER_CONFIG = {
  facebook:       { key: "url",     label: "Page URL" },
  instagram:      { key: "handle",  label: "Handle" },
  emails:         { key: "address", label: "Email address" },
  webpush:        { key: "name",    label: "Website name" },
  emailmarketing: { key: "name",    label: "Sender name" },
  livechat:       { key: "name",    label: "Widget name" },
  rcs:            { key: "number",  label: "Phone number" },
};

function rowTitle(groupKey, item) {
  if (groupKey === "shopify") return item.name;
  if (groupKey === "whatsapp") return item.number;
  if (groupKey === "emails") return item.address;
  return item.name;
}

function rowSubtitle(groupKey, item) {
  if (groupKey === "whatsapp" && item.username) return `@${item.username}`;
  return null;
}

function rowMetadata(groupKey, item) {
  if (groupKey === "shopify") return <span className="text-[12px] text-text-muted">{item.domain}</span>;
  if (groupKey === "whatsapp") {
    return (
      <>
        {item.isExistingNumber && <Badge tone="amber">Existing number</Badge>}
        <Badge tone="slate">Provider: {item.provider}</Badge>
        <Badge tone={qualityTone(item.quality)}>Quality: {item.quality}</Badge>
        {item.isDefaultForCampaigns && <Badge tone="emerald">Default for Campaigns</Badge>}
        <Badge tone="violet">{item.apiTier}</Badge>
      </>
    );
  }
  if (groupKey === "facebook") return <span className="text-[12px] text-text-muted">{item.url}</span>;
  if (groupKey === "instagram") return <span className="text-[12px] text-text-muted">{item.handle}</span>;
  return null;
}

export default function ConnectedChannelsPanel() {
  const [shopify, setShopify] = useState(SHOPIFY_STORE);
  const [whatsappNumbers, setWhatsappNumbers] = useState(WHATSAPP_NUMBERS);
  const [simpleChannels, setSimpleChannels] = useState({
    facebook: FACEBOOK_PAGES,
    instagram: INSTAGRAM_ACCOUNTS,
    emails: EMAIL_ADDRESSES,
    webpush: [WEB_PUSH_CHANNEL],
    emailmarketing: [EMAIL_MARKETING_CHANNEL],
    livechat: [],
    rcs: [],
  });
  const [view, setView] = useState({ type: "list" });
  const [modalOpen, setModalOpen] = useState(false);

  const onMakeDefault = (id) => {
    setWhatsappNumbers((prev) => prev.map((n) => ({ ...n, isDefaultForCampaigns: n.id === id })));
  };

  const updateSimpleItem = (groupKey, id, patch) => {
    setSimpleChannels((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  };

  const disconnectSimpleItem = (groupKey, id) => {
    setSimpleChannels((prev) => ({ ...prev, [groupKey]: prev[groupKey].filter((i) => i.id !== id) }));
  };

  const findSimpleItem = (groupKey, id) => (simpleChannels[groupKey] || []).find((i) => i.id === id);

  const handleConnect = (typeId, values) => {
    const id = `${typeId}_${Date.now()}`;
    if (typeId === "whatsapp") {
      setWhatsappNumbers((prev) => [...prev, {
        id, number: values.number, username: "", isExistingNumber: false, isDefaultForCampaigns: false,
        apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High", voiceCallEnabled: false,
        businessDescription: "", messagesConsumed: 0, messagingLimit: 25000, about: "", businessAddress: "",
        businessEmail: "", businessWebsite: "", catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
        brandName: "", brandLogoUrl: "", wabaId: "", businessPortfolioId: "", wabaProvider: "",
      }]);
      return;
    }
    const name = values.name || values.handle || values.url || values.address || values.number || "";
    setSimpleChannels((prev) => ({
      ...prev,
      [typeId]: [...(prev[typeId] || []), { id, name, ...values }],
    }));
  };

  const openDetail = (groupKey, id) => {
    if (groupKey === "shopify") setView({ type: "shopify" });
    else if (groupKey === "whatsapp") setView({ type: "whatsapp", id });
    else setView({ type: "simple", groupKey, id });
  };

  const backToList = () => setView({ type: "list" });

  const groups = [
    { key: "shopify", label: "Shopify", items: [shopify] },
    { key: "emailmarketing", label: "Email", items: simpleChannels.emailmarketing },
    { key: "webpush", label: "Web push", items: simpleChannels.webpush },
    { key: "whatsapp", label: "Whatsapp", items: whatsappNumbers },
    { key: "facebook", label: "Facebook", items: simpleChannels.facebook },
    { key: "instagram", label: "Instagram", items: simpleChannels.instagram },
    { key: "emails", label: "Emails", items: simpleChannels.emails },
    { key: "livechat", label: "Live Chat", items: simpleChannels.livechat },
    { key: "rcs", label: "RCS", items: simpleChannels.rcs },
  ];

  if (view.type === "shopify") {
    return <ShopifyDetail store={shopify} onBack={backToList} onUpdate={(patch) => setShopify((prev) => ({ ...prev, ...patch }))} />;
  }

  if (view.type === "whatsapp") {
    return (
      <WhatsAppNumberDetail
        number={whatsappNumbers.find((n) => n.id === view.id)}
        onBack={backToList}
        onMakeDefault={onMakeDefault}
      />
    );
  }

  if (view.type === "simple") {
    const config = SIMPLE_IDENTIFIER_CONFIG[view.groupKey];
    const meta = CHANNEL_TYPES[view.groupKey];
    return (
      <SimpleChannelDetail
        item={findSimpleItem(view.groupKey, view.id)}
        groupLabel={meta.label}
        Icon={meta.Icon}
        iconColor={meta.color}
        identifierLabel={config.label}
        identifierKey={config.key}
        onBack={backToList}
        onUpdate={(id, patch) => updateSimpleItem(view.groupKey, id, patch)}
        onDisconnect={(id) => { disconnectSimpleItem(view.groupKey, id); backToList(); }}
      />
    );
  }

  return (
    <div data-testid="connected-channels-panel">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Connected channels</h2>
          <p className="text-[13px] text-text-secondary mt-1">Here is the list of channels that are already connected on your inbox</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          data-testid="connect-channel-btn"
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
        >
          Connect channel
        </button>
      </div>

      {groups.filter((g) => g.items.length > 0).map((g) => (
        <div key={g.key} className="mb-6" data-testid={`channel-group-${g.key}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-text-primary">{g.label}</span>
            {g.key === "whatsapp" && (
              <a href="https://business.facebook.com/commerce/catalogs" target="_blank" rel="noreferrer" className="text-[12px] text-primary font-medium inline-flex items-center gap-1">
                Facebook Catalog <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {g.items.map((item) => (
              <ChannelRow
                key={item.id}
                title={rowTitle(g.key, item)}
                subtitle={rowSubtitle(g.key, item)}
                metadata={rowMetadata(g.key, item)}
                onClick={() => openDetail(g.key, item.id)}
                testId={`channel-row-${g.key}-${item.id}`}
              />
            ))}
          </div>
        </div>
      ))}

      <ConnectChannelModal open={modalOpen} onClose={() => setModalOpen(false)} onConnect={handleConnect} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ConnectedChannelsPanel" --watchAll=false`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/channels/ConnectedChannelsPanel.jsx \
        src/components/settings/channels/__tests__/ConnectedChannelsPanel.test.jsx
git commit -m "feat: add ConnectedChannelsPanel integrating list, detail views, and connect modal"
```

---

### Task 10: Wire into `Settings.jsx`

**Files:**
- Modify: `src/pages/Settings.jsx`

**Interfaces:**
- Consumes: `ConnectedChannelsPanel` (default export) from `@/components/settings/channels/ConnectedChannelsPanel`.
- Produces: no new exports — `SUB_NAV` and `PANELS` updated, dead code removed.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/Settings.test.jsx` (new file — none exists today):

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsPage from "../Settings";

describe("SettingsPage", () => {
  it("shows Connected channels in the nav (not the old Channels/WhatsApp/RCS/SMS/Email items) and renders it by default when clicked", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Connected channels")).toBeInTheDocument();
    expect(screen.queryByText(/^WhatsApp$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^RCS$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^SMS$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Email$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Connected channels"));
    expect(screen.getByTestId("connected-channels-panel")).toBeInTheDocument();
  });

  it("still renders the Account tab by default", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("settings-account")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/Settings" --watchAll=false`
Expected: FAIL — nav still shows "Channels" (not "Connected channels") and the old WhatsApp/RCS/SMS/Email items are still present.

- [ ] **Step 3: Update `Settings.jsx`**

Add the import at the top, alongside the other imports:

```js
import ConnectedChannelsPanel from "@/components/settings/channels/ConnectedChannelsPanel";
```

Remove `Plug`'s sibling icon imports that become unused (`MessageCircle`, `MessageSquare`, `Smartphone`, `ShoppingBag`, `Radio` are used only by the deleted `CHANNELS`/`BlankChannelPanel` code — check each remains needed elsewhere in the file before removing; `Mail` and `Bell` are still used by `NotificationsPanel`'s unrelated content, keep those). After checking, the import block becomes:

```js
import {
  User,
  Plug,
  CreditCard,
  UsersRound,
  BellRing,
  KeyRound,
  Mail,
  Bell,
} from "lucide-react";
```

Update `SUB_NAV`:

```js
const SUB_NAV = [
  { id: "account", label: "Account", Icon: User },
  { id: "channels", label: "Connected channels", Icon: Plug },
  { id: "billing", label: "Billing", Icon: CreditCard },
  { id: "team", label: "Team", Icon: UsersRound },
  { id: "notifications", label: "Notifications", Icon: BellRing },
  { id: "api", label: "API Keys", Icon: KeyRound },
];
```

Delete the `CHANNELS` const and the `ChannelsPanel` function entirely (lines were 74–128 before this change — re-locate by searching for `const CHANNELS = [` and removing through the `ChannelsPanel` function's closing `}`).

Delete `BlankChannelPanel`, `WhatsAppPanel`, `RcsPanel`, `SmsPanel`, `EmailPanel` entirely (search for `function BlankChannelPanel` through `function EmailPanel() {\n  return <BlankChannelPanel id="email" title="Email" />;\n}`).

Update `PANELS`:

```js
const PANELS = {
  account: AccountPanel,
  channels: ConnectedChannelsPanel,
  billing: BillingPanel,
  team: TeamManagementPanel,
  notifications: NotificationsPanel,
  api: ApiPanel,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/Settings" --watchAll=false`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Settings.jsx src/pages/__tests__/Settings.test.jsx
git commit -m "feat: wire ConnectedChannelsPanel into Settings, remove old Channels/stub nav items"
```

---

### Task 11: Full regression pass

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Run the full channels + Settings test suite**

Run: `npx craco test --testPathPattern="settings/channels|pages/__tests__/Settings" --watchAll=false`
Expected: PASS — every test file created/modified across Tasks 1–10, no failures.

- [ ] **Step 2: Run the full repo test suite**

Run: `npx craco test --watchAll=false`
Expected: PASS except for pre-existing, unrelated failures already known before this feature (`src/store/__tests__/campaignBuilderStore.test.js`, `src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx`, `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabCarousel.test.jsx`). If any other suite fails, that's a regression from this plan — fix it before considering the plan complete.

- [ ] **Step 3: Production build check**

Run: `npx craco build`
Expected: compiles cleanly, no new errors or warnings attributable to the `src/components/settings/channels/` files or `src/pages/Settings.jsx`.

- [ ] **Step 4: Manual smoke-test note**

If a browser-automation tool (e.g. `chromium-cli`, Playwright) is available in this environment, start the dev server and click through: Settings → Connected channels → open a WhatsApp number → Make Default for Campaigns → back → confirm the list shows the new default → Connect channel → connect a new Instagram handle → confirm it appears under Instagram. If no such tool is available, state that explicitly rather than skipping this step silently — the automated test suite from Tasks 1–10 is strong evidence but is not the same as an eyes-on check.

- [ ] **Step 5: Commit (only if Steps 1–3 required fixes)**

```bash
git add -A
git commit -m "fix: address regressions found in full test/build pass for Connected Channels"
```

(Skip this step entirely if nothing needed fixing.)

---

## Self-Review Notes

- **Spec coverage:** §2 nav changes → Task 10. §3.1 icon consolidation → Task 1. §4 mock data → Task 1. §5 list page/ChannelRow → Tasks 2, 9. §6 connect modal → Tasks 7, 8. §7 Shopify detail → Task 4. §8 WhatsApp detail (core + account overview/catalog) → Tasks 5, 6. §9 SimpleChannelDetail → Task 3. §10 testing → one test file per component throughout, plus Task 11. §11 out-of-scope items → nothing built for these, confirmed by omission (no OAuth, no SMS, no rich detail for the lightweight types, no real image upload, other icon maps untouched).
- **Type consistency:** `WhatsAppNumberDetail`'s `number` shape (Task 5/6) matches `WHATSAPP_NUMBERS` exactly (Task 1) field-for-field. `SimpleChannelDetail`'s `identifierKey`/`identifierLabel` props (Task 3) match `SIMPLE_IDENTIFIER_CONFIG`'s shape used in `ConnectedChannelsPanel` (Task 9). `ConnectChannelModal`'s `onConnect(typeId, values)` (Task 8) matches `ConnectedChannelsPanel.handleConnect`'s destructuring (Task 9) for every type's `formField.key`.
- **No placeholders:** every step has complete, runnable code. The one intentionally-temporary marker (`{/* Account overview + Facebook Catalog card added in a later task */}` in Task 5) is explicitly named and replaced by exact string match in Task 6 — not left dangling.
