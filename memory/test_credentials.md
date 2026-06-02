# Engage 360 — Test Credentials (Phase 1)

No authentication required. Single tenant (TSPKARIX), single user (Himanshu / HK).
All API routes are public.

## LLM Integration
- Universal key: `EMERGENT_LLM_KEY` (already in `/app/backend/.env`)
- Default model: `openai/gpt-5-mini` (configurable via UI + `POST /api/llm/default-model`)
- Orchestrator routing model: `openai/gpt-5-mini`
- Artefact generation model: `openai/gpt-5-mini`

## Test conversation flow
1. POST `/api/conversations` with `{"seed_message": "Build a cart abandonment flow", "pinned_agent": "dev"}` → ~15-25s
2. Returned agent message has `pending_artefact_type: "flow_brief"`
3. POST `/api/conversations/:id/messages/:msg_id/generate-artefact` → ~20-30s, returns artefact

Available agent ids: aryan, zara, meera, rishi, dev, priya
