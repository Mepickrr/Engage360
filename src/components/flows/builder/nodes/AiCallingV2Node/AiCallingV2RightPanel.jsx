// src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx
// PARTIAL FILE — Tasks 4 and 5 will add Delivery tab, Output tab, and the default export.
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhoneCall, Play, Square } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  PROVIDERS,
  PHONE_NUMBERS,
  AGENT_TYPES,
  VOICE_BUILDS_BY_TYPE,
  VOICES,
  COUPON_EXPIRY_OPTIONS,
  RETRY_GAPS,
  OUTPUT_PORTS_BY_TYPE,
} from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Shared UI primitives ─────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: MUTED,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children, required, optional }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{children}</span>
      {required && (
        <span style={{ fontSize: 10, fontWeight: 600, color: "#EF4444", border: "1px solid #FCA5A5", borderRadius: 4, padding: "1px 6px" }}>
          Required
        </span>
      )}
      {optional && (
        <span style={{ fontSize: 10, fontWeight: 600, color: "#16A34A", border: "1px solid #86EFAC", borderRadius: 4, padding: "1px 6px" }}>
          Optional
        </span>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ position: "relative" }}>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
            border: `1px solid ${(!value && required) ? "#FCA5A5" : BORDER}`,
            borderRadius: 8, outline: "none", background: "#fff",
            appearance: "none", cursor: "pointer",
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0,
        background: on ? INDIGO : "#E2E8F0",
        cursor: "pointer", display: "flex", alignItems: "center", padding: 2,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "transform 0.2s",
        transform: on ? "translateX(16px)" : "translateX(0)",
      }} />
    </div>
  );
}

// ── Template Tab ─────────────────────────────────────────────────

