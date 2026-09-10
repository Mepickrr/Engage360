# Meta Embedded Signup Mock Flow — Design

## Purpose

Wire the two currently-inert CTAs on the Engage Account Setup page
("Start Meta Embedded Signup" and "Set Up With AI Instead") to open a
new, small popup-sized browser tab that replicates Meta's real WhatsApp
Embedded Signup flow — condensed from the 10 reference screenshots into
an 8-step mock wizard, fully prefilled from the seller's Account Setup
form data, ending in a success screen. This is a visual mock only: no
real Meta/Facebook API calls, no real OTP delivery, no real WABA
creation. Both CTAs open the identical flow (per product decision — no
visible manual/AI distinction in the mock itself).

## Non-goals

- No real Meta Graph API / Embedded Signup SDK integration.
- No real OTP generation/delivery (both OTP screens use fixed dummy
  codes, always "correct").
- No persistence of the mock signup's outcome anywhere (closing the tab
  is the end of the interaction; nothing is written back to the
  Account Setup page or any backend).
- Not a pixel-perfect clone of every hover/dropdown-open frame in the
  reference screenshots — visually equivalent, trivial UI-interaction
  frames (e.g. a dropdown closed vs. open) are condensed into one step
  where nothing meaningful is lost.

## Approach

**State lift:** `WhatsAppProfilePreview.jsx`'s form state moves up into
`EngageAccountSetup.jsx` (the parent page) so the sibling
`SetupInstructions.jsx` can read it when its CTAs fire.
`WhatsAppProfilePreview` becomes a fully controlled component (props in,
same pattern its own `NumberSetupCard` child already uses) — this is a
plain "lift state up for sibling sharing" refactor, not a new store.

**Cross-tab hand-off:** `EngageAccountSetup.jsx` owns one
`handleStartSignup()`, passed to `SetupInstructions` as a prop and
called by both its CTAs. It builds a small payload, writes it to
`localStorage` under a fixed key, then opens a small named popup window
at the new route. The new tab reads that key once on mount.

**Route:** `/engage/meta-embedded-signup` — a full-bleed sibling of
`AppShell` (same routing pattern as `/engage/account-setup`), rendering
one small centered card that fills the popup window's viewport.

## Files

| File | Purpose |
|---|---|
| `src/pages/EngageAccountSetup.jsx` (modify) | Owns all profile-form state (moved up from `WhatsAppProfilePreview`); passes it down as props; owns `handleStartSignup()`, passed to `SetupInstructions`. |
| `src/components/engage/account-setup/WhatsAppProfilePreview.jsx` (modify) | Becomes fully controlled — all `useState` calls removed, replaced with props matching the state/setter names lifted to the page. |
| `src/components/engage/account-setup/SetupInstructions.jsx` (modify) | Both CTAs' `onClick={() => {}}` become `onClick={onStart}` (new required prop), removing their `// TODO` comments — these two are now genuinely wired, everything else in the file is unchanged. |
| `src/lib/metaSignupMock.js` (new) | Pure helpers: `buildSignupPayload(formState)` (derives the phone-number fallback, masked email, WABA asset name), `writeSignupPayload(payload)` / `readSignupPayload()` (thin `localStorage` wrappers under a fixed key with a default-payload fallback when nothing is stored), `openSignupPopup()` (the `window.open(...)` call with fixed dimensions/name). |
| `src/pages/MetaEmbeddedSignup.jsx` (new) | The new page: reads the payload on mount, owns the `currentStep` index, renders the active step's chrome + screen, provides `goNext`/`goBack`. |
| `src/components/engage/meta-signup/MetaTopBarChrome.jsx` (new) | The Meta-hosted chrome wrapper (infinity logo, share icon, small app icon, FB avatar dropdown) used by steps 1, 2, 3, 8. |
| `src/components/engage/meta-signup/FbLoginWindowChrome.jsx` (new) | The nested "Facebook Login for Business" browser-window chrome (title bar + address-bar-style row) used by steps 4-7. |
| `src/components/engage/meta-signup/StepRail.jsx` (new) | The left vertical step-progress indicator (checked / active / upcoming circles) shown on steps 2-7. |
| `src/components/engage/meta-signup/steps/*.jsx` (new, one file per step) | `IntroStep.jsx`, `PhoneNumberStep.jsx`, `VerifyPhoneStep.jsx`, `SelectAssetsStep.jsx`, `BusinessInfoStep.jsx`, `ConnectingStep.jsx`, `EmailVerifyStep.jsx`, `SuccessStep.jsx` — each a small, focused, presentational component. |

## Behavior

### Trigger (Account Setup page)

`EngageAccountSetup.jsx`:
```js
function handleStartSignup() {
  const payload = buildSignupPayload({
    brandName, category, website, email,
    numberMode, numberValue, virtualNumberValue,
  });
  writeSignupPayload(payload);
  openSignupPopup();
}
```
`buildSignupPayload` derives `phoneNumber`:
- `numberMode === "has_number"` and `numberValue` non-empty → `` `+91 ${numberValue}` ``
- `numberMode === "needs_virtual_number"` and `virtualNumberValue` set → that value as-is
- otherwise (`has_app`, or nothing entered) → the fixed placeholder `"+91 98765 43210"`

