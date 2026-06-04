import React, { useState, useMemo } from "react";
import { Search, Eye, AlertTriangle, LogIn, X, ExternalLink } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  MOCK_FLOWS,
  FLOW_STATUSES,
  CHANNEL_ICONS,
  flowNeedsWarning,
} from "./data/mockData";
import FlowPreviewModal from "./FlowPreviewModal";

const ROSE   = "#F43F5E";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />;
}

export default function StartFlowRightPanel() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewFlow,  setPreviewFlow]  = useState(null);

  // All hooks must be called before any early return
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_FLOWS.filter((f) => {
      const matchesSearch =
        !q || f.name.toLowerCase().includes(q) || f.trigger.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const linkedFlow = MOCK_FLOWS.find((f) => f.id === data.linkedFlowId) ?? null;

  if (!node) return (
    <div style={{ padding: 24, color: MUTED, fontSize: 13, textAlign: "center" }}>
      No node selected
    </div>
  );

  function patch(updates) {
    updateNodeData(selectedNodeId, updates);
  }

  function clearFlow() {
    patch({ linkedFlowId: null, linkedFlowName: null, linkedFlowStatus: null });
  }

  function selectFlow(flow) {
    patch({
      linkedFlowId:     flow.id,
      linkedFlowName:   flow.name,
      linkedFlowStatus: flow.status,
    });
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          background: "linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogIn size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Start Flow</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
              Chain this flow into another
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {/* Node label */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Node Label
            </div>
            <input
              type="text"
              value={data.label ?? "Start Flow"}
              onChange={(e) => patch({ label: e.target.value })}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <Divider />

          {/* ── Currently linked flow ── */}
          {linkedFlow ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Linked Flow
              </div>
              <LinkedFlowCard
                flow={linkedFlow}
                onClear={clearFlow}
                onPreview={() => setPreviewFlow(linkedFlow)}
              />
              {flowNeedsWarning(linkedFlow.status) && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 7,
                  marginTop: 8, padding: "8px 10px",
                  background: "#FFFBEB", borderRadius: 8,
                  border: "1px solid #FDE68A",
                }}>
                  <AlertTriangle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                    This flow is <strong>{linkedFlow.status}</strong>. Users may not enter it until
                    it's activated.
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => patch({ linkedFlowId: null, linkedFlowName: null, linkedFlowStatus: null })}
                style={{
                  marginTop: 8, width: "100%",
                  padding: "6px", fontSize: 12, fontWeight: 500,
                  color: ROSE, background: "#FFF1F2",
                  border: `1px solid #FECDD3`, borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Change flow
              </button>
            </div>
          ) : (
            <div style={{
              marginBottom: 14, padding: "10px 12px",
              background: "#FFF1F2", borderRadius: 8,
              border: "1px dashed #FECDD3",
              fontSize: 12, color: "#FB7185", textAlign: "center",
            }}>
              No flow linked yet. Select one below.
            </div>
          )}

          <Divider />

          {/* ── Flow selector ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Select a Flow
            </div>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", border: `1px solid ${BORDER}`,
              borderRadius: 8, marginBottom: 10, background: "#fff",
            }}>
              <Search size={13} color={MUTED} style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flows…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={12} color={MUTED} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {FLOW_STATUSES.map((s) => {
                const active = statusFilter === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    style={{
                      padding: "3px 10px", fontSize: 11, fontWeight: 600,
                      borderRadius: 20, cursor: "pointer", border: "1px solid",
                      borderColor: active ? (s.border ?? ROSE) : BORDER,
                      background: active ? (s.bg ?? "#FFF1F2") : "#fff",
                      color: active ? (s.fg ?? ROSE) : "#64748B",
                      transition: "all 0.12s",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Flow list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: MUTED, fontSize: 12 }}>
                  No flows match your search
                </div>
              ) : (
                filtered.map((flow) => (
                  <FlowRow
                    key={flow.id}
                    flow={flow}
                    selected={data.linkedFlowId === flow.id}
                    onSelect={() => selectFlow(flow)}
                    onPreview={() => setPreviewFlow(flow)}
                  />
                ))
              )}
            </div>

            <div style={{
              marginTop: 12, padding: "8px 10px",
              background: "#F8FAFC", borderRadius: 8,
              fontSize: 11, color: MUTED, textAlign: "center",
            }}>
              Only 1 flow can be linked
            </div>
          </div>
        </div>
      </div>

      {/* Wide preview modal */}
      {previewFlow && (
        <FlowPreviewModal
          flow={previewFlow}
          onClose={() => setPreviewFlow(null)}
        />
      )}
    </>
  );
}

// ── Linked flow card (shown when a flow is already selected) ──────
function LinkedFlowCard({ flow, onClear, onPreview }) {
  const statusMeta = FLOW_STATUSES.find((s) => s.id === flow.status);
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      border: `1px solid ${statusMeta?.border ?? BORDER}`,
      background: statusMeta?.bg ?? "#fff",
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#1E293B",
          marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {flow.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {statusMeta && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "1px 7px", borderRadius: 20,
              color: statusMeta.fg, background: "#fff",
              border: `1px solid ${statusMeta.border}`,
            }}>
              {statusMeta.label}
            </span>
          )}
          <ChannelIcons channels={flow.channels} />
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{flow.trigger}</div>
      </div>
      <button
        type="button"
        onClick={onPreview}
        title="Preview flow"
        style={{
          flexShrink: 0, padding: "5px 6px", borderRadius: 6,
          background: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}`,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#475569",
        }}
      >
        <Eye size={12} />
        Preview
      </button>
    </div>
  );
}

// ── Single flow row in the list ───────────────────────────────────
function FlowRow({ flow, selected, onSelect, onPreview }) {
  const statusMeta = FLOW_STATUSES.find((s) => s.id === flow.status);
  const warn = flowNeedsWarning(flow.status);

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        border: `1.5px solid ${selected ? ROSE : BORDER}`,
        background: selected ? "#FFF1F2" : "#fff",
        transition: "all 0.12s",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}
    >
      {/* Selection indicator */}
      <div style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? ROSE : "#CBD5E1"}`,
        background: selected ? ROSE : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: "#1E293B",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1, minWidth: 0,
          }}>
            {flow.name}
          </span>
          {statusMeta && (
            <span style={{
              fontSize: 10, fontWeight: 600, flexShrink: 0,
              padding: "1px 6px", borderRadius: 20,
              color: statusMeta.fg, background: statusMeta.bg,
              border: `1px solid ${statusMeta.border}`,
            }}>
              {statusMeta.label}
            </span>
          )}
        </div>

        {/* Channel icons + trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <ChannelIcons channels={flow.channels} />
          <span style={{ fontSize: 10, color: MUTED }}>{flow.trigger}</span>
        </div>

        {/* Last updated + warning */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>Updated {flow.updatedAt}</span>
          {warn && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#D97706" }}>
              <AlertTriangle size={9} />
              {flow.status}
            </span>
          )}
        </div>
      </div>

      {/* Preview button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        title="Preview flow"
        style={{
          flexShrink: 0, padding: "4px 5px", borderRadius: 6,
          background: "none", border: `1px solid ${BORDER}`,
          cursor: "pointer", display: "flex", alignItems: "center",
          color: MUTED,
        }}
      >
        <Eye size={12} />
      </button>
    </div>
  );
}

// ── Channel icon strip ────────────────────────────────────────────
function ChannelIcons({ channels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {(channels || []).map((ch) => {
        const meta = CHANNEL_ICONS[ch];
        if (!meta) return null;
        const { Icon, color } = meta;
        return (
          <div
            key={ch}
            title={ch}
            style={{
              width: 18, height: 18, borderRadius: 4,
              background: `${color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon size={10} color={color} />
          </div>
        );
      })}
    </div>
  );
}
