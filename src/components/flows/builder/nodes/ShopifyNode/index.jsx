// src/components/flows/builder/nodes/ShopifyNode/index.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { ShoppingBag } from "lucide-react";
import { SHOPIFY_ACTIONS, SHOPIFY_GREEN } from "./data/mockData";

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

function getPreviewLine(data) {
  const action = data?.action;
  if (!action) return null;
  if (action === "order_creation")    return "Order will be created on Shopify";
  if (action === "order_cancellation") return "Order will be cancelled on Shopify";
  if (action === "order_tag") {
    const tag = (data?.orderTags ?? [])[0] ?? "—";
    return `Order Tag <${tag}> is Updated`;
  }
  if (action === "customer_tag") {
    const tag = (data?.customerTags ?? [])[0] ?? "—";
    return `Customer Tag <${tag}> is Updated`;
  }
  if (action === "order_notes") {
    const note = (data?.orderNote ?? "").slice(0, 30) || "—";
    return `Order Note <${note}> is Updated`;
  }
  if (action === "discount_code") {
    const d = data?.discount ?? {};
    const title   = d.title || "—";
    const type    = d.type  || "amount";
    const expires = d.expirationEnabled ? (d.expirationValue ?? "(pending)") : "never";
    return `Discount: ${title} · ${type} · expires ${expires}`;
  }
  return null;
}

export default function ShopifyNode({ id, data, selected }) {
  const action     = data?.action ?? null;
  const isConfigured = !!action;
  const actionMeta   = SHOPIFY_ACTIONS.find((a) => a.id === action);
  const previewLine  = getPreviewLine(data);

  return (
    <div
      data-testid={`rf-shopify-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isConfigured ? "solid" : "dashed"} ${
          isConfigured ? SHOPIFY_GREEN : "rgba(150,191,72,0.4)"
        }`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(150,191,72,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: SHOPIFY_GREEN, width: 10, height: 10, top: -5 }}
      />

      {!isConfigured ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: SHOPIFY_GREEN,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShoppingBag size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Shopify</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, #6a9e2a 0%, ${SHOPIFY_GREEN} 100%)`,
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <ShoppingBag size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {actionMeta?.label ?? "Shopify"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Shopify
              </div>
            </div>
          </div>

          {/* Action chip */}
          <div style={{
            padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 600, color: SHOPIFY_GREEN,
              background: "#F2F7E8", border: "1px solid #C8E190",
              borderRadius: 20, padding: "1px 7px",
            }}>
              {actionMeta?.emoji} {actionMeta?.label}
            </span>
          </div>

          {/* Preview line */}
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

      {/* Output handles */}
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
