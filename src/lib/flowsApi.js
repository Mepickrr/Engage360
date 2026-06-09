// Flow API layer.
// Routing logic:
//   seed-*   → read from seedFlows.js; first write with nodes creates a real/local copy
//   local-*  → read/write localStorage
//   api ID   → backend; falls back to localStorage on network failure

import { api } from "@/lib/api";
import { SEED_FLOW_MAP } from "@/data/seedFlows";
import {
  getLocalFlow,
  getLocalFlows,
  saveLocalFlow,
  deleteLocalFlow,
  generateLocalId,
  isLocalId,
  isSeedId,
} from "@/lib/localFlowStore";

// ── fetchFlows — API flows + localStorage flows ───────────────────────────────
export const fetchFlows = async () => {
  const localFlows = Object.values(getLocalFlows());
  try {
    const apiFlows = await api.get("/flows");
    const apiIds = new Set((Array.isArray(apiFlows) ? apiFlows : []).map((f) => f.id));
    // Merge: API first, then local flows not already returned by API
    return [
      ...(Array.isArray(apiFlows) ? apiFlows : []),
      ...localFlows.filter((f) => !apiIds.has(f.id)),
    ];
  } catch {
    return localFlows;
  }
};

// ── fetchFlow — seed → local → API ───────────────────────────────────────────
export const fetchFlow = (id) => {
  if (isSeedId(id) && SEED_FLOW_MAP[id]) return Promise.resolve({ ...SEED_FLOW_MAP[id] });
  const local = getLocalFlow(id);
  if (local) return Promise.resolve(local);
  return api.get(`/flows/${id}`);
};

// ── createFlow — try API, fall back to localStorage ──────────────────────────
export const createFlow = async (body) => {
  try {
    return await api.post("/flows", body);
  } catch {
    const id = generateLocalId();
    return saveLocalFlow({ status: "draft", ...body, id });
  }
};

// ── updateFlow — smart routing ────────────────────────────────────────────────
export const updateFlow = async (id, body) => {
  // Seed flow:
  //   - meta-only update (rename): resolve in-memory, no persistence needed
  //     (the store already holds the latest state)
  //   - full save (body includes nodes): create a persisted copy
  if (isSeedId(id)) {
    if (!body.nodes) {
      return Promise.resolve({ ...SEED_FLOW_MAP[id], ...body });
    }
    // Strip the seed id so createFlow assigns a new one
    const { id: _unused, ...rest } = { ...SEED_FLOW_MAP[id], ...body };
    return createFlow(rest);
  }

  // Local flow: update localStorage directly
  if (isLocalId(id)) {
    const existing = getLocalFlow(id) || { id };
    return Promise.resolve(saveLocalFlow({ ...existing, ...body }));
  }

  // API flow: hit backend, fall back to localStorage on failure
  try {
    return await api.put(`/flows/${id}`, body);
  } catch {
    const existing = getLocalFlow(id) || { id };
    return Promise.resolve(saveLocalFlow({ ...existing, ...body }));
  }
};

// ── Status mutations ──────────────────────────────────────────────────────────
export const publishFlow = async (id) => {
  if (isLocalId(id)) {
    const f = getLocalFlow(id);
    return Promise.resolve(saveLocalFlow({ ...(f || { id }), status: "active" }));
  }
  if (isSeedId(id)) return Promise.resolve({ status: "active" });
  return api.post(`/flows/${id}/publish`);
};

export const pauseFlow = async (id) => {
  if (isLocalId(id)) {
    const f = getLocalFlow(id);
    return Promise.resolve(saveLocalFlow({ ...(f || { id }), status: "paused" }));
  }
  if (isSeedId(id)) return Promise.resolve({ status: "paused" });
  return api.post(`/flows/${id}/pause`);
};

export const resumeFlow = async (id) => {
  if (isLocalId(id)) {
    const f = getLocalFlow(id);
    return Promise.resolve(saveLocalFlow({ ...(f || { id }), status: "active" }));
  }
  if (isSeedId(id)) return Promise.resolve({ status: "active" });
  return api.post(`/flows/${id}/resume`);
};

export const deleteFlow = async (id) => {
  if (isLocalId(id)) {
    deleteLocalFlow(id);
    return Promise.resolve({});
  }
  if (isSeedId(id)) return Promise.resolve({});
  return api.del(`/flows/${id}`);
};

// ── Conversation / AI endpoints ───────────────────────────────────────────────
export const fetchFlowConversation = (id) =>
  api.get(`/flows/${id}/conversation`);
export const sendFlowMessage = (id, content) =>
  api.post(`/flows/${id}/messages`, { content });
export const aiModifyFlow = (id, message) =>
  api.post(`/flows/${id}/ai-modify`, { message });
