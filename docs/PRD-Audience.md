# Audience Page — Product Requirements Document

## Table of Contents

1. [Feature Brief](#1-feature-brief)
2. [The Job](#2-the-job)
3. [Success Metrics](#3-success-metrics)
4. [Who Uses This and When](#4-who-uses-this-and-when)
5. [User Flows](#5-user-flows)
6. [Functional Specification](#6-functional-specification)
7. [States](#7-states)
8. [Edge Cases](#8-edge-cases)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Analytics & Instrumentation](#10-analytics--instrumentation)
11. [Copy](#11-copy)
12. [Dependencies](#12-dependencies)
13. [Out of Scope](#13-out-of-scope)
14. [Open Questions](#14-open-questions)
15. [Decision Log](#15-decision-log)

---

## 1. Feature Brief

The Audience page is the central workspace for understanding the people in a store's customer database. Marketers currently have no way to browse, search, or inspect individual users without going through a third-party analytics tool or asking engineering to run a query. This page removes that dependency by giving every marketer a live, searchable view of the user base — who is reachable on which channels, how valuable each customer is, and exactly what they have done on the platform. The profile drawer extends this to a full record of a user's attributes and event history, enabling a marketer to make an informed decision about messaging or segmentation without switching tools.

---

## 2. The Job

Give marketers a complete, self-service view of every user in their store so they can understand who they are talking to before they build or launch a campaign.

Three things that, if missing, make it not worth shipping:

1. **Reachability is visible per user.** A marketer must be able to see, at a glance, which channels they can actually reach a user on. A profile without reachability data is useless for a messaging platform.
2. **Individual user activity is inspectable.** The event timeline must show what the user has actually done, not just what was tracked on them. Without this, the drawer is just a contact card.
3. **Search and filter work on real data.** The list must be filterable by meaningful behavioral and identity dimensions. Static labels that don't update are not filtering — they are decoration.

---

## 3. Success Metrics

| Metric | Baseline (current) | Target (90 days) |
|--------|-------------------|-----------------|
| % of marketing sessions that include an Audience page visit | 0% (page not in use) | > 30% |
| Avg. profile drawer opens per session | 0 | > 3 |
| % of marketer-reported "I need to know X about a user" resolved without engineering | ~10% | > 80% |
| Search-to-drawer conversion (marketer finds a user and inspects them) | — | > 60% of search sessions |
| "Add to Segment" action triggered from drawer per week | 0 | > 20 |
| Support tickets requesting user-level data export | baseline TBD | −50% |

---

## 4. Who Uses This and When

**Persona 1 — Campaign Marketer preparing a send**

Goal: Verify that a specific customer is in the right segment and reachable on WhatsApp before launching a campaign.
Emotional state: Pre-campaign pressure; needs quick confirmation, not discovery.
Success: Finds the user in under 10 seconds, confirms subscription status and LTV, proceeds to launch.
Failure: Can't find the user by name or email; doesn't know if the customer has opted in; has to ask engineering.

---

**Persona 2 — CRM Manager troubleshooting a delivery failure**

Goal: Understand why a specific user didn't receive a message — was it a subscription issue, a channel block, or missing data?
Emotional state: Reactive, slightly stressed. Something went wrong and they need an answer for a stakeholder.
Success: Opens the drawer, sees the channel subscription status and event timeline, identifies the gap (e.g., SMS opt-out), closes the loop.
Failure: The event timeline doesn't show the delivery event; reachability status doesn't distinguish between opted-out and never-subscribed.

---

**Persona 3 — Growth Marketer building a new segment**

Goal: Understand the composition of the user base before creating a new audience segment — how many users are in the VIP tier, how many abandoned a cart in the last 7 days.
Emotional state: Exploratory, hypothesis-driven. Looking for patterns, not specific users.
Success: Uses filter pills and KPI tiles to get a rough breakdown; inspects 2–3 representative profiles to validate the hypothesis; proceeds to create a segment.
Failure: Filter labels are static, counts don't reflect the actual database, and the drawn profiles don't match the expected audience characteristics.

---

## 5. User Flows

### Flow 1: Browse and Search the User List

1. Marketer navigates to `/audience` from the sidebar.
2. The page loads the user list with the "All Users" filter active. KPI tiles show: Total Users, Identified, Anonymous, Active 30d. The count on each tile reflects the current filter state.
3. Marketer clicks a filter pill (e.g., "VIPs"). The list immediately re-filters. The KPI tiles update to reflect counts within that filter.
4. Marketer types in the search input. The list filters in real time, matching against name, email, and phone number. Search and filter pills can be combined (e.g., search "Aanya" within "VIPs").
5. If no users match, the empty state is shown with a clear explanation and a "Clear filters" action.
6. Marketer clicks a user row to open the profile drawer.

**State persistence on filter/search:**
The active filter pill and search query are preserved in the URL as query parameters so the page can be bookmarked and shared. Navigating back from the drawer returns the marketer to the same filtered state.

---

### Flow 2: Inspect a User Profile

1. Marketer clicks a user row. The profile drawer opens from the right, covering the right portion of the list. The list remains visible and scrollable behind the drawer.
2. The drawer header shows: user avatar, display name, audience type badge (Identified / Anonymous), and email.
3. **User Properties tab (default):**
   - Marketer sees Basic Details, Customer Lifecycle stat cards, and Reachability.
   - Reachability shows each channel (WhatsApp, Email, SMS, Web Push, Mobile Push, In-App, RCS, Call) with its current subscription status: Subscribed, Unsubscribed, Not Available, or Pending.
   - Each subscribed channel has a "Test Now" button that sends a test message to the user on that channel.
   - Marketer scrolls down to see collapsible sections: Tracked Custom Attributes, Engage Prediction (best send times), Shiprocket Buyer Tags, and Lifecycle timestamps.
4. **Event Activity tab:**
   - Marketer clicks the "Event Activity" tab.
   - Events are shown in reverse-chronological order. Events within 10 minutes of each other are grouped.
   - Marketer clicks an event row to expand it and see the full key-value attribute payload.
   - If there are more events, a "Fetch More" button loads the next page.
5. Marketer closes the drawer by clicking the close button or pressing Escape. The list returns to the previous scroll position.

---

### Flow 3: Act on a User

1. With the drawer open, marketer clicks the Actions dropdown in the drawer header.
2. Available actions:
   - **Export Profile** — downloads the user's full attribute set as a CSV/JSON file.
   - **Add to Segment** — opens a segment picker. Marketer selects an existing segment or creates a new one. User is added. A success toast confirms.
   - **Block User** — shows a confirmation dialog. On confirm, the user is marked as blocked; all outbound messages to them are suppressed. The user's audience type badge updates in the drawer header.
   - **Send Campaign** — navigates to the flow creation page with this user's identity pre-seeded as the target audience.
3. Each action has its own confirmation and error state (see States section).

---

### Flow 4: Filter by Quick Segment

1. Marketer clicks a filter pill (e.g., "Cart Abandoners").
2. The list filters to show only users matching that quick segment definition.
3. The KPI tiles recalculate for the filtered set: Total in filter, Identified (within filter), Anonymous (within filter), Active 30d (within filter).
4. Marketer can combine a pill with a text search to narrow further.
5. "All Users" pill clears all active filters.

---

### Flow 5: Test Reachability

1. Marketer opens a user's drawer, goes to the User Properties tab.
2. In the Reachability section, marketer clicks "Test Now" on WhatsApp.
3. The button shows a loading state while the test message is dispatched.
4. On success: a brief inline confirmation replaces the button for 3 seconds, then restores it.
5. On failure (user not reachable on that channel, API error): an inline error message explains why the test failed. The button is restored.
6. Only subscribed channels show the "Test Now" button. Unsubscribed or Not Available channels show a static status label with no action.

---

## 6. Functional Specification

### 6.1 User List

| Element | Type | Required | Default | Notes |
|---------|------|----------|---------|-------|
| Search input | Text | No | Empty | Matches name, email, or phone number. Case-insensitive. Debounced 300ms. |
| Filter pills | Single-select | No | "All Users" | Options: All Users, Identified, VIPs, Active 30d, Cart Abandoners, New Signups. Selecting any pill deactivates "All Users". Selecting "All Users" clears the active pill. |
| User row | Clickable row | — | — | Clicking opens the profile drawer. Keyboard: Enter/Space. |
| Pagination | Cursor-based | — | 50 per page | "Load more" at the bottom. Not a page number selector. |
| Sort | Column header click | No | Last active, descending | Sortable columns: Name, Last Active, LTV. |

**User row columns:**

| Column | Content | Notes |
|--------|---------|-------|
| User | Avatar + Name + Email | Avatar is initials-based if no image. |
| Last Active | Relative time (e.g., "2h ago") | Falls back to absolute date if > 7 days. |
| Channels | Up to 4 channel chips | Shows channels the user is subscribed to. "+N more" if > 4. |
| LTV | INR value | Formatted: ₹X or ₹X.XXL. "—" if not available. |
| Audience Type | Badge | Identified or Anonymous. |

---

### 6.2 KPI Tiles

Four tiles displayed above the list. Each tile recalculates when the active filter changes.

| Tile | Definition |
|------|-----------|
| Total Users | Count of users matching the current filter + search. |
| Identified | Count with a known email or phone number. |
| Anonymous | Count without email and without phone. |
| Active 30d | Count who fired at least one event in the last 30 days. |

---

### 6.3 Filter Pills

| Pill | Audience Definition |
|------|-------------------|
| All Users | No filter. Full database. |
| Identified | `audience_type == "identified"` |
| VIPs | `LTV >= store-configured VIP threshold` (default: ₹5,000) |
| Active 30d | `last_seen >= today − 30 days` |
| Cart Abandoners | `cart_abandoned event fired` in last 30 days with no subsequent purchase |
| New Signups | `first_seen >= today − 7 days` |

If the VIP threshold is not configured for the store, the VIP pill is hidden.

---

### 6.4 User Profile Drawer

**Header:**

| Element | Content |
|---------|---------|
| Avatar | Initials circle. Color is deterministic from user ID. |
| Display name | `first_name + last_name`. Falls back to email prefix. Falls back to Anonymous User if neither exists. |
| Audience type badge | Identified (green) / Anonymous (slate). |
| Email | Shown below name. "No email" in muted text if absent. |
| Actions button | Dropdown: Export Profile, Add to Segment, Block User, Send Campaign. |
| Close button | Top-right. Also closed by Escape key. |

---

### 6.5 User Properties Tab

**Basic Details:**

| Field | Value | Empty state |
|-------|-------|-------------|
| Full Name | `first_name + last_name` | "Not set" |
| Email | email address | "Not set" |
| Mobile | formatted phone with country code | "Not set" |
| WhatsApp Username | username | "Not set" |
| Engage ID | internal identifier | Always present |
| Audience Type | Identified / Anonymous | Always present |
| Gender | Male / Female / Other | "Not set" |
| Birth Date | DD MMM YYYY | "Not set" |
| Anniversary | DD MMM YYYY | "Not set" |

**Customer Lifecycle stat cards:**

| Stat | Value | Notes |
|------|-------|-------|
| Last Active | Relative time | "Never" if no events recorded. |
| Total Sessions | Integer | 0 if none. |
| Lifetime Value | INR formatted | "₹0" if none. |

**Reachability:**

One card per channel (WhatsApp, Email, SMS, Web Push, Mobile Push, In-App, RCS, Call).

| Subscription Status | Meaning | "Test Now" shown |
|--------------------|---------|-----------------|
| Subscribed | User has opted in and the channel is functional | Yes |
| Unsubscribed | User has explicitly opted out | No |
| Not Available | Channel token does not exist for this user | No |
| Pending | Opt-in requested but not confirmed | No |

"Test Now" sends a test event through the channel. It is disabled during an in-flight test. A channel can only be tested once every 60 seconds (rate limit).

**Collapsible sections:**

Each section is collapsed by default. Clicking the section header expands it.

| Section | Contents |
|---------|---------|
| Tracked Custom Attributes | All custom key-value properties set by the store's SDK. Key + value displayed. |
| Engage Prediction | Best send times per channel. Shown as time slots (e.g., "8–10 AM", "7–9 PM"). |
| Shiprocket Buyer Tags | Boolean tags (weekendShopper, bargainHunter, highValueShopper, rtoRisk, etc.) plus numeric metrics (AOV, total orders, discount usage). |
| Lifecycle | First Seen and Last Seen timestamps in DD MMM YYYY HH:MM format. |

---

### 6.6 Event Activity Tab

**Event list:**

| Element | Behavior |
|---------|---------|
| Sort order | Reverse-chronological (newest first). |
| Grouping | Events within 10 minutes of each other are grouped under a single time heading. |
| Event row | Shows: event name, channel (if applicable), relative timestamp. Clicking expands the row. |
| Expanded event | Shows a key-value table of all event attributes. Values longer than 80 characters are truncated with a "Show more" toggle. |
| "Fetch More" button | Loads the next page of events (20 per page). Only shown if more events exist. Shows a spinner while loading. On error, shows "Failed to load — retry". |

**Event fields always shown in expanded view:**

- Event received at (timestamp)
- Source (SDK, API, etc.)
- Platform
- SDK version
- App version
- Campaign ID (if attribution exists)

---

### 6.7 Actions

**Export Profile:**
- Downloads a file containing all user attributes from the Basic Details, Custom Attributes, Buyer Tags, and Lifecycle sections.
- Format: CSV (default) with an option to export as JSON.
- File name: `engage-profile-{engage_id}-{YYYY-MM-DD}.csv`
- Does not include event history (that is a separate export).

**Add to Segment:**
- Opens a modal listing all existing segments.
- Segments are searchable by name.
- Marketer selects one segment and clicks "Add".
- The user is added asynchronously. A toast confirms once complete.
- If the user is already in the selected segment, an inline warning is shown before confirmation.
- A "Create new segment" option opens the segment creation flow in a new tab.

**Block User:**
- Shows a confirmation dialog: "Block [name]? All outbound messages to this user will be suppressed. This can be undone." with Cancel and Block buttons.
- On confirm: user is marked blocked. The audience type badge in the drawer header updates to show "Blocked". The user remains visible in the list with a blocked indicator.
- Blocked users can be unblocked via the same Actions menu (which now shows "Unblock User" instead).

**Send Campaign:**
- Navigates to `/flows-v2/create` with the user's identity pre-seeded as the audience filter (user ID match).
- Opens in the same tab. The drawer is closed before navigation.

---

## 7. States

### User List

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|-------|---------|--------------------|-------------------|-----------------|--------------|
| Loading | Page first load or filter change | Skeleton rows in the list; KPI tiles show dashes | None | Data fetch in progress | Data arrives → list populates |
| Populated | Data loaded successfully | Full user rows + KPI tiles | Search, filter, click row | Polling for count updates every 60s | — |
| Empty (no users) | Store has no users yet | Illustration + "No users yet" message + onboarding prompt | Link to SDK setup docs | No data fetch retried | First user tracked → transitions to Populated |
| Empty (filtered) | Search/filter yields 0 results | "No users match your search" message | "Clear filters" button | — | Filter cleared → Populated |
| Error | API call fails | Error banner: "Couldn't load your audience — try again" + Retry button | Retry | Logs error | Retry clicked → Loading |
| Partially loaded | Paginated load in progress | Existing rows shown; spinner at the bottom | Interact with existing rows | Next page fetch | Fetch complete → more rows appended |

---

### Profile Drawer

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|-------|---------|--------------------|-------------------|-----------------|--------------|
| Loading | Row clicked | Drawer opens with skeleton layout | Close | User data fetch | Data arrives → Populated |
| Populated | Data loaded | Full profile | All actions | — | Close or Escape |
| Error | Profile fetch fails | "Couldn't load this profile — try again" within the drawer | Retry, Close | — | Retry → Loading |
| Test in progress | "Test Now" clicked | Button shows spinner; label "Sending…" | Close, navigate tabs | Test dispatched | Test resolves → success or error |
| Test success | Test message sent | Inline "Sent!" confirmation for 3s | — | — | 3s timer → button restored |
| Test error | Test fails | Inline error message with reason | Retry, dismiss | — | Dismiss → button restored |
| Add to Segment modal | Actions → Add to Segment | Modal overlay on top of drawer | Select segment, cancel, create new | — | Confirm or cancel → modal closed |
| Block confirmation | Actions → Block User | Confirmation dialog | Confirm, Cancel | — | Confirm → blocked state; Cancel → drawer unchanged |
| Blocked | User is blocked | "Blocked" badge in header; Actions menu shows "Unblock User" | Unblock, close, send campaign disabled | — | Unblock confirmed → Populated |
| Events loading | Event Activity tab opened | Skeleton event rows | Close, switch tab | Event history fetch | Data arrives → events shown |
| Events empty | No events for this user | "No activity recorded yet" | Close, switch tab | — | — |
| Fetch More loading | "Fetch More" clicked | Spinner below existing events | Close, scroll | Next page fetch | Data arrives → appended |
| Fetch More error | Next page fails | "Failed to load — retry" inline | Retry | — | Retry → loading |

---

## 8. Edge Cases

**Situation:** User has no name, no email, and no phone number.
**Wrong behavior:** Row shows empty cells; drawer header shows blank.
**Correct behavior:** Row shows "Anonymous User" as the display name with the Engage ID as a subtitle. Drawer header shows "Anonymous User" with the Engage ID below it.

---

**Situation:** User is subscribed on WhatsApp but their WhatsApp token has expired.
**Wrong behavior:** Status shows "Subscribed" and "Test Now" sends a message that fails silently.
**Correct behavior:** Status shows "Subscribed" but a "Token expired" indicator is shown inline. "Test Now" is hidden for this channel. A tooltip on the status explains: "Subscription active, but the channel token needs to be refreshed."

---

**Situation:** Marketer clicks "Test Now" on two different channels within 5 seconds.
**Wrong behavior:** Both tests fire simultaneously; the UI shows two independent loading states that may resolve out of order.
**Correct behavior:** Each channel's "Test Now" button is independently rate-limited (60s). Clicking one does not affect the state of others.

---

**Situation:** User has more than 4 subscribed channels.
**Wrong behavior:** Only 4 chips are shown in the list row with no indication more exist; marketer thinks the user is only reachable on those 4.
**Correct behavior:** 4 chips shown + "+N more" pill. Hovering the pill shows a tooltip listing the additional channels. The full set is always shown in the drawer's Reachability section.

---

**Situation:** A Tracked Custom Attribute has a null or empty string value.
**Wrong behavior:** Attribute is hidden or shows an empty row.
**Correct behavior:** Attribute is shown with a "Not set" value in muted text. This makes it clear the attribute was tracked but has no value, versus an attribute that was never tracked (which would not appear at all).

---

**Situation:** Event payload has a value that is a nested JSON object (e.g., `items: [{sku: "X", qty: 2}]`).
**Wrong behavior:** The key-value table shows `[object Object]` or breaks the layout.
**Correct behavior:** Nested values are serialized to a formatted JSON string in the value cell. A "Copy" icon next to the cell copies the raw value to the clipboard.

---

**Situation:** Marketer searches for a partial phone number (e.g., "9876") and there are 200+ matching users.
**Wrong behavior:** All 200+ users load at once, freezing the list.
**Correct behavior:** Search results are paginated. The first 50 matching users are shown. The count tile updates to "200+ results". "Load more" appends the next 50.

---

**Situation:** Marketer adds a user to a segment that is currently being refreshed (syncing).
**Wrong behavior:** Add succeeds silently but the user doesn't appear in the segment until the next manual refresh, with no explanation.
**Correct behavior:** A warning below the segment picker states: "This segment is currently syncing. The user will be included when the sync completes." The action still proceeds. A toast confirms when the sync is done.

---

**Situation:** Marketer opens the profile drawer and then closes and reopens it for the same user within 5 seconds.
**Wrong behavior:** Full reload, showing skeleton again.
**Correct behavior:** Cached data is shown instantly (from the previous fetch); a background refresh runs silently. A "Last updated Xs ago" indicator is shown in the drawer footer if the cached data is > 30 seconds old.

---

**Situation:** Marketer is blocked from an IP address or the API key is revoked mid-session.
**Wrong behavior:** Silently shows stale data or shows a generic crash page.
**Correct behavior:** Auth error triggers a dismissible banner: "Your session has expired. Refresh the page to continue." Data already loaded remains visible (read-only) until the user refreshes.

---

**Situation:** "Block User" is clicked on a user who is currently mid-journey in an active flow.
**Wrong behavior:** Block succeeds, but in-flight messages that were already queued still go out.
**Correct behavior:** Blocking suppresses all future message dispatch. Messages already dispatched to the delivery queue are not recalled (technically cannot be recalled from carrier). The confirmation dialog notes: "Messages already dispatched may still be delivered."

---

**Situation:** Event Activity tab is opened for a user who has 50,000+ events.
**Wrong behavior:** All events loaded into memory, causing browser slowdown.
**Correct behavior:** Only the first 20 events are fetched. "Fetch More" loads 20 at a time. The total event count is shown in the tab label: "Event Activity (50K+)".

---

## 9. Non-Functional Requirements

### Performance

- Initial page load (list populated, KPI tiles shown): < 2 seconds on standard connectivity.
- Filter pill click → list update: < 500ms.
- Search debounce: 300ms. Results after debounce settles: < 800ms.
- Profile drawer open → data visible: < 1 second from click.
- Event Activity tab open → first 20 events visible: < 1 second.

### Scale

- The list must handle stores with up to 10 million users without interface degradation. Pagination and server-side filtering are mandatory; client-side filtering of the full dataset is not acceptable.
- Search must be executed server-side. Client-side search over a cached snapshot is not acceptable for stores with > 1,000 users.
- At 10x scale (100M users), the page must still load within 3 seconds. Query performance is a backend responsibility, but the frontend must not make blocking requests on load.

### Security

- User PII (email, phone, name) must not appear in URL parameters.
- Export Profile downloads must be gated by the marketer's role. Read-only users cannot export.
- Block User and Add to Segment require write permissions. The Actions button is hidden for read-only users.
- "Test Now" must verify the requesting user has send permissions before dispatching. An unauthorized test attempt returns a 403, shown as: "You don't have permission to send test messages."
- Event attribute values in the expanded view may contain sensitive data (e.g., payment transaction IDs). These are not redacted — the assumption is that only authorized marketers reach this page. If PII governance rules change, this section will need masking controls.

### Reliability

- If the KPI tile counts fail to load, the list still shows and is usable. The tiles show "—" with a retry icon.
- If the event activity API is unavailable, the User Properties tab still opens and is fully functional. The Event Activity tab shows the error state independently.
- If the "Add to Segment" API times out after 10 seconds, the modal shows a timeout error: "Adding to segment is taking longer than expected. It will complete in the background — you can close this." The user should be added asynchronously.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|-------|---------|-----------|
| `audience_page_viewed` | Page load | `filter_active`, `search_term` (if any), `user_count_visible` |
| `audience_filter_applied` | Filter pill clicked | `filter_name`, `result_count` |
| `audience_searched` | Search debounce resolves | `search_term_length`, `result_count` |
| `audience_profile_opened` | User row clicked | `user_id`, `audience_type`, `channel_count` |
| `audience_tab_switched` | Tab clicked in drawer | `from_tab`, `to_tab`, `user_id` |
| `audience_channel_tested` | "Test Now" clicked | `user_id`, `channel`, `result` (success/failure) |
| `audience_action_triggered` | Actions dropdown item clicked | `action` (export/segment/block/campaign), `user_id` |
| `audience_add_to_segment_completed` | Segment add confirmed | `user_id`, `segment_id`, `segment_name` |
| `audience_user_blocked` | Block confirmed | `user_id` |
| `audience_events_fetched_more` | Fetch More clicked | `user_id`, `page_number`, `result_count` |
| `audience_event_expanded` | Event row expanded | `user_id`, `event_name` |
| `audience_profile_exported` | Export confirmed | `user_id`, `format` |

---

### Reporting Metrics

| Metric | Definition | Where it surfaces | Attribution | Edge cases |
|--------|-----------|-------------------|-------------|------------|
| Profile inspection rate | `profile_opened / page_views` | Audience analytics dashboard | Session-scoped | Page views from automation/bots excluded |
| Channel test success rate | `test_success / test_triggered` | Reachability health dashboard | Per channel | Timed-out tests counted as failures |
| Segment add rate | `add_to_segment / profile_opened` | Segment growth dashboard | Per segment | Duplicate adds (user already in segment) excluded from numerator |
| Block rate | `user_blocked / profile_opened` | Trust & safety dashboard | Daily | Should remain < 0.5%; alert if spikes |

---

## 11. Copy

### Empty States

> **No users yet**
> Your audience will appear here once your SDK is connected and tracking events.
> [Connect your SDK →]

> **No users match your search**
> Try a different name, email, or phone number, or [clear your filters].

---

### KPI Tiles (null/zero states)

> Total Users: **0** — *Your first user will appear here automatically*

> LTV: **—** — *No purchase data available*

---

### Reachability Status Labels

| Status | Label | Tooltip |
|--------|-------|---------|
| Subscribed | ✓ Subscribed | "This user will receive messages on this channel." |
| Unsubscribed | ✗ Unsubscribed | "This user has opted out and will not receive messages on this channel." |
| Not Available | – Not available | "No channel token exists for this user. They haven't connected this channel." |
| Pending | ◎ Pending | "Opt-in has been requested but not yet confirmed." |
| Token expired | ⚠ Subscribed (expired) | "The channel token has expired. Messages may not be delivered." |

---

### Test Now Outcomes

> **Sending…** *(button label during flight)*

> **Sent!** *(inline, shown for 3 seconds)*

> Failed: This user is not reachable on WhatsApp right now. Check their subscription status.

> You've already tested this channel in the last 60 seconds. Wait a moment and try again.

> You don't have permission to send test messages. Contact your workspace admin.

---

### Actions

> **Block [Name]?**
> All outbound messages to this user will be suppressed. Messages already dispatched may still be delivered. This can be undone at any time.
> [Cancel] [Block User]

> **[Name] has been blocked.** All future messages to this user are suppressed.

> **[Name] has been unblocked.** They may now receive messages again.

> **[Name] has been added to [Segment Name].**

> **[Name] is already in [Segment Name].** Adding them again will have no effect. [Add anyway] [Cancel]

> **Exporting profile…** Your download will start in a moment.

---

### Errors

> Couldn't load your audience. Check your connection and try again. [Retry]

> Couldn't load this profile. [Try again]

> Adding [Name] to the segment is taking longer than expected. It will complete in the background — you can close this.

> Your session has expired. [Refresh the page] to continue.

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Graceful degradation |
|------------|---------------|---------------|---------------------|
| User profile API | User list, search, filters, KPI counts | Page cannot load user data | Show error state with retry |
| Event history API | Event Activity tab | Tab shows error independently | User Properties tab still functional |
| Segment API | Add to Segment action | Action shows error; segment list does not load | Other drawer actions unaffected |
| Message dispatch API | Test Now | Test shows failure state | Reachability status still displayed |
| Export service | Export Profile | Action shows error | Other drawer actions unaffected |
| Block/Unblock API | Block/Unblock user | Action shows error with retry | User is not marked blocked |
| Auth service | All actions | Session expired banner; read view preserved | Page is read-only until re-auth |

---

## 13. Out of Scope

| Exclusion | Reason | What unlocks it |
|-----------|--------|----------------|
| Segment creation from the Audience page | Segment management is a separate product surface. Creating from here adds scope without clear user need in V1. | User research showing demand for in-context segment creation. |
| Bulk actions (export all, bulk block) | Requires a multi-select interaction pattern and a separate bulk processing backend. Separate scope. | Bulk operations PRD. |
| User editing (update name, email, attributes) | Write operations on user profiles require identity verification workflows and audit logging. | Identity management PRD. |
| Merge/deduplication of anonymous and identified users | Complex matching logic. Separate identity resolution feature. | Identity resolution PRD. |
| Real-time event streaming (live event feed) | Requires WebSocket infrastructure. Polling with refresh is V1. | Infrastructure capable of SSE or WebSockets. |
| Advanced cohort analysis (conversion funnels per segment) | This is the Analytics product, not the Audience page. | Analytics PRD. |
| User-level message history (all messages sent to a user) | Requires cross-channel message log. Different from event history. | Messaging history PRD. |

---

## 14. Open Questions

| Question | Why it's open | Owner | What resolves it |
|----------|-------------|-------|-----------------|
| What is the VIP threshold for the VIP filter pill — is it store-configurable or platform-wide? | No decision made. If store-configurable, requires a settings UI. If platform-wide, simpler but less flexible. | Product + Engineering | Decision meeting needed. |
| Should blocked users be hidden from the list by default, or visible with a "blocked" indicator? | Both have valid arguments. Hiding reduces clutter but hides information. Showing adds transparency but may confuse. | Product + Design | User research or a/b test. |
| Is "Test Now" available to all marketer roles, or only admin-level? | Sending a test message is a real message dispatch with potential deliverability implications. Role gating not defined. | Product + Engineering | Roles & permissions PRD. |
| What happens to a user's data when their store is churned/deleted? | Retention and deletion policy not defined. Affects what the Audience page shows for demo/churned stores. | Legal + Engineering | Data retention policy. |
| Should the event activity export (all events for a user) be available from the Audience page, or only via the API? | Not scoped currently. High demand from CRM managers. | Product | Backlog prioritization. |
| Is the "Fetch More" model for events cursor-based (most scalable) or offset-based? | Backend preference not stated. Affects frontend pagination contract. | Engineering | Backend API design decision. |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|----------|------------------------|-----------|------------------|
| Profile drawer instead of a separate profile page | Full page navigation to `/audience/:id` | Drawer keeps the list context visible, enabling comparison of users without back navigation. Faster workflow for multi-user investigation. | Deep linking to a specific profile is harder with a drawer (requires query param or state management, not a clean URL). |
| "All Users" filter as the default, not a segment | Default to a curated segment | Marketers unfamiliar with the store's data need the full picture first. Segments assume prior knowledge. | First load on large stores may be slower since "All Users" is the heaviest query. Pagination and SSR mitigate this. |
| Reachability shown per-channel, not as an aggregate score | Single "reachable on X channels" count | Individual channel status is actionable. An aggregate score hides which specific channel has a problem. | More space required in the drawer. Handled with the compact card layout. |
| Events loaded 20 at a time with Fetch More, not infinite scroll | Infinite scroll | Fetch More gives the user a clear signal about what was loaded and prevents the browser from holding thousands of DOM nodes. | Slightly more clicks required for heavy power users inspecting long event histories. |
