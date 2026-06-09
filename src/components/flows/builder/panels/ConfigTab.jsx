import React from "react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { CHANNEL_META } from "@/lib/flowMeta";
import DelayConfig from "./DelayConfig";
import WhatsAppRightPanel from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel";
import AiCallingRightPanel from "@/components/flows/builder/nodes/AiCallingNode/AiCallingRightPanel";
import AiChatbotRightPanel from "@/components/flows/builder/nodes/AiChatbotNode/AiChatbotRightPanel";
import RCSRightPanel from "@/components/flows/builder/nodes/RCSNode/RCSRightPanel";
import AiPredictRightPanel from "@/components/flows/builder/nodes/AiPredictNode/AiPredictRightPanel";
import StartFlowRightPanel from "@/components/flows/builder/nodes/StartFlowNode/StartFlowRightPanel";
import RazorpayRightPanel from "@/components/flows/builder/nodes/RazorpayNode/RazorpayRightPanel";
import SMSRightPanel from "@/components/flows/builder/nodes/SMSNode/SMSRightPanel";
import PushRightPanel from "@/components/flows/builder/nodes/PushNode/PushRightPanel";
import ConditionalSplitRightPanel from "@/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel";
import EmailRightPanel from "@/components/flows/builder/nodes/EmailNode/EmailRightPanel";
import OnsiteRightPanel from "@/components/flows/builder/nodes/OnsiteNode/OnsiteRightPanel";
import InAppRightPanel from "@/components/flows/builder/nodes/InAppNode/InAppRightPanel";
import NextBestActionRightPanel from "@/components/flows/builder/nodes/NextBestActionNode/NextBestActionRightPanel";
import SmartFlowOptimizerRightPanel from "@/components/flows/builder/nodes/SmartFlowOptimizerNode/SmartFlowOptimizerRightPanel";

function NumberInput({ label, value, onChange, testId, suffix }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </span>
      <div className="flex items-center gap-1 mt-1">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          data-testid={testId}
          className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary/60"
        />
        {suffix && (
          <span className="text-[11px] text-text-muted">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, testId, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </span>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="mt-1 w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary/60"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, testId, rows = 4, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        data-testid={testId}
        className="mt-1 w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary/60 resize-none"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, testId }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="mt-1 w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary/60 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function WhatsAppPreview({ body }) {
  return (
    <div className="bg-[#E5DDD5] rounded-md p-2">
      <div className="bg-white rounded-2xl rounded-tl-sm px-2.5 py-1.5 shadow-sm">
        <div className="text-[12px] text-slate-800 whitespace-pre-wrap">
          {body || "Your message preview..."}
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, body }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md text-[12px]">
      {subject && (
        <div className="border-b border-slate-200 px-2.5 py-1.5 bg-slate-50">
          <div className="text-[9px] uppercase tracking-wide text-text-muted">
            Subject
          </div>
          <div className="font-semibold text-text-primary">{subject}</div>
        </div>
      )}
      <div className="px-2.5 py-2 text-slate-800 whitespace-pre-wrap">
        {body || "Your email preview..."}
      </div>
    </div>
  );
}

function FlowSettings({ meta, onPatch }) {
  return (
    <div className="space-y-3" data-testid="config-flow-settings">
      <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
        Flow settings
      </div>
      <TextInput
        label="Name"
        value={meta?.name}
        onChange={(v) => onPatch({ name: v })}
        testId="config-flow-name"
      />
      <TextArea
        label="Description"
        value={meta?.description}
        onChange={(v) => onPatch({ description: v })}
        rows={3}
        testId="config-flow-description"
      />
      <div>
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
          Audience segment
        </span>
        <div className="mt-1 px-2 py-1.5 text-sm border border-border rounded-md bg-slate-50 text-text-secondary">
          {meta?.audience?.segment_name || "Not set"}
        </div>
        {meta?.audience?.estimated_users != null && (
          <div className="text-[10px] text-text-muted mt-1">
            ~{new Intl.NumberFormat("en-IN").format(meta.audience.estimated_users)} users
          </div>
        )}
      </div>
    </div>
  );
}

const TEMPLATE_OPTIONS = [
  { value: "", label: "No template" },
  { value: "tpl_promo_15", label: "promo_15_off" },
  { value: "tpl_review_ask", label: "review_ask_v1" },
  { value: "tpl_cart_abandon", label: "cart_abandon_v2" },
];

// Static option lists (module scope = stable identity, no re-renders).
const TRIGGER_TYPE_OPTIONS = [
  { value: "event", label: "Event" },
  { value: "segment", label: "Segment entry" },
  { value: "schedule", label: "Schedule" },
  { value: "webhook", label: "API webhook" },
];

const TRIGGER_EVENT_OPTIONS = [
  { value: "cart_abandoned", label: "cart_abandoned" },
  { value: "purchase", label: "purchase" },
  { value: "user_signup", label: "user_signup" },
  { value: "product_viewed", label: "product_viewed" },
  { value: "order_delivered", label: "order_delivered" },
];

