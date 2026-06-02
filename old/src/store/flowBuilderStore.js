// Flow builder store — Zustand. Owns nodes/edges, selection, autosave status,
// and a "snapshot before AI" stash so the toast can undo a Dev modification.

import { create } from "zustand";

export const useFlowBuilderStore = create((set, get) => ({
  flowId: null,
  meta: null, // {name, description, status, audience, performance...}
  nodes: [],
  edges: [],
  selectedNodeId: null,
  autosaveStatus: "idle", // "idle" | "saving" | "saved" | "error"
  preAiSnapshot: null,    // {nodes, edges} for undo

  setFlowId: (id) => set({ flowId: id }),
  hydrate: (flow) =>
    set({
      flowId: flow.id,
      meta: {
        name: flow.name,
        description: flow.description,
        status: flow.status,
        audience: flow.audience,
        channels: flow.channels,
        performance: flow.performance,
        updated_at: flow.updated_at,
      },
      nodes: flow.nodes || [],
      edges: flow.edges || [],
      selectedNodeId: null,
    }),

  setNodes: (next) => set({ nodes: next }),
  setEdges: (next) => set({ edges: next }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setAutosaveStatus: (s) => set({ autosaveStatus: s }),
  patchMeta: (patch) => set({ meta: { ...(get().meta || {}), ...patch } }),

  // Helpers
  upsertNode: (node) => {
    const exists = get().nodes.some((n) => n.id === node.id);
    if (exists) {
      set({ nodes: get().nodes.map((n) => (n.id === node.id ? node : n)) });
    } else {
      set({ nodes: [...get().nodes, node] });
    }
  },
  removeNode: (id) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    }),
  updateNodeData: (id, dataPatch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...dataPatch } } : n,
      ),
    }),
  addEdge: (edge) => set({ edges: [...get().edges, edge] }),

  // For AI undo
  takeAiSnapshot: () =>
    set({ preAiSnapshot: { nodes: get().nodes, edges: get().edges } }),
  restoreAiSnapshot: () => {
    const snap = get().preAiSnapshot;
    if (snap) {
      set({ nodes: snap.nodes, edges: snap.edges, preAiSnapshot: null });
    }
  },
  clearAiSnapshot: () => set({ preAiSnapshot: null }),

  reset: () =>
    set({
      flowId: null,
      meta: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      autosaveStatus: "idle",
      preAiSnapshot: null,
    }),
}));
