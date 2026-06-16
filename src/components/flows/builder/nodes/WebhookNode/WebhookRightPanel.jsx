import React, { useState } from "react";
import { Webhook, Trash2, ChevronRight, Play, X } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  WEBHOOK_METHODS,
  WEBHOOK_AUTH_TYPES,
  WEBHOOK_RETRY_STRATEGIES,
  WEBHOOK_INITIAL_DELAYS,
  WEBHOOK_OUTPUT_PORTS,
  SYSTEM_VARIABLES,
  defaultWebhookNodeData,
} from "./data/mockData";

const BLUE  = "#3B82F6";
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
    <div
      onClick={() => onChange(!on)}
      style={{ width: 40, height: 22, borderRadius: 11, background: on ? BLUE : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

function SectionButton({ label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: "100%", padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.1s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
    >
      <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {count > 0 && (
          <span style={{ fontSize: 10, background: "#EFF6FF", color: BLUE, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>
            {count}
          </span>
        )}
        <ChevronRight size={13} color={MUTED} />
      </div>
    </button>
  );
}

function VariableSelect({ value, onChange, placeholder = "Variable comes here" }) {
  const [open, setOpen] = useState(false);
  const groups = Object.entries(SYSTEM_VARIABLES);
  const allVars = groups.flatMap(([, vars]) => vars);
  const displayVal = value ? (allVars.find((v) => `{{${v.key}}}` === value)?.label ?? value) : "";

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        readOnly
        value={displayVal}
        placeholder={placeholder}
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer", boxSizing: "border-box", background: value ? "#EFF6FF" : "#fff", color: value ? BLUE : "#94A3B8" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto" }}>
          <div
            onClick={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 12px", fontSize: 11, color: "#EF4444", cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Clear
          </div>
          {groups.map(([group, vars]) => (
            <div key={group}>
              <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", background: "#F8FAFC" }}>
                {group}
              </div>
              {vars.map((v) => (
                <div
                  key={v.key}
                  onClick={() => { onChange(`{{${v.key}}}`); setOpen(false); }}
                  style={{ padding: "7px 12px", fontSize: 11, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ color: "#0F172A" }}>{v.label}</span>
                  <span style={{ color: MUTED, fontSize: 9 }}>{v.example}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KVRow({ keyVal, value, onKeyChange, onValueChange, onRemove, valueIsVariable = false }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
      <input
        type="text"
        value={keyVal}
        onChange={(e) => onKeyChange(e.target.value)}
        placeholder="Key Name"
        style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
      />
      {valueIsVariable ? (
        <VariableSelect value={value} onChange={onValueChange} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Value"
          style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4, display: "flex", alignItems: "center" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function URLParamsPanel({ params, onChange, onClose }) {
  const add    = () => onChange([...params, { key: "", value: "" }]);
  const remove = (i) => onChange(params.filter((_, j) => j !== i));
  const patch  = (i, field, val) => { const next = [...params]; next[i] = { ...next[i], [field]: val }; onChange(next); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>URL Parameters</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Parameters appended to your destination URL.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {params.map((p, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Parameter {i + 1}</div>
            <KVRow keyVal={p.key} value={p.value} onKeyChange={(v) => patch(i, "key", v)} onValueChange={(v) => patch(i, "value", v)} onRemove={() => remove(i)} valueIsVariable />
          </div>
        ))}
        <button type="button" onClick={add} style={{ padding: "9px 14px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add Parameters
        </button>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

function HeadersPanel({ headers, onChange, onClose }) {
  const add    = () => onChange([...headers, { key: "", value: "" }]);
  const remove = (i) => onChange(headers.filter((_, j) => j !== i));
  const patch  = (i, field, val) => { const next = [...headers]; next[i] = { ...next[i], [field]: val }; onChange(next); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Custom Headers</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>HTTP headers sent with your webhook request.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {headers.map((h, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Header {i + 1}</div>
            <KVRow keyVal={h.key} value={h.value} onKeyChange={(v) => patch(i, "key", v)} onValueChange={(v) => patch(i, "value", v)} onRemove={() => remove(i)} valueIsVariable={false} />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          style={{ padding: "8px 14px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}
        >
          + Add Header
        </button>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

function PayloadPanel({ payload, onChange, onClose }) {
  const { mode, form, raw } = payload;
  const setMode  = (m) => onChange({ ...payload, mode: m });
  const addRow   = () => onChange({ ...payload, form: [...form, { key: "", value: "" }] });
  const removeRow = (i) => onChange({ ...payload, form: form.filter((_, j) => j !== i) });
  const patchRow = (i, field, val) => { const next = [...form]; next[i] = { ...next[i], [field]: val }; onChange({ ...payload, form: next }); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Request Payload</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>JSON body payload sent with your webhook request.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", gap: 8 }}>
        {["form", "raw"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: mode === m ? BLUE : "#F1F5F9", color: mode === m ? "#fff" : "#475569", border: "none" }}
          >
            {m === "form" ? "Form" : "Raw JSON"}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {mode === "form" ? (
          <>
            {form.map((row, i) => (
              <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Payload {i + 1}</div>
                <KVRow keyVal={row.key} value={row.value} onKeyChange={(v) => patchRow(i, "key", v)} onValueChange={(v) => patchRow(i, "value", v)} onRemove={() => removeRow(i)} valueIsVariable />
              </div>
            ))}
            <button type="button" onClick={addRow} style={{ padding: "9px 14px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add Payload
            </button>
          </>
        ) : (
          <textarea
            value={raw}
            onChange={(e) => onChange({ ...payload, raw: e.target.value })}
            placeholder={'{\n  "userId": "{{customer.id}}",\n  "event": "cart_abandoned"\n}'}
            rows={12}
            style={{ width: "100%", padding: 10, fontSize: 12, fontFamily: "monospace", border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5 }}
          />
        )}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

const MOCK_TEST_RESPONSE = {
  status: 200,
  latency: 142,
  body: JSON.stringify({ success: true, message: "Webhook received", userId: "CUST_4821" }, null, 2),
};

export default function WebhookRightPanel({ node, updateNodeData, removeNode }) {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const [panel,       setPanel]       = useState(null); // null | "params" | "headers" | "payload"
  const [testVisible, setTestVisible] = useState(false);
  const [testResult,  setTestResult]  = useState(null); // null | "loading" | object

  if (!node) return null;

  const data = { ...defaultWebhookNodeData, ...node.data };
  const patch = (p) => updateNodeData(selectedNodeId, p);

  const method     = data.method  ?? "POST";
  const url        = data.url     ?? "";
  const auth       = data.auth    ?? defaultWebhookNodeData.auth;
  const params     = data.params  ?? [];
  const headers    = data.headers ?? [];
  const payload    = data.payload ?? defaultWebhookNodeData.payload;
  const retry      = data.retry   ?? defaultWebhookNodeData.retry;
  const wiredPorts = data.outputConfig?.wiredPorts ?? [];

  const togglePort = (portId) => {
    const next = wiredPorts.includes(portId)
      ? wiredPorts.filter((p) => p !== portId)
      : [...wiredPorts, portId];
    patch({ outputConfig: { ...data.outputConfig, wiredPorts: next } });
  };

  const sendTest = () => {
    setTestVisible(true);
    setTestResult("loading");
    setTimeout(() => setTestResult(MOCK_TEST_RESPONSE), 1200);
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sub-panel overlays */}
      {panel === "params"  && <URLParamsPanel params={params}  onChange={(v) => patch({ params: v })}   onClose={() => setPanel(null)} />}
      {panel === "headers" && <HeadersPanel  headers={headers} onChange={(v) => patch({ headers: v })}  onClose={() => setPanel(null)} />}
      {panel === "payload" && <PayloadPanel  payload={payload} onChange={(v) => patch({ payload: v })} onClose={() => setPanel(null)} />}

      {/* Header bar */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Webhook size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", flex: 1 }}>Webhook</span>
        <button
          type="button"
          onClick={() => removeNode(node.id)}
          title="Delete node"
          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Node label */}
        <div>
          <Label>Node Label</Label>
          <input
            type="text"
            value={data.label ?? "Webhook"}
            onChange={(e) => patch({ label: e.target.value })}
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Method + URL */}
        <div>
          <Label>Request</Label>
          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={method}
              onChange={(e) => patch({ method: e.target.value })}
              style={{ width: 84, padding: "7px 8px", fontSize: 12, fontWeight: 700, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#F8FAFC", color: BLUE, cursor: "pointer" }}
            >
              {WEBHOOK_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://api.example.com/webhook"
              style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* URL Parameters */}
        <div>
          <Label>URL Parameters</Label>
          <SectionButton label="URL Parameters" count={params.length} onClick={() => setPanel("params")} />
        </div>

        {/* Custom Headers */}
        <div>
          <Label>Custom Headers</Label>
          <SectionButton label="Custom Headers" count={headers.length} onClick={() => setPanel("headers")} />
        </div>

        {/* Authentication */}
        <div>
          <Label>Authentication</Label>
          <select
            value={auth.type}
            onChange={(e) => patch({ auth: { ...auth, type: e.target.value } })}
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer", marginBottom: auth.type !== "none" ? 10 : 0, boxSizing: "border-box" }}
          >
            {WEBHOOK_AUTH_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>

          {auth.type === "api_key" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={auth.apiKeyName}
                  onChange={(e) => patch({ auth: { ...auth, apiKeyName: e.target.value } })}
                  placeholder="Key name (e.g. X-Api-Key)"
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
                />
                <select
                  value={auth.apiKeyIn}
                  onChange={(e) => patch({ auth: { ...auth, apiKeyIn: e.target.value } })}
                  style={{ width: 80, padding: "7px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                >
                  <option value="header">Header</option>
                  <option value="query">Query</option>
                </select>
              </div>
              <input
                type="password"
                value={auth.apiKeyValue}
                onChange={(e) => patch({ auth: { ...auth, apiKeyValue: e.target.value } })}
                placeholder="Key value"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          {auth.type === "bearer" && (
            <input
              type="password"
              value={auth.bearerToken}
              onChange={(e) => patch({ auth: { ...auth, bearerToken: e.target.value } })}
              placeholder="Bearer token"
              style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          )}

          {auth.type === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                value={auth.basicUser}
                onChange={(e) => patch({ auth: { ...auth, basicUser: e.target.value } })}
                placeholder="Username"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
              <input
                type="password"
                value={auth.basicPass}
                onChange={(e) => patch({ auth: { ...auth, basicPass: e.target.value } })}
                placeholder="Password"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>

        {/* Request Payload — hidden for GET */}
        {method !== "GET" && (
          <div>
            <Label>Request Payload</Label>
            <SectionButton
              label="Request Payload"
              count={payload.mode === "form" ? payload.form.length : (payload.raw ? 1 : 0)}
              onClick={() => setPanel("payload")}
            />
          </div>
        )}

        {/* Retry */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: retry.enabled ? 12 : 0 }}>
            <Label>Retry on Failure</Label>
            <Toggle on={retry.enabled} onChange={(v) => patch({ retry: { ...retry, enabled: v } })} />
          </div>
          {retry.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Max Retries</div>
                  <select
                    value={retry.max}
                    onChange={(e) => patch({ retry: { ...retry, max: Number(e.target.value) } })}
                    style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Strategy</div>
                  <select
                    value={retry.strategy}
                    onChange={(e) => patch({ retry: { ...retry, strategy: e.target.value } })}
                    style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                  >
                    {WEBHOOK_RETRY_STRATEGIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Initial Delay</div>
                <select
                  value={retry.initialDelay}
                  onChange={(e) => patch({ retry: { ...retry, initialDelay: Number(e.target.value) } })}
                  style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                >
                  {WEBHOOK_INITIAL_DELAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Timeout */}
        <div>
          <Label>Timeout</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              value={data.timeout_ms ?? 10000}
              onChange={(e) => patch({ timeout_ms: Number(e.target.value) || 10000 })}
              min={1000}
              max={60000}
              step={1000}
              style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
            />
            <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>ms</span>
          </div>
        </div>

        {/* Output Branches */}
        <div>
          <Label>Output Branches</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEBHOOK_OUTPUT_PORTS.map((port) => (
              <div
                key={port.id}
                onClick={() => togglePort(port.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${wiredPorts.includes(port.id) ? port.color : BORDER}`,
                  background: wiredPorts.includes(port.id) ? `${port.color}15` : "#F8FAFC",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: wiredPorts.includes(port.id) ? port.color : "#475569" }}>
                  {port.label}
                </span>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${wiredPorts.includes(port.id) ? port.color : "#CBD5E1"}`, background: wiredPorts.includes(port.id) ? port.color : "transparent" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Test Mode */}
        <div>
          <Label>Test Mode</Label>
          <button
            type="button"
            onClick={sendTest}
            disabled={!url}
            style={{ width: "100%", padding: "9px", border: `1px solid ${url ? BLUE : BORDER}`, borderRadius: 8, background: url ? "#EFF6FF" : "#F8FAFC", color: url ? BLUE : MUTED, fontSize: 12, fontWeight: 600, cursor: url ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Play size={13} />
            Send Test
          </button>

          {testVisible && (
            <div style={{ marginTop: 10, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>Response</span>
                <button type="button" onClick={() => { setTestVisible(false); setTestResult(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                  <X size={13} />
                </button>
              </div>
              {testResult === "loading" ? (
                <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: MUTED }}>Sending request…</div>
              ) : testResult ? (
                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#ECFDF5", color: "#065F46", fontWeight: 700 }}>{testResult.status} OK</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{testResult.latency}ms</span>
                  </div>
                  <pre style={{ fontSize: 10, background: "#F8FAFC", padding: 10, borderRadius: 6, overflowX: "auto", margin: 0, color: "#1E293B", lineHeight: 1.5 }}>
                    {testResult.body}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
