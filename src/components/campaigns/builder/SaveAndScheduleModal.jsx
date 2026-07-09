import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import { updateCampaign } from "@/lib/campaignsApi";
import TestModeModal from "./TestModeModal";

function resolveAudienceCount(step) {
  if (!step) return 0;
  const sourceType = step.audience?.sourceType || "segment";
  const config = step.audience?.broadcastSourceConfig || {};
  if (sourceType === "csv") {
    return (config.selectedHistoricalCsvs || []).reduce((a, c) => a + c.rowCount, 0);
  }
  return (config.selectedSegments || []).reduce((a, s) => a + s.userCount, 0);
}

export default function SaveAndScheduleModal({ open, onClose }) {
  const navigate = useNavigate();
  const campaignId = useCampaignBuilderStore((s) => s.campaignId);
  const meta = useCampaignBuilderStore((s) => s.meta);
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const schedule = useCampaignBuilderStore((s) => s.schedule);
  const setSchedule = useCampaignBuilderStore((s) => s.setSchedule);
  const setStatus = useCampaignBuilderStore((s) => s.setStatus);
  const [testModeOpen, setTestModeOpen] = useState(false);

  const primaryStep = sequence.find((s) => s.is_primary);
  const resolvedCount = resolveAudienceCount(primaryStep);

  const handleConfirm = async () => {
    const status = schedule.mode === "now" ? "sending" : "scheduled";
    setStatus(status);
    await updateCampaign(campaignId, { meta, sequence, status, schedule });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent data-testid="save-schedule-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save & Schedule</DialogTitle>
          </DialogHeader>

          <div className="mb-3" data-testid="estimated-audience-size">
            <span className="text-[12px] text-text-secondary">Estimated Audience Size</span>
            <div className="text-[20px] font-semibold text-text-primary">{resolvedCount.toLocaleString("en-IN")}</div>
          </div>

          <div className="mb-4 bg-primary-tint border border-primary/20 rounded-md px-3 py-2 text-[12px] text-text-secondary" data-testid="ai-suggestion-card">
            AI Suggestion: Sending between 6–9 PM typically improves open rates for this audience.
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              data-testid="save-schedule-test-mode-btn"
              onClick={() => setTestModeOpen(true)}
              className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
            >
              Test Mode
            </button>
            <button
              type="button"
              data-testid="save-schedule-switch-flow-btn"
              onClick={() => navigate("/flows-v2/builder/new")}
              className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
            >
              Switch to Flow Builder
            </button>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="schedule-mode"
                data-testid="schedule-now-radio"
                checked={schedule.mode === "now"}
                onChange={() => setSchedule({ mode: "now", datetime: null })}
              />
              Send now
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="schedule-mode"
                data-testid="schedule-later-radio"
                checked={schedule.mode === "scheduled"}
                onChange={() => setSchedule({ ...schedule, mode: "scheduled" })}
              />
              Schedule for
            </label>
            {schedule.mode === "scheduled" && (
              <input
                type="datetime-local"
                data-testid="schedule-datetime-input"
                value={schedule.datetime || ""}
                onChange={(e) => setSchedule({ ...schedule, datetime: e.target.value })}
                className="mt-2 w-full border border-border rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>

          <button
            type="button"
            data-testid="confirm-schedule-btn"
            disabled={!schedule.mode}
            onClick={handleConfirm}
            className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40"
          >
            Confirm & Schedule
          </button>
        </DialogContent>
      </Dialog>
      <TestModeModal open={testModeOpen} onClose={() => setTestModeOpen(false)} />
    </>
  );
}
