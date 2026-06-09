import React from "react";
import { Handle, Position } from "reactflow";
import { CreditCard } from "lucide-react";
import { RAZORPAY_MANDATORY_FIELDS } from "./data/mockData";

const BLUE   = "#3B82F6";
const BORDER = "#E5E7EB";

export default function RazorpayNode({ id, data, selected }) {
  const fieldValues    = data?.fieldValues ?? {};
  const label          = data?.label ?? "Create Payment Link";
  const filledCount    = RAZORPAY_MANDATORY_FIELDS.filter((f) => fieldValues[f.key]).length;
  const totalMandatory = RAZORPAY_MANDATORY_FIELDS.length;
  const allFilled      = filledCount === totalMandatory;
  const isEmpty        = filledCount === 0;

  return (
    <div
      data-testid={`rf-razorpay-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${isEmpty ? "rgba(59,130,246,0.4)" : BLUE}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(59,130,246,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: BLUE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: BLUE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CreditCard size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Razorpay</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CreditCard size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Create Payment Link
              </div>
            </div>
          </div>

          {/* Field completion row */}
          <div style={{
            padding: "8px 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 10, color: "#64748B" }}>Mandatory fields</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px",
              borderRadius: 20,
              background: allFilled ? "#F0FDF4" : "#FEF3C7",
              color:      allFilled ? "#16A34A" : "#B45309",
              border: `1px solid ${allFilled ? "#BBF7D0" : "#FDE68A"}`,
            }}>
              {filledCount}/{totalMandatory}
            </span>
          </div>
        </>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: BLUE, width: 10, height: 10, bottom: -5 }}
      />
    </div>
  );
}
