import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sparkles, Lock, Plus, Trash2, Play, Globe,
} from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  VOICE_PERSONAS,
  TONES,
  AI_CALLING_TEMPLATES,
  DEFAULT_OUTPUTS,
} from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

// ── Shared UI helpers ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function StyledTextarea({ value, onChange, rows = 4, placeholder }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 10px", fontSize: 13,
        border: `1px solid ${BORDER}`, borderRadius: 8,
        outline: "none", resize: "none", lineHeight: 1.55,
        fontFamily: "inherit", boxSizing: "border-box",
      }}
    />
  );
}

function AiEnhanceButton({ onEnhance, label = "✦ AI Enhance" }) {
  return (
    <button
      type="button"
      onClick={onEnhance}
      style={{
        fontSize: 10, color: INDIGO, fontWeight: 600,
        background: "none", border: `1px solid ${INDIGO}`,
        borderRadius: 6, padding: "2px 8px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 3,
      }}
    >
      <Sparkles size={10} />
      {label}
    </button>
  );
}

function mockEnhance(text) {
  return `As a professional AI calling agent, ${text || "Please describe the task."} Please confirm if you can proceed.`;
}

function handleAiEnhance(current, onUpdate) {
  const toastId = toast.loading("Enhancing with AI...");
  setTimeout(() => {
    toast.dismiss(toastId);
    toast.success("Enhanced successfully!");
    onUpdate(mockEnhance(current));
  }, 800);
}

