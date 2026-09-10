# Engage Account Setup Page — Design

## Purpose

When a seller clicks the CTA on the Fastrr Engage page/panel, they should
land on a dedicated **"Engage Account Setup"** page: a two-column setup
screen that walks them through connecting a WhatsApp number and filling in
their WhatsApp Business profile, with a large, authentic-looking phone
mockup on the right that updates live as they type.

This is a **prototype**, matching the rest of Fastrr Engage's demo scope:
all form state is real and interactive (typing/selecting/uploading all
work and reflect live in the mockup), but nothing persists anywhere and the
final CTAs ("Start Meta Embedded Signup" / "Set Up With AI Instead") are
intentionally **not wired** — per explicit instruction, that comes later.

## Non-goals

- No backend integration, no real Meta Embedded Signup call, no file
  upload to a server (the logo preview is a local `URL.createObjectURL`,
  never persisted or sent anywhere).
- No functional step-tracking/wizard logic on the left column — the
  numbered steps are static instructional copy, not a live progress
  tracker.
- CTA buttons are visually complete, no-op, marked with the same
  `// TODO: wire up once enablement flow is defined` convention already
  used across Fastrr Engage.
- Not a generic multi-purpose "device mockup" component library — the
  phone chrome is built for this one screen, following the same
  bespoke-over-generic approach used for `FastrrEngagePanel`.

## Approach

A new, full-bleed route (`/engage/account-setup`) added as a **sibling**
of the existing `<Route element={<AppShell />}>` block in `App.js` — not
nested inside it — so the sidebar/topbar do not render. This matches the
"immersive setup wizard" feel requested and is the standard pattern for
onboarding flows. No `Sidebar.jsx` entry: this page is reached only via
the Fastrr Engage CTA, the same way `WhatsAppNumberDetail`/
`ConnectChannelModal` aren't sidebar-linked either.

All form/preview state lives in one `useState` object inside
`WhatsAppProfilePreview.jsx`, following this codebase's actual convention
for setup/settings-style forms (`WhatsAppNumberDetail.jsx`,
`ConnectedChannelsPanel.jsx` both use plain `useState`, not a zustand
store) — a store would be unwarranted for a single-page linear form with
no state shared across routes.

## Files

| File | Purpose |
|---|---|
| `src/pages/EngageAccountSetup.jsx` | The page. Minimal top bar (Fastrr logo + "Exit setup" link to `/fastrr-engage`), then a two-column layout: left `<SetupInstructions />` (scrolls normally), right `<PhoneMockup><WhatsAppProfilePreview /></PhoneMockup>` (sticky — stays in view while the left column scrolls). |
| `src/components/engage/account-setup/SetupInstructions.jsx` | Left column: page heading/subhead, 2 tip callouts, 3 numbered steps, 2 CTA buttons (no-op). Purely static/presentational, no props needed beyond nothing (all content is module-local). |
| `src/components/engage/account-setup/PhoneMockup.jsx` | Device chrome only: outer frame (~360×720, light gray, rounded ~44px corners, 8px bezel, drop shadow, small notch pill), light iOS status bar (time + signal/wifi/battery glyphs, dark-on-white), and a scrollable inner screen area. Renders `children` inside the screen area. No WhatsApp-specific content lives here — adapted in spirit from `TemplateEditorModal.jsx`'s `PhoneFrame`/`IOSStatusBar`, but light-themed and larger. |
| `src/components/engage/account-setup/WhatsAppProfilePreview.jsx` | Rendered inside `PhoneMockup`. WhatsApp-teal (`#075E54`) header bar reading "Business Profile" with a back-chevron. Below it: `<NumberSetupCard />`, then the profile fields list (logo, brand name, description, website, category, email, support number, address). Owns all form state. |
| `src/components/engage/account-setup/NumberSetupCard.jsx` | Visually distinct card: "Connect Your WhatsApp Number" heading + 3-way segmented control (`has_number` / `needs_virtual_number` / `has_app`, default `has_number`) with conditional mini-fields per mode. Controlled via props (`mode`, `onModeChange`, plus per-mode field values/setters) — state still owned by the parent `WhatsAppProfilePreview`. |
| `src/components/engage/account-setup/data.js` | `MOCK_VIRTUAL_NUMBERS` (3–4 entries: `{ number, priceLabel: "₹500/mo" }`) and `BUSINESS_CATEGORIES` (`["Shopping & Retail", "Education", "Ecommerce", "Others"]`, `"Shopping & Retail"` default). |

**Routing (`src/App.js`):**
```jsx
<Route path="/engage/account-setup" element={<EngageAccountSetupPage />} />
```
added as a sibling of `<Route element={<AppShell />}>...</Route>`, not a child of it.

