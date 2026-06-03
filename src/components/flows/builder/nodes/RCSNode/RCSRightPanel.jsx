import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, MessagesSquare, Trash2 } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  RCS_NUMBERS,
  RCS_DELIVERY_OUTPUT_OPTIONS,
  MOCK_RCS_TEMPLATES,
  SYSTEM_VARIABLES,
  rcsIsConnectable,
} from "./data/mockData";
import RCSTemplateModal from "./RCSTemplateModal";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

// ── Shared helpers ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: on ? INDIGO : "#E2E8F0",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: 2,
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          transition: "transform 0.2s",
          transform: on ? "translateX(18px)" : "translateX(0)",
        }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Approved:    { bg: "#ECFDF5", color: "#065F46" },
    "In Review": { bg: "#FFFBEB", color: "#92400E" },
    Rejected:    { bg: "#FEF2F2", color: "#991B1B" },
    Draft:       { bg: "#F1F5F9", color: "#6B7280" },
  };
  const s = map[status] || map["Draft"];
  return (
    <span
      style={{
        fontSize: 9,
        padding: "1px 6px",
        borderRadius: 8,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span
      style={{
        fontSize: 9,
        padding: "1px 6px",
        borderRadius: 8,
        fontWeight: 600,
        background: "#EEF2FF",
        color: INDIGO,
      }}
    >
      {type}
    </span>
  );
}

// ── Extract variables from body ────────────────────────────────
function extractVars(body) {
  const seen = new Set();
  return [...(body || "").matchAll(/\{\{([^}]+)\}\}/g)]
    .map((m) => m[1])
    .filter((v) => {
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
}

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, upd }) {
  const [showBrowse, setShowBrowse] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);

  const allTemplates = [...MOCK_RCS_TEMPLATES, ...customTemplates];
  const filtered = allTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleSelectTemplate = (tpl) => {
    // Auto-populate variableMap with empty chains for each var in body
    const vars = extractVars(tpl.body);
    const variableMap = {};
    vars.forEach((v) => { variableMap[v] = [""]; });
    upd({ template: tpl, variableMap });
    setShowBrowse(false);
  };

  const handleModalSave = (tpl) => {
    setCustomTemplates((prev) => {
      const exists = prev.find((t) => t.id === tpl.id);
      if (exists) return prev.map((t) => (t.id === tpl.id ? tpl : t));
      return [...prev, tpl];
    });
    handleSelectTemplate(tpl);
  };

  const vars = extractVars(data.template?.body);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Node Label */}
      <div>
        <SectionLabel>Node Label</SectionLabel>
        <input
          value={data.label || ""}
          onChange={(e) => upd({ label: e.target.value })}
          placeholder="Send RCS"
          style={{
            width: "100%",
            padding: "7px 10px",
            fontSize: 13,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* From Number */}
      <div>
        <SectionLabel>From Number</SectionLabel>
        <select
          value={data.rcsNumberId || "rcs_1"}
          onChange={(e) => upd({ rcsNumberId: e.target.value })}
          style={{
            width: "100%",
            padding: "7px 28px 7px 10px",
            fontSize: 13,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            outline: "none",
            background: "#fff",
            appearance: "none",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          {RCS_NUMBERS.map((n) => (
            <option key={n.id} value={n.id} disabled={n.status === "inactive"}>
              {n.nickname} — {n.number}
              {n.status === "inactive" ? " (Inactive)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Template section */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <SectionLabel>Template</SectionLabel>
          <button
            type="button"
            onClick={() => { setEditingTemplate(null); setShowModal(true); }}
            style={{
              fontSize: 11,
              color: INDIGO,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            + Create New
          </button>
        </div>

        {!data.template ? (
          /* No template state */
          <div
            style={{
              border: `1.5px dashed ${BORDER}`,
              borderRadius: 10,
              padding: "16px 12px",
              textAlign: "center",
              color: MUTED,
              fontSize: 12,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              No template selected. Pick one or create new.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowBrowse((v) => !v)}
                style={{
                  padding: "6px 14px",
                  border: `1px solid ${INDIGO}`,
                  borderRadius: 20,
                  background: "#EEF2FF",
                  color: INDIGO,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Browse Templates
              </button>
              <button
                type="button"
                onClick={() => { setEditingTemplate(null); setShowModal(true); }}
                style={{
                  padding: "6px 14px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 20,
                  background: "#fff",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Create New
              </button>
            </div>
          </div>
        ) : (
          /* Selected template card */
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#0F172A",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.template.name}
                </span>
                <TypeBadge type={data.template.type} />
                <StatusBadge status={data.template.status} />
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => { setEditingTemplate(data.template); setShowModal(true); }}
                  style={{
                    fontSize: 11,
                    color: "#64748B",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrowse((v) => !v)}
                  style={{
                    fontSize: 11,
                    color: INDIGO,
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>
            </div>
            <div style={{ padding: "8px 12px" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {data.template.body?.slice(0, 100)}
                {(data.template.body?.length || 0) > 100 ? "…" : ""}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 6,
                    background: "#F1F5F9",
                    color: "#64748B",
                  }}
                >
                  {data.template.style === "basic" ? "Basic" : "Single"}
                </span>
                {data.template.style === "single" && data.template.mediaType !== "none" && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 6px",
                      borderRadius: 6,
                      background: "#EEF2FF",
                      color: INDIGO,
                    }}
                  >
                    {data.template.mediaType}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Browse templates inline list */}
      {showBrowse && (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${BORDER}`,
              position: "relative",
            }}
          >
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                color: MUTED,
                pointerEvents: "none",
              }}
            />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search templates…"
              style={{
                width: "100%",
                padding: "6px 8px 6px 28px",
                fontSize: 12,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                background: "#F7F8FA",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px 12px", textAlign: "center", color: MUTED, fontSize: 12 }}>
                No templates found
              </div>
            ) : (
              filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    padding: "10px 12px",
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: "pointer",
                    transition: "background 0.13s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1 }}>
                      {tpl.name}
                    </span>
                    <TypeBadge type={tpl.type} />
                    <StatusBadge status={tpl.status} />
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.4 }}>
                    {tpl.body?.slice(0, 70)}{(tpl.body?.length || 0) > 70 ? "…" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#F1F5F9",
                        color: "#64748B",
                      }}
                    >
                      {tpl.style === "basic" ? "Basic" : "Single"}
                    </span>
                    {tpl.style === "single" && tpl.mediaType !== "none" && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: "#EEF2FF",
                          color: INDIGO,
                        }}
                      >
                        {tpl.mediaType}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Variable Mapping */}
      {data.template && vars.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <SectionLabel>Variable Mapping</SectionLabel>
            <span style={{ fontSize: 10, color: MUTED }}>First non-empty value used</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vars.map((v) => {
              const rawVal = (data.variableMap || {})[v];
              const chain = Array.isArray(rawVal) ? rawVal : rawVal ? [rawVal] : [""];

              const updateChain = (newChain) =>
                upd({ variableMap: { ...(data.variableMap || {}), [v]: newChain } });

              return (
                <div
                  key={v}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* Variable token header */}
                  <div
                    style={{
                      padding: "6px 10px",
                      background: "#F8FAFC",
                      borderBottom: `1px solid ${BORDER}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: INDIGO,
                      }}
                    >{`{{${v}}}`}</span>
                    <span style={{ fontSize: 10, color: MUTED }}>OR chain</span>
                  </div>

                  {/* OR entries */}
                  {chain.map((entry, idx) => (
                    <div key={idx}>
                      {idx > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "0 10px",
                          }}
                        >
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#94A3B8",
                              padding: "1px 6px",
                              borderRadius: 10,
                              background: "#F1F5F9",
                              letterSpacing: 1,
                            }}
                          >
                            OR
                          </span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        <select
                          value={entry || ""}
                          onChange={(e) => {
                            const c = [...chain];
                            c[idx] = e.target.value;
                            updateChain(c);
                          }}
                          style={{
                            flex: 1,
                            padding: "7px 8px",
                            fontSize: 12,
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            cursor: "pointer",
                            minWidth: 0,
                          }}
                        >
                          <option value="">Select attribute…</option>
                          {SYSTEM_VARIABLES.map((sv) => (
                            <option key={sv} value={sv}>{sv}</option>
                          ))}
                        </select>
                        {chain.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateChain(chain.filter((_, j) => j !== idx))}
                            style={{
                              flexShrink: 0,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: MUTED,
                              padding: "4px 8px",
                              fontSize: 13,
                              lineHeight: 1,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add fallback */}
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button
                      type="button"
                      onClick={() => updateChain([...chain, ""])}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        color: INDIGO,
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FF")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      + Add fallback
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RCSTemplateModal */}
      {showModal && (
        <RCSTemplateModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingTemplate(null); }}
          onSave={handleModalSave}
          initialTemplate={editingTemplate}
        />
      )}
    </div>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
const BRANCH_OPTIONS = RCS_DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id !== "next_step");

function DeliveryTab({ data, upd }) {
  const outputCfg = data?.outputConfig ?? {
    routingMode: "next_step",
    deliveryOutputs: [],
    noResponseValue: 5,
    noResponseUnit: "hours",
    wiredPorts: [],
  };
  const smartRetry = data?.smartRetry ?? {};
  const aiBestTime = data?.aiBestTime ?? false;

  const radioStyle = (active) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 14px",
    border: `1.5px solid ${active ? INDIGO : BORDER}`,
    borderRadius: 10,
    cursor: "pointer",
    background: active ? "#EEF2FF" : "#fff",
    transition: "all 0.15s",
  });

  const routingMode = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];

  const setMode = (mode) => {
    upd({
      outputConfig: {
        ...outputCfg,
        routingMode: mode,
        deliveryOutputs:
          mode === "next_step" ? [] : selectedBranches.length ? selectedBranches : ["delivered"],
      },
    });
  };

  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id)
      ? selectedBranches.filter((x) => x !== id)
      : [...selectedBranches, id];
    upd({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Routing Mode */}
      <div>
        <SectionLabel>Routing Mode</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div
              style={{
                marginTop: 2,
                width: 15,
                height: 15,
                borderRadius: "50%",
                border: `2px solid ${routingMode === "next_step" ? INDIGO : BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {routingMode === "next_step" && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: INDIGO,
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Single output port — all users continue to the same next node.
              </div>
            </div>
          </div>

          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div
              style={{
                marginTop: 2,
                width: 15,
                height: 15,
                borderRadius: "50%",
                border: `2px solid ${routingMode === "branches" ? INDIGO : BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {routingMode === "branches" && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: INDIGO,
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                Delivery Branches
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Separate output port per delivery status — route users based on whether the message was sent, read, failed, etc.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch checkboxes */}
      {routingMode === "branches" && (
        <div>
          <SectionLabel>Select Branch Statuses</SectionLabel>
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                    background: selected ? "#EEF2FF" : "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onClick={() => toggleBranch(opt.id)}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selected}
                    style={{ accentColor: INDIGO, width: 14, height: 14, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  {opt.hasTimeConfig && selected && (
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        min={1}
                        value={outputCfg.noResponseValue ?? 5}
                        onChange={(e) =>
                          upd({
                            outputConfig: {
                              ...outputCfg,
                              noResponseValue: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        style={{
                          width: 44,
                          padding: "3px 6px",
                          fontSize: 12,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 6,
                          outline: "none",
                        }}
                      />
                      <select
                        value={outputCfg.noResponseUnit ?? "hours"}
                        onChange={(e) =>
                          upd({
                            outputConfig: { ...outputCfg, noResponseUnit: e.target.value },
                          })
                        }
                        style={{
                          padding: "3px 6px",
                          fontSize: 12,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 6,
                          background: "#fff",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>
              Select at least one status to create output ports.
            </p>
          )}
        </div>
      )}

      {/* Smart Retry */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Smart Retry</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
              Automatically retry failed deliveries
            </div>
          </div>
          <Toggle
            on={!!smartRetry.enabled}
            onChange={(v) => upd({ smartRetry: { ...smartRetry, enabled: v } })}
          />
        </div>
      </div>

      {/* AI Best Time */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px",
          background: "#F8FAFC",
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
        }}
      >
        <Toggle on={!!aiBestTime} onChange={(v) => upd({ aiBestTime: v })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>
            AI Best Sent Time
          </div>
          <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            Sends at each user's optimal engagement window. Usually within 0–4 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Output Tab ──────────────────────────────────────────────────
function OutputTab({ data, upd }) {
  const template = data?.template;
  const outputCfg = data?.outputConfig ?? {
    routingMode: "next_step",
    deliveryOutputs: [],
    noResponseValue: 5,
    noResponseUnit: "hours",
    wiredPorts: [],
  };
  const routingMode = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];
  const connectableBtns = (template?.buttons ?? []).filter(rcsIsConnectable);

  const deliveryPortCount =
    routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);
  const totalPorts = deliveryPortCount + connectableBtns.length;

  const activeDeliveryPorts =
    routingMode === "next_step"
      ? RCS_DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id === "next_step")
      : RCS_DELIVERY_OUTPUT_OPTIONS.filter((o) => selectedBranches.includes(o.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Active output ports based on your routing mode and template buttons.
      </p>

      {/* Delivery ports */}
      {activeDeliveryPorts.length > 0 && (
        <div>
          <SectionLabel>Delivery Output Ports</SectionLabel>
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {activeDeliveryPorts.map((opt, i) => (
              <div
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom:
                    i < activeDeliveryPorts.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: "#EEF2FF",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: INDIGO,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Button ports */}
      {connectableBtns.length > 0 && (
        <div>
          <SectionLabel>Response Outputs (from buttons)</SectionLabel>
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {connectableBtns.map((btn, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: i < connectableBtns.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: "#EEF2FF",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: INDIGO,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{btn.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 7px",
                    borderRadius: 8,
                    fontWeight: 500,
                    background: btn.type === "quick_reply" ? "#EFF6FF" : "#F3E8FF",
                    color: btn.type === "quick_reply" ? "#2563EB" : "#7C3AED",
                  }}
                >
                  {btn.type === "quick_reply" ? "Quick Reply" : "URL"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!template && (
        <div style={{ textAlign: "center", color: MUTED, padding: "20px 0", fontSize: 12 }}>
          Select a template first to see response output ports
        </div>
      )}

      {/* Port count summary */}
      <div
        style={{
          background: "#F8FAFC",
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{totalPorts}</span>
      </div>

      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, margin: 0 }}>
        Connect a port by dragging from the dot on the canvas node to the target node.
      </p>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────
export default function RCSRightPanel() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const removeNode = useFlowBuilderStore((s) => s.removeNode);

  const node = nodes?.find((n) => n.id === selectedNodeId);
  const data = node?.data || {};
  const upd = (patch) => updateNodeData(selectedNodeId, patch);

  if (!node) return null;

  return (
    <Tabs defaultValue="template" className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: "10px 16px 0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessagesSquare size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.label || "Send RCS"}
            </div>
            <div style={{ fontSize: 10, color: MUTED }}>Configure RCS message</div>
          </div>
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            style={{
              fontSize: 11,
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Delete
          </button>
        </div>

        <TabsList className="w-full bg-transparent border-0 p-0 h-auto gap-0">
          {[
            { value: "template", label: "Template" },
            { value: "delivery", label: "Delivery" },
            { value: "output", label: "Output" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-semibold pb-2 text-slate-500"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Template */}
      <TabsContent value="template" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <TemplateTab data={data} upd={upd} />
        </div>
      </TabsContent>

      {/* Delivery */}
      <TabsContent value="delivery" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <DeliveryTab data={data} upd={upd} />
        </div>
      </TabsContent>

      {/* Output */}
      <TabsContent value="output" className="flex-1 min-h-0 relative m-0">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          <OutputTab data={data} upd={upd} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
