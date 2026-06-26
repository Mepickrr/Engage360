# Push Notification Templates — Product Design Spec

**Date:** 2026-06-24
**Status:** Foundational draft — open for additional layers
**Audience:** Internal product team, designers, engineering
**Scope:** Push notification template types within the Flow Builder Push Node

---

## Table of Contents

1. [What the Prototype Shows](#0-what-the-prototype-shows)
2. [Feature Brief](#1-feature-brief)
3. [The Job](#2-the-job)
4. [Success Metrics](#3-success-metrics)
5. [Who Uses This and When](#4-who-uses-this-and-when)
6. [User Flows](#5-user-flows)
7. [Functional Specification](#6-functional-specification)
   - [Common Fields (All Templates)](#61-common-fields-all-templates)
   - [Basic Notification](#62-basic-notification)
   - [Stylized Basic](#63-stylized-basic)
   - [Single Image Carousel](#64-single-image-carousel)
   - [Image Banner with Text Overlay](#65-image-banner-with-text-overlay)
   - [Timer](#66-timer)
   - [Timer with Progress Bar](#67-timer-with-progress-bar)
   - [Platform Matrix](#68-platform-support-matrix)
8. [States](#7-states)
9. [Edge Cases](#8-edge-cases)
10. [Non-Functional Requirements](#9-non-functional-requirements)
11. [Analytics & Instrumentation](#10-analytics--instrumentation)
12. [Copy](#11-copy)
13. [Dependencies](#12-dependencies)
14. [Out of Scope](#13-out-of-scope)
15. [Open Questions](#14-open-questions)
16. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

### What's built

- **`PushRightPanel.jsx`** — A 3-tab panel (Template / Delivery / Output) wired to the Push node on the flow canvas.
- **`mockData.js`** — Data model and constants for 5 template styles (`basic`, `stylized_basic`, `image_carousel`, `image_banner`, `timer`), mock templates, placeholder variables, delivery options, and preview platforms.
- **2-step template creation modal** — Step 1 selects a style via a thumbnail grid; Step 2 exposes a shared form (`name`, `title`, `body`, `hasImage`, `imageUrl`, `landingUrl`, `tags`, `renotify`, `persistNotification`, `utm`, `callToAction`, `iconType/iconUrl`) plus a live preview panel.
- **Platform preview switcher** — Mac, Windows, Windows 10, Android previews inside the creation modal and the Template tab.
- **Delivery tab** — AI Best Sent Time toggle and Smart Retry (smart vs. manual modes).
- **Output tab** — Next Step vs. Delivery Branches routing; branch statuses: `clicked`, `dismissed`, `delivered`.
- **iOS send mode** — Three-way radio: all devices / exclude provisional / only provisional.
- **Placeholder variable injection** — Customer, Order, Product, Store groups supported in `title`, `body`, `landingUrl`, `iconUrl`.

### What's incomplete

- **`subtitle` field** is missing from the template data model and all form inputs. Every notification type in this spec requires subtitle support.
- **`callToAction`** is a boolean checkbox in the form but has no downstream configuration — no button label fields, no per-button landing URLs, no button count selector, no platform-aware constraints. The label reads "*For Chrome Only*" which is architecturally incorrect (iOS supports up to 4 action buttons; Android supports up to 3).
- **`stylized_basic`** has a style thumbnail but the creation form exposes no color fields (background color, text color, button color).
- **`image_carousel`** is listed as Android-only in `PUSH_TEMPLATE_STYLES`. The form has no carousel-specific fields: no multi-image upload slots, no per-image click action configuration, no dot indicators configuration.
- **`image_banner`** exposes a single image URL field (`imageUrl`) but has no concept of collapsed vs. expanded images, no text overlay controls, and no text color/style fields.
- **`timer`** is listed as Android-only. The form has no timer-specific fields (end time, display format, countdown vs. elapsed).
- **`timer_with_progress_bar`** does not exist in `PUSH_TEMPLATE_STYLES` at all.
- **Preview** only shows Mac, Windows, Win10, Android. No iOS notification preview, no browser/web push preview (Chrome, Firefox, Safari).
- **Platform flags** in `PUSH_TEMPLATE_STYLES` say `["android", "ios"]` for most styles but Web is not listed as a target platform per style.

### What's absent

- `subtitle` as a distinct data field and form input.
- Per-image click actions on carousel slides.
- Color picker UI for background, text, and button colors.
- Collapsed/expanded image concept for banner and timer types.
- Timer end-time configuration (absolute timestamp picker or duration offset).
- Progress bar configuration (initial value, linked progress event, label).
- `timer_with_progress_bar` style definition.
- iOS preview rendering in the preview switcher.
- Web push preview rendering.
- Platform-specific action button limits enforced in UI.

---

## 1. Feature Brief

Push notification templates are the creative layer inside the Push node — the marketer's way of choosing how a notification looks before any message sends. Today the Push node exists in the flow builder but its template creation modal treats every style identically: a flat form that is only appropriate for basic text notifications. Marketers who want to send a flash sale with a countdown timer, a carousel of product images, or a branded notification with custom colors have no configuration path — they select a style thumbnail and land in the same generic form.

This spec defines the configuration, validation, and preview behavior for all six template types: Basic, Stylized Basic, Single Image Carousel, Image Banner with Text Overlay, Timer, and Timer with Progress Bar. Each type has a distinct data shape, distinct platform constraints, and distinct fields in the creation modal. When complete, a marketer selects a style and lands in a form that matches what that style can actually render on device.

---

## 2. The Job

**The irreducible job:** Let a marketer configure a styled, platform-aware push notification template without needing to know what iOS, Android, or Web can each render natively.

Three things that make it not worth shipping if missing:

1. **Style-specific forms.** Selecting "Timer" must reveal a timer end-time picker. Selecting "Stylized Basic" must reveal color pickers. The current shared form fails both.
2. **Accurate platform constraints enforced before send.** If a marketer enables Web as a target and selects "Timer with Progress Bar," the system must warn them that the type is not supported on Web rather than silently sending a degraded notification.
3. **Per-image click actions on carousels.** A carousel where every image lands on the same URL is not a carousel — it is a confusing broken experience. Each slide must have its own click destination.

---

## 3. Success Metrics

| Metric | Baseline | Target | Measurement window |
|---|---|---|---|
| Template creation completion rate (Step 1 → Save) | Unknown (no tracking) | ≥ 75% | 30 days post-launch |
| Style picker abandonment rate | Unknown | ≤ 20% | 30 days post-launch |
| Time to first push send after node drop | Unknown | ≤ 4 minutes median | 30 days post-launch |
| Platform constraint error at send time | Unknown | ≤ 2% of sends | 30 days post-launch |
| Carousel template adoption as % of push sends | 0% (not functional) | ≥ 15% | 60 days post-launch |
| Timer/progress template adoption | 0% (not functional) | ≥ 10% | 60 days post-launch |

---

## 4. Who Uses This and When

### Retention marketer — "I want cart recovery to stand out"

Running automated journeys to recover abandoned carts. Has run basic push before and wants to try richer formats. Opens a push node mid-flow, reaches the template modal. Goal: create a carousel showing the 3 products left in the cart with a "Buy now" button. Success: carousel is configured, each product image has a deep link to that product page, sends in under 5 minutes. Failure: cannot configure per-image links, falls back to a basic template because it is the only form they understand.

### Growth marketer — "Flash sale ends in 2 hours"

Launching a time-sensitive promotion. Needs a notification with a visible countdown timer so the recipient feels urgency. Opens push node, selects Timer. Goal: set an end time 2 hours from send time, include a banner image, configure action buttons for "Shop Now" and "Remind Me Later." Success: timer configuration is intuitive, countdown renders correctly in preview. Failure: cannot find timer end-time picker, ships a basic notification without the urgency mechanism.

### Brand / CRM designer — "Our push should look like us"

Responsible for visual consistency. Does not run campaigns but sets up branded templates for the team to reuse. Selects Stylized Basic to configure brand colors. Goal: set background color `#1A1A2E`, title text color `#F59E0B`, and a specific button color. Success: saves a branded template others can select from the library. Failure: no color fields in the form, the template library shows no visual differentiation between templates.

---

## 5. User Flows

### 5.1 Create a new template — happy path

1. Marketer drops a Push node on the canvas. The Template tab opens with two empty-state cards: "Create New" and "Select Existing."
2. Marketer clicks **Create New**. The 2-step modal opens.
3. **Step 1 — Select Style.** Marketer browses six style thumbnails. Each thumbnail shows a miniature visual, the style name, and platform badges. Selecting a tile highlights it in amber. Next button activates.
4. Marketer clicks **Next**. Step 2 loads with a form on the left and a live preview on the right. The form fields shown depend on the selected style (see §6).
5. Marketer fills required fields: `title` and `landingUrl`. Saves.
6. Modal closes. The Template tab now shows the template summary card. The canvas node shows the template title.

### 5.2 Create a new template — platform constraint warning path

1. Marketer selects "Timer with Progress Bar" in Step 1.
2. In Step 2, they check "Web" as a target platform.
3. An inline warning appears beneath the Web checkbox: "Timer with Progress Bar is not supported on Web Push. Web subscribers will not receive this notification."
4. The Web checkbox remains enabled (marketer can keep it checked knowing delivery will be suppressed for Web subscribers). They cannot proceed with Web as the only enabled platform — the system requires at least one supported platform.

### 5.3 Create a carousel — full flow

1. Marketer selects "Single Image Carousel."
2. In Step 2, carousel section shows 5 image slots. Slot 1 is required; slots 2–5 are optional.
3. For each slot: upload image or paste image URL, and set a click action URL (required when slot is filled).
4. Marketer configures title, message, subtitle, and a notification-level landing URL (used when the notification itself is tapped outside any image).
5. Background color, title text color, and button color pickers are available.
6. Live preview shows a carousel mock with dot indicators and navigation arrows. Platform selector is locked to Android and iOS — Web tab is disabled with a tooltip explaining Web Push does not support carousels.
7. Marketer saves. Modal closes.

### 5.4 Select an existing template

1. From the Template tab, marketer clicks "Select Existing." The template picker modal opens.
2. Marketer searches or browses. Each row shows: name, style badge, platform badges, last updated date, and a mini thumbnail.
3. Marketer clicks a template. Modal closes. The Template tab shows the summary card.

### 5.5 Edit a template from the node

1. From the template summary card, marketer clicks **Edit**. The creation modal opens pre-filled with the template's current values. The style cannot be changed from this entry point (locked to prevent data model mismatch).
2. Marketer edits fields and clicks **Save Template**.
3. Changes are reflected in the summary card and in the canvas node label.

### 5.6 State lifecycle of a draft template

A template in `status: "Draft"` (the state before Save is clicked) exists only in local component state. It is not persisted until **Save Template** is clicked. If the modal is closed without saving, the draft is discarded silently — no warning is shown for an empty draft, but a warning is shown if any required field has been filled.

---

## 6. Functional Specification

### 6.1 Common Fields (All Templates)

These fields appear on every template type. Template-specific fields are additive.

| Field | Type | Required | Default | Validation | Notes |
|---|---|---|---|---|---|
| `name` | string | No | `""` | ≤ 100 chars | Internal label for the template library. Not rendered in the notification. |
| `title` | string | Yes | `""` | 1–65 chars. Supports placeholders. | Displayed as the notification heading. |
| `subtitle` | string | No | `""` | ≤ 65 chars. Supports placeholders. | iOS: rendered as subtitle below title. Android: rendered as a second line in collapsed view when supported. Web: not displayed (silently ignored). |
| `body` | string | No | `""` | ≤ 240 chars. Supports placeholders. | Notification body text. |
| `landingUrl` | string | Yes | `""` | Valid URL. Supports placeholders. | Default tap destination when the notification is tapped. |
| `iconType` | enum | Yes | `"org"` | `"org"` / `"url"` / `"upload"` | Org logo, URL, or gallery upload. |
| `iconUrl` | string | Conditional | `""` | Valid URL. Required when `iconType = "url"`. | Custom icon URL. |
| `tags` | string | No | `""` | — | Comma-separated tags for the `tag` field in Web Push. Controls deduplication (same `tag` replaces a prior notification). |
| `renotify` | boolean | No | `false` | — | When `true`, re-alerts even if a notification with the same tag is already visible. |
| `persistNotification` | boolean | No | `false` | — | Web Push only: `requireInteraction: true`. Notification stays until the user dismisses. iOS and Android: no-op (silently ignored at send time). |
| `utm.enabled` | boolean | No | `false` | — | When enabled, UTM params are appended to `landingUrl` at send time. |
| `utm.utm_source` | string | Conditional | `"push"` | Required when `utm.enabled`. | — |
| `utm.utm_medium` | string | Conditional | `"journey"` | Required when `utm.enabled`. | — |
| `utm.utm_campaign` | string | Conditional | `""` | Required when `utm.enabled`. | — |
| `platforms.android` | boolean | No | `true` | — | Target Android subscribers. |
| `platforms.ios` | boolean | No | `true` | — | Target iOS subscribers. |
| `platforms.web` | boolean | No | `true` | — | Target Web Push subscribers. |
| `iosSendMode` | enum | No | `"all"` | `"all"` / `"no_prov"` / `"only_prov"` | Shown only when `platforms.ios = true`. |

**Placeholder variable injection** is available in `title`, `subtitle`, `body`, `landingUrl`, and `iconUrl` fields. Supported groups: Customer, Order, Product, Store (see `PUSH_PLACEHOLDER_VARS` in mockData.js).

---

### 6.2 Basic Notification

**Platforms:** iOS, Android, Web
**Style ID:** `basic`

The standard push notification — text with an optional image and optional action buttons. Suitable for transactional alerts, order updates, and simple promotional messages.

#### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `hasImage` | boolean | No | `false` | Enables the image URL field. |
| `imageUrl` | string | Conditional | `""` | Required when `hasImage = true`. Validates as a URL. iOS: downloaded via Notification Service Extension (requires `mutable-content: 1`). Android: rendered as BigPicture expanded image. Web: rendered as large banner in Chrome on Windows/Android; ignored on macOS Chrome and iOS Safari. |
| `actions` | array | No | `[]` | Action button configuration. See §6.2.1. |

#### 6.2.1 Action Buttons

Action buttons are interactive elements that appear in the expanded notification. Platform limits must be enforced in the UI, not just at send time.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `actions[n].label` | string | Yes | — | Button label text. ≤ 20 chars. |
| `actions[n].url` | string | Yes | — | Deep link or web URL tapped on this button. Supports placeholders. |
| `actions[n].iconUrl` | string | No | `""` | Web Push only: small icon shown beside the button label. |

**Platform constraints:**

| Platform | Max buttons displayed | Notes |
|---|---|---|
| **iOS** | 4 registered; 2 shown in banner, 4 on long-press | Buttons are registered as a `UNNotificationCategory` in the app binary. The category identifier must be pre-registered by the app team per button set. Server cannot inject arbitrary button labels dynamically — only the category identifier is sent in the payload. |
| **Android** | 3 | Added via `NotificationCompat.Builder.addAction()`. Labels sent in the FCM data payload; no app binary changes required. |
| **Web (Chrome)** | 2 | Maximum enforced by the browser; additional buttons are silently dropped. |
| **Web (Firefox)** | 2 | Same as Chrome. |
| **Web (Safari / iOS Safari)** | 0 | Action buttons are not supported. Buttons are silently ignored. |

**UI enforcement:** When the marketer is editing action buttons, a counter shows `N / MAX` where MAX is the tightest limit across the selected platforms. Adding beyond the maximum is blocked with inline copy explaining which platform caps it.

**iOS category constraint:** When iOS is a selected platform and action buttons are configured, the UI shows an advisory: "iOS action buttons require the button set to be registered in your app binary. Share this configuration with your iOS developer team." The advisory does not block saving.

---

### 6.3 Stylized Basic

**Platforms:** iOS, Android, Web
**Style ID:** `stylized_basic`

A basic text notification with brand-level color theming. The notification structure is identical to Basic but the marketer can specify background, text, and button accent colors that are applied where each platform supports them.

#### Fields

Inherits all Basic fields, plus:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `hasImage` | boolean | No | `false` | Same as Basic. |
| `imageUrl` | string | Conditional | `""` | Same as Basic. |
| `actions` | array | No | `[]` | Same as Basic. |
| `style.backgroundColor` | string (hex) | No | `""` | Android: sets notification background via `setColorized(true)` + `setColor()`. iOS: not supported (silently ignored). Web: not supported (silently ignored). |
| `style.titleColor` | string (hex) | No | `""` | Android custom `RemoteViews` only — requires SDK support. iOS: not supported. Web: not supported. |
| `style.bodyColor` | string (hex) | No | `""` | Same platform support as `titleColor`. |
| `style.buttonColor` | string (hex) | No | `""` | Android action button background. iOS: not supported (system controls button color). Web: not supported. |
| `style.buttonTextColor` | string (hex) | No | `""` | Android action button text. |

**Platform-aware display in UI:** Each color swatch shows a set of platform badges indicating where the color will actually render. Fields that have no effect on any selected platform are shown with a muted "Not supported on selected platforms" note, but remain editable for future-proofing.

**Color input format:** Each color field accepts a hex code (`#RRGGBB`). A color picker is provided as a supplementary input.

---

### 6.4 Single Image Carousel

**Platforms:** iOS, Android (Web: not supported — see §6.8)
**Style ID:** `image_carousel`

A swipeable series of up to 5 images. Each image has its own click action URL. Suitable for showcasing multiple products, a step-by-step process, or a collection.

**Implementation note:** Neither iOS nor Android has a native carousel notification style. iOS requires a `UNNotificationContentExtension` shipped in the app binary. Android requires custom `RemoteViews` (height limited to 256 dp expanded) managed by the platform SDK. This means carousel support is not available out of the box — it requires coordination with the mobile SDK team. See §12 Dependencies.

#### Fields

Inherits all common fields, plus:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `carousel.images` | array | Yes (min 1, max 5) | `[]` | Ordered list of carousel slide objects. |
| `carousel.images[n].imageUrl` | string | Yes | `""` | Image URL for this slide. Recommended dimensions: 800×400 px, max 1 MB. Aspect ratio: 2:1. |
| `carousel.images[n].clickUrl` | string | Yes | `""` | Landing URL when this specific image is tapped. Supports placeholders. |
| `carousel.images[n].altText` | string | No | `""` | Accessibility alt text. Not rendered in the notification. |
| `carousel.dotIndicators` | boolean | No | `true` | Show position dot indicators below the image strip. |
| `style.backgroundColor` | string (hex) | No | `""` | Background of the expanded notification area. Android only. |
| `style.titleColor` | string (hex) | No | `""` | Android only. |
| `style.bodyColor` | string (hex) | No | `""` | Android only. |
| `style.buttonColor` | string (hex) | No | `""` | Prev/Next navigation button background. Android only. |
| `style.buttonTextColor` | string (hex) | No | `""` | Android only. |
| `actions` | array | No | `[]` | Max 2 notification-level action buttons (iOS uses 2 slots for Prev/Next internally; remaining 2 slots can be marketer-configured). Android: max 1 notification-level action (2 slots used for Prev/Next, 1 remaining). Web: not supported. |

**Slide ordering:** Slides are rendered in array order. Drag-to-reorder is supported in the form.

**Minimum slide requirement:** At least 1 slide must have a filled `imageUrl` and `clickUrl` before saving. A carousel with 1 image is valid — it degrades gracefully to a single-image notification without navigation controls.

---

### 6.5 Image Banner with Text Overlay

**Platforms:** Android, Web (iOS: not supported — see §6.8)
**Style ID:** `image_banner`

A full-width banner image. In collapsed state the image acts as the notification thumbnail. In expanded state the image fills the notification header area with the title and message text overlaid on top. Used for high-visual-impact promotions where image and copy must coexist.

#### Fields

Inherits all common fields, plus:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `banner.collapsedImageUrl` | string | Yes | `""` | Image shown as the notification thumbnail in collapsed state. Recommended: 400×200 px, max 1 MB. |
| `banner.expandedImageUrl` | string | No | `""` | When set, a separate (larger) image fills the expanded notification area. When empty, `collapsedImageUrl` is scaled up for the expanded view. Recommended: 800×400 px. |
| `banner.overlayEnabled` | boolean | No | `true` | When `true`, `title` and `body` are rendered over the expanded image with a semi-transparent scrim. When `false`, title and body appear below the image in the standard text area. |
| `style.titleColor` | string (hex) | No | `"#FFFFFF"` | Text overlay color for the title. Relevant when `overlayEnabled = true`. |
| `style.bodyColor` | string (hex) | No | `"#FFFFFF"` | Text overlay color for the body. |
| `style.overlayScrimOpacity` | integer (0–100) | No | `50` | Opacity of the dark scrim behind overlaid text, as a percentage. Higher values improve readability on bright images. |
| `actions` | array | No | `[]` | Standard action buttons. Same platform limits as Basic. |

**Android implementation:** `banner.collapsedImageUrl` is used as the `BigPicture` image. `banner.expandedImageUrl`, when set, is downloaded as a second bitmap and injected into a custom `RemoteViews` expanded layout. Text overlay requires custom `RemoteViews` — this is not achievable with the standard `BigPictureStyle` API and requires SDK-level support.

**Web implementation:** The `image` field in Web Push `showNotification()` covers the expanded banner image. Chrome on Windows/Android renders this. `overlayEnabled` has no Web equivalent — title and body always appear below the image in Web Push; this field is ignored for Web targets.

---

### 6.6 Timer

**Platforms:** Android, Web (iOS: not supported via standard notifications — see §6.8)
**Style ID:** `timer`

A notification with a live countdown timer. Used for flash sales, auction endings, limited-time offers, and event reminders. The timer displays in the notification and counts down in real time without requiring additional pushes.

#### Timer mode

The marketer chooses between two ways to define when the timer ends:

| Mode | Label in UI | Behavior |
|---|---|---|
| `"duration"` | Duration | The marketer enters a relative duration (e.g. 2 hours 30 minutes). The countdown starts when the notification is delivered to the subscriber's device — after any event trigger delays and AI Best Sent Time holds. Each subscriber's timer begins independently at their individual delivery time. |
| `"specified_time"` | Specified time | The marketer sets an absolute end date and time. The countdown is the same for all subscribers regardless of when the notification is delivered. |

> **Note:** Countdown duration will start when the notification is delivered to the user after the event trigger and preset delays (if any).

#### Fields

Inherits all common fields (with `banner.collapsedImageUrl` and `banner.expandedImageUrl` from §6.5 also available for the background imagery), plus:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `timer.mode` | enum | Yes | `"duration"` | `"duration"` / `"specified_time"`. Selects how the timer end is defined. |
| `timer.duration` | integer (seconds) | Conditional | `""` | Required when `timer.mode = "duration"`. Total countdown duration in seconds. The UI exposes this as a compound input (days / hours / minutes / seconds) and converts to seconds on save. Minimum: 60 seconds. |
| `timer.endTime` | string (ISO 8601) | Conditional | `""` | Required when `timer.mode = "specified_time"`. The absolute datetime when the timer reaches zero. Must be in the future at save time. |
| `timer.displayFormat` | enum | No | `"hh:mm:ss"` | `"hh:mm:ss"` / `"mm:ss"` / `"dd:hh:mm:ss"`. Controls the visual format of the countdown. |
| `timer.expiredLabel` | string | No | `"Expired"` | Text shown in place of the countdown after the timer reaches zero. ≤ 15 chars. |
| `banner.collapsedImageUrl` | string | No | `""` | Optional thumbnail image in collapsed view. Same spec as Image Banner. |
| `banner.expandedImageUrl` | string | No | `""` | Optional hero image in expanded view. |
| `style.timerColor` | string (hex) | No | `"#EF4444"` | Color of the countdown display text. Input shown as "Timer text color" with a color picker. Android only. |
| `style.titleColor` | string (hex) | No | `""` | Android only. |
| `style.bodyColor` | string (hex) | No | `""` | Android only. |
| `actions` | array | No | `[]` | Standard action buttons. Same limits as Basic. |

**Android implementation:** Duration mode: the SDK calculates `endTimeMillis = deliveryTime + timer.duration` at the moment of delivery and passes it to `NotificationCompat.Builder.setWhen(endTimeMillis).setUsesChronometer(true).setChronometerCountDown(true)`. Specified Time mode: `endTimeMillis` is the absolute value stored in the template. For `expandedImageUrl` + timer in the same notification, custom `RemoteViews` with a `Chronometer` widget in the expanded layout is required.

**Web implementation:** Web Push does not natively support live countdown timers. On Web, the timer value (resolved duration or absolute end time) is included in the notification data payload. The Service Worker reads this at `showNotification()` time and formats the time remaining as a static string appended to the body. The countdown does not update live on Web — it is frozen at the moment the notification is first displayed. The UI shows a warning badge on the Web platform chip: "Timer displays as static time on Web."

**iOS:** Not supported. If iOS is selected alongside a Timer template, a blocking validation error prevents saving: "Timer is not supported on iOS. Deselect iOS or choose a different template type."

---

### 6.7 Timer with Progress Bar

**Platforms:** Android, Web (iOS: not supported — see §6.8)
**Style ID:** `timer_with_progress_bar`

A notification showing a countdown timer alongside a visual progress bar that fills or drains as the timer runs. Used for order processing stages, download progress, event queues, or any state where both time elapsed and progress toward completion are meaningful.

This style does not currently exist in `PUSH_TEMPLATE_STYLES` and must be added.

#### Android 12+ permission requirement

The SDK uses Android Alarms to periodically refresh the progress bar value in the expanded notification view. Starting Android 12 (API 31), exact alarms require the `SCHEDULE_EXACT_ALARM` or `USE_EXACT_ALARM` permission to be declared and granted by the app.

**Backup template behavior:** If the app does not have the required alarm permission, the Timer with Progress Bar template is not shown to the subscriber. Instead, a backup template is automatically displayed — this backup renders the Timer countdown but omits the progress bar. The subscriber receives the notification; only the visual progress bar component is absent.

> **Note for engineering:** To set the required permission, refer to the Push Templates developer documentation. This is an app-level permission that must be configured by the customer's mobile development team — it cannot be granted by the platform.

The marketer is informed of this behavior during template creation with a static note in the form (see §11 Copy — progress bar permission advisory).

#### Timer mode

Inherits the two-mode timer system from §6.6 (Duration / Specified Time) including the delivery-time note. The same `timer.mode`, `timer.duration`, and `timer.endTime` fields apply.

#### Fields

Inherits all common fields, plus:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `timer.mode` | enum | Yes | `"duration"` | Same as §6.6. |
| `timer.duration` | integer (seconds) | Conditional | `""` | Required when `timer.mode = "duration"`. Same as §6.6. |
| `timer.endTime` | string (ISO 8601) | Conditional | `""` | Required when `timer.mode = "specified_time"`. Same as §6.6. |
| `timer.displayFormat` | enum | No | `"hh:mm:ss"` | Same as §6.6. |
| `timer.expiredLabel` | string | No | `"Done"` | Text shown when timer reaches zero. ≤ 15 chars. |
| `progress.initialValue` | integer (0–100) | No | `0` | Percentage shown when the notification first appears. |
| `progress.label` | string | No | `""` | Text shown above or beside the progress bar. E.g. "Order Packing". ≤ 30 chars. |
| `progress.completedLabel` | string | No | `"Complete"` | Text shown when `progress.initialValue` reaches 100. ≤ 20 chars. |
| `hasImage` | boolean | No | `false` | Optional image thumbnail in the notification. |
| `imageUrl` | string | Conditional | `""` | Required when `hasImage = true`. |
| `style.progressBarColor` | string (hex) | No | `"#F59E0B"` | Fill color of the progress bar. Android only. |
| `style.timerColor` | string (hex) | No | `"#EF4444"` | Color of the countdown display text. Input labeled "Timer text color" with color picker. Android only. |
| `style.titleColor` | string (hex) | No | `""` | Android only. |
| `style.bodyColor` | string (hex) | No | `""` | Android only. |
| `style.buttonColor` | string (hex) | No | `""` | Android only. |
| `style.buttonTextColor` | string (hex) | No | `""` | Android only. |
| `actions` | array | No | `[]` | Action buttons. Android: max 3. Web: max 2. iOS: not supported. |

**Android implementation:** Requires custom `RemoteViews` with both a `Chronometer` widget and a `ProgressBar` widget in the expanded layout. Duration mode: timer end is computed at delivery time (same as §6.6). The progress bar's `progress.initialValue` is the static value at send time — live updates require subsequent push events with the same notification ID, which is outside the scope of this template.

**Web implementation:** Progress bar is not natively supported in Web Push `showNotification()`. On Web, the progress bar component is omitted and a fallback string `progress.label + ": " + progress.initialValue + "%"` is appended to the notification body. The timer behaves identically to §6.6 Web behavior (static at display time). The UI shows a warning on the Web chip: "Progress bar displays as text on Web."

---

### 6.8 Platform Support Matrix

| Template Type | iOS | Android | Web | Notes |
|---|---|---|---|---|
| Basic Notification | ✓ | ✓ | ✓ | Full support across all three. |
| Stylized Basic | ✓ (text only) | ✓ (full color) | ✓ (text only) | Background and button color only render on Android. |
| Single Image Carousel | ✓ (requires NCE in app binary) | ✓ (requires SDK RemoteViews) | ✗ | Web does not support carousel; notification is suppressed for Web subscribers. |
| Image Banner with Text Overlay | ✗ | ✓ | ✓ (image, no overlay) | iOS renders a standard basic notification when this type is sent (no image expansion, no overlay). Web renders the image below the text, not overlaid. |
| Timer | ✗ | ✓ | ✓ (static time only) | iOS not supported. Web timer is static at render time, not live. |
| Timer with Progress Bar | ✗ | ✓ | ✓ (progress as text) | iOS not supported. Web renders progress as appended text. |

**Suppression behavior:** When a template type is not supported on a selected platform, the notification is suppressed for subscribers on that platform — it is not sent at all. Suppressed subscribers are counted in a separate "Platform Unsupported" metric in node analytics. They do not advance through delivery branches.

**Validation:** If the only selected platform is unsupported for the chosen style (e.g., only iOS selected for a Timer template), saving is blocked with a clear error message.

---

## 7. States

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|---|---|---|---|---|---|
| **Empty — no template** | Node dropped on canvas, or template removed | Two dashed-border cards: "Create New" and "Select Existing." | Create New, Select Existing | Nothing persisted | Template is created or selected |
| **Step 1 — Style Picker** | Create New clicked | Modal with 6 style thumbnails, style name, platform badges | Select a style tile, Cancel | No data persisted | Style selected → Step 2 |
| **Step 2 — Configure (valid)** | Style selected, required fields filled | Form (left) + live preview (right). Save button active. | Edit fields, toggle platforms, Back, Cancel, Save Template | Draft exists in local state only | Save clicked → template persisted |
| **Step 2 — Configure (invalid)** | Required fields empty | Inline red error labels under `title` and/or `landingUrl`. Save button disabled. | Fill fields, Back, Cancel | No save attempted | All required fields filled |
| **Step 2 — Platform constraint warning** | Incompatible platform + style combo | Amber warning banner below the platform checkboxes. | Acknowledge warning, deselect platform, Back, Cancel, Save | Warning stored as metadata on the template | User deselects conflicting platform or saves knowingly |
| **Template selected** | Template picked from picker or saved from create modal | Template summary card: name, title, body, style badge, platform badges. Edit / Change / Remove actions. Platform preview switcher + live preview below. | Edit, Change, Remove, preview platform switcher | Node canvas label updated to `template.title` | Edit → create modal. Change → picker modal. Remove → empty state. |
| **Saving** | Save Template clicked | Save button shows spinner. Form disabled. | — | POST to template API | Success → modal closes. Failure → error toast |
| **Save error** | API returns error | Error toast: "Failed to save template. Try again." Form re-enabled. | Retry, Cancel | Draft preserved in local state | Retry succeeds or user cancels |
| **Delivery tab — AI Best Time on** | Toggle enabled | Amber toggle. Description: "Sends at each user's optimal engagement window." | Toggle off | Stored in `aiBestTime: true` | Toggle off |
| **Delivery tab — Smart Retry on** | Toggle enabled | Two mode buttons: Smart / Manual | Toggle off, select mode | Stored in `smartRetry.enabled: true, mode: "smart"\|"manual"` | Toggle off |
| **Output — Next Step** | Default state | Single output port info. | Switch to Delivery Branches | Node renders 1 output port on canvas | Mode switched |
| **Output — Delivery Branches, 0 selected** | Branches mode with no status checked | Red warning: "Select at least one status." Save Changes disabled. | Check a status | No save allowed | At least one status checked |
| **Output — Delivery Branches, 1+ selected** | Branches mode with statuses checked | Checkboxes filled, port count shown. | Add/remove statuses | Node renders N output ports | — |

---

## 8. Edge Cases

**Situation:** Marketer saves a carousel template with 5 images, then later edits it and removes 3 images. Live journeys already queued using this template have not yet been sent.
**Wrong behavior:** The send fires with 2 images but the notification was previewed with 5; marketer has no awareness of the change.
**Correct behavior:** Editing a template in use by a live journey should surface a warning: "This template is used by N active journey(s). Changes will apply to all pending sends." No blocking — the edit is allowed — but the warning must be visible and confirmed before saving.

---

**Situation:** Marketer uses `timer.mode = "specified_time"` with an `endTime` 30 minutes in the future. AI Best Sent Time holds the send for up to 4 hours. The timer expires before the notification is delivered.
**Wrong behavior:** Notification delivers with a timer already showing `00:00:00` or negative time. Recipient sees an expired countdown.
**Correct behavior:** This risk is specific to Specified Time mode — Duration mode is immune because the countdown starts at delivery time regardless of when the notification is dispatched. For Specified Time mode, the system checks `endTime` against the maximum possible delivery window (trigger time + AI Best Time hold + Smart Retry window) at template save time. If `endTime` falls within this window, an inline warning is shown: "Your timer may expire before some subscribers receive it. Extend the end time or switch to Duration mode." The save is not blocked, but the warning must be dismissed explicitly.

**Note:** This edge case does not apply when `timer.mode = "duration"` — the countdown always begins at the subscriber's individual delivery time, so it is always valid at the moment of delivery.

---

**Situation:** Marketer creates a carousel with per-image click URLs that contain `{{product.id}}` placeholders. A subscriber exists with no `product.id` value.
**Wrong behavior:** Click URL resolves to `https://store.com/product/` with a trailing slash and no ID — potentially a valid URL that lands on the wrong page silently.
**Correct behavior:** Same fallback logic as placeholder variables in other channels: if all OR-chain sources resolve to empty, the URL renders with the placeholder stripped. The resulting URL is `https://store.com/product/`. This is documented behavior and the marketer is informed via an inline note on carousel image URL fields: "URL placeholders that resolve to empty will leave the URL incomplete. Use the placeholder fallback chain to provide a default value."

---

**Situation:** Marketer selects both iOS and Android for the image carousel. iOS requires a `UNNotificationContentExtension` to be deployed in the app binary. The binary does not have it.
**Wrong behavior:** iOS sends are dispatched; the carousel category identifier is included in the APNs payload; iOS displays a standard notification without the carousel UI, potentially with a confusing "next/previous" button that does nothing.
**Correct behavior:** The platform must surface a one-time capability check when carousel is first selected with iOS as a target: "iOS carousels require your app to include a Notification Content Extension. Confirm with your iOS developer team before publishing this template." This check is a soft gate — it does not block — but it must be acknowledged.

---

**Situation:** Marketer uploads a carousel image that is 4 MB.
**Wrong behavior:** Upload succeeds, image is stored, send is dispatched. iOS NSE has a 30-second execution budget to download media. A 4 MB image on a slow connection takes longer than 30 seconds, causing the notification to fall back to no-image display.
**Correct behavior:** Image uploads are validated client-side and server-side at ≤ 1 MB per slide. Files above 1 MB show an immediate error: "Image must be under 1 MB. Try compressing the image before uploading."

---

**Situation:** Marketer configures a Timer with Progress Bar template and does not have a server-side push update mechanism wired to update progress.
**Wrong behavior:** Notification sends with `initialValue: 0` and never updates. Subscriber sees a perpetually empty progress bar.
**Correct behavior:** The progress bar in the template represents the initial state snapshot only. The template creation form includes a contextual note: "The progress bar displays the initial value at send time. Live updates require additional push events from your system via the push API. See documentation." This is documentation and expectation-setting, not a blocker.

---

**Situation:** Marketer sets `persistNotification: true` on a Basic template targeting iOS.
**Wrong behavior:** System stores the setting and attempts to apply it on iOS where it has no effect, confusing the marketer when iOS notifications still auto-dismiss.
**Correct behavior:** When `persistNotification` is enabled, the platform support badge for iOS shows a tooltip: "Persist is not supported on iOS. iOS notifications auto-dismiss per OS policy." The field remains editable for Web and Android targets.

---

**Situation:** Web Push platform is selected but subscriber has iOS Safari (PWA required, action buttons not supported).
**Wrong behavior:** Action buttons included in the Web Push payload are silently ignored by iOS Safari; marketer never knows.
**Correct behavior:** The notification is sent to all Web Push subscribers including iOS Safari. Action buttons are sent in the payload but silently ignored by iOS Safari — this is correct OS behavior and is not an error. Node analytics should count this as a successful delivery, not a failure.

---

## 9. Non-Functional Requirements

### Performance
- Template creation modal must open (Step 1 rendered) within 300 ms.
- Image upload must complete (CDN URL returned) within 3 seconds for files ≤ 1 MB on a 10 Mbps connection.
- Live preview in Step 2 must re-render within 100 ms of any field change (debounced at 150 ms).
- Platform preview switch must re-render within 50 ms.

### Scale
- A single push template can be used across unlimited journey nodes simultaneously. Template metadata is read-only at send time — updates to a template do not retroactively change in-flight sends that have already been enqueued.
- Carousel image slots: max 5 per template, no cross-template limit.

### Security
- Image URLs entered by marketers are not proxied through the platform server — they are delivered as-is to the device, which downloads directly. HTTPS is enforced at URL validation (HTTP URLs are rejected with an inline error).
- Placeholder variable injection sanitizes output before URL construction to prevent URL injection. Variables are URL-encoded when inserted into URL fields.
- Color hex values are sanitized to `#[0-9A-Fa-f]{6}` pattern; malformed values are rejected with inline error.
- Action button labels are stripped of HTML before storage and delivery.

### Reliability
- Template creation API calls are idempotent — a retry on network failure will not create a duplicate template.
- If the CDN image upload fails, the form remains editable with an error message. The template cannot be saved with a pending image upload in an error state.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|---|---|---|
| `push_template_modal_opened` | Create New or Select Existing clicked | `entry_point: "create"\|"select"`, `node_id` |
| `push_style_selected` | Style tile clicked in Step 1 | `style_id`, `node_id` |
| `push_template_modal_abandoned` | Modal closed without saving after any field was filled | `style_id`, `step: 1\|2`, `fields_filled: string[]` |
| `push_template_saved` | Save Template clicked and API returns success | `style_id`, `platforms: string[]`, `has_image`, `has_actions`, `has_carousel`, `has_timer`, `has_progress_bar` |
| `push_template_selected_existing` | Existing template picked from the picker | `template_id`, `style_id` |
| `push_platform_warning_seen` | Platform constraint warning shown | `style_id`, `conflicting_platform` |
| `push_preview_platform_switched` | Preview switcher tab clicked | `from_platform`, `to_platform` |
| `push_action_button_added` | Action button row added | `style_id`, `button_count_after` |
| `push_carousel_image_slot_filled` | Image URL set for a carousel slot | `slot_index`, `method: "url"\|"upload"` |

### Reporting Metrics

| Metric | Definition | Where it surfaces |
|---|---|---|
| **Sent** | Total notifications dispatched from the node | Node analytics overlay on canvas |
| **Delivered %** | Share of sent notifications confirmed delivered by the platform | Node analytics |
| **Clicked %** | Share of delivered notifications where the main notification body was tapped | Node analytics |
| **Action Button Click %** | Share of delivered notifications where any action button was tapped | Node analytics (per-button breakdown in detail view) |
| **Carousel Image Click %** | Share of carousel deliveries where a slide image was tapped (any slide) | Node analytics (available for `image_carousel` style only) |
| **Platform Unsupported %** | Share of subscribers who did not receive a send due to platform/style incompatibility | Node analytics (shows breakdown by platform) |
| **Timer Expired Pre-Delivery %** | Share of timer notifications using `specified_time` mode where `endTime` had passed before the notification was delivered | Node analytics (available for `timer` and `timer_with_progress_bar` styles using `specified_time` mode only; not applicable to `duration` mode) |
| **Progress Bar Backup Template Rate %** | Share of Timer with Progress Bar sends on Android where the alarm permission was absent and the backup template was displayed instead | Node analytics (available for `timer_with_progress_bar` style only) |
| **Revenue** | Total attributed revenue from customers who received this notification (requires Marketing Attribution enabled) | Node analytics |

---

## 11. Copy

### Empty state — no template

> **Set up your push notification**
> Create a new template or pick one from your library to configure this notification.

### Step 1 — modal title

> **Choose a notification style**
> Select how you want this notification to look.

### Step 1 — next button (no style selected)

> Select a style to continue

### Step 2 — title character count hint

> Title · [N]/65 characters

### Carousel — minimum image requirement error

> Add at least one image to continue.

### Carousel — missing click URL on filled slot

> Each image needs a tap destination URL.

### Action button — at platform limit

> [Platform] supports up to [N] buttons. Remove a button to add another.

### iOS action button advisory

> iOS action buttons must be registered in your app binary. Share this setup with your iOS developer before publishing.

### Timer — Duration mode note (inline in form)

> Countdown duration will start when the notification is delivered to the user after the event trigger and preset delays (if any).

### Timer — Specified Time mode: endTime in past (on save)

> The countdown end time is in the past. Update the end time or subscribers will see "Expired" immediately on delivery.

### Timer — Specified Time mode: end time within delivery window

> Your timer may expire before some subscribers receive it. Extend the end time or switch to Duration mode.

### Timer with Progress Bar — alarm permission advisory (inline in form, always visible)

> The SDK uses Alarms to periodically update the progress bar. On Android 12 and above, this requires an additional app permission. If the permission is not set, subscribers will see the Timer but not the progress bar. Refer to Push Templates developer documentation to set the required permission.

### Platform suppression advisory (carousel, iOS)

> Image Carousel is not natively supported on iOS. Sending to iOS requires a Notification Content Extension in your app. Confirm with your developer team.

### Image upload size error

> Image must be under 1 MB. Compress the file and try again.

### Image HTTPS error

> Image URL must use HTTPS.

### Save error toast

> Couldn't save the template. Check your connection and try again.

### Template in use — edit warning

> This template is used by [N] active journey(s). Saving changes will apply to all pending sends.

---

## 12. Dependencies

| Dependency | What is needed | Unavailable behavior | Owner |
|---|---|---|---|
| **iOS Notification Content Extension (NCE)** | App binary must ship a prebuilt NCE target for carousel and custom UI notifications. This is a one-time mobile build task. | Without NCE, carousels on iOS fall back to a standard text notification. The notification is delivered but the carousel UI does not appear. | iOS app team |
| **Mobile SDK — Android custom RemoteViews** | Carousel, image banner overlay, timer, and progress bar on Android require the SDK to handle custom `RemoteViews` inflation and Prev/Next `BroadcastReceiver` logic. | Without SDK support, these styles silently fall back to BigPicture (image only) or basic text notifications. | Android SDK / Platform team |
| **CDN / image hosting** | Uploaded carousel images must be stored at a publicly accessible HTTPS URL. | If CDN is unavailable, template creation is blocked for uploads; URL-based images are unaffected. | Infrastructure |
| **FCM push gateway** | Android and Web Push delivery. | Android and Web sends fail entirely. Retry logic applies. | Infra / Push gateway |
| **APNs push gateway** | iOS delivery. | iOS sends fail entirely. | Infra / Push gateway |
| **Web Push Service Worker** | End-user browser must have the service worker active to receive Web Push. | No delivery without a registered service worker; this is a subscriber-side requirement, not a platform requirement. | Web app team (one-time setup per customer domain) |
| **Push template API** | Save, update, list, and retrieve template objects with style-specific fields. Current backend schema (`body` only) must be extended to support the full template data shape. | Template creation modal cannot persist without API support. | Backend |

---

## 13. Out of Scope

| Exclusion | Reason |
|---|---|
| **Live Activity / Dynamic Island on iOS** | Live Activities use ActivityKit, not UserNotifications. They are a separate, higher-complexity feature requiring SwiftUI widget code in the app binary. Not a template-layer concern. |
| **Android 16 Live Updates / ProgressStyle** | Requires `POST_PROMOTED_NOTIFICATIONS` permission and prohibits `RemoteViews`. Separate feature with a different delivery model. |
| **Rich Communication Services (RCS)** | RCS is a separate channel node (`rcs`) already in the codebase. Not part of push notifications. |
| **In-app notification templates** | InApp is a separate channel node (`inapp`). Different rendering surface, different data model. |
| **Live progress bar updates via push API** | The progress bar template defines the initial state. Server-side live updates (pushing new progress values to the same notification ID) are a separate orchestration feature. |
| **Notification grouping / thread IDs** | iOS `thread-id` and Android `group` for notification stacking is a delivery configuration concern, not a template concern. |
| **A/B testing across template variants** | Template-level A/B split is a canvas-level feature (using the Split node), not a single-template feature. |
| **Emoji picker in title/body** | The existing emoji button exists as a UI stub. Implementation is a separate scope item. |
| **AI Enhance — tone variant generation** | The Sparkles button exists in the modal but shows an alert stub. AI copy generation is a separate feature. |

---

## 14. Open Questions

| # | Question | Why it's open | Owner | Resolution path |
|---|---|---|---|---|
| 1 | When a marketer edits a template used by a live journey, should in-flight sends (already enqueued but not yet dispatched) pick up the new template version or use the version at enqueue time? | Impacts whether a marketer can correct a typo in an active campaign or only in future sends. Both behaviors have legitimate use cases. | Product, Engineering | Decision needed before backend API design for template versioning. |
| 2 | For iOS carousels, should the platform surface a one-time setup confirmation (acknowledged per account) or a persistent per-template warning? | A per-account acknowledgement removes friction for teams that have already shipped the NCE. A per-template warning is safer for new accounts. | Product | Decide at iOS carousel implementation kickoff. |
| 3 | Does `progress.initialValue` represent the progress at the moment of send or the progress embedded in the template at creation time? If a marketer creates a template once and reuses it across multiple journey instances, each with a different customer state, `initialValue` should come from event data, not a fixed number. | This determines whether progress bar supports dynamic values from attributes (like SMS variable mapping) or is always a static design-time number. | Product, Engineering | Needs product decision on whether progress bar value can be mapped to a customer/order attribute. |
| 4 | Should the creation modal allow changing the `style` when editing an existing template, or should style changes require creating a new template? | Allowing style changes risks data model mismatches (e.g., switching from carousel to basic leaves orphaned `carousel.images` data). Blocking style changes is simpler but frustrating if a marketer wants to repurpose a template. | Engineering, Product | Recommend: lock style in edit mode. |
| 5 | The existing `PUSH_PREVIEW_PLATFORMS` shows Mac, Windows, Win10, Android — but no iOS and no browser (Chrome, Firefox, Safari) previews. Should iOS and web browser previews be added to the Step 2 preview switcher in this scope? | Web push has distinct rendering per browser/OS. iOS has a unique notification format. Previews set accurate expectations. | Design | Needs design effort estimate; flag as recommended. |
| 6 | For Timer `specified_time` mode on Web: should the Service Worker suppress the notification entirely if `endTime` has already passed by the time `showNotification()` fires? | Duration mode is immune (countdown starts at delivery). Specified Time mode is at risk. Suppressing avoids showing an expired timer; not suppressing lets the notification body copy still reach the subscriber. | Product | Recommend suppression with fallback to a basic notification (no timer text) when `endTime` is in the past at Service Worker fire time. |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff |
|---|---|---|---|
| **Platform suppression (not degradation) for unsupported style/platform combos** | Degrade silently (e.g., send a basic notification when carousel is not supported) | Silent degradation misleads the marketer — analytics show "delivered" but the user received a completely different notification. Suppression is honest; the marketer can see the gap and respond. | Marketer must be intentional about platform targeting. Some marketers may prefer any delivery over none. |
| **`timer_with_progress_bar` as a separate style, not a variation of `timer`** | Add a `hasProgressBar` boolean toggle to the Timer style | Separate styles allow distinct thumbnails, distinct validation logic, distinct platform support badges, and distinct analytics. A single style with a toggle creates divergent data shapes under one ID, complicating backend serialization and form rendering. | Adds a 6th entry to the style picker. Mitigated by good thumbnails and clear naming. |
| **Static progress bar value in template; live updates via push API out of scope** | Support dynamic progress values mapped to customer attributes (like SMS variable mapping) | The infrastructure for real-time progress update pushes is a backend orchestration feature that does not belong in the template spec. Scoping it out here keeps this PRD actionable while preserving the option for future expansion via attribute-mapped values. | Templates with static progress bars are less powerful for live order-status use cases. Documented as a known limitation in §13. |
| **Color fields shown for all platforms with "not supported" notes, not hidden** | Hide color pickers entirely when the selected platform does not support them | Hiding fields that would apply if the marketer later adds a supported platform causes confusion and data loss. Showing with muted notes is transparent about what will render, preserves the setting, and avoids a "why did my color disappear" question. | Slightly more cluttered form for Android-only campaigns where colors fully apply. |