## Behavior

### Left column (`SetupInstructions.jsx`) — static

- Heading: **"Let's Get Your WhatsApp Business Ready"**, subhead: *"A few details and you'll be sending your first message today."*
- Tip callouts (highlighted boxes, visually distinct from the steps):
  - *"No WhatsApp number yet? Grab an SR Virtual Number for just ₹500/month — no SIM required, fully WhatsApp-ready from day one."*
  - *"Setting up a new WABA? Register it directly with your new number — we'll walk you through every screen."*
- Numbered steps 1→3 (bold title + supporting line):
  1. **Add Your Business Details** — "Fill in what WhatsApp needs to approve your account: name, category, and contact info."
  2. **Start Embedded Signup** — "Launch Meta's official signup yourself, or let our AI assistant fill it in for you in seconds."
  3. **Verify & Go Live** — "Confirm your phone number, business details, and email — then you're ready to message customers."
- CTAs: primary **"Start Meta Embedded Signup"**, secondary **"Set Up With AI Instead"** — both `onClick={() => {}} // TODO: wire up once enablement flow is defined`.

### Right column — phone mockup, fully interactive

**`PhoneMockup.jsx`** renders the device chrome and an ambient soft gradient glow behind the frame on the page background (matches the existing hero-gradient visual language used elsewhere in Fastrr Engage, e.g. `FastrrEngagePanel`'s hero).

**`NumberSetupCard.jsx`** — segmented control with exactly one active mode at a time:
- `has_number` (default): one phone input with a `+91` prefix.
- `needs_virtual_number`: a `Select` (`src/components/ui/select.jsx`) listing `MOCK_VIRTUAL_NUMBERS`, each option showing the number plus its `₹500/mo` price tag.
- `has_app`: two inputs — **App ID** and **API Key Secret** (the latter `type="password"`).
- Switching modes swaps which field group renders; values from a non-active mode are retained in state (not cleared) so switching back and forth doesn't lose input, but only the active mode's fields render.

**Profile fields list** (real controlled inputs, update the mockup instantly as the seller types — no click-to-edit indirection):
- **Logo**: circular avatar with a camera-icon overlay; tapping it triggers a visually-hidden `<input type="file" accept="image/*">`; on change, `URL.createObjectURL(file)` becomes the avatar's `src` immediately.
- **Brand Name**: text input.
- **Company Description**: textarea.
- **Website URL**: text input.
- **Business Category**: `Select` sourced from `BUSINESS_CATEGORIES`, default `"Shopping & Retail"`.
- **Contact Email**: text input.
- **Support Number**: text input.
- **Office Address**: textarea.

## Styling

WhatsApp-authentic colors are used for the mockup's own chrome (header
`#075E54`, consistent with the existing precedent of `WA_GREEN`/
`#E5DDD5` raw hex used for WhatsApp-mimicking UI elsewhere in this
codebase, e.g. `WhatsAppBubblePreview.jsx` and
`WhatsAppRightPanel.jsx` — these intentionally reproduce a third-party
product's real UI, so they don't follow the app's own design tokens the
way in-app screens do). Everything outside the phone frame (the left
column, the page's own top bar, tip callouts, step numbers) uses the
existing Engage 360 tokens (`bg-primary`, `bg-primary-tint`,
`text-text-primary/secondary`, `border-border`, etc.) — no new tokens
introduced there.

## Testing

- `WhatsAppProfilePreview.test.jsx`: typing into each field updates the
  displayed value in the mockup; selecting each `NumberSetupCard` mode
  reveals only that mode's fields and hides the others; selecting a
  business category updates the shown value; uploading a file via the
  hidden input updates the avatar `src` (`URL.createObjectURL` mocked,
  standard jsdom pattern: `global.URL.createObjectURL = jest.fn(() =>
  "blob:mock-preview")`).
- `EngageAccountSetup.test.jsx` (page-level): both columns render; the
  two CTAs are present, clickable, no-ops; the "Exit setup" link points
  back to `/fastrr-engage`.
- No test coverage needed for `PhoneMockup.jsx`'s pure chrome (no logic,
  just markup) beyond it rendering its children — folded into the
  `WhatsAppProfilePreview` tests implicitly.

## Open items (explicitly deferred, not blocking this design)

- Wiring the two bottom CTAs to a real Meta Embedded Signup flow /
  AI-assisted flow — explicitly deferred by the user until asked for.
- Whether `PhoneMockup.jsx`'s device chrome should be generalized into a
  shared primitive once a second consumer needs a phone mockup (currently
  only one consumer — kept bespoke per YAGNI).
