import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BotMessageSquare, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  CHATBOT_TEAL,
  CHATBOT_TONES,
  AGENT_TYPES,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function mockEnhance(text) {
  return `You are a helpful AI assistant for {brand_name}. ${text || "Always be polite, concise, and stay on topic."} Never discuss competitors or make promises outside your knowledge.`;
}

export default function AiChatbotGlobalWizard({ open, initialGlobal, onClose, onComplete }) {
  const [tone,         setTone]         = useState(initialGlobal?.tone         ?? "professional");
  const [instructions, setInstructions] = useState(initialGlobal?.instructions ?? "");
  const [agentType,    setAgentType]    = useState(initialGlobal?.agentType    ?? null);
  const [enhancing,    setEnhancing]    = useState(false);

  const handleEnhance = () => {
    setEnhancing(true);
    const id = toast.loading("Enhancing with AI…");
    setTimeout(() => {
      toast.dismiss(id);
      toast.success("Enhanced!");
      setInstructions(mockEnhance(instructions));
      setEnhancing(false);
    }, 800);
  };

  const handleSave = () => {
    // Merge with initialGlobal so delivery fields set in the right panel are preserved
    onComplete({ ...(initialGlobal ?? {}), tone, instructions, agentType, configured: true });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{ maxWidth: 560, width: "100%", borderRadius: 16 }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">AI Chatbot Global Settings</DialogTitle>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${CHATBOT_TEAL} 0%, #0E7490 100%)`,
          padding: "20px 24px 18px", position: "relative",
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 6, padding: 5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} color="#fff" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <BotMessageSquare size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Set Up AI Chatbot</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                Global settings apply to all AI Chatbot nodes in this flow
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: "62vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Tone */}
          <div>
            <SectionLabel>Tone</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {CHATBOT_TONES.map((t) => (
                <button
                  key={t.id} type="button" onClick={() => setTone(t.id)}
                  style={{
                    flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600,
                    border: `1.5px solid ${tone === t.id ? CHATBOT_TEAL : BORDER}`,
                    borderRadius: 20, cursor: "pointer",
                    background: tone === t.id ? CHATBOT_TEAL : "#fff",
                    color: tone === t.id ? "#fff" : "#64748B",
                    transition: "all 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <SectionLabel>Instructions</SectionLabel>
              <button
                type="button" onClick={handleEnhance} disabled={enhancing}
                style={{
                  fontSize: 10, color: CHATBOT_TEAL, fontWeight: 600,
                  background: "none", border: `1px solid ${CHATBOT_TEAL}`,
                  borderRadius: 6, padding: "2px 8px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3,
                  opacity: enhancing ? 0.6 : 1,
                }}
              >
                <Sparkles size={10} />
                ✦ AI Enhance
              </button>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="You are a helpful support agent for {brand_name}. Be concise and friendly. Never discuss competitor products or make promises outside your knowledge."
              style={{
                width: "100%", padding: "9px 11px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                outline: "none", resize: "none", lineHeight: 1.55,
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>
              Applies to all AI Chatbot nodes in this flow
            </div>
          </div>

          {/* Agent Type */}
          <div>
            <SectionLabel>Agent Type</SectionLabel>
            <select
              value={agentType ?? ""}
              onChange={(e) => setAgentType(e.target.value || null)}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                background: "#fff", outline: "none", cursor: "pointer",
              }}
            >
              <option value="">Select agent type</option>
              {AGENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {agentType && (
              <div style={{ marginTop: 5, fontSize: 11, color: MUTED }}>
                {AGENT_TYPES.find((a) => a.id === agentType)?.desc}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${BORDER}`, padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA",
        }}>
          <button type="button" onClick={onClose} style={{ fontSize: 13, color: MUTED, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>
            Configure later
          </button>
          <button
            type="button" onClick={handleSave}
            style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${CHATBOT_TEAL}, #0E7490)`,
              border: "none", borderRadius: 8, padding: "9px 24px", cursor: "pointer",
            }}
          >
            Save &amp; Continue →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
