import React, { useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { StickyNote as StickyNoteIcon } from "lucide-react";

import TriggerNode from "./nodes/TriggerNode";
import ChannelNode from "./nodes/ChannelNode";
import LogicNode from "./nodes/LogicNode";
import ExitNode from "./nodes/ExitNode";
import GenericNode from "./nodes/GenericNode";
import WebhookNode from "./nodes/WebhookNode";
import ConditionalSplitNode from "./nodes/ConditionalSplitNode";
import StickyNoteNode from "./nodes/StickyNoteNode";

import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { defaultDataForPaletteItem } from "@/lib/flowMeta";

// Register every kind so reactflow can render them. Logic kinds all share the
// same renderer (LogicNode reads `type` to pick the icon/colour).
const nodeTypes = {
  trigger: TriggerNode,
  channel: ChannelNode,
  wait: LogicNode,
  condition: ConditionalSplitNode,
  split: LogicNode,
  wait_until: LogicNode,
  end: ExitNode,
  goal: ExitNode,
  generic: GenericNode,
  webhook: WebhookNode,
  note: StickyNoteNode,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" },
  style: { stroke: "#94A3B8", strokeWidth: 1.5 },
};

// Stable react-flow props (extracted to module scope so identity is constant —
// avoids unnecessary ReactFlow re-renders).
const FIT_VIEW_OPTIONS = { padding: 0.25 };
const PRO_OPTIONS = { hideAttribution: true };

function nextId(existing, prefix = "n") {
  const used = new Set(existing.map((n) => n.id));
  let i = existing.length + 1;
  while (used.has(`${prefix}${i}`)) i += 1;
  return `${prefix}${i}`;
}

export default function Canvas({ onCanvasDrop }) {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const edges = useFlowBuilderStore((s) => s.edges);
  const setNodes = useFlowBuilderStore((s) => s.setNodes);
  const setEdges = useFlowBuilderStore((s) => s.setEdges);
  const setSelectedNode = useFlowBuilderStore((s) => s.setSelectedNode);

  const wrapperRef = useRef(null);

  const { screenToFlowPosition } = useReactFlow();

  const handleAddStickyNote = useCallback(() => {
    const noteCount = nodes.filter((n) => n.type === "note").length;
    const offset = (noteCount % 5) * 24;
    const center = screenToFlowPosition({
      x: window.innerWidth / 2 + offset,
      y: window.innerHeight / 2 + offset,
    });
    setNodes(nodes.map((n) => (n.selected ? { ...n, selected: false } : n)));
    onCanvasDrop?.({
      id: nextId(nodes, "note"),
      type: "note",
      position: center,
      data: defaultDataForPaletteItem({ kind: "note" }),
      selected: true,
    });
  }, [nodes, onCanvasDrop, screenToFlowPosition, setNodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  );
  const onConnect = useCallback(
    (params) =>
      setEdges(
        addEdge(
          {
            ...params,
            id: `e${edges.length + 1}-${params.source}-${params.target}`,
            ...defaultEdgeOptions,
          },
          edges,
        ),
      ),
    [edges, setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }) => {
      setSelectedNode(selected?.[0]?.id || null);
    },
    [setSelectedNode],
  );

  // Drag-and-drop from palette
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow-item");
      if (!raw) return;
      let item;
      try {
        item = JSON.parse(raw);
      } catch {
        return;
      }

      // Compute drop position relative to the canvas viewport.
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const position = {
        x: event.clientX - (bounds?.left || 0) - 110,
        y: event.clientY - (bounds?.top || 0) - 30,
      };

      const id = nextId(nodes);
      const newNode = {
        id,
        type: item.kind,
        position,
        data: defaultDataForPaletteItem(item),
      };
      // Stash category metadata for renderer + config-fallback rendering.
      if (item.category)
        newNode.data = { ...newNode.data, category: item.category };
      if (item.icon) newNode.data = { ...newNode.data, icon: item.icon };
      if (item.color) newNode.data = { ...newNode.data, color: item.color };
      if (item.slug) newNode.data = { ...newNode.data, slug: item.slug };
      if (item.subtype)
        newNode.data = { ...newNode.data, subtype: item.subtype };
      onCanvasDrop?.(newNode);
    },
    [nodes, onCanvasDrop],
  );

  // Show a starter overlay if the canvas is empty.
  const emptyOverlay = useMemo(() => nodes.length === 0, [nodes.length]);

  // Render edges with our label tints (yes=green, no=red, A/B=violet).
  const styledEdges = useMemo(() => {
    return edges.map((e) => {
      const isYes = e.label === "yes" || e.sourceHandle === "yes";
      const isNo = e.label === "no" || e.sourceHandle === "no";
      const stroke = isYes ? "#10B981" : isNo ? "#EF4444" : e.style?.stroke || "#94A3B8";
      return {
        ...e,
        type: e.type || "smoothstep",
        markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed, color: stroke },
        style: { ...(e.style || {}), stroke, strokeWidth: 1.5 },
        labelStyle: { fontSize: 11, fill: stroke, fontWeight: 600 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: "#FFFFFF" },
      };
    });
  }, [edges]);

  return (
    <div
      ref={wrapperRef}
      className="flex-1 relative"
      data-testid="flow-canvas"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        proOptions={PRO_OPTIONS}
      >
        <Background gap={20} size={1} color="#CBD5E1" />
        <Controls position="bottom-left" showInteractive={false}>
          <ControlButton onClick={handleAddStickyNote} title="Sticky Note">
            <StickyNoteIcon size={16} />
          </ControlButton>
        </Controls>
        <MiniMap pannable zoomable nodeColor="#CBD5E1" maskColor="rgba(241,245,249,0.7)" />
      </ReactFlow>

      {emptyOverlay && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          data-testid="canvas-empty-overlay"
        >
          <div className="text-center max-w-sm bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-dashed border-text-muted/40">
            <div className="text-base font-semibold text-text-primary">
              Drag a Trigger from the palette to begin
            </div>
            <div className="text-[12px] text-text-secondary mt-1">
              Then connect channels and logic to build your journey.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
