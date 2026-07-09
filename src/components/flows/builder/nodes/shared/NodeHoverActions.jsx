import React, { useState } from "react";
import { Copy, Trash2, FlaskConical } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { confirmAndRemoveNode } from "./nodeActions";
import NodeTestModal from "./NodeTestModal";

const ICON_BTN_STYLE = {
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  cursor: "pointer",
};

// channel: pass a communication channel id (e.g. "whatsapp") to show the Test
// icon; omit/null for non-communication nodes (e.g. ConditionalSplitNode).
export default function NodeHoverActions({ nodeId, visible, channel }) {
  const [testOpen, setTestOpen] = useState(false);
  const duplicateNode = useFlowBuilderStore((s) => s.duplicateNode);
  const removeNode = useFlowBuilderStore((s) => s.removeNode);
  const edges = useFlowBuilderStore((s) => s.edges);

  return (
    <>
      {visible && (
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            top: -12,
            right: -12,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <button
            type="button"
            title="Duplicate"
            data-testid={`rf-node-duplicate-${nodeId}`}
            onClick={(e) => { e.stopPropagation(); duplicateNode(nodeId); }}
            style={ICON_BTN_STYLE}
          >
            <Copy size={13} color="#475569" />
          </button>
          {channel && (
            <button
              type="button"
              title="Test"
              data-testid={`rf-node-test-${nodeId}`}
              onClick={(e) => { e.stopPropagation(); setTestOpen(true); }}
              style={ICON_BTN_STYLE}
            >
              <FlaskConical size={13} color="#475569" />
            </button>
          )}
          <button
            type="button"
            title="Delete"
            data-testid={`rf-node-delete-${nodeId}`}
            onClick={(e) => { e.stopPropagation(); confirmAndRemoveNode(nodeId, edges, removeNode); }}
            style={ICON_BTN_STYLE}
          >
            <Trash2 size={13} color="#DC2626" />
          </button>
        </div>
      )}
      {channel && (
        <NodeTestModal open={testOpen} onClose={() => setTestOpen(false)} channel={channel} />
      )}
    </>
  );
}
