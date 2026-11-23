import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createBroadcast, fetchBroadcast, updateBroadcast } from "@/lib/broadcastsApi";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";
import ChannelPickerModal from "@/components/broadcasts/builder/ChannelPickerModal";
import LeftSequencePanel from "@/components/broadcasts/builder/LeftSequencePanel";
import CenterConfigPanel from "@/components/broadcasts/builder/CenterConfigPanel";
import CampaignContentPanel from "@/components/broadcasts/builder/CampaignContentPanel";
import TestModeModal from "@/components/broadcasts/builder/TestModeModal";
import SaveAndScheduleModal from "@/components/broadcasts/builder/SaveAndScheduleModal";
import { openFastrrSignals } from "@/components/signals/FastrrSignalsModal";
import { isSignalsActive, usesFastrrSegments } from "@/components/signals/fastrrSignals";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function BroadcastBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [pickerOpen, setPickerOpen] = useState(isNew);

  const campaignId = useBroadcastBuilderStore((s) => s.campaignId);
  const meta = useBroadcastBuilderStore((s) => s.meta);
  const sequence = useBroadcastBuilderStore((s) => s.sequence);
  const selectedStepId = useBroadcastBuilderStore((s) => s.selectedStepId);
  const autosaveStatus = useBroadcastBuilderStore((s) => s.autosaveStatus);
  const hydrate = useBroadcastBuilderStore((s) => s.hydrate);
  const reset = useBroadcastBuilderStore((s) => s.reset);
  const setCampaignId = useBroadcastBuilderStore((s) => s.setCampaignId);
  const addPrimaryStep = useBroadcastBuilderStore((s) => s.addPrimaryStep);
  const patchMeta = useBroadcastBuilderStore((s) => s.patchMeta);
  const setAutosaveStatus = useBroadcastBuilderStore((s) => s.setAutosaveStatus);
  const createdAt = useBroadcastBuilderStore((s) => s.createdAt);
  const setCreatedAt = useBroadcastBuilderStore((s) => s.setCreatedAt);
  const [testModeOpen, setTestModeOpen] = useState(false);
  const [saveScheduleOpen, setSaveScheduleOpen] = useState(false);

  useEffect(() => () => reset(), [reset]);

  const hydratedIdRef = useRef(null);
  useEffect(() => {
    if (isNew || hydratedIdRef.current === id) return;
    fetchBroadcast(id).then((doc) => {
      hydratedIdRef.current = id;
      hydrate(doc);
    });
  }, [id, isNew, hydrate]);

  const handleChannelPicked = useCallback(
    async (channel) => {
      addPrimaryStep(channel);
      setPickerOpen(false);
      const { meta: m, sequence: seq } = useBroadcastBuilderStore.getState();
      const doc = await createBroadcast({ meta: m, sequence: seq });
      hydratedIdRef.current = doc.id;
      setCampaignId(doc.id);
      setCreatedAt(doc.createdAt);
      navigate(`/fastrr/broadcasts/builder/${doc.id}`, { replace: true });
    },
    [addPrimaryStep, setCampaignId, setCreatedAt, navigate],
  );

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false);
    if (isNew) navigate("/fastrr/broadcasts");
  }, [isNew, navigate]);

  const lastSavedRef = useRef(null);
  const debounceRef = useRef(null);
  const pendingSaveRef = useRef(null);
  useEffect(() => {
    if (!campaignId) return;
    const snapshot = JSON.stringify({ meta, sequence });
    if (lastSavedRef.current === null) {
      lastSavedRef.current = snapshot;
      return;
    }
    if (lastSavedRef.current === snapshot) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutosaveStatus("saving");
    pendingSaveRef.current = { campaignId, meta, sequence, snapshot };
    debounceRef.current = setTimeout(async () => {
      await updateBroadcast(campaignId, { meta, sequence });
      lastSavedRef.current = snapshot;
      pendingSaveRef.current = null;
      setAutosaveStatus("saved");
      setTimeout(() => setAutosaveStatus("idle"), 1500);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [campaignId, meta, sequence, setAutosaveStatus]);

  useEffect(() => {
    return () => {
      const pending = pendingSaveRef.current;
      if (pending) {
        updateBroadcast(pending.campaignId, { meta: pending.meta, sequence: pending.sequence });
        pendingSaveRef.current = null;
      }
    };
  }, []);

  const selectedStep = sequence.find((s) => s.id === selectedStepId) || sequence[0] || null;

  // Fastrr segments are free to pick; the add-on is activated before scheduling.
  const handleSaveSchedule = () => {
    const usesSignals = sequence.some((st) => usesFastrrSegments(st.audience?.broadcastSourceConfig?.selectedSegments));
    if (usesSignals && !isSignalsActive()) {
      openFastrrSignals({ source: "campaign-save-schedule", onActivate: () => setSaveScheduleOpen(true) });
      return;
    }
    setSaveScheduleOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -m-6 bg-app-bg" data-testid="campaign-builder">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-white">
        <button
          type="button"
          aria-label="Back to broadcasts"
          onClick={() => navigate("/fastrr/broadcasts")}
          className="text-text-muted hover:text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <input
            type="text"
            value={meta.name}
            onChange={(e) => patchMeta({ name: e.target.value })}
            data-testid="campaign-name-input"
            className="text-sm font-medium border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 max-w-xs"
          />
          {createdAt && (
            <span className="text-[10px] text-text-muted px-2" data-testid="campaign-created-at">
              Created {new Date(createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
        <span className="text-[12px] text-text-muted ml-auto" data-testid="campaign-autosave-status">
          {autosaveStatus === "saving" ? "Saving..." : autosaveStatus === "saved" ? "All changes saved" : ""}
        </span>
        <button
          type="button"
          data-testid="switch-to-flow-builder-btn"
          onClick={() => navigate("/flows-v2/builder/new")}
          className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
        >
          Switch to Flow Builder
        </button>
        <button
          type="button"
          data-testid="header-test-mode-btn"
          onClick={() => setTestModeOpen(true)}
          className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
        >
          Test Mode
        </button>
        <button
          type="button"
          data-testid="header-save-schedule-btn"
          onClick={handleSaveSchedule}
          className="px-4 py-2 rounded-md bg-primary text-white text-[12px] font-medium"
        >
          Save & Schedule
        </button>
      </div>
      <div className="flex-1 flex min-h-0" style={pickerOpen ? { pointerEvents: "none" } : undefined}>
        <LeftSequencePanel />
        <CenterConfigPanel step={selectedStep} />
        <CampaignContentPanel step={selectedStep} />
      </div>
      <ChannelPickerModal
        open={pickerOpen}
        title="Choose your primary channel"
        onSelect={handleChannelPicked}
        onClose={handlePickerClose}
      />
      <TestModeModal open={testModeOpen} onClose={() => setTestModeOpen(false)} />
      <SaveAndScheduleModal open={saveScheduleOpen} onClose={() => setSaveScheduleOpen(false)} />
    </div>
  );
}
