// Shared delete confirmation, used by both the canvas Backspace/Delete
// shortcut and the per-node hover delete icon so the two stay in sync.
export function confirmAndRemoveNode(nodeId, edges, removeNode) {
  const hasEdges = edges.some((e) => e.source === nodeId || e.target === nodeId);
  if (hasEdges && !window.confirm("Delete this node and its connections?")) return;
  removeNode(nodeId);
}
