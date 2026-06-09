import React, { useState } from "react";
import { BrainCog, GripVertical, X } from "lucide-react";
import {
  NBA_GREEN, NBA_CHANNEL_OPTIONS, NBA_AI_MODELS, NBA_GOALS,
  defaultNBANodeData,
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

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? NBA_GREEN : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

// ── Channel picker with drag-to-reorder ───────────────────────
function ChannelList({ channels, onChange }) {
  const [dragIndex, setDragIndex] = useState(null);

  const addChannel = (id) => {
    if (!channels.includes(id)) onChange([...channels, id]);
  };

  const removeChannel = (id) => {
    if (channels.length === 1) return;
    onChange(channels.filter((c) => c !== id));
  };

  const onDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e, targetIdx) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIdx) return;
    const reordered = [...channels];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
    setDragIndex(null);
  };

  const available = NBA_CHANNEL_OPTIONS.filter((c) => !channels.includes(c.id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Label>Channels (priority order)</Label>
      </div>

      {/* Ordered list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {channels.map((chId, idx) => {
          const ch = NBA_CHANNEL_OPTIONS.find((c) => c.id === chId);
          if (!ch) return null;
          return (
            <div
              key={chId}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, idx)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff",
                cursor: "grab",
              }}
            >
              <GripVertical size={13} style={{ color: MUTED, flexShrink: 0 }} />
              <span style={{ fontSize: 14 }}>{ch.emoji}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{ch.label}</span>
              <span style={{ fontSize: 9, color: MUTED, fontWeight: 500 }}>#{idx + 1}</span>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />
              <button
                onClick={() => removeChannel(chId)}
                style={{ background: "none", border: "none", cursor: channels.length > 1 ? "pointer" : "not-allowed", color: channels.length > 1 ? "#EF4444" : "#CBD5E1", padding: 0, lineHeight: 1 }}
              ><X size={12} /></button>
            </div>
          );
        })}
      </div>

      {/* Add channel */}
      {available.length > 0 && (
        <div>
          <Label>Add channel</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {available.map((ch) => (
              <button key={ch.id} onClick={() => addChannel(ch.id)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                border: `1.5px dashed ${BORDER}`, borderRadius: 8,
                background: "transparent", cursor: "pointer", fontSize: 11, color: "#64748B",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ch.color; e.currentTarget.style.color = ch.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#64748B"; }}>
                <span>{ch.emoji}</span> {ch.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────
export default function NextBestActionRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? defaultNBANodeData;
  const patch = (p) => updateNodeData(node.id, p);

  const { channels = [], model = "best_channel", goal = "engagement", fallback = true } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: NBA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BrainCog size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={data.label ?? "Next Best Action"}
              onChange={(e) => patch({ label: e.target.value })}
              style={{ width: "100%", fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", outline: "none", background: "transparent", padding: 0 }}
            />
            <div style={{ fontSize: 10, color: MUTED }}>AI-powered channel selection</div>
          </div>
          <button onClick={() => removeNode(node.id)} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Delete</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* How it works banner */}
        <div style={{ padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#065F46", marginBottom: 3 }}>How it works</div>
          <p style={{ fontSize: 11, color: "#166534", margin: 0, lineHeight: 1.55 }}>
            AI analyses each user's engagement history and picks the channel they are most likely to respond to. Users exit through the port of the selected channel.
          </p>
        </div>

        {/* AI Model */}
        <div>
          <Label>AI Model</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {NBA_AI_MODELS.map((m) => {
              const active = model === m.id;
              return (
                <div key={m.id} onClick={() => patch({ model: m.id })} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  border: `1.5px solid ${active ? NBA_GREEN : BORDER}`, borderRadius: 8, cursor: "pointer",
                  background: active ? "#F0FDF4" : "#fff",
                }}>
                  <div style={{ marginTop: 2, width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? NBA_GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: NBA_GREEN }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
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
            {NBA_GOALS.map((g) => {
              const active = goal === g.id;
              return (
                <button key={g.id} onClick={() => patch({ goal: g.id })} style={{
                  flex: 1, padding: "7px 6px", border: `1.5px solid ${active ? NBA_GREEN : BORDER}`,
                  borderRadius: 8, background: active ? "#F0FDF4" : "#fff",
                  color: active ? "#065F46" : "#64748B", fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer",
                }}>{g.label}</button>
              );
            })}
          </div>
        </div>

        {/* Channel list */}
        <ChannelList channels={channels} onChange={(c) => patch({ channels: c })} />

        {/* Fallback behaviour */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <Toggle on={fallback} onChange={(v) => patch({ fallback: v })} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>Enable fallback</div>
            <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
              If the AI's top choice fails to deliver, automatically try the next channel in priority order.
            </p>
          </div>
        </div>

        {/* Port summary */}
        <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{channels.length}</span>
        </div>
      </div>
    </div>
  );
}