`SetupInstructions` receives `onStart` as a new required prop; both its
CTA buttons call it (`onClick={onStart}`), replacing their previous
no-ops. Nothing else in that file changes.

### The mock wizard (`MetaEmbeddedSignup.jsx`)

Reads the payload once via `readSignupPayload()` (falls back to a
built-in default payload if `localStorage` is empty — e.g. someone
opens the URL directly without going through the CTA). Holds
`currentStep` (0-indexed, 8 steps). Renders:

1. **Intro** (`MetaTopBarChrome` + `IntroStep`) — consent/handshake
   illustration screen, "Cancel"/"Continue" → `goNext`.
2. **Phone number** (`MetaTopBarChrome` + `StepRail` + `PhoneNumberStep`)
   — phone input prefilled from `payload.phoneNumber`, "Back"/"Next".
3. **Verify phone** (`MetaTopBarChrome` + `StepRail` + `VerifyPhoneStep`)
   — 6-box OTP prefilled `123456`; a "Resend Code" link toggles a local
   `showResentToast` boolean showing the "Code sent successfully" toast
   (this is the img-3/img-4 pair from the references, one step, two
   visual states); "Next" → `goNext`.
4. **Select business assets** (`FbLoginWindowChrome` + `StepRail` +
   `SelectAssetsStep`) — fixed "Shiprocket" business portfolio, WABA
   dropdown pre-selected to "Create a WhatsApp Business account"
   (img 5+6 condensed); "Back"/"Next".
5. **Business info** (`FbLoginWindowChrome` + `StepRail` +
   `BusinessInfoStep`) — Name ← `payload.brandName`, Category ←
   `payload.category`, Country fixed `"India"`, Website ←
   `payload.website`, Timezone fixed `"(GMT+05:30) Asia/Kolkata"`;
   "Back"/"Next".
6. **Connecting** (`FbLoginWindowChrome` + `ConnectingStep`) — spinner;
   a `useEffect` with a ~1.5s `setTimeout` calls `goNext` automatically,
   no button.
7. **Email verify** (`FbLoginWindowChrome` + `EmailVerifyStep`) — modal
   overlay, masked email derived from `payload.email` (fallback
   `"seller@example.com"` if empty), 6-digit code prefilled `654321`,
   countdown text, "Next" → `goNext`.
8. **Success** (`MetaTopBarChrome` + `SuccessStep`) — confetti icon,
   "Your account is connected to Shiprocket Communication", "Assets
   successfully created: `${payload.brandName || "Your Business"}
   WhatsApp Account`", "Finish" → `window.close()`.

`goNext`/`goBack` simply increment/decrement `currentStep` (clamped to
`[0, 7]`).

### Popup dimensions

`openSignupPopup()`:
```js
window.open(
  "/engage/meta-embedded-signup",
  "metaEmbeddedSignup",
  "width=560,height=780"
);
```

## Styling

The two chrome wrappers intentionally use raw colors/markup to mimic
Meta's and Chrome's real UI (a light gray top bar, Meta's blue
"infinity" mark rendered as simple CSS/SVG, a browser-window title bar
with system-style window controls) — this is the same "mimic a
third-party product's real UI" precedent already used for
`WhatsAppBubblePreview.jsx` and the account-setup phone mockup: it does
not follow the app's own design tokens, by design. Step content
(labels, inputs, buttons) reuses the existing `Input`/`Select`/`Button`
primitives from `src/components/ui/` wherever a screen calls for a real
form control, styled to match the reference screenshots' spacing/scale
rather than the rest of Engage 360.

## Testing

- `metaSignupMock.test.js`: `buildSignupPayload` covers all three
  phone-number derivation branches; `writeSignupPayload`/
  `readSignupPayload` round-trip correctly through a mocked
  `localStorage`, and `readSignupPayload` returns the built-in default
  when nothing is stored.
- `SetupInstructions.test.jsx` (existing file, extend): both CTAs now
  call the new required `onStart` prop instead of being no-ops.
- `EngageAccountSetup.test.jsx` (existing file, extend): clicking either
  CTA writes the expected payload shape to `localStorage` and calls
  `window.open` with the exact URL/name/dimensions above (both
  `localStorage` and `window.open` mocked).
- `MetaEmbeddedSignup.test.jsx` (new): renders step 1 by default; each
  "Next"/"Back" action advances/retreats `currentStep` and swaps chrome
  correctly at the steps-4/8 boundary; the connecting step
  auto-advances (fake timers); the phone/business-info/email screens
  render the payload's prefilled values; Finish calls `window.close`
  (mocked).
- No dedicated tests needed for the purely-presentational step
  components or the two chrome wrappers beyond what
  `MetaEmbeddedSignup.test.jsx` already exercises by rendering the full
  tree at each step — consistent with how `PhoneMockup.jsx`'s chrome
  was covered by its own single rendering test in the prior plan, scaled
  up here since there are two chrome variants across 8 steps.

## Open items (explicitly deferred, not blocking this design)

- No real backend/API wiring — explicitly out of scope, per the user's
  running instruction across this whole feature area.
- Whether the two chrome wrappers should later be extracted as shared,
  more generic "OS chrome" primitives if a third mock flow needs
  similar treatment — kept bespoke per YAGNI, matching this codebase's
  established precedent (`FastrrEngagePanel`, `PhoneMockup`).
