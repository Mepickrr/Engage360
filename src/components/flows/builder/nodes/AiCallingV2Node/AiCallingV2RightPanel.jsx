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
  RETRY_GAP_UNITS,
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

// ── TASK 4: ADD DeliveryTab HERE ──

function DeliveryTab({ data, upd }) {
  const utm = data.utm ?? {};

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Retry */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Retry</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Attempts */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Attempts</div>
            <input
              type="number"
              min={1}
              max={10}
              value={data.retryAttempt ?? 1}
              onChange={(e) => {
                const val = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                upd({ retryAttempt: val });
              }}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          {/* Gap */}
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Gap between retries</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                inputMode="numeric"
                value={data.retryGapValue ?? 5}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const val = raw === "" ? "" : Math.max(1, parseInt(raw, 10));
                  upd({ retryGapValue: val });
                }}
                style={{
                  width: 56, padding: "8px 10px", fontSize: 13, textAlign: "center",
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ position: "relative", flex: 1 }}>
                <select
                  value={data.retryGapUnit ?? "Minute"}
                  onChange={(e) => upd({ retryGapUnit: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
                    border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
                    background: "#fff", appearance: "none", cursor: "pointer",
                  }}
                >
                  {RETRY_GAP_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTM Parameters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionLabel>UTM Parameters</SectionLabel>
          <Toggle
            on={!!utm.enabled}
            onChange={(v) => upd({ utm: { ...utm, enabled: v } })}
          />
        </div>
        {utm.enabled && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            {[
              ["utm_source",   "Source",   "aicalling"],
              ["utm_medium",   "Medium",   "journey"],
              ["utm_campaign", "Campaign", ""],
              ["utm_content",  "Content",  ""],
              ["utm_term",     "Term",     ""],
            ].map(([key, label, placeholder], i, arr) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <span style={{
                  fontSize: 11, color: "#64748B", padding: "8px 10px", width: 84,
                  flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`,
                  fontFamily: "monospace",
                }}>
                  {label}
                </span>
                <input
                  type="text"
                  value={utm[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => upd({ utm: { ...utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "8px 10px", fontSize: 12, border: "none", outline: "none" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── OutputTab ─────────────────────────────────────────────────────

function OutputTab({ data, upd }) {
  const ports      = data.agentType ? (OUTPUT_PORTS_BY_TYPE[data.agentType] ?? []) : [];
  const wiredPorts = data.wiredPorts ?? [];

  const intentPorts     = ports.filter((p) => p.group === "intent");
  const connectionPorts = ports.filter((p) => p.group === "connection");

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Output mode selector */}
      <div>
        <SectionLabel>Output Mode</SectionLabel>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[
            { value: "next",   label: "Next Step" },
            { value: "branch", label: "Branch Output" },
          ].map((opt) => {
            const isActive = (data.outputMode ?? "next") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => upd({ outputMode: opt.value })}
                style={{
                  flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                  border: "none", cursor: "pointer",
                  background: isActive ? INDIGO : "#fff",
                  color: isActive ? "#fff" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next step description */}
      {(data.outputMode ?? "next") === "next" && (
        <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
          Flow continues to the next connected node after the call completes.
        </p>
      )}

      {/* Branch output — port list */}
      {data.outputMode === "branch" && (
        <div>
          {!data.agentType ? (
            <p style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>
              Select a Type in the Template tab to see available output ports.
            </p>
          ) : (
            <>
              <SectionLabel>Output Ports</SectionLabel>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                {intentPorts.map((port, i) => {
                  const wired = wiredPorts.includes(port.id);
                  return (
                    <div
                      key={port.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px",
                        borderBottom: i < intentPorts.length - 1 ? `1px solid ${BORDER}` : "none",
                        opacity: wired ? 1 : 0.5,
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
                        background: wired ? INDIGO : "transparent",
                      }} />
                      <span style={{ fontSize: 12, color: "#0F172A" }}>{port.label}</span>
                      {wired && (
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "#16A34A", fontWeight: 500 }}>Connected</span>
                      )}
                    </div>
                  );
                })}

                {connectionPorts.length > 0 && (
                  <>
                    <div style={{ height: 1, background: BORDER }} />
                    {connectionPorts.map((port) => {
                      const wired = wiredPorts.includes(port.id);
                      return (
                        <div
                          key={port.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 12px",
                            borderBottom: `1px solid ${BORDER}`,
                            opacity: wired ? 1 : 0.5,
                          }}
                        >
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
                            background: wired ? INDIGO : "transparent",
                          }} />
                          <span style={{ fontSize: 12, color: "#0F172A" }}>{port.label}</span>
                          {wired && (
                            <span style={{ marginLeft: "auto", fontSize: 10, color: "#16A34A", fontWeight: 500 }}>Connected</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                Dimmed ports are not yet connected. Wire them on the canvas to activate.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────

export default function AiCallingV2RightPanel() {
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};
  const upd  = (patch) => updateNodeData(selectedNodeId, patch);

  if (!node) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PhoneCall size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>AI Calling</div>
          <div style={{ fontSize: 10, color: MUTED }}>Squadstack voice agent</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="template" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <TabsList style={{ flexShrink: 0, borderRadius: 0, borderBottom: `1px solid ${BORDER}`, background: "#F8FAFC", padding: "4px 12px 0", justifyContent: "flex-start" }}>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="template" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <TemplateTab data={data} upd={upd} />
        </TabsContent>
        <TabsContent value="delivery" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <DeliveryTab data={data} upd={upd} />
        </TabsContent>
        <TabsContent value="output" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <OutputTab data={data} upd={upd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
