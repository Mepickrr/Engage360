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
import StartTriggerNode from "./nodes/StartTriggerNode";
import WhatsAppNode from "./nodes/WhatsAppNode";
import AiCallingNode from "./nodes/AiCallingNode";
import AiCallingV2Node from "./nodes/AiCallingV2Node";
import AiChatbotNode from "./nodes/AiChatbotNode";
import RCSNode from "./nodes/RCSNode";
import AiPredictNode from "./nodes/AiPredictNode";
import StartFlowNode from "./nodes/StartFlowNode";
import RazorpayNode from "./nodes/RazorpayNode";
import SMSNode from "./nodes/SMSNode";
import PushNode from "./nodes/PushNode";
import ConditionalSplitNode from "./nodes/ConditionalSplitNode";
import EmailNode from "./nodes/EmailNode";
import OnsiteNode from "./nodes/OnsiteNode";
import InAppNode from "./nodes/InAppNode";
import NextBestActionNode from "./nodes/NextBestActionNode";
import SmartFlowOptimizerNode from "./nodes/SmartFlowOptimizerNode";
import WebhookNode from "./nodes/WebhookNode";
import JudgeMeNode from "./nodes/JudgeMeNode";
import ShopifyNode from "./nodes/ShopifyNode";
import StickyNoteNode from "./nodes/StickyNoteNode";

import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { defaultDataForPaletteItem } from "@/lib/flowMeta";

// Register every kind so reactflow can render them. Logic kinds all share the
// same renderer (LogicNode reads `type` to pick the icon/colour).
// "action" and "note" map to ChannelNode which handles generic labelled cards.
const nodeTypes = {
  trigger:         TriggerNode,
  "start-trigger": StartTriggerNode,
  whatsapp:        WhatsAppNode,
  email:           EmailNode,
  onsite:          OnsiteNode,
  inapp:              InAppNode,
  nextbestaction:     NextBestActionNode,
  smartflowoptimizer: SmartFlowOptimizerNode,
  aicalling:       AiCallingNode,
  aicallingv2:     AiCallingV2Node,
  aichatbot:       AiChatbotNode,
  rcs:             RCSNode,
  aipredict:       AiPredictNode,
  startflow:       StartFlowNode,
  razorpay:        RazorpayNode,
  webhook:         WebhookNode,
  judgeme:         JudgeMeNode,
  shopify:         ShopifyNode,
  sms:             SMSNode,
  push:            PushNode,
  conditionalsplit: ConditionalSplitNode,
  channel:         ChannelNode,
  action:          ChannelNode,   // Integrations, AI actions, legacy action nodes
  note:            StickyNoteNode,
  wait:            LogicNode,
  condition:       LogicNode,
  split:           LogicNode,
  wait_until:      LogicNode,
  end:             ExitNode,
  goal:            ExitNode,
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

  // wrapperRef points to the div that wraps ReactFlow — used for coordinate math.
  const wrapperRef = useRef(null);

  const { screenToFlowPosition } = useReactFlow();

  const handleAddStickyNote = useCallback(() => {
    const noteCount = nodes.filter((n) => n.type === "note").length;
    const offset = (noteCount % 5) * 24;
    const center = screenToFlowPosition({
      x: window.innerWidth / 2 + offset,
      y: window.innerHeight / 2 + offset,
    });
    onCanvasDrop?.({
      id: nextId(nodes, "note"),
      type: "note",
      position: center,
      data: defaultDataForPaletteItem({ kind: "note" }),
    });
  }, [nodes, onCanvasDrop, screenToFlowPosition]);

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

  // ── Drag-and-drop from palette ────────────────────────────────
  // onDragOver must be on the wrapper div (not <ReactFlow>) so the browser
  // allows the drop. preventDefault() here is what enables the drop event.
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow-item");
      if (!raw) return;
      let item;
      try { item = JSON.parse(raw); } catch { return; }

      // Convert drop position (screen coords) → ReactFlow canvas coords.
      // We subtract the wrapper's bounding rect so the node lands where
      // the user actually dropped it, regardless of sidebar width / scroll.
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const position = {
        x: event.clientX - (bounds?.left ?? 0) - 80,
        y: event.clientY - (bounds?.top ?? 0) - 20,
      };

      onCanvasDrop?.({
        id: nextId(nodes),
        type: item.kind,
        position,
        data: defaultDataForPaletteItem(item),
      });
    },
    [nodes, onCanvasDrop],
  );

  // Show a starter overlay if the canvas is empty.
  const emptyOverlay = useMemo(() => nodes.length === 0, [nodes.length]);

  const styledEdges = useMemo(() => {
    return edges.map((e) => {
      const isYes = e.label === "yes" || e.sourceHandle === "yes";
      const isNo  = e.label === "no"  || e.sourceHandle === "no";
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
              Drag a node from the left panel, or click one to add it
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
