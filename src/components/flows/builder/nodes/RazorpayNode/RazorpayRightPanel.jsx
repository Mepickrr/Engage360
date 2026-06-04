import React, { useState } from "react";
import { CreditCard, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  RAZORPAY_MANDATORY_FIELDS,
  RAZORPAY_OPTIONAL_FIELDS,
  RAZORPAY_SAVED_RESPONSES,
} from "./data/mockData";
import VariablePicker from "./VariablePicker";

const BLUE   = "#3B82F6";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: MUTED,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />;
}

// ── Single field row: label + VariablePicker ──────────────────────
function FieldRow({ field, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
        {field.label}
      </div>
      <VariablePicker
        value={value ?? null}
        onChange={onChange}
        fieldLabel={field.label}
        fieldType={field.type}
      />
    </div>
  );
}

export default function RazorpayRightPanel() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);

  const [optionalOpen, setOptionalOpen] = useState(false);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};

  if (!node) return (
    <div style={{ padding: 24, color: MUTED, fontSize: 13, textAlign: "center" }}>
      No node selected
    </div>
  );

  const fieldValues = data.fieldValues ?? {};

  function setFieldValue(key, val) {
    updateNodeData(selectedNodeId, {
      fieldValues: { ...fieldValues, [key]: val },
    });
  }

  function patchLabel(v) {
    updateNodeData(selectedNodeId, { label: v });
  }

  const mandatoryFilled  = RAZORPAY_MANDATORY_FIELDS.filter((f) => fieldValues[f.key]).length;
  const mandatoryTotal   = RAZORPAY_MANDATORY_FIELDS.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <CreditCard size={18} color={BLUE} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Razorpay</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
            Create Payment Link
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Node label */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Node Label</SectionLabel>
          <input
            type="text"
            value={data.label ?? "Create Payment Link"}
            onChange={(e) => patchLabel(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px", fontSize: 13,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <Divider />

        {/* ── Mandatory fields ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Mandatory Fields</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px",
              borderRadius: 20,
              background: mandatoryFilled === mandatoryTotal ? "#F0FDF4" : "#FEF3C7",
              color: mandatoryFilled === mandatoryTotal ? "#16A34A" : "#B45309",
              border: `1px solid ${mandatoryFilled === mandatoryTotal ? "#BBF7D0" : "#FDE68A"}`,
            }}>
              {mandatoryFilled}/{mandatoryTotal}
            </span>
          </div>

          {RAZORPAY_MANDATORY_FIELDS.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              value={fieldValues[field.key]}
              onChange={(v) => setFieldValue(field.key, v)}
            />
          ))}
        </div>

        <Divider />

        {/* ── Optional fields (collapsible) ── */}
        <div>
          <div
            onClick={() => setOptionalOpen((p) => !p)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", padding: "10px 12px",
              background: "#F8FAFC", borderRadius: 10,
              border: `1px solid ${BORDER}`,
              marginBottom: optionalOpen ? 14 : 0,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Optional Fields</span>
            {optionalOpen
              ? <ChevronUp size={16} color={MUTED} />
              : <ChevronDown size={16} color={MUTED} />
            }
          </div>

          {optionalOpen && (
            <div style={{ paddingTop: 4 }}>
              {RAZORPAY_OPTIONAL_FIELDS.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key]}
                  onChange={(v) => setFieldValue(field.key, v)}
                />
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* ── Saved responses ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Saved responses</span>
            <div title="Variables produced by this node, usable in downstream nodes">
              <Info size={14} color={MUTED} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {RAZORPAY_SAVED_RESPONSES.map((r) => (
              <span
                key={r}
                style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: 500,
                  border: `1px solid ${BORDER}`, borderRadius: 20,
                  color: "#475569", background: "#F8FAFC",
                  fontFamily: "monospace",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