// ── Script Tab ────────────────────────────────────────────────────
function ScriptTab({ data, upd }) {
  const mode = data.mode ?? "custom";
  const templateId = data.templateId ?? null;

  const selectedTemplate = AI_CALLING_TEMPLATES.find((t) => t.id === templateId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Node title */}
      <div>
        <SectionLabel>Node Title</SectionLabel>
        <input
          value={data.label ?? "AI Call"}
          onChange={(e) => upd({ label: e.target.value })}
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Mode toggle */}
      <div>
        <SectionLabel>Mode</SectionLabel>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[{ id: "template", label: "Use Template" }, { id: "custom", label: "Custom" }].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => upd({ mode: m.id })}
              style={{
                flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "none",
                background: mode === m.id ? INDIGO : "#fff",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {AI_CALLING_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => upd({ templateId: tpl.id, instruction: tpl.instruction, script: tpl.script })}
                style={{
                  border: `2px solid ${templateId === tpl.id ? INDIGO : BORDER}`,
                  borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                  background: templateId === tpl.id ? "#EEF2FF" : "#fff",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{tpl.name}</div>
                <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.4 }}>
                  {tpl.instruction.slice(0, 60)}…
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <SectionLabel>Instruction Preview</SectionLabel>
                <textarea
                  readOnly
                  value={selectedTemplate.instruction}
                  rows={3}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, resize: "none", background: "#F8FAFC", color: "#475569", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <SectionLabel>Script Preview</SectionLabel>
                <textarea
                  readOnly
                  value={selectedTemplate.script}
                  rows={4}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, resize: "none", background: "#F8FAFC", color: "#475569", fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom mode */}
      {mode === "custom" && (
        <>
          {/* Instruction */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <SectionLabel>Instruction</SectionLabel>
              <AiEnhanceButton onEnhance={() => handleAiEnhance(data.instruction, (v) => upd({ instruction: v }))} />
            </div>
            <StyledTextarea
              value={data.instruction}
              onChange={(e) => upd({ instruction: e.target.value })}
              rows={4}
              placeholder="Describe what the AI agent should do during this call..."
            />
          </div>

          {/* Script */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <SectionLabel>Script</SectionLabel>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => upd({ script: (data.script || "") + " {variable}" })}
                  style={{ fontSize: 10, color: "#64748B", fontWeight: 600, background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
                >
                  + Add Variable
                </button>
                <AiEnhanceButton onEnhance={() => handleAiEnhance(data.script, (v) => upd({ script: v }))} />
              </div>
            </div>
            <StyledTextarea
              value={data.script}
              onChange={(e) => upd({ script: e.target.value })}
              rows={5}
              placeholder="Write the script the AI will read..."
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Output Tab ────────────────────────────────────────────────────
function OutputTab({ data, upd }) {
  const outputMode = data.outputMode ?? "manual";
  const outputs = data.outputs ?? [];

  const addCustomOutput = () => {
    upd({ outputs: [...outputs, { id: `custom_${Date.now()}`, label: "Custom outcome", isFixed: false }] });
  };

  const removeOutput = (id) => {
    upd({ outputs: outputs.filter((o) => o.id !== id) });
  };

  const updateOutputLabel = (id, label) => {
    upd({ outputs: outputs.map((o) => o.id === id ? { ...o, label } : o) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* OutputMode toggle */}
      <div>
        <SectionLabel>Output Mode</SectionLabel>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[{ id: "manual", label: "Manual" }, { id: "ai", label: "AI Agent" }].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => upd({ outputMode: m.id })}
              style={{
                flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "none",
                background: outputMode === m.id ? INDIGO : "#fff",
                color: outputMode === m.id ? "#fff" : "#64748B",
                transition: "all 0.15s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {outputMode === "manual" && (
        <>
          <div>
            <SectionLabel>Output Ports</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {outputs.map((out) => (
                <div key={out.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: INDIGO, flexShrink: 0 }} />
                  {out.isFixed ? (
                    <>
                      <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{out.label}</span>
                      <Lock size={11} color={MUTED} style={{ flexShrink: 0 }} />
                    </>
                  ) : (
                    <>
                      <input
                        value={out.label}
                        onChange={(e) => updateOutputLabel(out.id, e.target.value)}
                        style={{ flex: 1, fontSize: 12, border: "none", outline: "none", background: "transparent", color: "#374151" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOutput(out.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                      >
                        <Trash2 size={12} color="#EF4444" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addCustomOutput}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 0", border: `1.5px dashed ${BORDER}`, borderRadius: 8,
              fontSize: 12, color: INDIGO, fontWeight: 600, cursor: "pointer", background: "none",
              width: "100%",
            }}
          >
            <Plus size={13} />
            Add Custom Output
          </button>

          <div style={{ fontSize: 10, color: MUTED, background: "#F8FAFC", borderRadius: 6, padding: "7px 10px", lineHeight: 1.5 }}>
            Number of outputs determines connection ports on the canvas
          </div>
        </>
      )}

      {outputMode === "ai" && (
        <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Sparkles size={16} color={INDIGO} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
            The AI agent will determine call outcomes based on the goal and instructions. Outputs will be dynamically set during the call.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Global Tab ────────────────────────────────────────────────────
function GlobalTab({ aiCallingGlobal, setAiCallingGlobal }) {
  const [playingId, setPlayingId] = useState(null);

  const voiceId = aiCallingGlobal?.voiceId ?? "varsha";
  const tone = aiCallingGlobal?.tone ?? "professional";
  const goal = aiCallingGlobal?.goal ?? "";

  const playVoice = (persona) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance("Hello, I am here to help you with your product.");
      utt.rate = persona.speechRate;
      utt.pitch = persona.speechPitch;
      setPlayingId(persona.id);
      utt.onend = () => setPlayingId(null);
      utt.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Warning banner */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: 8, padding: "10px 12px" }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>⚙</span>
        <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
          Changes here apply to <strong>ALL AI Calling nodes</strong> in this flow
        </div>
      </div>

      {/* Voice section */}
      <div>
        <SectionLabel>Select Voice</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {VOICE_PERSONAS.map((persona) => {
            const isSelected = voiceId === persona.id;
            const initials = persona.name.slice(0, 2).toUpperCase();
            return (
              <div
                key={persona.id}
                onClick={() => setAiCallingGlobal({ voiceId: persona.id })}
                style={{
                  border: `2px solid ${isSelected ? INDIGO : BORDER}`,
                  borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                  background: isSelected ? "#EEF2FF" : "#fff",
                  position: "relative", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: persona.color, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{persona.name}</div>
                  </div>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? INDIGO : "#CBD5E1"}`,
                    background: isSelected ? INDIGO : "transparent",
                    transition: "all 0.15s",
                  }} />
                </div>
                <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4, marginBottom: 6 }}>{persona.description}</div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); playVoice(persona); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, fontSize: 10,
                    color: playingId === persona.id ? "#10B981" : INDIGO,
                    fontWeight: 600, background: "none", border: `1px solid ${playingId === persona.id ? "#10B981" : INDIGO}`,
                    borderRadius: 5, padding: "2px 7px", cursor: "pointer",
                  }}
                >
                  <Play size={9} />
                  {playingId === persona.id ? "Playing..." : "Preview"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tone section */}
      <div>
        <SectionLabel>Tone</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAiCallingGlobal({ tone: t.id })}
              style={{
                flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${tone === t.id ? INDIGO : BORDER}`,
                borderRadius: 20, cursor: "pointer",
                background: tone === t.id ? INDIGO : "#fff",
                color: tone === t.id ? "#fff" : "#64748B",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <SectionLabel>Goal</SectionLabel>
          <AiEnhanceButton onEnhance={() => handleAiEnhance(goal, (v) => setAiCallingGlobal({ goal: v }))} />
        </div>
        <StyledTextarea
          value={goal}
          onChange={(e) => setAiCallingGlobal({ goal: e.target.value })}
          rows={4}
          placeholder="Describe the primary goal for all AI calling nodes in this flow..."
        />
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────
export default function AiCallingRightPanel() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const aiCallingGlobal = useFlowBuilderStore((s) => s.aiCallingGlobal);
  const setAiCallingGlobal = useFlowBuilderStore((s) => s.setAiCallingGlobal);

  const node = nodes?.find((n) => n.id === selectedNodeId);
  const data = node?.data || {};
  const upd = (patch) => updateNodeData(selectedNodeId, patch);

  return (
    <Tabs defaultValue="script" className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "10px 16px 0", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{data.label || "AI Call"}</div>
            <div style={{ fontSize: 10, color: MUTED }}>AI Calling Node</div>
          </div>
        </div>
        <TabsList className="w-full bg-transparent border-0 p-0 h-auto gap-0">
          {[
            { value: "script", label: "Script" },
            { value: "output", label: "Output" },
            { value: "global", label: "Global" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-semibold pb-2 text-slate-500"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Script */}
      <TabsContent value="script" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <ScriptTab data={data} upd={upd} />
        </div>
      </TabsContent>

      {/* Output */}
      <TabsContent value="output" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <OutputTab data={data} upd={upd} />
        </div>
      </TabsContent>

      {/* Global */}
      <TabsContent value="global" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <GlobalTab aiCallingGlobal={aiCallingGlobal} setAiCallingGlobal={setAiCallingGlobal} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
