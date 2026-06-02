# Engage 360 — PRD

## Original problem statement
Engage 360 is a Customer Engagement Platform (Shiprocket Engage / MoEngage / CleverTap class), built in phases.

- **Phase 0** ✅ Design system + global shell (10 sidebar sections, dark topbar, floating AI pill, Coming-soon placeholders).
- **Phase 1** ✅ AI Agents Home + Conversation Panel + Task Repository + Real LLM (6 personas, orchestrator-driven routing, three artefact types).
- **Phase 2 (this iteration)** ✅ Flows list + visual Builder + Dev AI side panel + Phase 1 handoff. Reactflow canvas, recharts analytics, autosave, model-switcher reused from Phase 1.
- **Phase 3 (next)** — Segments page UI, Templates Gallery, cross-flow Analytics, Helpdesk, Settings, real channel sends.

## Architecture
- **Frontend** (`/app/frontend/`): React 19 + CRA + Tailwind + shadcn + Lucide + React Router v7 + React Query + Zustand + sonner + **reactflow@11** + **recharts**. Path alias `@/`.
- **Backend** (`/app/backend/`): FastAPI + Motor + Pydantic v2. All routes under `/api`. OpenAPI at `/api/openapi.json`.
- **LLM** via `emergentintegrations` (universal key). Default `openai/gpt-5-mini`. Switchable via the Ask AI bar + `POST /api/llm/default-model`. Orchestrator hardening rules deterministically promote `artefact_type` for the dev+build, meera+segment, zara+creative cases (see `/app/backend/llm/orchestrator.py::_harden_artefact`).
- **MongoDB** collections: `agents`, `store_stats`, `intelligence_cards`, `reports`, `tasks`, `conversations`, `messages`, `flows`.

## What's been implemented (cumulative)
### Phase 0 (pre-iteration)
- Global shell, design tokens, 10 routes, `/api/health`, `/api/me`, `/api/openapi.json`.

### Phase 1
- 6 agent personas with distinct brand-grounded system prompts.
- Orchestrator routing (JSON-mode), artefact generators (flow_brief / segment_preview / creative_preview).
- Agent Home: greeting → store stats (4 KPIs) → Meet the Team → Agent Detail Modal → Intelligence Cards (4 sorted by urgency) → Ask AI bar w/ model switcher → Scheduled Reports → Task Board (3+3+2+2).
- Conversation Panel (shadcn Sheet) with Agent Roster, MessageList, Build Mode + Artefact Panel.
- Backend reseed endpoint `/api/admin/reseed` (drops + reseeds demo collections).
- Tested 100% by `testing_agent_v3`.

### Phase 2 (2026-02 this iteration)
- ✅ Backend: `routes/flows.py` (CRUD + lifecycle + Dev AI side panel + ai-modify), `llm/flow_modifier.py` (JSON-mode flow rewrite), seed of 4 flows with distribution check.
- ✅ Frontend Flows list: 4 KPIs, search, status filter, sortable rows with channels/audience/performance, kebab actions (View / Pause / Resume / Delete).
- ✅ Flow Builder shell: editable name, status pill, autosave indicator, publish/pause/resume.
- ✅ Reactflow canvas with custom node renderers (Trigger / Channel / Logic / Exit), drag-and-drop palette grouped by Triggers/Channels/Logic/Exits, controls + minimap, snap-grid background.
- ✅ Right panel tabs: **Config** (per-node-type forms + flow settings fallback + WhatsApp/Email preview mocks), **AI (Dev)** (scoped Dev conversation with suggested prompts, Undo toast on modification), **Analytics** (recharts sparkline + 4 KPIs + per-node delivery breakdown; placeholder on drafts).
- ✅ Autosave: 1.5s debounced PUT on nodes/edges and name/description.
- ✅ Phase 1 handoff: "Approve and build" → POST /api/flows with `from_brief_id` → 7-node flow created → navigate to `/flows/builder/<id>` → completed task auto-created.
- ✅ Orchestrator hardening: deterministic `flow_brief` when pinned_agent=dev AND prompt contains build/flow/journey verbs.
- ✅ `/api/flows {from_brief_id: ...}` returns HTTP 400 when no flow_brief artefact exists.
- ✅ Tested 100%: backend 12/12 pytest, frontend full marquee handoff verified in Playwright.

## Personas (unchanged from Phase 1)
aryan / zara / meera / rishi / dev / priya — each with brand-grounded system prompt, suggested prompts, persona color, and signals.

## Phase P0 Stabilization (2026-02-22)
- `/` now renders `AgentsPage` (Agent surface is the actual home). `/agents` kept as a back-compat alias.
- Sidebar: both `nav-home` and `nav-agents` navigate to `/` and BOTH highlight when pathname is `/` or `/agents` (`matchPaths` config).
- New `components/common/ErrorBoundary.jsx` wraps `<Outlet />` inside `AppShell` — graceful fallback card with retry + back-to-home buttons.
- `index.js` registers `window.addEventListener('unhandledrejection')` and `'error'` so async failures land in the console instead of disappearing.
- Defensive guards: `Array.isArray(agents)` in `AgentDetailModal`, `nodes` guarded in `FlowBriefPreview`, `?? []` on map sources, `onError` on critical `useQuery`s.
- Verified: 17/17 P0 review-request tests pass, zero console errors on `/`, `/agents`, `/campaigns`, `/flows`.

## Backlog
### P0 — Phase 3 next
- Segments page UI (build/save/preview from the Build Mode segment artefact)
- Templates Gallery (catalogue of WhatsApp/Email templates referenced from ChannelNode config)
- Real Shopify integration for `store_stats` and event triggers
- Real channel sends (WhatsApp BSP, Email provider)

### P1 — fast follows
- Streaming token-by-token responses for chat
- Recent-conversations picker inside Conversation Panel (deferred from Phase 1)
- Optional: memoize React Flow nodeTypes outside component (cosmetic perf hint — files already module-scope, warning is benign)
- Optional: add `DialogDescription` to ConversationPanel modal for stricter a11y
- Improve `/api/flows/:id/messages` so a mutation prompt always produces a node delta (carried-over minor)

### P2
- Auth (Emergent Google SSO or JWT)
- Per-tenant data scoping
- Push / Campaigns / Instagram inbox / Audience real implementations
- Settings (workspace, team, channel credentials, integrations)
- Mobile responsiveness pass

## Next tasks (immediate)
1. Pick Phase 3 entry point (Segments vs Templates vs Settings) with user.
2. Wire real channel send via SendGrid / Twilio / BSP.
3. Investigate `is_modification` reliability on Dev modify prompts.
