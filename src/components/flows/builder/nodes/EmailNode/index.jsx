import React from "react";
import { Handle, Position } from "reactflow";
import { Mail, Paperclip } from "lucide-react";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import { EMAIL_FROM_ADDRESSES, EMAIL_DELIVERY_OPTIONS } from "./data/mockData";
import { useFlowVariant } from "@/components/flows/FlowVariantContext";
import emailIcon from "@/assets/icons/email.png";

const EMAIL_BLUE = "#3B82F6";
const BORDER     = "#E5E7EB";

function StatusPill({ status }) {
  const map = {
    Active:  { bg: "#ECFDF5", color: "#065F46" },
    Draft:   { bg: "#F1F5F9", color: "#6B7280" },
    Paused:  { bg: "#FFFBEB", color: "#92400E" },
  };
  const s = map[status] || map["Draft"];
  return (
    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0 }}>
      {status}
    </span>
  );
}

function PortRow({ portId, label, wired }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? EMAIL_BLUE : "#CBD5E1"}`,
        background: wired ? EMAIL_BLUE : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute", right: -4, top: "50%",
          transform: "translateY(-50%)",
          width: 10, height: 10,
          background: "transparent", border: "none",
        }}
      />
    </div>
  );
}

export default function EmailNode({ id, data, selected }) {
  const { brandIcons } = useFlowVariant();
  const useBrandIcon  = !!brandIcons?.email;
  const template      = data?.template ?? null;
  const label         = data?.label ?? "Send Email";
  const outputCfg     = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const wiredPorts    = outputCfg.wiredPorts ?? [];
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius    = analyticsData ? "12px 12px 0 0" : 12;
  const isEmpty       = !template;

  const fromAddress   = EMAIL_FROM_ADDRESSES.find((f) => f.id === (data?.fromId ?? "from_1"));

  const routingMode         = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts = routingMode === "next_step"
    ? EMAIL_DELIVERY_OPTIONS.filter((o) => o.id === "next_step")
    : EMAIL_DELIVERY_OPTIONS.filter((o) => (outputCfg.deliveryOutputs ?? []).includes(o.id));

  const borderColor = isEmpty ? "rgba(59,130,246,0.4)" : EMAIL_BLUE;

  const chips = [
    data?.utm?.enabled     && { label: "UTM" },
    data?.aiBestTime       && { label: "AI Best Time" },
    data?.attachments?.length > 0 && { label: `${data.attachments.length} File${data.attachments.length > 1 ? "s" : ""}` },
    data?.gmailAnnotation?.enabled && { label: "Gmail Annotation" },
  ].filter(Boolean);

  return (
    <div
      data-testid={`rf-email-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: cardRadius,
        boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: EMAIL_BLUE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          {useBrandIcon ? (
            <img src={emailIcon} alt="" width={38} height={38} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={18} color="#fff" />
            </div>
          )}
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Send Email</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            {useBrandIcon ? (
              <img src={emailIcon} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Mail size={11} color="#fff" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template.name}
              </div>
            </div>
            <StatusPill status={template.status} />
          </div>

          {/* Subject line preview */}
          <div style={{ margin: "0 8px 8px", background: "#EFF6FF", borderRadius: 8, padding: "7px 10px" }}>
            <div style={{ fontSize: 9, color: "#93C5FD", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
              Subject
            </div>
            <div style={{ fontSize: 11, color: "#1E40AF", fontWeight: 600, lineHeight: 1.4, wordBreak: "break-word" }}>
              {data?.subject || template.subject || "No subject"}
            </div>
            {(data?.previewText || template.previewText) && (
              <div style={{ fontSize: 10, color: "#60A5FA", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data?.previewText || template.previewText}
              </div>
            )}
          </div>

          {/* From address */}
          {fromAddress && (
            <div style={{ margin: "0 8px 8px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: EMAIL_BLUE }}>{fromAddress.name[0]}</span>
              </div>
              <div style={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600 }}>{fromAddress.name}</span>
                <span style={{ color: "#CBD5E1", margin: "0 4px" }}>·</span>
                {fromAddress.email}
              </div>
            </div>
          )}

          {/* Delivery output ports */}
          {activeDeliveryPorts.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {activeDeliveryPorts.map((opt) => (
                <PortRow key={opt.id} portId={opt.id} label={opt.label} wired={wiredPorts.includes(opt.id)} />
              ))}
            </div>
          )}

          {/* Feature chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px 8px", borderTop: `1px solid ${BORDER}` }}>
              {chips.map((chip, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "#EFF6FF", color: EMAIL_BLUE }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <NodeAnalyticsFooter type="email" analyticsData={analyticsData} />
    </div>
  );
}
