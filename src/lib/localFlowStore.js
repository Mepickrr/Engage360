// localStorage-backed flow persistence.
// Used as the primary store for locally-saved flows and as an API fallback.

const KEY = "dowl_local_flows";

export function getLocalFlows() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function getLocalFlow(id) {
  return getLocalFlows()[id] || null;
}

export function saveLocalFlow(flow) {
  const all = getLocalFlows();
  const saved = { ...flow, updated_at: new Date().toISOString() };
  all[saved.id] = saved;
  localStorage.setItem(KEY, JSON.stringify(all));
  return saved;
}

export function deleteLocalFlow(id) {
  const all = getLocalFlows();
  delete all[id];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function generateLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isLocalId(id) {
  return typeof id === "string" && id.startsWith("local-");
}

export function isSeedId(id) {
  return typeof id === "string" && id.startsWith("seed-");
}
