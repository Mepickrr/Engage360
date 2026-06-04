import React, { useState } from "react";
import { Brain, GitFork, Info, Plus, Trash2, ChevronDown } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { PREDICTION_TYPES, MOCK_USER_EVENTS, THRESHOLD_META } from "./data/mockData";

const VIOLET = "#6D28D9";
const BORDER  = "#E5E7EB";
const MUTED   = "#94A3B8";

const ALL_THRESHOLDS = ["high", "medium", "low"];

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: MUTED,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />;
}

function StyledSelect({ value, onChange, children, disabled }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      style={{
        width: "100%", padding: "8px 10px", fontSize: 13,
        border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
        background: disabled ? "#F8FAFC" : "#fff",
        color: value ? "#1E293B" : MUTED,
        cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
      }}
    >
      {children}
    </select>
  );
}

// Dropdown to add a threshold that's not yet in the branch list
function AddThresholdMenu({ usedThresholds, onAdd }) {
  const [open, setOpen] = useState(false);
  const available = ALL_THRESHOLDS.filter((t) => !usedThresholds.includes(t));
  if (available.length === 0) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", fontSize: 12, fontWeight: 600,
          color: VIOLET, background: "#F5F3FF",
          border: `1px solid #DDD6FE`, borderRadius: 8, cursor: "pointer",
        }}
      >
        <Plus size={12} />
        Add branch
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            zIndex: 20, background: "#fff",
            border: `1px solid ${BORDER}`, borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            overflow: "hidden", minWidth: 140,
          }}>
            {available.map((t) => {
              const meta = THRESHOLD_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onAdd(t); setOpen(false); }}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "8px 12px", fontSize: 12, fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer",
                    color: meta.color,
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AiPredictRightPanel() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};

  if (!node) {
    return (
      <div style={{ padding: 24, color: MUTED, fontSize: 13, textAlign: "center" }}>
        No node selected
      </div>
    );
  }

  function patch(updates) {
    updateNodeData(selectedNodeId, updates);
  }

  const branches = data.branches ?? [];
  const usedThresholds = branches.map((b) => b.threshold).filter(Boolean);

  const selectedPrediction = PREDICTION_TYPES.find((p) => p.id === data.predictionType);
  const isCustom = data.predictionType === "custom";

  function addBranch(threshold) {
    const meta = THRESHOLD_META[threshold];
    patch({
      branches: [
        ...branches,
        { id: `branch_${threshold}`, threshold, label: meta.label },
      ],
    });
  }

  function removeBranch(id) {
    patch({ branches: branches.filter((b) => b.id !== id) });
  }

  function renameBranch(id, label) {
    patch({ branches: branches.map((b) => (b.id === id ? { ...b, label } : b)) });
  }

  function changeThreshold(id, threshold) {
    const meta = THRESHOLD_META[threshold];
    patch({
      branches: branches.map((b) =>
        b.id === id ? { ...b, threshold, id: `branch_${threshold}`, label: meta.label } : b
      ),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Brain size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Predict</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
            ML-powered audience scoring
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Node label */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Node Label</SectionLabel>
          <input
            type="text"
            value={data.label ?? "AI Predict"}
            onChange={(e) => patch({ label: e.target.value })}
            style={{
              width: "100%", padding: "8px 10px", fontSize: 13,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <Divider />

        {/* What do you want to predict? */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>What do you want to predict?</SectionLabel>
          <StyledSelect
            value={data.predictionType}
            onChange={(val) => patch({ predictionType: val, customEvent: val === "custom" ? data.customEvent : null })}
          >
            <option value="">Select prediction type…</option>
            {PREDICTION_TYPES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </StyledSelect>

          {selectedPrediction && (
            <div style={{
              marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6,
              padding: "8px 10px", background: "#F5F3FF",
              borderRadius: 8, border: "1px solid #EDE9FE",
            }}>
              <Info size={13} color={VIOLET} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#5B21B6", lineHeight: 1.5 }}>
                {selectedPrediction.description}
              </span>
            </div>
          )}
        </div>

        {/* Custom event picker */}
        {isCustom && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Select User Event</SectionLabel>
            <StyledSelect value={data.customEvent} onChange={(val) => patch({ customEvent: val })}>
              <option value="">Select event…</option>
              {MOCK_USER_EVENTS.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </StyledSelect>
          </div>
        )}

        <Divider />

        {/* Combined threshold + output branches */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <GitFork size={13} color={MUTED} />
            <SectionLabel>Output Branches</SectionLabel>
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
            Each branch routes users matching that likelihood tier. Remove branches you don't need.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {branches.map((branch) => {
              const meta = THRESHOLD_META[branch.threshold] ?? THRESHOLD_META.high;
              const canRemove = branches.length > 1;
              // Available thresholds for this branch's selector = its own + unused ones
              const availableForThis = ALL_THRESHOLDS.filter(
                (t) => t === branch.threshold || !usedThresholds.includes(t)
              );

              return (
                <div
                  key={branch.id}
                  style={{
                    border: `1px solid ${meta.border}`,
                    borderRadius: 10, background: meta.bg,
                    overflow: "hidden",
                  }}
                >
                  {/* Threshold selector row */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 10px",
                    borderBottom: `1px solid ${meta.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                        Threshold
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select
                        value={branch.threshold ?? ""}
                        onChange={(e) => changeThreshold(branch.id, e.target.value)}
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: meta.color, background: "#fff",
                          border: `1px solid ${meta.border}`,
                          borderRadius: 6, padding: "2px 6px",
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {availableForThis.map((t) => (
                          <option key={t} value={t}>
                            {THRESHOLD_META[t].label}
                          </option>
                        ))}
                      </select>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => removeBranch(branch.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: 2, display: "flex", alignItems: "center",
                            color: "#94A3B8",
                          }}
                          title="Remove branch"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Branch label */}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: meta.color, fontWeight: 600, marginBottom: 4 }}>
                      Branch label
                    </div>
                    <input
                      type="text"
                      value={branch.label}
                      onChange={(e) => renameBranch(branch.id, e.target.value)}
                      style={{
                        width: "100%", padding: "6px 8px", fontSize: 12,
                        border: `1px solid ${meta.border}`, borderRadius: 6,
                        background: "#fff", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add branch */}
          <div style={{ marginTop: 10 }}>
            <AddThresholdMenu usedThresholds={usedThresholds} onAdd={addBranch} />
          </div>
        </div>

      </div>
    </div>
  );
}
