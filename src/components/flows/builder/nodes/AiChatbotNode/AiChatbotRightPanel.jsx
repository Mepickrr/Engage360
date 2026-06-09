import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Plus, Trash2, Lock, GripVertical } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { toast } from "sonner";
import {
  CHATBOT_TEAL,
  CHATBOT_TONES,
  AGENT_TYPES,
  CHATBOT_TEMPLATES,
  TIMEOUT_OPTIONS,
  SYSTEM_PORT_GOAL,
  SYSTEM_PORT_TIMEOUT,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function AiEnhanceButton({ onClick }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        fontSize: 10, color: CHATBOT_TEAL, fontWeight: 600,
        background: "none", border: `1px solid ${CHATBOT_TEAL}`,
        borderRadius: 6, padding: "2px 8px", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 3,
      }}
    >
      <Sparkles size={10} /> AI Enhance
    </button>
  );
}

function mockEnhance(text) {
  return `As a helpful AI assistant, ${text || "please assist the customer with their query."} Confirm if you can proceed.`;
}

// ── Chat Tab (per-node: goal + mode + reply options) ─────────────

function ChatTab({ data, upd }) {
  const mode       = data.mode       ?? "custom";
  const templateId = data.templateId ?? null;

  const applyTemplate = (tpl) => {
    upd({ templateId: tpl.id, goal: tpl.goal, replyOptions: tpl.replyOptions, mode: "template" });
  };

  const handleEnhanceGoal = () => {
    const id = toast.loading("Enhancing with AI…");
    setTimeout(() => {
      toast.dismiss(id); toast.success("Enhanced!");
      upd({ goal: mockEnhance(data.goal) });
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Mode toggle */}
      <div>
        <SectionLabel>Mode</SectionLabel>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[{ id: "template", label: "Use Template" }, { id: "custom", label: "Custom" }].map((m) => (
            <button
              key={m.id} type="button" onClick={() => upd({ mode: m.id })}
              style={{
                flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "none",
                background: mode === m.id ? CHATBOT_TEAL : "#fff",
                color: mode === m.id ? "#fff" : "#64748B",
                transition: "all 0.15s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template mode */}
      {mode === "template" && (
        <div>
          <SectionLabel>Select Template</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CHATBOT_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                style={{
                  border: `2px solid ${templateId === tpl.id ? CHATBOT_TEAL : BORDER}`,
                  borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                  background: templateId === tpl.id ? "#F0FDFF" : "#fff",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{tpl.name}</div>
                <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4 }}>
                  {tpl.goal.slice(0, 55)}…
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <SectionLabel>Goal</SectionLabel>
          <AiEnhanceButton onClick={handleEnhanceGoal} />
        </div>
        <textarea
          value={data.goal ?? ""}
          onChange={(e) => upd({ goal: e.target.value })}
          rows={4}
          placeholder="Collect the customer's order ID and reason for complaint. Resolve the issue if possible, or flag for escalation."
          style={{
            width: "100%", padding: "8px 10px", fontSize: 13,
            border: `1px solid ${BORDER}`, borderRadius: 8,
            outline: "none", resize: "none", lineHeight: 1.55,
            fontFamily: "inherit", boxSizing: "border-box", color: "#1E293B",
          }}
        />
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>
          Drives the "Goal achieved" output port
        </div>
      </div>

    </div>
  );
}

// ── Output Tab ────────────────────────────────────────────────────

function OutputTab({ data, upd }) {
  const replyOptions   = data.replyOptions   ?? [];
  const timeoutMinutes = data.timeoutMinutes ?? 30;
  const wiredPorts     = data.wiredPorts     ?? [];

  const addReply = () => {
    if (replyOptions.length >= 5) { toast.error("Maximum 5 reply options"); return; }
    upd({ replyOptions: [...replyOptions, { id: `ro_${Date.now()}`, label: "" }] });
  };
  const updateReply = (i, label) => upd({ replyOptions: replyOptions.map((r, idx) => idx === i ? { ...r, label } : r) });
  const removeReply = (i) => upd({ replyOptions: replyOptions.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Reply options */}
      <div>
        <SectionLabel>Reply Options</SectionLabel>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, padding: "7px 10px", background: "#F0FDFF", borderRadius: 6, borderLeft: `2px solid ${CHATBOT_TEAL}`, lineHeight: 1.5 }}>
          Each option is a tappable button in chat and an output port on the canvas.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {replyOptions.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", background: "#fff" }}>
              <GripVertical size={14} color={MUTED} style={{ flexShrink: 0, cursor: "grab" }} />
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${wiredPorts.includes(r.id) ? CHATBOT_TEAL : BORDER}`,
                background: wiredPorts.includes(r.id) ? CHATBOT_TEAL : "transparent",
              }} />
              <input
                type="text" value={r.label}
                onChange={(e) => updateReply(i, e.target.value)}
                placeholder={`Reply option ${i + 1}`}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#1E293B" }}
              />
              <button type="button" onClick={() => removeReply(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
                <Trash2 size={13} color="#EF4444" />
              </button>
            </div>
          ))}
          {replyOptions.length < 5 && (
            <button type="button" onClick={addReply} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px dashed ${BORDER}`, borderRadius: 8, padding: "9px 12px", background: "none", cursor: "pointer", fontSize: 12, color: MUTED, width: "100%" }}>
              <Plus size={13} /> Add reply option
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* System outputs */}
      <div>
        <SectionLabel>System Outputs</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F0FDF4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${wiredPorts.includes(SYSTEM_PORT_GOAL) ? "#10B981" : "#86EFAC"}`, background: wiredPorts.includes(SYSTEM_PORT_GOAL) ? "#10B981" : "transparent" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Goal achieved</span>
            </div>
            <Lock size={11} color="#86EFAC" />
          </div>

          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", background: "#F8FAFC" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${wiredPorts.includes(SYSTEM_PORT_TIMEOUT) ? MUTED : BORDER}`, background: wiredPorts.includes(SYSTEM_PORT_TIMEOUT) ? MUTED : "transparent" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>No response / Timeout</span>
              </div>
              <Lock size={11} color={MUTED} />
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: MUTED }}>Timeout after</span>
              <select
                value={timeoutMinutes}
                onChange={(e) => upd({ timeoutMinutes: Number(e.target.value) })}
                style={{ padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer" }}
              >
                {TIMEOUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: MUTED }}>with no reply</span>
            </div>
          </div>

        </div>
      </div>

      {/* Summary */}
      <div style={{ padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        <strong style={{ color: "#1E293B" }}>{replyOptions.length + 2}</strong> output ports total —{" "}
        {replyOptions.length} {replyOptions.length === 1 ? "reply option" : "reply options"} + goal achieved + no response
      </div>
    </div>
  );
}

// ── Global Tab ────────────────────────────────────────────────────

function GlobalTab({ global: g, setGlobal }) {
  const tone          = g?.tone            ?? "professional";
  const instructions  = g?.instructions    ?? "";
  const agentType     = g?.agentType       ?? null;
  const storeAccess   = g?.storeDataAccess ?? false;
  const storeMode     = g?.storeDataMode   ?? "full";
  const tools         = g?.tools           ?? [];
  const handover      = g?.handoverContext ?? [];

  const handleEnhance = () => {
    const id = toast.loading("Enhancing with AI…");
    setTimeout(() => {
      toast.dismiss(id); toast.success("Enhanced!");
      setGlobal({ instructions: mockEnhance(instructions) });
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Warning */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: 8, padding: "10px 12px" }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>⚙</span>
        <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
          Changes here apply to <strong>ALL AI Chatbot nodes</strong> in this flow
        </div>
      </div>

      {/* Tone */}
      <div>
        <SectionLabel>Tone</SectionLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {CHATBOT_TONES.map((t) => (
            <button key={t.id} type="button" onClick={() => setGlobal({ tone: t.id })}
              style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 600, border: `1.5px solid ${tone === t.id ? CHATBOT_TEAL : BORDER}`, borderRadius: 20, cursor: "pointer", background: tone === t.id ? CHATBOT_TEAL : "#fff", color: tone === t.id ? "#fff" : "#64748B", transition: "all 0.15s" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <SectionLabel>Instructions</SectionLabel>
          <AiEnhanceButton onClick={handleEnhance} />
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setGlobal({ instructions: e.target.value })}
          rows={4}
          placeholder="You are a helpful support agent for {brand_name}. Be concise, friendly, and stay on topic. Never discuss competitors."
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </div>

      {/* Agent Type */}
      <div>
        <SectionLabel>Agent Type</SectionLabel>
        <select
          value={agentType ?? ""}
          onChange={(e) => setGlobal({ agentType: e.target.value || null })}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", outline: "none", cursor: "pointer" }}
        >
          <option value="">Select agent type</option>
          {AGENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        {agentType && <div style={{ marginTop: 5, fontSize: 11, color: MUTED }}>{AGENT_TYPES.find((a) => a.id === agentType)?.desc}</div>}
      </div>

      {/* Store Data Access */}
      <div>
        <SectionLabel>Store Data Access</SectionLabel>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: storeAccess ? 10 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>Allow store data access</div>
              <div style={{ fontSize: 11, color: MUTED }}>Let the bot access store data for custom responses</div>
            </div>
            <button type="button" onClick={() => setGlobal({ storeDataAccess: !storeAccess })} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 22 }}>
              {storeAccess ? "🟢" : "⚪"}
            </button>
          </div>
          {storeAccess && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ id: "full", label: "Full access to store data" }, { id: "partial", label: "Partial access to selected data" }].map((opt) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="radio" checked={storeMode === opt.id} onChange={() => setGlobal({ storeDataMode: opt.id })} style={{ accentColor: CHATBOT_TEAL }} />
                  <span style={{ fontSize: 12, color: "#1E293B" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tools */}
      <div>
        <SectionLabel>Advanced Tools</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tools.map((tool, i) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input type="text" value={tool.name} placeholder="Tool name"
                  onChange={(e) => { const next = [...tools]; next[i] = { ...next[i], name: e.target.value }; setGlobal({ tools: next }); }}
                  style={{ width: "100%", fontSize: 12, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "#1E293B", marginBottom: 3 }}
                />
                <input type="text" value={tool.description} placeholder="Describe what this tool does…"
                  onChange={(e) => { const next = [...tools]; next[i] = { ...next[i], description: e.target.value }; setGlobal({ tools: next }); }}
                  style={{ width: "100%", fontSize: 11, color: MUTED, border: "none", outline: "none", background: "transparent" }}
                />
              </div>
              <button type="button" onClick={() => setGlobal({ tools: tools.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
                <Trash2 size={13} color="#EF4444" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setGlobal({ tools: [...tools, { name: "", description: "" }] })}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px dashed ${BORDER}`, borderRadius: 8, padding: "9px 12px", background: "none", cursor: "pointer", fontSize: 12, color: MUTED, width: "100%" }}
          >
            <Plus size={13} /> Add new tool
          </button>
        </div>
      </div>

      {/* Handover Context */}
      <div>
        <SectionLabel>Handover Context</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {handover.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="text" value={item.key} placeholder="Key"
                onChange={(e) => { const next = [...handover]; next[i] = { ...next[i], key: e.target.value }; setGlobal({ handoverContext: next }); }}
                style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
              />
              <input type="text" value={item.value} placeholder="Value"
                onChange={(e) => { const next = [...handover]; next[i] = { ...next[i], value: e.target.value }; setGlobal({ handoverContext: next }); }}
                style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
              />
              <button type="button" onClick={() => setGlobal({ handoverContext: handover.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Trash2 size={13} color="#EF4444" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setGlobal({ handoverContext: [...handover, { key: "", value: "" }] })}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1.5px dashed ${BORDER}`, borderRadius: 8, padding: "9px 12px", background: "none", cursor: "pointer", fontSize: 12, color: MUTED, width: "100%" }}
          >
            <Plus size={13} /> Add custom information
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root panel ────────────────────────────────────────────────────

export default function AiChatbotRightPanel() {
  const selectedNodeId    = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes             = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData    = useFlowBuilderStore((s) => s.updateNodeData);
  const aiChatbotGlobal   = useFlowBuilderStore((s) => s.aiChatbotGlobal);
  const setAiChatbotGlobal = useFlowBuilderStore((s) => s.setAiChatbotGlobal);

  const node = nodes?.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};
  const upd  = (patch) => updateNodeData(selectedNodeId, patch);

  const toneLabel    = CHATBOT_TONES.find((t) => t.id === (aiChatbotGlobal?.tone ?? "professional"))?.label ?? "";
  const agentLabel   = AGENT_TYPES.find((a) => a.id === aiChatbotGlobal?.agentType)?.label ?? null;

  return (
    <Tabs defaultValue="chat" className="absolute inset-0 flex flex-col">

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "10px 16px 0", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${CHATBOT_TEAL}, #0E7490)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>🤖</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{data.label || "AI Chatbot"}</div>
            <div style={{ fontSize: 10, color: MUTED }}>
              {agentLabel ? `${agentLabel} · ` : ""}{toneLabel}
            </div>
          </div>
        </div>

        <TabsList className="w-full bg-transparent border-0 p-0 h-auto gap-0">
          {[
            { value: "chat",   label: "Chat" },
            { value: "output", label: "Output" },
            { value: "global", label: "Global" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value} value={tab.value}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-semibold pb-2 text-slate-500"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="chat" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <ChatTab data={data} upd={upd} />
        </div>
      </TabsContent>

      <TabsContent value="output" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <OutputTab data={data} upd={upd} />
        </div>
      </TabsContent>

      <TabsContent value="global" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <GlobalTab global={aiChatbotGlobal} setGlobal={setAiChatbotGlobal} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
