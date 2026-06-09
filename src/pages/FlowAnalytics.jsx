import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery } from "@tanstack/react-query";

import { fetchFlow } from "@/lib/flowsApi";
import { getAnalytics } from "@/data/mockAnalytics";
import AnalyticsTopbar from "@/components/flows/analytics/AnalyticsTopbar";
import OverallAnalyticsPanel from "@/components/flows/analytics/OverallAnalyticsPanel";

// Use the exact same node renderers as the flow builder canvas
import TriggerNode from "@/components/flows/builder/nodes/TriggerNode";
import ChannelNode from "@/components/flows/builder/nodes/ChannelNode";
import LogicNode from "@/components/flows/builder/nodes/LogicNode";
import ExitNode from "@/components/flows/builder/nodes/ExitNode";
import StartTriggerNode from "@/components/flows/builder/nodes/StartTriggerNode";
import WhatsAppNode from "@/components/flows/builder/nodes/WhatsAppNode";
import AiCallingNode from "@/components/flows/builder/nodes/AiCallingNode";
import AiChatbotNode from "@/components/flows/builder/nodes/AiChatbotNode";
import RCSNode from "@/components/flows/builder/nodes/RCSNode";
import AiPredictNode from "@/components/flows/builder/nodes/AiPredictNode";
import StartFlowNode from "@/components/flows/builder/nodes/StartFlowNode";
import RazorpayNode from "@/components/flows/builder/nodes/RazorpayNode";
import SMSNode from "@/components/flows/builder/nodes/SMSNode";
import PushNode from "@/components/flows/builder/nodes/PushNode";
import ConditionalSplitNode from "@/components/flows/builder/nodes/ConditionalSplitNode";
import EmailNode from "@/components/flows/builder/nodes/EmailNode";
import OnsiteNode from "@/components/flows/builder/nodes/OnsiteNode";
import InAppNode from "@/components/flows/builder/nodes/InAppNode";
import NextBestActionNode from "@/components/flows/builder/nodes/NextBestActionNode";
import SmartFlowOptimizerNode from "@/components/flows/builder/nodes/SmartFlowOptimizerNode";

// Identical to Canvas.jsx — same registry, same visual output
const nodeTypes = {
  trigger:          TriggerNode,
  "start-trigger":  StartTriggerNode,
  whatsapp:         WhatsAppNode,
  email:            EmailNode,
  onsite:           OnsiteNode,
  inapp:              InAppNode,
  nextbestaction:     NextBestActionNode,
  smartflowoptimizer: SmartFlowOptimizerNode,
  aicalling:        AiCallingNode,
  aichatbot:        AiChatbotNode,
  rcs:              RCSNode,
  aipredict:        AiPredictNode,
  startflow:        StartFlowNode,
  razorpay:         RazorpayNode,
  sms:              SMSNode,
  push:             PushNode,
  conditionalsplit: ConditionalSplitNode,
  channel:          ChannelNode,
  action:           ChannelNode,
  note:             ChannelNode,
  wait:             LogicNode,
  condition:        LogicNode,
  split:            LogicNode,
  wait_until:       LogicNode,
  end:              ExitNode,
  goal:             ExitNode,
};

// Inject analytics data into each node's data prop
function injectAnalytics(nodes, nodeAnalytics) {
  return nodes.map((node) => ({
    ...node,
    draggable:   false,
    connectable: false,
    selectable:  false,
    data: {
      ...node.data,
      analyticsData: nodeAnalytics?.[node.id] ?? null,
    },
  }));
}

// Preserve existing edge styling, just disable interaction
function prepareEdges(edges) {
  return edges.map((edge) => ({
    ...edge,
    selectable: false,
    focusable:  false,
  }));
}

function AnalyticsCanvas({ nodes, edges }) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnDoubleClick={false}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#E2E8F0" gap={20} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function FlowAnalytics() {
  const { id } = useParams();
  const [timeRange, setTimeRange] = useState("last_7_days");
  const [viewMode, setViewMode]   = useState("activity");

  const { data: flow, isLoading } = useQuery({
    queryKey: ["flow", id],
    queryFn:  () => fetchFlow(id),
    enabled:  !!id,
    staleTime: 0,
  });

  const analytics = useMemo(() => getAnalytics(id), [id]);

  const injectedNodes = useMemo(() => {
    if (!flow?.nodes) return [];
    return injectAnalytics(flow.nodes, analytics?.nodes);
  }, [flow?.nodes, analytics?.nodes]);

  const preparedEdges = useMemo(
    () => prepareEdges(flow?.edges ?? []),
    [flow?.edges],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-text-muted text-sm">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -m-6 bg-app-bg">
      <AnalyticsTopbar
        flowId={id}
        flowName={flow?.name}
        status={flow?.status}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      <OverallAnalyticsPanel
        overall={analytics?.overall}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <AnalyticsCanvas nodes={injectedNodes} edges={preparedEdges} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