const OPERATOR_OPTIONS = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: "≥" },
  { value: "<=", label: "≤" },
];

function NodeConfig({ node, updateNodeData, removeNode }) {
  if (!node) return null;
  const { type, data } = node;
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div className="space-y-3" data-testid={`config-node-${type}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
          {type} node
        </div>
        <button
          type="button"
          data-testid={`config-delete-${node.id}`}
          onClick={() => removeNode(node.id)}
          className="text-[11px] text-rose-600 hover:underline"
        >
          Delete
        </button>
      </div>

      <TextInput
        label="Label"
        value={data?.label}
        onChange={(v) => patch({ label: v })}
        testId="config-label"
      />

      {type === "trigger" && (
        <>
          <SelectInput
            label="Trigger type"
            value={data?.trigger_type || "event"}
            onChange={(v) => patch({ trigger_type: v })}
            options={TRIGGER_TYPE_OPTIONS}
            testId="config-trigger-type"
          />
          {data?.trigger_type === "event" && (
            <SelectInput
              label="Event"
              value={data?.event_name || "cart_abandoned"}
              onChange={(v) => patch({ event_name: v })}
              options={TRIGGER_EVENT_OPTIONS}
              testId="config-trigger-event"
            />
          )}
        </>
      )}

      {type === "channel" && (
        <>
          <SelectInput
            label="Template"
            value={data?.template_id || ""}
            onChange={(v) => patch({ template_id: v || null })}
            options={TEMPLATE_OPTIONS}
            testId="config-channel-template"
          />
          {data?.channel === "email" && (
            <TextInput
              label="Subject"
              value={data?.subject}
              onChange={(v) => patch({ subject: v })}
              testId="config-channel-subject"
              placeholder="Email subject line"
            />
          )}
          <TextArea
            label="Message body"
            value={data?.body}
            onChange={(v) => patch({ body: v })}
            placeholder="Hey {{first_name}}, ..."
            testId="config-channel-body"
            rows={5}
          />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">
              Preview
            </div>
            {data?.channel === "whatsapp" ? (
              <WhatsAppPreview body={data?.body} />
            ) : data?.channel === "email" ? (
              <EmailPreview subject={data?.subject} body={data?.body} />
            ) : (
              <div className="bg-slate-50 border border-border rounded-md px-2.5 py-2 text-[12px] text-text-secondary">
                {data?.body || "Message preview..."}
              </div>
            )}
          </div>
        </>
      )}

      {type === "wait" && (
        <div className="-mx-4 -mt-4">
          <DelayConfig data={data} patch={patch} />
        </div>
      )}

      {type === "condition" && (
        <>
          <TextInput
            label="Field"
            value={data?.field}
            onChange={(v) => patch({ field: v })}
            testId="config-condition-field"
          />
          <SelectInput
            label="Operator"
            value={data?.operator || "="}
            onChange={(v) => patch({ operator: v })}
            options={OPERATOR_OPTIONS}
            testId="config-condition-operator"
          />
          <TextInput
            label="Value"
            value={String(data?.value ?? "")}
            onChange={(v) => patch({ value: v })}
            testId="config-condition-value"
          />
        </>
      )}

      {(type === "end" || type === "goal") && (
        <TextInput
          label="Description"
          value={data?.label}
          onChange={(v) => patch({ label: v })}
          testId="config-exit-description"
        />
      )}
    </div>
  );
}

export default function ConfigTab() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const meta           = useFlowBuilderStore((s) => s.meta);
  const patchMeta      = useFlowBuilderStore((s) => s.patchMeta);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const removeNode     = useFlowBuilderStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === selectedNodeId) || null;

  // WhatsApp node gets its own full-panel UI (handles template picker, delivery, output)
  if (node?.type === "whatsapp") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <WhatsAppRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "aicalling") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <AiCallingRightPanel />
      </div>
    );
  }

  if (node?.type === "aichatbot") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <AiChatbotRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "rcs") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <RCSRightPanel />
      </div>
    );
  }

  if (node?.type === "aipredict") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <AiPredictRightPanel />
      </div>
    );
  }

  if (node?.type === "startflow") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <StartFlowRightPanel />
      </div>
    );
  }

  if (node?.type === "razorpay") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <RazorpayRightPanel />
      </div>
    );
  }

  if (node?.type === "sms") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <SMSRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "push") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <PushRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "onsite") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <OnsiteRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "inapp") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <InAppRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "nextbestaction") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <NextBestActionRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "smartflowoptimizer") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <SmartFlowOptimizerRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "email") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <EmailRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  if (node?.type === "conditionalsplit") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col">
        <ConditionalSplitRightPanel />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 p-4 overflow-y-auto" data-testid="right-config-tab">
      {node ? (
        <NodeConfig
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      ) : (
        <FlowSettings meta={meta} onPatch={patchMeta} />
      )}
    </div>
  );
}
