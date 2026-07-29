# Connected Channels (Settings) — Design Spec

**Date:** 2026-07-29
**Status:** Draft
**Scope:** `src/pages/Settings.jsx` and a new `src/components/settings/channels/` feature area

---

## 1. Summary

Replace the current flat "Channels" tab (a 2-col card grid with no detail views) and the separate "WhatsApp" / "RCS" / "SMS" / "Email" stub nav items (all "coming soon") with one consolidated **"Connected channels"** section, matching the provided wireframes: a grouped list of everything currently connected, a "Connect channel" button/modal for adding new channels, and detail/edit pages for Shopify and each WhatsApp number (richer, per the wireframes), plus a lightweight detail view for every other channel type.

No real backend integration — this is a mock/demo app throughout (same pattern as every other Settings panel, which uses `previewToast()` for non-functional actions). Mock business name is generic (not "Avimee").

---

## 2. Navigation changes (`src/pages/Settings.jsx`)

`SUB_NAV` drops the `whatsapp`, `rcs`, `sms`, `email` entries entirely. The existing `channels` entry's label changes from "Channels" to "Connected channels" and its icon/panel are replaced:

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

`PANELS.channels` points to the new `ConnectedChannelsPanel` (replacing the local `ChannelsPanel` function, which is deleted). `WhatsAppPanel`/`RcsPanel`/`SmsPanel`/`EmailPanel`/`BlankChannelPanel` are deleted (no longer referenced anywhere). The old `CHANNELS` const is deleted.

SMS has no presence in the wireframes' Connect modal or list — it is dropped, not carried forward as a hidden/future type. RCS keeps a route to being connected (it's in the Connect modal's picker), but has no dedicated rich detail page — it uses `SimpleChannelDetail` like Live Chat.

---

## 3. File structure

```
src/components/settings/channels/
  ConnectedChannelsPanel.jsx   — main list view + local view-state router (list | detail)
  ChannelRow.jsx                — one row: icon/avatar + name + metadata + chevron
  ConnectChannelModal.jsx       — picker grid -> per-type mini form -> success
  ShopifyDetail.jsx             — Details/Others tabs
  WhatsAppNumberDetail.jsx      — rich per-number settings + live phone preview
  SimpleChannelDetail.jsx       — generic lightweight detail (FB/IG/Email/WebPush/EmailMarketing/LiveChat/RCS)
  channelIcons.js                — consolidated icon/color map for every channel type
  data/mockChannels.js          — all mock data + the CONNECT_CHANNEL_TYPES catalogue
```

### 3.1 `channelIcons.js` — consolidation

Three different, inconsistent `{Icon, color}` mappings currently exist (`Settings.jsx`'s own `CHANNELS`, `StartFlowNode`'s `CHANNEL_ICONS`, `ChannelPickerModal`'s `CHANNEL_OPTIONS`). Rather than add a fourth, this feature introduces one shared map and uses it exclusively for every icon/color in this feature (it does not touch or migrate the other three existing call sites — that's out of scope, no unrelated refactor):

