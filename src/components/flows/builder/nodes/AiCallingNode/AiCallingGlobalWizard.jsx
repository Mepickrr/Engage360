import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PhoneCall, Play, Sparkles, X } from "lucide-react";
import { VOICE_PERSONAS, TONES } from "./data/mockData";
import { toast } from "sonner";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, letterSpacing: "0.02em" }}>
      {children}
    </div>
  );
}

function mockEnhance(text) {
  return `As a professional AI calling agent, ${text || "help the customer with their query."} Please confirm if you can proceed.`;
}

export default function AiCallingGlobalWizard({ open, initialGlobal, onClose, onComplete }) {
  const [voiceId, setVoiceId] = useState(initialGlobal?.voiceId ?? "varsha");
  const [tone, setTone] = useState(initialGlobal?.tone ?? "professional");
  const [goal, setGoal] = useState(initialGlobal?.goal ?? "");
  const [playingId, setPlayingId] = useState(null);
  const [enhancing, setEnhancing] = useState(false);

  const handlePlay = (persona, e) => {
    e.stopPropagation();
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

  const handleEnhance = () => {
    setEnhancing(true);
    const toastId = toast.loading("Enhancing with AI...");
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success("Enhanced!");
      setGoal(mockEnhance(goal));
      setEnhancing(false);
    }, 800);
  };

  const handleSave = () => {
    onComplete({ voiceId, tone, goal, configured: true });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{ maxWidth: 540, width: "100%", borderRadius: 16 }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">AI Calling Global Settings</DialogTitle>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          padding: "20px 24px 18px",
          position: "relative",
        }}>
          <button
            type="button"
            onClick={onClose}
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
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <PhoneCall size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                Set Up AI Calling
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                Global settings apply to all AI Calling nodes in this flow
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: INDIGO }}>1</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              Configure Voice &amp; Goal
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px", maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Voice */}
          <div>
            <SectionLabel>Select Voice</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {VOICE_PERSONAS.map((persona) => {
                const selected = voiceId === persona.id;
                const initials = persona.name.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={persona.id}
                    onClick={() => setVoiceId(persona.id)}
                    style={{
                      border: `2px solid ${selected ? INDIGO : BORDER}`,
                      borderRadius: 10, padding: "10px 10px 8px",
                      cursor: "pointer",
                      background: selected ? "#EEF2FF" : "#fff",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: persona.color,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{initials}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{persona.name}</div>
                        <div style={{ fontSize: 9, color: MUTED }}>{persona.gender === "F" ? "Female" : "Male"}</div>
                      </div>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${selected ? INDIGO : "#CBD5E1"}`,
                        background: selected ? INDIGO : "transparent",
                        transition: "all 0.15s",
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4, marginBottom: 6 }}>
                      {persona.description}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handlePlay(persona, e)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, fontSize: 10,
                        color: playingId === persona.id ? "#10B981" : INDIGO,
                        fontWeight: 600, background: "none",
                        border: `1px solid ${playingId === persona.id ? "#10B981" : INDIGO}`,
                        borderRadius: 5, padding: "2px 7px", cursor: "pointer",
                      }}
                    >
                      <Play size={8} />
                      {playingId === persona.id ? "Playing…" : "Preview"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <SectionLabel>Tone</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  style={{
                    flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600,
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

          {/* Goal */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <SectionLabel>Goal</SectionLabel>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={enhancing}
                style={{
                  fontSize: 10, color: INDIGO, fontWeight: 600,
                  background: "none", border: `1px solid ${INDIGO}`,
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
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="Describe the primary goal for all AI calling nodes in this flow…"
              style={{
                width: "100%", padding: "9px 11px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                outline: "none", resize: "none", lineHeight: 1.55,
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 13, color: MUTED, fontWeight: 500,
              background: "none", border: "none", cursor: "pointer", padding: "6px 0",
            }}
          >
            Configure later
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${INDIGO}, #7C3AED)`,
              border: "none", borderRadius: 8,
              padding: "9px 24px", cursor: "pointer",
            }}
          >
            Save &amp; Continue →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
