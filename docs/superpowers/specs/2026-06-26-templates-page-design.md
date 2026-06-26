# Templates Page — Product Design Spec

**Date:** 2026-06-26
**Status:** Approved — ready for implementation
**Audience:** Internal product team, engineering, design
**Scope:** Standalone Templates page covering WhatsApp, SMS, Email, RCS, Push, and Onsite channels

---

## Table of Contents

1. [What the Prototype Shows](#0-what-the-prototype-shows)
2. [Feature Brief](#1-feature-brief)
3. [The Job](#2-the-job)
4. [Success Metrics](#3-success-metrics)
5. [Who Uses This and When](#4-who-uses-this-and-when)
6. [User Flows](#5-user-flows)
7. [Functional Specification](#6-functional-specification)
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

### What's built (v1 frontend scaffold)

- **Grid card view** with channel tabs (All, WhatsApp, SMS, Email, Push, RCS, Onsite), left filter panel (Channel, Type, Status, Language, Used in Flows), and a 3-column responsive card grid.
- **Channel-aware preview renderers** per card: WhatsApp renders a chat bubble with header/body/buttons on a grey background; SMS renders plain text on a cream background; Email shows subject + preheader in a mini client frame; Push shows an Android notification card; RCS shows a rich card; Onsite renders a browser-frame popup.
- **Dual quality signals on card**: channel quality badge (H/M/L/Unknown — Meta/carrier rating) and a platform engagement bar (internal health score + read rate %).
- **Card hover state**: View Details (primary), Send Campaign (secondary), View Analytics (link). "Used in N flows" pill at bottom-right.
- **Detail drawer**: Right-side 600px overlay with 3 tabs — Preview (full-size channel render + metadata), Analytics (step funnel with Sent → Delivered → Read → Clicked + CTA breakdown + dual quality panel + time window selector), Feedback (quality explanation + internal health trend + AI recommendation chip).
- **My Templates / Template Library toggle**: Segmented control switching between user's own templates and platform-curated ecommerce starters. Library has its own Use Case filter and "Use this template" clone flow.
- **Channel picker modal**: Opened by "+ Create new template". 6-tile grid (WhatsApp, SMS, Email, Push, RCS, Onsite). Per-channel coming-soon drawer since creation forms are future scope.
- **Filter chips**: Active filters displayed as dismissible chips above the grid.
- **Empty states**: Zero templates, zero filter results, library channel starters pending.
- **Static data only**: No backend dependency. All templates, library starters, and analytics are hardcoded mock data.

### What's incomplete

- Per-channel template creation forms (WhatsApp composer, SMS DLT form, Email HTML editor etc.) — channel picker opens but lands on a "coming soon" drawer per channel.
- Sync button is cosmetic — triggers an animation and toast but makes no API call.
- "Send campaign" navigation redirects to `/campaigns` without pre-filling template state (Campaign creation page not yet built).
- Bulk selection and bulk actions (archive, delete, duplicate) are not implemented.
- Template editing — "Edit" button in drawer opens a toast placeholder.

### What's absent

- Backend API integration for template CRUD.
- Real WhatsApp BSP / Meta approval flow.
- DLT registration workflow for SMS/RCS.
- A/B testing between template variants.
- Template versioning and history.
- Teammate comments/notes on templates.

---

## 1. Feature Brief

The Templates page is the central library where sellers create, browse, filter, and manage channel-specific message templates across WhatsApp, SMS, Email, RCS, Push, and Onsite. Today, templates are scattered across individual flow nodes — a seller who wants to reuse a high-performing WhatsApp message must find the flow it lives in, open the node, copy the content, and rebuild it elsewhere. There is no cross-channel library, no way to see which templates are performing well, and no guided path for new sellers who have never built a compliant template before.

This page consolidates the entire template lifecycle: browse existing templates with live channel previews and performance signals, discover platform-curated ecommerce starters from the Template Library, create new templates via a channel picker, and understand per-template performance through a delivery and engagement funnel with both external quality ratings and internal health scores.

---

## 2. The Job

**The irreducible job:** Give every seller a single place to see, find, create, and act on their message templates — across all channels — without needing to open a flow builder or contact support.

**Three things that make it not worth shipping if missing:**

1. **Channel-accurate preview on the card.** A seller browsing 30 WhatsApp templates must see what each message actually looks like — header image, body text, CTA buttons — in a WhatsApp bubble, not a plain text summary. Generic previews break trust in the library. If the preview isn't channel-native, sellers will keep maintaining templates in spreadsheets.

2. **Dual quality signal.** The card must surface both the channel quality rating (Meta/carrier external score) AND the platform's internal engagement health score. Showing only the external rating misleads: a Meta "High quality" template can still perform below segment average. Showing only read rate loses regulatory context. Both are required for a complete picture.

3. **Template Library with clone-to-draft flow.** Sellers — especially new ones — need curated ecommerce starters they can preview, personalise, and submit for approval in one flow. Without this, first templates get rejected due to compliance errors, killing momentum. The library is the onramp; without it, the create flow is a blank canvas that most sellers will abandon.

---

## 3. Success Metrics

| Metric | Baseline | Target | Window |
|---|---|---|---|
| Template creation-to-approval rate | N/A (templates created in nodes, not tracked standalone) | ≥ 70% of submitted templates approved within 72 hours | 60 days post-launch |
| Time from Templates page load to first template submission | N/A | < 8 minutes median | 30 days post-launch |
| Template Library adoption | 0% (feature doesn't exist) | ≥ 30% of new templates cloned from a Library starter | 60 days post-launch |
| Search-to-action rate | N/A | ≥ 25% of search sessions result in View Details or Send Campaign | 30 days post-launch |
| Templates page as entry point for campaigns | N/A | ≥ 20% of campaign creations start from Templates page | 60 days post-launch |
| Low / Unknown quality templates actioned | N/A | ≥ 40% of Low-quality templates edited or archived within 30 days of signal appearing | 60 days post-launch |

---

## 4. Who Uses This and When

**The retention marketer running WhatsApp journeys**
Goal: Find the right template quickly when building a new flow touchpoint, or verify a template is still performing before reusing it. At the moment of use: they're mid-flow-build, needing to confirm which cart recovery template had the best read rate last month. Success: filter by WhatsApp + Cart Recovery, sort by Highest read rate, see the winner in 30 seconds, click "Use in flow" (future) or copy template ID. Failure: no filtering by use case, no sort by performance — they guess or open 5 individual nodes to compare.

**The growth marketer launching first campaign**
Goal: Create a valid, compliant WhatsApp template that passes Meta approval without previous experience. At the moment of use: setting up their first journey, reaching the template step with no saved templates. Success: opens Template Library, finds "Cart Recovery — Product Image", previews it, clicks "Use this template", edits the body text, saves as Draft, submits for approval — all in under 8 minutes. Failure: Template Library doesn't exist, they create from scratch and submit a template with promotional language in a Utility category, get rejected.

**The CRM manager maintaining the template library**
Goal: Keep the library clean — archive low performers, track approval status, spot templates with degraded quality before they affect campaign deliverability. At the moment of use: weekly template audit. Success: filter by Status: Active + Quality: Low/Unknown, see a list of at-risk templates, click into Feedback tab for each, archive or queue for edit. Failure: no quality filter, no feedback tab, must manually remember which templates are underperforming.

---

## 5. User Flows

### 5.1 Browse and find a template — happy path

1. Seller navigates to Templates from the left nav.
2. Page loads "My Templates" view showing all templates in the grid (default: sort by Newest).
3. Seller clicks the WhatsApp channel tab — count updates, grid filters to WhatsApp only.
4. Seller types "cart" in the search bar — grid narrows to matching templates.
5. Seller clicks a card → Detail drawer opens on the right, Preview tab active.
6. Seller switches to Analytics tab — sees 30-day funnel and quality signals.
7. Seller switches to Feedback tab — sees AI recommendation and quality explanation.
8. Seller clicks "Send Campaign" — navigates to `/campaigns` (template redirect, future state: pre-filled).

### 5.2 Clone from Template Library — first-time seller

1. Seller has 0 templates. Empty state shows "Browse Library" CTA.
2. Seller clicks "Browse Library" → view switches to Template Library.
3. Seller clicks Use Case filter → selects "Cart Recovery".
4. Seller hovers a library card → "Preview" and "Use this template" appear.
5. Seller clicks "Preview" → drawer opens (Preview tab only, no Analytics/Feedback).
6. Seller sees full message preview with `{{customer.name}}` placeholders highlighted.
7. Seller clicks "Use this template" → a Draft copy is created in My Templates.
8. View switches to My Templates, drawer opens to the new Draft with a toast: "Template added — customise and submit for approval."
9. Seller clicks "Edit" → per-channel creation form (future scope, shows coming-soon drawer in v1).

### 5.3 Create a new template from scratch

1. Seller clicks "+ Create new template".
2. Channel picker modal opens (6 channel tiles).
3. Seller selects WhatsApp — modal closes, per-channel creation drawer opens.
4. In v1: coming-soon drawer shows channel name + capability summary + "Notify me when ready" toggle.

### 5.4 Filter and audit low-quality templates

1. Seller opens left filter panel.
2. Expands Status accordion → selects "Active".
3. Seller sorts grid by "Highest read rate" → lowest performers float to the bottom.
4. Seller opens a low-engagement template → Feedback tab → sees quality explanation and recommendation.
5. Seller clicks "Edit" (future scope) or kebab menu → Archive.

### 5.5 View analytics for a template

1. Seller hovers a card → clicks "View Analytics".
2. Drawer opens directly to Analytics tab (not Preview).
3. Seller sees 30-day step funnel, CTA breakdown, dual quality panel.
4. Seller changes time window to "90 days" → numbers update.
5. Seller closes drawer with X.

---

## 6. Functional Specification

### 6.1 Page Layout

The page has a fixed two-column layout:

| Zone | Width | Contents |
|---|---|---|
| Left filter panel | 240px (collapsible to 0) | Channel, Type, Status, Language, Used in Flows filters |
| Main content | flex-1 | View toggle, channel tabs, search/sort bar, active filter chips, template grid |

A collapse arrow on the filter panel allows sellers to maximize the grid. The panel state is preserved in component state (not persisted to localStorage in v1).

### 6.2 Channel Tabs

Tabs: All · WhatsApp · SMS · Email · Push · RCS · Onsite

Each tab shows a live count badge reflecting the current filter state (not total — filtered). The "All" tab count equals the total visible templates. Tab selection filters the grid and updates the Channel filter in the left panel (they are in sync).

### 6.3 Search, Sort, Density

**Search:** Full-text across template name and body text. Debounced at 200ms. Matches are highlighted in template name on the card (not in preview). Searching clears the Channel tab selection to "All" unless the tab was explicitly set by the user in the same session.

**Sort options:** Newest (default) · Most used in flows · Highest read rate · Alphabetical (A–Z)

**Grid density:** Comfortable (default, card height ~320px) · Compact (card height ~240px). In Compact mode the preview area is reduced; quality signals and metadata remain visible.

### 6.4 Left Filter Panel

Accordions, all expanded by default:

| Filter | Options |
|---|---|
| Channel | All · WhatsApp · SMS · Email · Push · RCS · Onsite |
| Type | All · Marketing · Utility |
| Status | All · Active · Draft · Rejected · In review · Disabled · Paused |
| Language | All · English · Hindi · Regional |
| Used in flows | Toggle (off by default) — shows only templates actively used in ≥1 live journey |

Active filters appear as dismissible chips in a strip above the grid. "Clear all" link resets all filters to defaults.

### 6.5 Template Card

Each card contains:

**Header row:** Channel icon (colored) + channel name · Status badge (color-coded) · Checkbox (on hover, for future bulk selection)

**Preview area:** Channel-specific renderer. Scales content to fit card height. Not interactive (no scrolling). Shows a representative excerpt — full content available in drawer.

| Channel | Preview renderer |
|---|---|
| WhatsApp | Chat bubble on WhatsApp grey background. Header (image placeholder or bold text) + body (3 lines max) + button pills. |
| SMS | Plain text on cream/off-white background in monospace style. Body truncated at 80 chars + DLT sender ID at footer. |
| Email | Mini email client frame: subject line header + preheader + body excerpt. |
| Push | Dark background (device wallpaper feel) + white notification card with app icon, title, body. |
| RCS | Light blue background + rich card with image placeholder, title, body, button pills. |
| Onsite | Browser chrome frame (traffic light dots + URL bar) with popup/banner centered. |

**Footer row (always visible):**
- Left: Quality badge (H = green, M = amber, L = red, Unknown = grey) + engagement health bar (coloured strip, 40px wide)
- Right: Read rate % (or "–" if no data) · "Used in N flows" pill (hidden if 0)

**Hover overlay:** 60% dark overlay preserving content visibility behind. Three actions centered:
- View Details (primary filled button)
- Send Campaign (outlined button) → navigates to `/campaigns`
- View Analytics (purple text link)

### 6.6 Detail Drawer

Right-side drawer, 600px wide, overlays the grid with a backdrop. Opens from card hover actions or clicking the card body. Closes with X button or clicking the backdrop.

**Three tabs:**

**Preview tab:**
- Full-size channel preview (same renderer, large mode, scrollable)
- Metadata block: template name, channel, category, subcategory, template ID (monospace), language, created date, status badge
- Info banner (channel-specific): e.g. "Media is editable while sending campaign" for WhatsApp
- Bottom action bar: Edit (opens coming-soon drawer in v1) · Test · Send Campaign · kebab menu (Duplicate / Archive / Delete)

**Analytics tab:**
- Time window selector: Last 7 days · 30 days · 90 days · All time
- Step funnel (horizontal): Sent → Delivered (pct + count) → Read (pct + count) → Clicked (pct + count). Each step shows a percentage pill and absolute count. Step widths are proportional to conversion rate.
- CTA breakdown: per-button click count and rate below the funnel
- Dual quality panel (side by side):
  - Left card: Channel quality — tier badge + source label (Meta / Carrier / Platform) + one-paragraph explanation of what the tier means
  - Right card: Platform health — score out of 100 + read rate vs channel average + 7-point sparkline trend

**Feedback tab:**
- Quality explanation: What the current tier means and what drives it (channel-specific copy)
- Engagement health summary: Platform score with colour coding, trend direction (↑ improving / ↓ declining / → stable)
- AI recommendation chip: A single actionable insight, e.g. "This template performs 2.3× above your WhatsApp average — consider expanding its reach" or "Read rate has dropped 12% in 14 days — review content or audience targeting"
- For Draft/Rejected templates: Shows approval status, rejection reason (if any), and suggested next steps

### 6.7 Template Library

Toggled via the "Template Library" pill in the segmented control next to the "My Templates" heading.

**Differences from My Templates:**
- Warm off-white grid background (`#FAFAF7`) with "Curated by Dowl" badge + descriptor text
- Cards have no status badge, no read rate, no quality badge
- Cards show: channel chip + use case chip (Cart Recovery, Order Confirmation, Win-back, COD to Prepaid, Post-purchase Review, Flash Sale, Re-engagement)
- Hover actions: Preview (primary) · Use this template (secondary)
- Left panel replaces Status filter with Use Case filter

**Clone flow:**
1. "Use this template" → creates a Draft copy in My Templates (client-side state in v1)
2. View switches to My Templates, new Draft is highlighted
3. Toast: "Template added to your library — customise and submit for approval"

### 6.8 Channel Picker Modal

Triggered by "+ Create new template". Centered modal, 480px wide.

- Heading: "What channel is this template for?"
- 2×3 grid of channel tiles: WhatsApp · SMS · Email · Push · RCS · Onsite
- Each tile: channel icon (colored) + channel name + one-line descriptor
- Single click selects and dismisses → opens per-channel creation drawer
- In v1: creation drawer shows channel name, capability summary (what the future form will support), and a "Notify me when ready" toggle

---

## 7. States

| State | Trigger | What the user sees | Available actions | How it exits |
|---|---|---|---|---|
| **Loading** | Page first mounts | 6 skeleton cards pulsing in 3-column grid | — | Mock data loads (instant in v1) |
| **Populated — My Templates** | Default after load | Grid of template cards, all filters at default | Filter, search, sort, click card, create | User interaction |
| **Populated — Template Library** | Toggle switched | Curated starter cards on off-white bg | Filter by use case, preview, use | Toggle back or use template |
| **Filtered — results** | Any filter/search active | Filtered grid + active chips above grid | Dismiss chips, clear all | Remove filters |
| **Filtered — zero results** | No templates match filters | Inline empty: "No templates match your filters" + "Clear filters" link | Clear filters | Clear filters |
| **Empty — no templates** | Account has zero templates | Illustrated empty state + two CTAs | Create template / Browse Library | Create or Library |
| **Drawer open — Preview** | Card click or View Details | Drawer overlays right side, Preview tab active, backdrop dims grid | Switch tabs, Edit, Test, Send Campaign | X or backdrop click |
| **Drawer open — Analytics** | View Analytics hover action | Drawer opens to Analytics tab directly | Switch tabs, change time window | X or backdrop click |
| **Drawer open — Feedback** | Tab click within open drawer | Feedback tab content | Switch tabs | X or backdrop click |
| **Channel picker open** | + Create new template | Centered modal with 6 channel tiles | Select channel, close | Channel selected or ESC |
| **Coming-soon drawer** | Channel selected in picker (v1) | Channel-specific capability summary + notify toggle | Close, toggle notify | Close |
| **Sync in progress** | Sync button clicked | Sync icon animates, button disabled | — | 1.5s animation completes → toast |

---

## 8. Edge Cases

**Template with zero send history**
Template exists in Active status but has never been used in a flow or campaign. Analytics tab shows a zero-state: "No send data yet. Use this template in a flow or campaign to start seeing performance." Quality badge shows "Unknown" with tooltip: "Quality is rated by Meta after the first 1,000 sends."

**Draft template in search results**
Seller searches for a term that matches a Draft template name. Draft templates appear in results with a grey "Draft" status badge. Analytics tab shows zero-state. Feedback tab shows approval guidance.

**Template used in a deleted flow**
`usedInFlows` count shows N, but clicking the "Used in N flows" pill (future scope) would show a deleted flow. In v1 the pill is display-only so this does not surface. When flow linking is implemented, deleted flows must be excluded from the count.

**Rejected template with no rejection reason from carrier**
Some carriers return a rejection without a reason code. Feedback tab shows: "Rejected by [carrier] — reason not provided. Review the content guidelines and resubmit." Edit & Resubmit button still appears.

**Onsite template quality badge**
Onsite has no external carrier quality signal. Quality badge shows platform-only: the internal engagement score. The badge label reads "Platform" instead of "Meta" or "Carrier" to clarify the source.

**Read rate of 0% on an active template**
Possible for Push where impressions aren't always trackable. Engagement bar shows empty (grey) rather than red. Tooltip: "Read tracking not available for this channel — CTR is the primary engagement signal."

**Long template name overflows card header**
Template names can be up to 100 characters. Card header truncates at 28 characters with ellipsis. Full name shown in drawer header and on hover tooltip.

---

## 9. Non-Functional Requirements

**Performance**
- Page must render the grid (with mock data) within 300ms of navigation.
- Filtering and searching must update the grid within 50ms (all client-side).
- Detail drawer must open within 100ms of click.
- Channel preview renderers must paint within 50ms of drawer open.

**Accessibility**
- All filter controls must be keyboard navigable.
- Cards must have aria-label including template name and channel.
- Drawer must trap focus when open and restore focus on close.
- Status badges and quality badges must not rely on colour alone — include text labels.

**Responsiveness**
- Grid: 3 columns on desktop (≥1280px), 2 columns on tablet (768–1279px), 1 column on mobile (<768px).
- Filter panel collapses on mobile — accessible via a "Filters" button above the grid.
- Drawer becomes full-screen on mobile.

**Security**
- All template content is rendered as text — no dangerouslySetInnerHTML. Variable placeholders (`{{customer.name}}`) are rendered as styled spans, not evaluated.

---

## 10. Analytics & Instrumentation

| Event | Trigger | Properties |
|---|---|---|
| `templates_page_viewed` | Page load | `view: "my"\|"library"` |
| `template_card_clicked` | Card body or View Details | `template_id`, `channel`, `status` |
| `template_analytics_viewed` | View Analytics clicked or Analytics tab opened | `template_id`, `channel`, `time_window` |
| `template_library_opened` | Library toggle clicked | — |
| `template_library_starter_used` | "Use this template" clicked | `starter_id`, `channel`, `use_case` |
| `template_create_modal_opened` | "+ Create new template" | — |
| `template_channel_selected` | Channel tile clicked in picker | `channel` |
| `template_search_performed` | Search input with ≥ 2 chars (debounced) | `query_length`, `result_count` |
| `template_filter_applied` | Any filter changed | `filter_type`, `filter_value`, `result_count` |
| `template_send_campaign_clicked` | Send Campaign button | `template_id`, `channel` |
| `template_drawer_closed` | X or backdrop click | `template_id`, `last_active_tab` |

---

## 11. Copy

**Page title:** "Templates"

**Page subtitle:** "Create and manage message templates across all channels."

**My Templates heading:** "My templates"

**Template Library heading:** "Template Library"

**Library descriptor:** "Curated by Dowl · Ready-to-use ecommerce starters — personalise and submit for approval"

**Empty state — no templates:**
> "Your template library is empty"
> "Create your first template or start from a curated ecommerce starter."
> CTAs: "Create template" · "Browse Library"

**Empty state — filter returns no results:**
> "No templates match your filters"
> [Clear filters]

**Search placeholder:** "Search by template name or body..."

**Sort label:** "Sort by"

**Create button:** "+ Create new template"

**Sync button:** "Sync"

**Sync toast:** "Templates synced"

**Channel picker heading:** "What channel is this template for?"

**Coming-soon drawer — heading:** "[Channel] template builder"

**Coming-soon drawer — body:** "The [Channel] template creation form is coming soon. Toggle the notification to be the first to know."

**Clone success toast:** "Template added to your library — customise and submit for approval"

**Analytics — no data state:** "No send data yet. Use this template in a flow or campaign to start seeing performance."

**Quality explanation — High (WhatsApp):** "Meta rates this template as High quality based on strong delivery rates, positive customer interactions, and low block rates. We recommend keeping the content style consistent to maintain this rating."

**Quality explanation — Unknown:** "Quality is rated after the first 1,000 sends. Keep monitoring after your first campaign."

**Feedback — AI recommendation chip prefix:** "AI insight · "

**Drawer — Edit button:** "Edit"

**Drawer — Test button:** "Test"

**Drawer — Send Campaign button:** "Send Campaign"

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Owner |
|---|---|---|---|
| Backend template API | CRUD for template objects across all channels | v1 ships with static mock data; no runtime impact | Engineering |
| WhatsApp BSP / Meta approval webhook | Real approval status updates | v1 shows static status from mock data | Infra / WhatsApp BSP |
| DLT registration (SMS/RCS) | Carrier-assigned DLT IDs for Indian SMS/RCS | Mock DLT IDs in v1 | Compliance / Carrier |
| Campaign creation page (`/campaigns`) | "Send Campaign" navigation target | Redirects to `/campaigns`; no pre-fill in v1 | Product (Campaigns spec) |
| Per-channel creation forms | WhatsApp, SMS, Email, Push, RCS, Onsite composers | Coming-soon drawer shown in v1 | Engineering (future scope) |
| Analytics pipeline | Real send/deliver/read/click data per template | Static mock analytics in v1 | Data / Analytics |

---

## 13. Out of Scope

| Exclusion | Reason |
|---|---|
| Per-channel template creation forms | Defined as future scope; channel picker wires the entry point |
| Bulk selection and bulk actions | Interaction design not finalised; cards have checkboxes on hover as placeholder |
| Template versioning / history | Requires backend versioning schema; out of scope for v1 |
| Teammate comments on templates | Collaboration feature; separate spec |
| A/B testing between template variants | Canvas-level feature via Split node, not template-level |
| Email HTML editor | Email template creation is a complex sub-feature; separate spec |
| WhatsApp template submission to Meta BSP | Requires BSP integration; approval flow triggers on save in backend |
| Real-time sync with Meta / carrier approval status | Requires webhook listener; v1 uses static status |

---

## 14. Open Questions

| # | Question | Why it's open | Owner | Resolution path |
|---|---|---|---|---|
| 1 | When "Send Campaign" navigates to `/campaigns`, what state is pre-filled? Template ID only, or full template content? | Depends on Campaign page data model which is not yet specced | Product (Campaigns) | Resolve when Campaign creation spec is written |
| 2 | Should the "Used in N flows" pill link to a list of those flows? | Useful for CRM managers doing audits; requires cross-referencing template ID against all flow nodes | Engineering | Recommend yes; implement when template-flow relationship is indexed in backend |
| 3 | What is the platform engagement score formula? | Internal score shown as a number 0–100 on the card and drawer; the weighting of read rate, CTR, unsubscribes is not yet defined | Product / Data | Needs data team input on signal weighting |
| 4 | Should Template Library starters be global (same for all accounts) or customisable per vertical (D2C vs SaaS vs fintech)? | All current starters are ecommerce-oriented; future accounts may be non-D2C | Product | Confirm account-type segmentation before Library is backend-powered |
| 5 | For Onsite templates — should the popup/banner visual be configurable (background color, font) in the same form as messaging channels? | Onsite has visual design properties that messaging channels don't; may need a separate visual editor | Design / Engineering | Separate Onsite template spec needed before creation form is built |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff |
|---|---|---|---|
| **Dual quality signal on card (channel quality + platform score)** | Show only channel quality rating (Meta/carrier) | External ratings alone are misleading for audience-specific performance. A Meta "High quality" template can still have a below-average read rate for a specific seller's audience. Showing both gives a complete picture. | Slightly more information density on the card footer. Mitigated by compact layout (badge + bar, ~60px combined). |
| **Detail drawer instead of full-page navigation** | Navigate to a `/templates/:id` detail page | Preserving grid state (filters, scroll position, selected channel tab) is critical for power users doing template audits. A drawer keeps them anchored. Full-page navigation would require state persistence across routes. | Drawer limits vertical space for analytics; mitigated by scrollable tabs and collapsible sections. |
| **Template Library as a toggle within the same page** | Separate `/templates/library` route | The library is a discovery companion to My Templates — sellers switch between them frequently (browse library, clone, edit). A toggle keeps context; a separate route adds friction and breaks the "find → clone → edit" flow. | If Library grows very large, performance may need pagination. Acceptable for v1 with static data. |
| **Channel picker → coming-soon drawer (v1)** | Disable "Create new template" until forms are ready | Disabling the CTA trains sellers that creation is unavailable. The coming-soon drawer communicates intent, lets sellers notify themselves, and keeps the information architecture intact for when forms ship. | Slightly disappointing UX for sellers who click Create expecting a form. Mitigated by honest copy and notify toggle. |
| **No blur on card hover (use dim overlay instead)** | Blur the preview (as in reference wireframe) | Blur destroys content visibility — sellers hover to peek at the message, not to see an abstract. A 60% dark overlay lets content remain partially visible while the action buttons are clearly readable. | Overlay slightly obscures quality signals in footer; mitigated by showing footer below the overlay zone. |
| **"Used in N flows" pill — display only in v1** | Link pill to flow list immediately | Flow-template relationship requires a backend index to be accurate. Showing a static count from mock data without a drill-down is sufficient for v1; the link is a future enhancement. | Sellers cannot click through to see which flows; acceptable given backend dependency. |