```js
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

(`lucide-react` ships `Facebook` and `Instagram` brand-shaped icons already — confirmed available in this project's installed version — so no custom SVGs are needed.)

---

## 4. Mock data (`data/mockChannels.js`)

```js
export const SHOPIFY_STORE = {
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
  { id: "wa_2", number: "+91 74360 36067", username: "herbalroots_support", isExistingNumber: true, isDefaultForCampaigns: false, apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High", voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000, about: "", businessAddress: "", businessEmail: "", businessWebsite: "", catalogId: "", catalogAllowAccess: false, removeOutOfStock: false, brandName: "", brandLogoUrl: "", wabaId: "328175003703388", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE" },
  { id: "wa_3", number: "+91 74360 36065", username: "", isExistingNumber: true, isDefaultForCampaigns: false, apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "Medium", voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000, about: "", businessAddress: "", businessEmail: "", businessWebsite: "", catalogId: "", catalogAllowAccess: false, removeOutOfStock: false, brandName: "", brandLogoUrl: "", wabaId: "328175003703389", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE" },
  { id: "wa_4", number: "+91 98244 45471", username: "", isExistingNumber: true, isDefaultForCampaigns: false, apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High", voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 25000, about: "", businessAddress: "", businessEmail: "", businessWebsite: "", catalogId: "", catalogAllowAccess: false, removeOutOfStock: false, brandName: "", brandLogoUrl: "", wabaId: "328175003703390", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE" },
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
// absent — it isn't offered in the wireframe's connect modal (real Shopify
// connections happen via app install, not this flow).
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

`ConnectedChannelsPanel` holds `WHATSAPP_NUMBERS`, `FACEBOOK_PAGES`, etc. in local `useState` (seeded from these exports) so that connecting a new one or editing an existing one re-renders the list — matching the rest of this codebase's convention of mock arrays as `useState` initial values, not a global store.

---

## 5. `ConnectedChannelsPanel.jsx` — list page

Owns one piece of state: `view` — either `{ type: "list" }` or `{ type: "shopify" }` / `{ type: "whatsapp", id }` / `{ type: "simple", group, id }`. Renders the list when `view.type === "list"`, otherwise renders the matching detail component with a `back` callback that resets `view` to `{ type: "list" }`. No new routes.

**List view**, top to bottom:
- Header: "Connected channels" title + "Here is the list of channels that are already connected on your inbox" subtitle + **Connect channel** button (top-right, opens `ConnectChannelModal`).
- One section per group that has ≥1 connected item, in this order: Shopify, Email (marketing), Web push, WhatsApp, Facebook, Instagram, Emails. Each section: small icon + group label heading, then a `bg-surface border border-border rounded-lg divide-y divide-border` list of `ChannelRow`s (exact container styling reused from the existing Notifications panel).
- WhatsApp's group heading row also shows a right-aligned **"Facebook Catalog ↗"** external link (`target="_blank"`, a fixed placeholder URL to Meta's commerce manager) — matches the wireframe exactly.
- Each WhatsApp row shows: number + `@username` (or nothing if unset) on the left; on the right, badges in this order — `Existing number` (amber, if `isExistingNumber`), `Provider: TSP Karix` (slate), `Quality: High` (emerald if High, amber if Medium, rose if Low), `Default for Campaigns` (emerald, if default), `Marketing Message Lite API` (violet, from `apiTier`) — then the chevron.
- Shopify row: store name + domain, chevron. Facebook/Instagram/Email rows: name + handle/URL/address, chevron.

**`ChannelRow.jsx`** is the one shared row component (icon-or-blank-avatar, title, optional subtitle, right-aligned metadata slot — badges or plain text — chevron, `onClick`), generalizing the existing `ChannelsPanel` card shape from a card grid into a list row (icon circle style, `text-[13px] font-semibold` title, `text-[11px] text-text-muted` subtitle — same type-scale as the rest of Settings).

---

## 6. `ConnectChannelModal.jsx`

Built on the shared `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` primitives (`@/components/ui/dialog`), styled like `ChannelPickerModal.jsx` (icon-circle + title + description cards) but wider (`max-w-3xl`) to fit the 5-wide grid from the wireframe, and stateful across two steps:

**Step 1 — picker.** Renders `CONNECT_CHANNEL_GROUPS`, each group as a labeled heading + `grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3` of cards (icon in tinted circle from `channelIcons.js`, title, one-line description, its own outlined "Connect" button — `border border-primary text-primary`, matching the wireframe's outlined-not-filled Connect buttons). Clicking a card's Connect button moves to step 2 for that type.

**Step 2 — mini form.** Same dialog, header changes to "Connect {label}" with a back-chevron to step 1. Renders the one field from that type's `formField` (a plain labeled text input, same `Field`-style markup already used in `AccountPanel`) plus Cancel/Connect footer buttons. Submitting:
- Generates a new mock id and pushes a new entry onto the relevant array in `ConnectedChannelsPanel`'s state (e.g. a new `WHATSAPP_NUMBERS` entry with the entered number, `isExistingNumber: false`, `isDefaultForCampaigns: false`, sensible zeroed/default values for everything else; a new Facebook/Instagram/Email/etc. entry with just the entered value as name/handle/address).
- Closes the modal and returns to the list view, where the new row is now visible.

Shopify is not selectable here (see §4) — no step-2 form needed for it.

---

## 7. `ShopifyDetail.jsx`

Back-arrow header (`← Shopify`, icon + label, matching the WhatsApp detail header's exact chrome). Body: shadcn `Tabs` with two triggers, **Details** (default) and **Others** — same primitive already used for the Team panel's Members/Roles tabs.

**Details tab:** store initials avatar + name + domain link, a right-side card with the Google API Services disclosure text (static), a "Webhook connection status" row with a `Live` pill (emerald), and a 3-up stat-tile row (Customer / Orders / Products) using the same tile shape as `PreviewHeader`'s `KpiTile` if reusable, otherwise a small local equivalent (icon + label + big number).

**Others tab:** Store name / Store domain (disabled/grey inputs matching the wireframe's greyed-out look — reuse the existing disabled `Field` input style from `AccountPanel`), a "Short code" input with a live `0/7` counter and a disabled "Save" button that enables once 1+ chars are typed, then three settings rows in `bg-surface border border-border rounded-lg` boxes: "Scopes for website events" (green check pill, read-only), "Enable/Disable website events tracker" (the hand-rolled toggle from `NotificationsPanel`, wired to local state) with the cookie-consent helper text + `contact support` link, and "Scopes for syncing orders beyond 60 days" with a "Request access" link (`previewToast()`).

---

## 8. `WhatsAppNumberDetail.jsx`

Two-column layout: left column `flex-1` (settings), right column fixed-width sticky (live preview) — same structural idiom as the Flow Builder's `UnifiedTemplateModal` (form left, live bubble preview right), reimplemented locally here since this preview shows a WhatsApp *profile* card, not a message bubble.

**Left column, top to bottom:**
1. Header: back-arrow, small WhatsApp icon badge + "Whatsapp" label (matches wireframe chrome).
2. Number row: avatar placeholder, `+91 74360 36065` + copy-icon button (copies to clipboard), `@username` chip or a dashed **"+ Set username"** affordance if unset.
3. Top-right action cluster: `Provider: TSP Karix` and `Quality: High/Medium/Low` badges always shown; then — if `isDefaultForCampaigns` is false, a filled **"Make Default for Campaigns"** button that, on click, sets this number's `isDefaultForCampaigns: true` and unsets it on whichever other number currently holds it (only one default at a time); if true, a `Default for Campaigns` badge plus an outlined **"Migrate provider"** button next to it, which simply calls `previewToast()` on click (no confirm dialog, no state change — actual provider migration has no real backend here, same treatment as every other non-functional action in Settings).
4. "WhatsApp voice call" row with a `BETA` pill, description text, right-aligned "Setup" link (`previewToast()`).
5. "Business description" row: current value in quotes, edit (pencil) and delete (trash) icon buttons — edit opens an inline textarea + Save/Cancel, matching the pencil/trash convention already used for the address/about/website rows.
6. "Message consumed" row: `{messagesConsumed} messages consumed` + a refresh icon button that re-rolls the mock number (random int, just to feel alive — matches the wireframe's ↻ icon).
7. "Messaging limit" row: `{messagingLimit} messages per day` + the same refresh icon (re-rolls within a plausible range).
8. "About" row — empty state shows a dashed **"+ Add about"** button (per the first wireframe); once set, shows the text + edit/delete icons (per the second wireframe's fuller state).
9. "Business address", "Email for business contact", "Business website" rows — each edit/delete, same pattern.
10. **Account overview** sub-section: a small heading row with "WhatsApp TSP Onboarding Status → View Details" and "WhatsApp A/B Testing → Test Now" links (both `previewToast()`); the Meta-branded amber disclosure banner ("Meta enforces daily WhatsApp Business messaging limits for quality, compliance, and tier-based improvements."); the green "Your account is powered by MM Lite API ✓" banner; then disabled/grey `Field`-style inputs for Display Name, Messaging Limit, WABA ID (+ `Available` pill), Phone Number (+ `Available` pill), Business Portfolio ID (+ `Available` pill), WABA Provider; then "Following details will be displayed on your WhatsApp Business Account profile." sub-heading with Brand Name (info-tooltip icon, reusing the shared `Tooltip` component from `@/components/ui/tooltip`) and Brand Logo (avatar placeholder + upload affordance, non-functional).
11. Facebook Catalog card: catalog ID + "Manage ↗" external link, a phone-preview thumbnail image (static placeholder), the catalog-access toggle (hand-rolled toggle style) with its helper text, and the "Remove Out of Stock products from the catalog" checkbox + the purple sync-interval note — all from the original wireframe.

**Right column — live preview:** a phone-shaped mockup (rounded rect frame, notch) rendering, from the *current in-progress* left-column state: avatar circle, `{number with middle digits masked}` + a category line ("Shopping and Retail" — static, matches wireframe), "Official business account" row with a person-add icon and an info icon, then conditionally-rendered lines for about text / business address / business email / business website (each only shown once that field has a value — empty fields simply don't render a line, so the preview genuinely reflects what a customer would see), and a bottom "About and phone number" section showing the about text. This re-renders live as the seller types into the left column's edit fields (lifted state, not a separate data source).

---

## 9. `SimpleChannelDetail.jsx`

One reusable view for Facebook pages, Instagram accounts, Email addresses, Web push, Email marketing, Live Chat, and RCS entries. Back-arrow header (icon + label from `channelIcons.js` for that group), then: an editable "Name" field, a read-only field showing the connected identifier (URL / handle / email address — labeled appropriately per group), and a **Disconnect** button (red outline, bottom) that removes the entry from the list and returns to the list view. This is intentionally minimal — it exists so every row has *somewhere* to go, not because the wireframes specified rich content for these types.

---

## 10. Testing

- `channelIcons.js` — trivial, no dedicated test file (a plain constant map).
- `ConnectedChannelsPanel.test.jsx` — renders all seeded groups/rows with correct badges; clicking a row navigates to the right detail view and back; "Connect channel" opens the modal.
- `ConnectChannelModal.test.jsx` — picker renders both groups; clicking a type's Connect moves to step 2; submitting the mini form adds a new row (assert via a stateful harness parent, matching this codebase's established `renderStatefulPanel` idiom) and closes the modal.
- `ShopifyDetail.test.jsx` — tab switch Details↔Others; short-code Save button enables only once text is entered; tracker toggle flips state.
- `WhatsAppNumberDetail.test.jsx` — Make Default for Campaigns swaps the default across numbers; Migrate provider button present only when default; refresh icons change the displayed numbers; editing Business description/About updates the right-column preview text live; empty fields don't render their preview line.
- `SimpleChannelDetail.test.jsx` — renders identifier, Disconnect removes the entry.
- No `src/pages/__tests__/Settings.test.jsx` exists today — add one covering the nav changes (no more standalone WhatsApp/RCS/SMS/Email items; "Connected channels" label; clicking it renders `ConnectedChannelsPanel`).

---

## 11. Out of scope

- Any real OAuth/API connection flow, webhook verification, or backend persistence — everything is local mock state, consistent with the rest of this app.
- SMS as a channel type (dropped, see §2).
- Rich detail pages for Facebook/Instagram/Email/Web push/Email marketing/Live Chat/RCS beyond `SimpleChannelDetail`.
- Real image upload for Brand Logo / catalog phone-preview thumbnail (static placeholders only).
- Migrating the three *other* pre-existing icon/color mappings elsewhere in the codebase onto the new `channelIcons.js` — left untouched, out of scope for this feature.
