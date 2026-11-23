const STORAGE_KEY = "bitespeed_broadcasts_v1";

function readAll() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function createBroadcast(body) {
  const all = readAll();
  const id = `campaign-${Object.keys(all).length + 1}-${Math.round(performance.now())}`;
  const now = new Date().toISOString();
  const doc = { ...body, createdAt: now, updatedAt: now, id };
  all[id] = doc;
  writeAll(all);
  return doc;
}

export async function fetchBroadcast(id) {
  const all = readAll();
  const doc = all[id];
  if (!doc) throw new Error(`Campaign ${id} not found`);
  return doc;
}

export async function updateBroadcast(id, patch) {
  const all = readAll();
  const existing = all[id];
  if (!existing) throw new Error(`Campaign ${id} not found`);
  const doc = { ...existing, ...patch, updatedAt: new Date().toISOString(), id };
  all[id] = doc;
  writeAll(all);
  return doc;
}
