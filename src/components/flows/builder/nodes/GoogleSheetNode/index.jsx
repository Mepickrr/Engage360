import React from "react";
import { Handle, Position } from "reactflow";
import { Table } from "lucide-react";
import { GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE } from "./data/mockData";
import { getGoogleSheetSummary } from "./data/summary";

const GREEN  = "#16A34A";
const RED    = "#DC2626";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function OutputHandle({ id, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>{label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        style={{
          background: color, width: 10, height: 10,
          position: "relative", top: "auto", right: "auto",
          transform: "none", flexShrink: 0,
        }}
      />
    </div>
  );
}


export default function GoogleSheetNode({ id, data, selected }) {
  const action       = data?.action ?? null;
  const isConfigured = !!action;
  const actionMeta   = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);
  const previewLine  = getGoogleSheetSummary(data);

  return (
    <div
      data-testid={`rf-google-sheet-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isConfigured ? "solid" : "dashed"} ${
          isConfigured ? GOOGLE_SHEET_BLUE : "rgba(55,138,221,0.4)"
        }`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(55,138,221,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: GOOGLE_SHEET_BLUE, width: 10, height: 10, top: -5 }}
      />

      {!isConfigured ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: GOOGLE_SHEET_BLUE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Table size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Google Sheet</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          <div style={{
            background: `linear-gradient(135deg, #2C6FB0 0%, ${GOOGLE_SHEET_BLUE} 100%)`,
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Table size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {actionMeta?.label ?? "Google Sheet"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Google Sheet
              </div>
            </div>
          </div>

          {previewLine && (
            <div style={{
              padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
              background: "#F8FAFC",
            }}>
              <span style={{ fontSize: 10, color: "#475569" }}>{previewLine}</span>
            </div>
          )}
        </>
      )}

      <div style={{
        padding: "8px 10px 10px",
        display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end",
      }}>
        <OutputHandle id="success" label="Success" color={GREEN} />
        <OutputHandle id="failed"  label="Failed"  color={RED}   />
      </div>
    </div>
  );
}
