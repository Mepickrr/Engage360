import React, { useEffect, useRef, useState } from "react";
import { Search, Check, PlusCircle, Upload, Users, Info } from "lucide-react";
import { BROADCAST_MOCK_SEGMENTS, MOCK_HISTORICAL_CSVS } from "@/components/flows/builder/broadcastAudienceData";
import CreateSegmentModal from "./CreateSegmentModal";
import UploadListModal from "./UploadListModal";

export default function SendToDropdown({ config, setConfig }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("segments");
  const [search, setSearch] = useState("");
  const [createSegmentOpen, setCreateSegmentOpen] = useState(false);
  const [uploadListOpen, setUploadListOpen] = useState(false);
  const [customSegments, setCustomSegments] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const allSegments = [...BROADCAST_MOCK_SEGMENTS, ...customSegments];
  const allLists = [...MOCK_HISTORICAL_CSVS, ...customLists];

  const selectedSegments = config.selectedSegments || [];
  const selectedLists = config.selectedHistoricalCsvs || [];

  const isSegmentSel = (id) => selectedSegments.some((s) => s.id === id);
  const isListSel = (id) => selectedLists.some((l) => l.id === id);

  const toggleSegment = (seg) =>
    setConfig((prev) => ({
      ...prev,
      selectedSegments: isSegmentSel(seg.id)
        ? (prev.selectedSegments || []).filter((s) => s.id !== seg.id)
        : [...(prev.selectedSegments || []), seg],
    }));

  const toggleList = (list) =>
    setConfig((prev) => ({
      ...prev,
      selectedHistoricalCsvs: isListSel(list.id)
        ? (prev.selectedHistoricalCsvs || []).filter((l) => l.id !== list.id)
        : [...(prev.selectedHistoricalCsvs || []), list],
    }));

  const removeChip = (kind, id) => {
    if (kind === "segment") setConfig((prev) => ({ ...prev, selectedSegments: (prev.selectedSegments || []).filter((s) => s.id !== id) }));
    else setConfig((prev) => ({ ...prev, selectedHistoricalCsvs: (prev.selectedHistoricalCsvs || []).filter((l) => l.id !== id) }));
  };

  const filteredSegments = allSegments.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredLists = allLists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  const totalSelected = selectedSegments.length + selectedLists.length;
  const totalUsers =
    selectedSegments.reduce((a, s) => a + (s.userCount || 0), 0) +
    selectedLists.reduce((a, l) => a + (l.rowCount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="flex items-center gap-1 text-[12px] font-medium text-text-secondary">
          Send To
          <Info className="w-3.5 h-3.5 text-text-muted" />
        </label>
        <div className="flex items-center gap-1.5 text-[12px] text-text-muted" data-testid="send-to-count">
          <Info className="w-3.5 h-3.5" />
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-text-secondary">{totalUsers.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          data-testid="send-to-trigger"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm text-left bg-white"
        >
          <span className={totalSelected ? "text-text-primary" : "text-text-muted"}>
            {totalSelected ? `${totalSelected} selected` : "Select Segments or Lists"}
          </span>
          <Search className="w-4 h-4 text-text-muted shrink-0" />
        </button>

        {open && (
          <div
            data-testid="send-to-panel"
            className="absolute z-20 mt-2 w-full bg-white border border-border rounded-xl shadow-lg p-3"
          >
            <div className="flex items-center gap-4 mb-3">
              <button
                type="button"
                data-testid="create-new-segment-link"
                onClick={() => setCreateSegmentOpen(true)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-primary"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create New Segment
              </button>
              <button
                type="button"
                data-testid="upload-new-list-link"
                onClick={() => setUploadListOpen(true)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-primary"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New List
              </button>
            </div>

            <div className="flex rounded-lg border border-border overflow-hidden mb-3">
              <button
                type="button"
                data-testid="send-to-tab-segments"
                onClick={() => setTab("segments")}
                className={`flex-1 px-3 py-2 text-[12px] font-medium ${tab === "segments" ? "bg-slate-100 text-text-primary" : "text-text-secondary"}`}
              >
                Segments ({allSegments.length})
              </button>
              <button
                type="button"
                data-testid="send-to-tab-lists"
                onClick={() => setTab("lists")}
                className={`flex-1 px-3 py-2 text-[12px] font-medium ${tab === "lists" ? "bg-slate-100 text-text-primary" : "text-text-secondary"}`}
              >
                Lists ({allLists.length})
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === "segments" ? "Search segments…" : "Search lists…"}
                className="w-full pl-8 pr-2 py-1.5 text-[13px] rounded-md border border-border focus:outline-none focus:border-primary/60"
              />
            </div>

            {tab === "segments" && (
              <p className="text-[11px] text-text-muted mb-2">
                (Please refresh the segments from the Live Segments page to ensure latest data)
              </p>
            )}

            <div className="max-h-64 overflow-y-auto space-y-1">
              {tab === "segments"
                ? filteredSegments.map((seg) => (
                    <label
                      key={seg.id}
                      data-testid={`segment-row-${seg.id}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-50"
                    >
                      <span
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                          isSegmentSel(seg.id) ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {isSegmentSel(seg.id) && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <input type="checkbox" checked={isSegmentSel(seg.id)} onChange={() => toggleSegment(seg)} className="sr-only" />
                      <span className="flex-1 text-[13px] text-text-primary truncate">{seg.name}</span>
                      <span className="text-[10px] font-medium text-text-secondary border border-border rounded-full px-2 py-0.5 shrink-0">
                        {seg.source || "Segment"}
                      </span>
                      <span className="text-[12px] text-text-secondary shrink-0 w-12 text-right">
                        {seg.userCount.toLocaleString("en-IN")}
                      </span>
                    </label>
                  ))
                : filteredLists.map((list) => (
                    <label
                      key={list.id}
                      data-testid={`list-row-${list.id}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-50"
                    >
                      <span
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                          isListSel(list.id) ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {isListSel(list.id) && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <input type="checkbox" checked={isListSel(list.id)} onChange={() => toggleList(list)} className="sr-only" />
                      <span className="flex-1 text-[13px] text-text-primary truncate">{list.name}</span>
                      <span className="text-[12px] text-text-secondary shrink-0 w-12 text-right">
                        {list.rowCount.toLocaleString("en-IN")}
                      </span>
                    </label>
                  ))}
              {(tab === "segments" ? filteredSegments : filteredLists).length === 0 && (
                <div className="text-center py-6 text-[12px] text-text-muted">No matches for &ldquo;{search}&rdquo;</div>
              )}
            </div>
          </div>
        )}
      </div>

      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2" data-testid="send-to-chips">
          {selectedSegments.map((s) => (
            <span key={s.id} className="flex items-center gap-1 bg-primary-tint text-primary text-[12px] font-medium rounded-full pl-2.5 pr-1.5 py-1">
              {s.name}
              <button type="button" data-testid={`remove-chip-segment-${s.id}`} onClick={() => removeChip("segment", s.id)} className="hover:text-red-600">
                ×
              </button>
            </span>
          ))}
          {selectedLists.map((l) => (
            <span key={l.id} className="flex items-center gap-1 bg-slate-100 text-text-secondary text-[12px] font-medium rounded-full pl-2.5 pr-1.5 py-1">
              {l.name}
              <button type="button" data-testid={`remove-chip-list-${l.id}`} onClick={() => removeChip("list", l.id)} className="hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <CreateSegmentModal
        open={createSegmentOpen}
        onClose={() => setCreateSegmentOpen(false)}
        onCreated={(seg) => {
          setCustomSegments((prev) => [...prev, seg]);
          toggleSegment(seg);
          setCreateSegmentOpen(false);
          setTab("segments");
        }}
      />
      <UploadListModal
        open={uploadListOpen}
        onClose={() => setUploadListOpen(false)}
        onCreated={(list) => {
          setCustomLists((prev) => [...prev, list]);
          toggleList(list);
          setUploadListOpen(false);
          setTab("lists");
        }}
      />
    </div>
  );
}
