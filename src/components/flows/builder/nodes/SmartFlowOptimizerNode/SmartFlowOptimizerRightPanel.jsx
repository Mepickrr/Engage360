import React, { useState } from "react";
import { Route, Plus, Trash2 } from "lucide-react";
import {
  SFO_INDIGO, SFO_CHANNEL_OPTIONS, SFO_GOALS, SFO_DISTRIBUTIONS,
  defaultSFONodeData,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

// ── Branch list ────────────────────────────────────────────────
function BranchList({ branches, distribution, onChange }) {
  const addBranch = () => {
    const usedChannels = branches.map((b) => b.channel);
    const nextChannel = SFO_CHANNEL_OPTIONS.find((c) => !usedChannels.includes(c.id))?.id ?? "push";
    const newBranch = {
      id:      `sfo_b${Date.now()}`,
      label:   `Branch ${branches.length + 1}`,
      channel: nextChannel,
      traffic: Math.floor(100 / (branches.length + 1)),
    };
    onChange([...branches, newBranch]);
  };

  const removeBranch = (id) => {
    if (branches.length <= 2) return;
    onChange(branches.filter((b) => b.id !== id));
  };

  const patchBranch = (id, patch) => {
    onChange(branches.map((b) => b.id === id ? { ...b, ...patch } : b));
  };

  // Compute even split for auto/equal display
  const evenPct = Math.floor(100 / branches.length);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Label>Branches</Label>
        {branches.length < 5 && (
          <button onClick={addBranch} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: SFO_INDIGO, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            <Plus size={12} /> Add branch
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {branches.map((branch, idx) => {
          const ch = SFO_CHANNEL_OPTIONS.find((c) => c.id === branch.channel);
          const displayPct = distribution === "manual" ? (branch.traffic ?? evenPct) : evenPct;
          return (
            <div key={branch.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              {/* Branch header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: ch?.color ?? SFO_INDIGO, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                  {ch?.emoji ?? "📣"}
                </div>
                <input
                  value={branch.label}
                  onChange={(e) => patchBranch(branch.id, { label: e.target.value })}
                  style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0F172A", border: "none", outline: "none", background: "transparent", minWidth: 0 }}
                />
                {distribution === "manual" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <input
                      type="number" min={1} max={100}
                      value={branch.traffic ?? evenPct}
                      onChange={(e) => patchBranch(branch.id, { traffic: parseInt(e.target.value) || 1 })}
                      style={{ width: 44, padding: "3px 6px", fontSize: 12, fontWeight: 700, color: SFO_INDIGO, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", textAlign: "center" }}
                    />
                    <span style={{ fontSize: 11, color: MUTED }}>%</span>
                  </div>
                )}
                {distribution !== "manual" && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: SFO_INDIGO, flexShrink: 0 }}>{displayPct}%</span>
                )}
                <button
                  onClick={() => removeBranch(branch.id)}
                  style={{ background: "none", border: "none", cursor: branches.length > 2 ? "pointer" : "not-allowed", color: branches.length > 2 ? "#EF4444" : "#CBD5E1", padding: 0, lineHeight: 1 }}
                ><Trash2 size={12} /></button>
              </div>

              {/* Channel picker */}
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Channel</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {SFO_CHANNEL_OPTIONS.map((opt) => {
                    const active = branch.channel === opt.id;
                    return (
                      <button key={opt.id} onClick={() => patchBranch(branch.id, { channel: opt.id })} style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
                        border: `1.5px solid ${active ? opt.color : BORDER}`,
                        borderRadius: 6, background: active ? `${opt.color}12` : "#fff",
                        color: active ? opt.color : "#64748B", fontSize: 10, fontWeight: active ? 700 : 400, cursor: "pointer",
                      }}>
                        <span>{opt.emoji}</span>{opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {branches.length >= 5 && (
        <p style={{ fontSize: 10, color: MUTED, marginTop: 6, textAlign: "center" }}>Maximum 5 branches</p>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────
export default function SmartFlowOptimizerRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? defaultSFONodeData;
  const patch = (p) => updateNodeData(node.id, p);

  const {
    branches         = defaultSFONodeData.branches,
    optimizeFor      = "ctr",
    distribution     = "auto",
    winnerThreshold  = 95,
    minSampleSize    = 500,
  } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: SFO_INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Route size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={data.label ?? "Smart Flow Optimizer"}
              onChange={(e) => patch({ label: e.target.value })}
              style={{ width: "100%", fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", outline: "none", background: "transparent", padding: 0 }}
            />
            <div style={{ fontSize: 10, color: MUTED }}>AI channel experiment</div>
          </div>
          <button onClick={() => removeNode(node.id)} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Delete</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* How it works */}
        <div style={{ padding: "10px 12px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3730A3", marginBottom: 3 }}>How it works</div>
          <p style={{ fontSize: 11, color: "#4338CA", margin: 0, lineHeight: 1.55 }}>
            Each branch sends via a different channel. AI tracks performance and gradually shifts more traffic toward the winning channel.
          </p>
        </div>

        {/* Branches */}
        <BranchList
          branches={branches}
          distribution={distribution}
          onChange={(b) => patch({ branches: b })}
        />

        {/* Traffic distribution */}
        <div>
          <Label>Traffic distribution</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SFO_DISTRIBUTIONS.map((d) => {
              const active = distribution === d.id;
              return (
                <div key={d.id} onClick={() => patch({ distribution: d.id })} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px",
                  border: `1.5px solid ${active ? SFO_INDIGO : BORDER}`, borderRadius: 8, cursor: "pointer",
                  background: active ? "#EEF2FF" : "#fff",
                }}>
                  <div style={{ marginTop: 2, width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? SFO_INDIGO : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: SFO_INDIGO }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 1, lineHeight: 1.4 }}>{d.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimise for */}
        <div>
          <Label>Optimise for</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {SFO_GOALS.map((g) => {
              const active = optimizeFor === g.id;
              return (
                <button key={g.id} onClick={() => patch({ optimizeFor: g.id })} style={{
                  flex: 1, padding: "7px 4px", border: `1.5px solid ${active ? SFO_INDIGO : BORDER}`,
                  borderRadius: 8, background: active ? "#EEF2FF" : "#fff",
                  color: active ? "#3730A3" : "#64748B", fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer",
                }}>{g.label}</button>
              );
            })}
          </div>
        </div>

        {/* Experiment settings */}
        <div>
          <Label>Experiment settings</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Winner threshold */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Winner confidence</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Declare winner when confidence reaches this level</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <input
                  type="number" min={80} max={99}
                  value={winnerThreshold}
                  onChange={(e) => patch({ winnerThreshold: parseInt(e.target.value) || 95 })}
                  style={{ width: 48, padding: "4px 6px", fontSize: 13, fontWeight: 700, color: SFO_INDIGO, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", textAlign: "center" }}
                />
                <span style={{ fontSize: 11, color: MUTED }}>%</span>
              </div>
            </div>

            {/* Min sample size */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Min. users per branch</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Results considered only after this many users</div>
              </div>
              <input
                type="number" min={100} step={100}
                value={minSampleSize}
                onChange={(e) => patch({ minSampleSize: parseInt(e.target.value) || 100 })}
                style={{ width: 64, padding: "4px 6px", fontSize: 13, fontWeight: 700, color: SFO_INDIGO, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", textAlign: "center", flexShrink: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Port summary */}
        <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{branches.length}</span>
        </div>
      </div>
    </div>
  );
}
