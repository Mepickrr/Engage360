import React, { useState, useRef, useEffect } from "react";
import { Table, CheckCircle2, Loader2 } from "lucide-react";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_DUMMY_COLUMNS, defaultGoogleSheetNodeData,
} from "./data/mockData";
import { getGoogleSheetPanelSummary } from "./data/summary";
import GoogleSheetConfigModal from "./GoogleSheetConfigModal";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const GREEN  = "#16A34A";

const ACTION_KEY = {
  add_row: "addRow",
  update_row: "updateRow",
  get_row: "getRow",
  upsert_row: "upsertRow",
};

const SYNC_DELAY_MS = 1200;

// ── Action picker ─────────────────────────────────────────────────────────────
function ActionPicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Select an action
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {GOOGLE_SHEET_ACTIONS.map(({ id, label, desc }) => {
          const highlight = hovered === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`gsheet-action-${id}`}
              style={{
                borderRadius: 8, padding: "10px 8px", textAlign: "center", cursor: "pointer",
                background: highlight ? "#EEF2FF" : "#fff",
                border: `${highlight ? 2 : 1.5}px solid ${highlight ? GOOGLE_SHEET_BLUE : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <Table size={18} color={GOOGLE_SHEET_BLUE} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sheet Connection section (URL / ID + Submit + Sync) ───────────────────────
function SheetConnectionSection({ sheetUrl, sheetId, sheetConnected, sync, onChange, onSubmit, onSync }) {
  const status = sync?.status ?? "idle";
  return (
    <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>
              Sheet URL *
            </div>
            {sheetConnected && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: GREEN }}>
                <CheckCircle2 size={11} /> Connected
              </span>
            )}
          </div>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => onChange({ sheetUrl: e.target.value, ...(sheetConnected ? { sheetConnected: false } : {}) })}
            placeholder="https://docs.google.com/spreadsheets/d/1234..."
            data-testid="gsheet-sheet-url"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>The URL for the Google Sheet</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Sheet ID (Optional)
          </div>
          <input
            type="text"
            value={sheetId}
            onChange={(e) => onChange({ sheetId: e.target.value })}
            placeholder="123456"
            data-testid="gsheet-sheet-id"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>For multiple sheets in file, specify Sheet ID</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={!sheetUrl}
          onClick={onSubmit}
          data-testid="gsheet-submit"
          style={{
            flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 8, cursor: sheetUrl ? "pointer" : "not-allowed",
            background: sheetUrl ? GOOGLE_SHEET_BLUE : "#E2E8F0", color: sheetUrl ? "#fff" : "#94A3B8",
          }}
        >
          Submit
        </button>
        <button
          type="button"
          disabled={!sheetUrl || status === "syncing"}
          onClick={onSync}
          data-testid="gsheet-sync"
          style={{
            flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: (sheetUrl && status !== "syncing") ? "pointer" : "not-allowed",
            border: `1px solid ${sheetUrl ? GOOGLE_SHEET_BLUE : BORDER}`, background: "#fff",
            color: sheetUrl ? GOOGLE_SHEET_BLUE : "#94A3B8",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {status === "syncing" && <Loader2 size={12} className="animate-spin" />}
          {status === "syncing" ? "Syncing…" : "Sync"}
        </button>
      </div>

      {status === "synced" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: GREEN, fontWeight: 600, marginBottom: 6 }}>
            <CheckCircle2 size={12} /> Last synced just now
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(sync?.detectedColumns ?? []).map((col) => (
              <span key={col} style={{ background: "#F1F5F9", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151" }}>
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Configured-action summary card ────────────────────────────────────────────
function ActionSummaryCard({ actionMeta, summary, onEdit }) {
  return (
    <div style={{ padding: 16 }}>
      <div
        onClick={onEdit}
        data-testid="gsheet-edit-config"
        style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{actionMeta?.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: GOOGLE_SHEET_BLUE }}>Edit configuration</span>
        </div>
        {summary && (
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{summary}</div>
        )}
      </div>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function GoogleSheetRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const timeoutRef = useRef(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const [modalOpen, setModalOpen] = useState(false);
  // Mirrors data.action, but updated optimistically on selection so the modal
  // can open in the same render — updateNodeData may not feed a new `node`
  // prop back synchronously (e.g. in tests, or depending on store timing).
  const [activeAction, setActiveAction] = useState(data.action ?? null);
  useEffect(() => { setActiveAction(data.action ?? null); }, [data.action]);

  const action     = activeAction;
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);
  const actionKey  = ACTION_KEY[action];

  const resetAction = () => {
    patch({
      action: null,
      addRow:    { ...defaultGoogleSheetNodeData.addRow },
      updateRow: { ...defaultGoogleSheetNodeData.updateRow },
      getRow:    { ...defaultGoogleSheetNodeData.getRow },
      upsertRow: { ...defaultGoogleSheetNodeData.upsertRow },
    });
    setActiveAction(null);
  };

  const handleSelectAction = (a) => {
    patch({ action: a });
    setActiveAction(a);
    setModalOpen(true);
  };

  const handleSubmit = () => patch({ sheetConnected: true });

  const handleSync = () => {
    patch({ sync: { status: "syncing", lastSyncedAt: null, detectedColumns: [] } });
    timeoutRef.current = setTimeout(() => {
      patch({ sync: { status: "synced", lastSyncedAt: Date.now(), detectedColumns: GOOGLE_SHEET_DUMMY_COLUMNS } });
    }, SYNC_DELAY_MS);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: GOOGLE_SHEET_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Table size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Google Sheet</div>
          {actionMeta && <div style={{ fontSize: 11, color: MUTED }}>{actionMeta.label}</div>}
        </div>
        {removeNode && (
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <SheetConnectionSection
          sheetUrl={data.sheetUrl ?? ""}
          sheetId={data.sheetId ?? ""}
          sheetConnected={!!data.sheetConnected}
          sync={data.sync ?? defaultGoogleSheetNodeData.sync}
          onChange={patch}
          onSubmit={handleSubmit}
          onSync={handleSync}
        />

        {!action ? (
          <ActionPicker onSelect={handleSelectAction} />
        ) : (
          <>
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={resetAction}
                data-testid="gsheet-change-action"
                style={{ fontSize: 11, color: GOOGLE_SHEET_BLUE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Change action
              </button>
            </div>
            <ActionSummaryCard
              actionMeta={actionMeta}
              summary={getGoogleSheetPanelSummary(data)}
              onEdit={() => setModalOpen(true)}
            />
          </>
        )}
      </div>

      <GoogleSheetConfigModal
        open={modalOpen && !!action}
        onClose={() => setModalOpen(false)}
        action={action}
        initialData={actionKey ? data[actionKey] : undefined}
        onSave={(nextSubObject) => patch({ [actionKey]: nextSubObject })}
      />
    </div>
  );
}
