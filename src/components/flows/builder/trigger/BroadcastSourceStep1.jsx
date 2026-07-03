import React, { useRef, useState } from "react";
import { Upload, FileText, X, Check, Search } from "lucide-react";
import { MOCK_HISTORICAL_CSVS, BROADCAST_MOCK_SEGMENTS } from "../broadcastAudienceData";

export default function BroadcastSourceStep1({ sourceType, config, setConfig }) {
  return sourceType === "csv" ? (
    <CsvSourceConfig config={config} setConfig={setConfig} />
  ) : (
    <SegmentSourceConfig config={config} setConfig={setConfig} />
  );
}

// ─── CSV source ───────────────────────────────────────────────────────────────

function CsvSourceConfig({ config, setConfig }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files) => {
    const valid = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".csv"));
    if (!valid.length) return;
    setConfig((prev) => ({ ...prev, csvFiles: [...(prev.csvFiles || []), ...valid] }));
  };

  const removeUpload = (idx) =>
    setConfig((prev) => ({ ...prev, csvFiles: prev.csvFiles.filter((_, i) => i !== idx) }));

  const toggleHistorical = (csv) =>
    setConfig((prev) => {
      const already = (prev.selectedHistoricalCsvs || []).some((c) => c.id === csv.id);
      return {
        ...prev,
        selectedHistoricalCsvs: already
          ? prev.selectedHistoricalCsvs.filter((c) => c.id !== csv.id)
          : [...(prev.selectedHistoricalCsvs || []), csv],
      };
    });

  const isHistSel = (id) => (config.selectedHistoricalCsvs || []).some((c) => c.id === id);

  const histRows = (config.selectedHistoricalCsvs || []).reduce((a, c) => a + c.rowCount, 0);
  const totalFiles =
    (config.csvFiles || []).length + (config.selectedHistoricalCsvs || []).length;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-2">Upload CSV files</div>
        <div
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 bg-slate-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto text-text-muted mb-2" />
          <div className="text-sm font-medium text-text-primary">
            Drop CSV files here or click to browse
          </div>
          <div className="text-xs text-text-muted mt-1">
            You can upload multiple CSVs. Each file must include a phone number column.
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {(config.csvFiles || []).length > 0 && (
          <div className="mt-3 space-y-2">
            {config.csvFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50"
              >
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-800 flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeUpload(i)}
                  className="text-emerald-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical CSVs */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-2">
          Or select from previously uploaded CSVs
        </div>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="w-10 px-3 py-2" />
                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  File name
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Rows
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Uploaded
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_HISTORICAL_CSVS.map((csv) => {
                const sel = isHistSel(csv.id);
                return (
                  <tr
                    key={csv.id}
                    className={`cursor-pointer transition-colors ${sel ? "bg-primary/5" : "hover:bg-slate-50"}`}
                    onClick={() => toggleHistorical(csv)}
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          sel ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-text-primary">{csv.name}</div>
                      <div className="text-[11px] text-text-muted">{csv.columns.join(", ")}</div>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">
                      {csv.rowCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">{csv.uploadedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {totalFiles > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-primary">{totalFiles} file(s) selected</span>
          {histRows > 0 && (
            <span className="text-text-secondary">
              · ~{histRows.toLocaleString("en-IN")} contacts from saved files
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Segment source ───────────────────────────────────────────────────────────

function SegmentSourceConfig({ config, setConfig }) {
  const [search, setSearch] = useState("");

  const filtered = BROADCAST_MOCK_SEGMENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSel = (id) => (config.selectedSegments || []).some((s) => s.id === id);

  const toggleSegment = (seg) =>
    setConfig((prev) => {
      const already = isSel(seg.id);
      return {
        ...prev,
        selectedSegments: already
          ? prev.selectedSegments.filter((s) => s.id !== seg.id)
          : [...(prev.selectedSegments || []), seg],
      };
    });

  const setCombinator = (c) => setConfig((prev) => ({ ...prev, segmentCombinator: c }));

  const totalUsers = (config.selectedSegments || []).reduce((a, s) => a + s.userCount, 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search segments…"
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
      </div>

      {/* Segment list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
        {filtered.map((seg) => {
          const sel = isSel(seg.id);
          return (
            <label
              key={seg.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                sel ? "border-primary bg-primary/5" : "border-border hover:bg-slate-50"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                  sel ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {sel && <Check className="w-3 h-3 text-white" />}
              </span>
              <input
                type="checkbox"
                checked={sel}
                onChange={() => toggleSegment(seg)}
                className="sr-only"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{seg.name}</div>
                <div className="text-[11px] text-text-muted capitalize">
                  {seg.type} · updated {seg.updatedAt}
                </div>
              </div>
              <span className="text-sm font-semibold text-text-secondary shrink-0">
                {seg.userCount.toLocaleString("en-IN")}
              </span>
            </label>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-text-muted">
            No segments match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Combinator */}
      {(config.selectedSegments || []).length > 1 && (
        <div className="border-t border-border pt-4 space-y-2">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">
            Combine selected segments with
          </div>
          <div className="flex gap-2">
            {["OR", "AND"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCombinator(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  (config.segmentCombinator || "OR") === c
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-secondary border-border hover:bg-slate-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="text-xs text-text-muted">
            {(config.segmentCombinator || "OR") === "OR"
              ? "Users in ANY of the selected segments will be included."
              : "Only users present in ALL selected segments will be included."}
          </div>
        </div>
      )}

      {/* Summary */}
      {(config.selectedSegments || []).length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-primary">
            {(config.selectedSegments || []).length} segment(s) selected
          </span>
          <span className="text-text-secondary">
            · ~{totalUsers.toLocaleString("en-IN")} users
          </span>
        </div>
      )}
    </div>
  );
}