function TemplateTab({ data, upd }) {
  const [playingVoice, setPlayingVoice] = useState(null);

  const voiceBuilds = data.agentType
    ? (VOICE_BUILDS_BY_TYPE[data.agentType] ?? []).map((v) => ({ value: v, label: v }))
    : [];

  function handleAgentTypeChange(val) {
    upd({ agentType: val, voiceBuild: "", wiredPorts: [] });
  }

  function handleVoicePreview(voiceValue) {
    if (playingVoice === voiceValue) {
      setPlayingVoice(null);
      return;
    }
    setPlayingVoice(voiceValue);
    // Simulate preview — reset after 3 seconds
    setTimeout(() => setPlayingVoice(null), 3000);
  }

  const showCouponFields = data.agentType === "abandoned_cart" || data.agentType === "marketing";
  const showPlaceCOD     = data.agentType === "abandoned_cart";

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Provider */}
      <SelectField
        label="Provider"
        value={data.provider}
        onChange={(v) => upd({ provider: v })}
        options={PROVIDERS}
      />

      {/* Phone Number */}
      <SelectField
        label="Phone Number"
        value={data.phoneNumber}
        onChange={(v) => upd({ phoneNumber: v })}
        options={PHONE_NUMBERS}
        placeholder="Select phone number"
        required
      />

      {/* Type */}
      <SelectField
        label="Type"
        value={data.agentType}
        onChange={handleAgentTypeChange}
        options={AGENT_TYPES}
        placeholder="Select agent type"
        required
      />

      {/* Squadstack Voice Build */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Squadstack Voice Build</SectionLabel>
        <div style={{ position: "relative" }}>
          <select
            value={data.voiceBuild || ""}
            onChange={(e) => upd({ voiceBuild: e.target.value })}
            disabled={!data.agentType}
            style={{
              width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
              border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
              background: data.agentType ? "#fff" : "#F8FAFC",
              appearance: "none", cursor: data.agentType ? "pointer" : "not-allowed",
              color: data.agentType ? "#0F172A" : MUTED,
            }}
          >
            <option value="">{data.agentType ? "Select voice build" : "Select type first"}</option>
            {voiceBuilds.map((vb) => (
              <option key={vb.value} value={vb.value}>{vb.label}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
        </div>
      </div>

      {/* Voice with preview */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Voice</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {VOICES.map((v) => {
            const isSelected = data.voice === v.value;
            const isPlaying  = playingVoice === v.value;
            return (
              <div
                key={v.value}
                onClick={() => upd({ voice: v.value })}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px",
                  border: `1.5px solid ${isSelected ? INDIGO : BORDER}`,
                  borderRadius: 8, cursor: "pointer",
                  background: isSelected ? "#EEF2FF" : "#fff",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: isSelected ? INDIGO : "#F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: isSelected ? "#fff" : MUTED,
                }}>
                  {v.gender}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: "#0F172A" }}>
                  {v.label}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleVoicePreview(v.value); }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: `1px solid ${isPlaying ? INDIGO : BORDER}`,
                    background: isPlaying ? INDIGO : "#F8FAFC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {isPlaying
                    ? <Square size={10} color="#fff" fill="#fff" />
                    : <Play  size={10} color={MUTED} />
                  }
                </button>
              </div>
            );
          })}
        </div>
        {playingVoice && (
          <p style={{ fontSize: 10, color: INDIGO, marginTop: 6, fontStyle: "italic" }}>
            Playing preview for {VOICES.find((v) => v.value === playingVoice)?.label}…
          </p>
        )}
      </div>

      {/* AI Actions */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>AI Actions</SectionLabel>

        {/* Offer a prepaid discount */}
        <div style={{
          border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 10,
        }}>
          {/* Toggle header */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px", background: "#F8FAFC",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                Offer a prepaid discount
              </div>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Before accepting COD, the AI nudges the shopper to pay online with a discount. Helps shift COD orders to prepaid.
              </p>
            </div>
            <Toggle
              on={!!data.discount?.enabled}
              onChange={(v) => upd({ discount: { ...data.discount, enabled: v } })}
            />
          </div>

          {data.discount?.enabled && (
            <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Discount message */}
              <div>
                <FieldLabel required>Discount message</FieldLabel>
                <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                  The AI speaks this line when offering the discount. Keep it short and specific.
                </p>
                <textarea
                  value={data.discount?.message ?? ""}
                  onChange={(e) => upd({ discount: { ...data.discount, message: e.target.value } })}
                  placeholder="Pay online now and get 5% off instantly"
                  rows={2}
                  style={{
                    width: "100%", padding: "8px 10px", fontSize: 13,
                    border: `1px solid ${!data.discount?.message ? "#FCA5A5" : BORDER}`,
                    borderRadius: 8, outline: "none", resize: "none",
                    fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Discount coupon code — abandoned_cart + marketing only */}
              {showCouponFields && (
                <div>
                  <FieldLabel optional>Discount coupon code</FieldLabel>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                    If you have a coupon code, the AI will read it out on the call so the shopper can apply it at checkout.
                  </p>
                  <input
                    type="text"
                    value={data.discount?.couponCode ?? ""}
                    onChange={(e) => upd({ discount: { ...data.discount, couponCode: e.target.value } })}
                    placeholder="E.G. PREPAY5"
                    style={{
                      width: "100%", padding: "8px 10px", fontSize: 13,
                      border: `1px solid ${BORDER}`, borderRadius: 8,
                      outline: "none", fontFamily: "monospace", boxSizing: "border-box",
                    }}
                  />
                  {data.discount?.couponCode && (
                    <p style={{ fontSize: 11, color: "#64748B", marginTop: 6, fontStyle: "italic" }}>
                      The AI will say something like: <em style={{ color: INDIGO }}>"Use code {data.discount.couponCode} at checkout to get 5% off when you pay online."</em>
                    </p>
                  )}
                </div>
              )}

              {/* Coupon expiry — abandoned_cart + marketing only */}
              {showCouponFields && (
                <div>
                  <FieldLabel optional>Coupon expiry</FieldLabel>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                    Add urgency. The AI will mention the expiry if set.
                  </p>
                  <div style={{ position: "relative", display: "inline-block", width: "auto", minWidth: 160 }}>
                    <select
                      value={data.discount?.expiry ?? "none"}
                      onChange={(e) => upd({ discount: { ...data.discount, expiry: e.target.value } })}
                      style={{
                        padding: "7px 32px 7px 12px", fontSize: 13,
                        border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
                        background: "#fff", appearance: "none", cursor: "pointer",
                      }}
                    >
                      {COUPON_EXPIRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Place COD — abandoned_cart only */}
        {showPlaceCOD && (
          <div style={{
            border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px", background: "#F8FAFC",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                  Place COD
                </div>
                <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                  AI will place the order as Cash on Delivery if the shopper agrees.
                </p>
              </div>
              <Toggle
                on={!!data.placeCOD}
                onChange={(v) => upd({ placeCOD: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task 4 will insert DeliveryTab here ──────────────────────────
// ── Task 5 will insert OutputTab + export default here ──────────
