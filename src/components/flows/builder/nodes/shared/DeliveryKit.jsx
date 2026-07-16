import React from "react";

const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

// ── Group — kicker label + one bordered card holding multiple Rows, replacing a stack of per-setting Sections ──
export function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        {children}
      </div>
    </div>
  );
}

// ── Row — one setting inside a Group; padded, divided from the next row (omit divider via `last`) ──
export function Row({ children, last = false }) {
  return (
    <div style={{ padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, accentColor }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? accentColor : "#E2E8F0",
        cursor: "pointer", display: "flex", alignItems: "center",
        padding: 2, flexShrink: 0, transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s",
        transform: on ? "translateX(18px)" : "translateX(0)",
      }} />
    </div>
  );
}

const UTM_ROWS = [
  { key: "utm_source", label: "Source" },
  { key: "utm_medium", label: "Medium" },
  { key: "utm_campaign", label: "Campaign" },
  { key: "utm_term", label: "Term" },
  { key: "utm_content", label: "Content" },
];

// ── UTMFields — enable toggle + shared 5-row key-cell/input table, identical across every channel ──
export function UTMFields({ utm = {}, onChange, accentColor, defaults = {} }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: utm.enabled ? 12 : 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>UTM Parameters</div>
          <div style={{ fontSize: 11, color: MUTED }}>Auto-append UTM to all links</div>
        </div>
        <Toggle on={!!utm.enabled} onChange={(v) => onChange({ ...utm, enabled: v })} accentColor={accentColor} />
      </div>
      {utm.enabled && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {UTM_ROWS.map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>
                {label}
              </span>
              <input
                value={utm[key] || ""}
                placeholder={defaults[key] || ""}
                onChange={(e) => onChange({ ...utm, [key]: e.target.value })}
                style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RetryFields — enable toggle + Smart/Manual selector + (when Manual) retry count & interval config ──
export function RetryFields({ smartRetry = {}, onChange, accentColor }) {
  const mode = smartRetry.mode ?? "smart";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: smartRetry.enabled ? 10 : 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Smart Retry</div>
          <div style={{ fontSize: 11, color: MUTED }}>Automatically retry failed deliveries</div>
        </div>
        <Toggle on={!!smartRetry.enabled} onChange={(v) => onChange({ ...smartRetry, enabled: v })} accentColor={accentColor} />
      </div>

      {smartRetry.enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[["smart", "Smart Retry (Recommended)"], ["manual", "Manual Retry"]].map(([m, label]) => (
              <button key={m} type="button" onClick={() => onChange({ ...smartRetry, mode: m })} style={{
                flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                border: `2px solid ${mode === m ? accentColor : BORDER}`,
                background: mode === m ? `${accentColor}14` : "#fff",
                color: mode === m ? accentColor : "#64748B",
              }}>{label}</button>
            ))}
          </div>

          {mode === "manual" && (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  Number of retries
                </div>
                <input
                  type="number" min={1} max={5}
                  value={smartRetry.retryCount ?? 1}
                  onChange={(e) => onChange({ ...smartRetry, retryCount: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  Retry interval
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="number" min={1}
                    value={smartRetry.retryInterval ?? 15}
                    onChange={(e) => onChange({ ...smartRetry, retryInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ flex: 1, minWidth: 0, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                  />
                  <select
                    value={smartRetry.retryIntervalUnit ?? "minutes"}
                    onChange={(e) => onChange({ ...smartRetry, retryIntervalUnit: e.target.value })}
                    style={{ padding: "7px 8px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", outline: "none", cursor: "pointer" }}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
