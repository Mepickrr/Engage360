import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";
import EventPickerModal from "./EventPickerModal";
import Step1WhenContent, { emptyGroup } from "./Step1WhenContent";
import Step2WhoContent from "./Step2WhoContent";
import BroadcastConfig from "./BroadcastConfig";
import BroadcastSourceStep1 from "./BroadcastSourceStep1";
import BroadcastSourceStep2 from "./BroadcastSourceStep2";
import DateRelativeTriggerContent, { emptyDateConfig } from "./DateRelativeTriggerContent";
import EventOffsetTriggerContent, { emptyEventOffsetConfig } from "./EventOffsetTriggerContent";
import { emptyConditionBlock } from "./triggerHelpers";
import WebhookTriggerStep1, { isWebhookStep1Valid } from "./WebhookTriggerStep1";
import { emptyWebhookConfig, flattenPayload } from "./webhookHelpers";
import GoogleSheetTriggerStep1, { isGoogleSheetStep1Valid } from "./GoogleSheetTriggerStep1";
import { emptyGoogleSheetTriggerConfig } from "./googleSheetTriggerHelpers";

function emptyAudience() {
  return {
    include_all: true,
    include: { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" },
    exclude_enabled: false,
    exclude: { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" },
    limit_enabled: false,
    limit_entry: { count: 1, window: 1, unit: "days" },
    audience_kind: "all",
    global_control: false,
    flow_control: false,
  };
}

function emptyBroadcast() {
  return {
    schedule_kind: "now",
    audience_kind: "all",
  };
}

function emptyBroadcastSourceConfig() {
  return {
    csvFiles: [],
    selectedHistoricalCsvs: [],
    selectedSegments: [],
    segmentCombinator: "OR",
  };
}

function emptyBroadcastSourceSchedule() {
  return { type: "immediate", date: "", time: "", timezone: "Asia/Kolkata" };
}

// Find an event card by name. Skips the "ALL" aggregate bucket so we always
// get the canonical copy (with the correct header field) from the real category.
function findEvent(name) {
  for (const h of Object.keys(catalogueData.catalogue)) {
    if (h === "ALL" || h === "All") continue;
    for (const sec of Object.keys(catalogueData.catalogue[h])) {
      for (const c of catalogueData.catalogue[h][sec]) {
        if (c.name === name) return c;
      }
    }
  }
  return null;
}

export default function StartTriggerWizard({
  open,
  initialConfig,
  onClose,
  onComplete,
  lockdown = false,
  onSaveDraft,
  onDeleteFlow,
}) {
  // "picker" | "config" | "broadcast" | "broadcast-source-1" | "broadcast-source-2"
  const [stage, setStage] = useState("picker");
  const [pickingForGroupIdx, setPickingForGroupIdx] = useState(null);

  const [triggerGroups, setTriggerGroups] = useState([]);
  const [groupsCombinator, setGroupsCombinator] = useState("AND");
  const [exitTrigger, setExitTrigger] = useState(null);
  const [audience, setAudience] = useState(emptyAudience());
  const [broadcast, setBroadcast] = useState(emptyBroadcast());
  const [broadcastSourceType, setBroadcastSourceType] = useState(null); // "csv" | "segment"
  const [broadcastSourceConfig, setBroadcastSourceConfig] = useState(emptyBroadcastSourceConfig());
  const [broadcastSourceSchedule, setBroadcastSourceSchedule] = useState(emptyBroadcastSourceSchedule());
  const [isDateRelative, setIsDateRelative] = useState(false);
  const [dateConfig, setDateConfig] = useState(emptyDateConfig());
  const [isEventOffset, setIsEventOffset] = useState(false);
  const [eventOffsetConfig, setEventOffsetConfig] = useState(emptyEventOffsetConfig());
  const [isWebhook, setIsWebhook] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState(emptyWebhookConfig());
  const [isGoogleSheet, setIsGoogleSheet] = useState(false);
  const [googleSheetConfig, setGoogleSheetConfig] = useState(emptyGoogleSheetTriggerConfig());

  // Hydrate from existing config when edit mode opens.
  useEffect(() => {
    if (!open) return;
    if (initialConfig) {
      const ev = findEvent(initialConfig.triggerGroups?.[0]?.event);
      setTriggerGroups(initialConfig.triggerGroups || []);
      setGroupsCombinator(initialConfig.groupsCombinator || "AND");
      setExitTrigger(initialConfig.exitTrigger || null);
      setAudience(initialConfig.audience || emptyAudience());
      setBroadcast(initialConfig.broadcast || emptyBroadcast());
      if (initialConfig?.kind === "webhook") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setWebhookConfig({
          webhookUrl: initialConfig.webhookUrl,
          authProtected: initialConfig.authProtected || false,
          authConfig: initialConfig.authConfig || null,
          samplePayload: initialConfig.samplePayload || "",
          uniqueId: initialConfig.uniqueId || null,
          secondaryId: initialConfig.secondaryId || null,
          variableMappings: initialConfig.variableMappings || [],
        });
        setStage("config");
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("config");
      } else if (initialConfig?.kind === "event_offset") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
        setIsEventOffset(true);
        setEventOffsetConfig(initialConfig.eventOffsetConfig || emptyEventOffsetConfig());
        setStage("config");
      } else if (initialConfig?.kind === "google_sheet_new_row") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(true);
        setGoogleSheetConfig({
          sheetUrl: initialConfig.sheetUrl || "",
          sheetId: initialConfig.sheetId || "",
          connected: !!initialConfig.sheetUrl,
          columnIdMode: initialConfig.columnIdMode || "header",
          detectedColumns: initialConfig.detectedColumns || [],
          columns: initialConfig.columns || [],
          variableNames: initialConfig.variableNames || {},
          contactIdentifierColumn: initialConfig.contactIdentifierColumn || "",
          pollIntervalMinutes: initialConfig.pollIntervalMinutes || 5,
          sampleValues: initialConfig.sampleValues || {},
        });
        setStage("config");
      } else if (ev?.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
        if (ev?.name === "Saved segment" || ev?.name === "CSV upload") {
          setBroadcastSourceType(ev.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(initialConfig.broadcastSourceConfig || emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(initialConfig.broadcastSourceSchedule || emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
        setIsEventOffset(false);
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setStage("config");
      }
    } else {
      setTriggerGroups([]);
      setGroupsCombinator("AND");
      setExitTrigger(null);
      setAudience(emptyAudience());
      setBroadcast(emptyBroadcast());
      setBroadcastSourceType(null);
      setBroadcastSourceConfig(emptyBroadcastSourceConfig());
      setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
      setIsDateRelative(false);
      setIsEventOffset(false);
      setIsWebhook(false);
      setIsGoogleSheet(false);
      setWebhookConfig(emptyWebhookConfig());
      setDateConfig(emptyDateConfig());
      setEventOffsetConfig(emptyEventOffsetConfig());
      setGoogleSheetConfig(emptyGoogleSheetTriggerConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
  }, [open, initialConfig]);

  const primaryEvent = triggerGroups[0]?.event;
  const primaryCard = useMemo(
    () => (primaryEvent ? findEvent(primaryEvent) : null),
    [primaryEvent],
  );
  const isBroadcast = primaryCard?.header === "Broadcast";
  const isBroadcastSource =
    isBroadcast &&
    (primaryCard?.name === "Saved segment" || primaryCard?.name === "CSV upload");
  const skipStep2 =
    isGoogleSheet || (!isDateRelative && primaryCard && !primaryCard.audience_qualification_allow);

  // Picker callbacks
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      setTriggerGroups([emptyGroup(card.name)]);
      if (card.name === "Webhook trigger") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setWebhookConfig(emptyWebhookConfig());
        setStage("config");
      } else if (card.name === "Google Sheet Data Entry") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(true);
        setGoogleSheetConfig(emptyGoogleSheetTriggerConfig());
        setStage("config");
      } else if (card.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else if (card.date_relative) {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig(card.attribute_key));
        setStage("config");
      } else if (card.system_event_relative) {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
        setIsEventOffset(true);
        setEventOffsetConfig(emptyEventOffsetConfig(card.name));
        setStage("config");
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setStage("config");
      }
    } else {
      const idx = pickingForGroupIdx;
      setTriggerGroups((prev) => {
        const next = [...prev];
        if (idx < next.length) {
          const patch = { ...next[idx], event: card.name };
          if (!card.advance_evaluate) {
            patch.evaluateTime = undefined;
            patch.evaluate = [];
          }
          next[idx] = patch;
        } else {
          next.push(emptyGroup(card.name));
        }
        return next;
      });
      setPickingForGroupIdx(null);
      setStage("config");
    }
  };

  const handleFinish = () => {
    let config;
    if (isWebhook) {
      config = {
        kind: "webhook",
        ...webhookConfig,
        payloadVariables: flattenPayload(webhookConfig.samplePayload).variables,
        audience,
      };
    } else if (isGoogleSheet) {
      config = { kind: "google_sheet_new_row", ...googleSheetConfig };
    } else if (isBroadcastSource) {
      config = {
        kind: "broadcast_source",
        sourceType: broadcastSourceType,
        broadcastSourceConfig,
        broadcastSourceSchedule,
        audience,
        triggerGroups,
      };
    } else if (isBroadcast) {
      config = { kind: "broadcast", triggerGroups, broadcast };
    } else if (isDateRelative) {
      config = { kind: "date_relative", dateConfig, audience };
    } else if (isEventOffset) {
      config = { kind: "event_offset", eventOffsetConfig, audience };
    } else {
      config = {
        kind: "event",
        triggerGroups,
        groupsCombinator,
        exitTrigger,
        audience: skipStep2 ? null : audience,
      };
    }
    onComplete(config);
  };

  // The picker modal is its own Dialog (own backdrop) when opened standalone.
  if (stage === "picker") {
    return (
      <EventPickerModal
        open={open}
        onClose={onClose}
        onPick={onPickEvent}
        lockdown={lockdown}
        onSaveDraft={onSaveDraft}
        onDeleteFlow={onDeleteFlow}
      />
    );
  }

  const sourceStepLabel =
    broadcastSourceType === "csv" ? "Select CSV files" : "Select segments";
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : stage === "broadcast-source-1" || stage === "broadcast-source-2"
      ? `1. ${sourceStepLabel} → 2. Schedule & audience`
      : isWebhook
      ? "1. Configure Webhook → 2. Who will enter the flow"
      : isGoogleSheet
      ? "1. Configure Google Sheet Data Entry"
      : "1. When will users enter the flow → 2. Who will enter the flow";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o && !lockdown) onClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
          data-testid="trigger-wizard"
          hideCloseButton={lockdown}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Configure trigger</DialogTitle>
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-text-primary">
                Configure trigger
              </div>
              <div className="text-[12px] text-text-muted hidden sm:block">
                {stepperLabel}
              </div>
            </div>
            {lockdown && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  data-testid="trigger-wizard-save-draft"
                  className="px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={onDeleteFlow}
                  data-testid="trigger-wizard-delete-flow"
                  className="px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50"
                >
                  Delete flow
                </button>
              </div>
            )}
          </header>

          {stage !== "broadcast" && !stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot n={1} active={stage === "config"} done={false} label={isWebhook ? "Configure Webhook" : isGoogleSheet ? "Configure Google Sheet Data Entry" : "When"} />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "config" && !skipStep2}
                done={false}
                label="Who"
                disabled={skipStep2}
              />
            </div>
          )}

          {stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot
                n={1}
                active={stage === "broadcast-source-1"}
                done={stage === "broadcast-source-2"}
                label={sourceStepLabel}
              />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "broadcast-source-2"}
                done={false}
                label="Schedule & Audience"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {stage === "config" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "config" && isGoogleSheet && (
              <GoogleSheetTriggerStep1 config={googleSheetConfig} setConfig={setGoogleSheetConfig} />
            )}
            {stage === "config" && isDateRelative && !isWebhook && !isGoogleSheet && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "config" && isEventOffset && !isWebhook && !isGoogleSheet && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "config" && !isDateRelative && !isEventOffset && !isWebhook && !isGoogleSheet && (
              <Step1WhenContent
                triggerGroups={triggerGroups}
                setTriggerGroups={setTriggerGroups}
                groupsCombinator={groupsCombinator}
                setGroupsCombinator={setGroupsCombinator}
                exitTrigger={exitTrigger}
                setExitTrigger={setExitTrigger}
                onPickEventForGroup={(idx) => {
                  setPickingForGroupIdx(idx);
                  setStage("picker");
                }}
              />
            )}
            {stage === "config" && !skipStep2 && (
              <Step2WhoContent audience={audience} setAudience={setAudience} />
            )}
            {stage === "broadcast" && (
              <BroadcastConfig config={broadcast} setConfig={setBroadcast} />
            )}
            {stage === "broadcast-source-1" && (
              <BroadcastSourceStep1
                sourceType={broadcastSourceType}
                config={broadcastSourceConfig}
                setConfig={setBroadcastSourceConfig}
              />
            )}
            {stage === "broadcast-source-2" && (
              <BroadcastSourceStep2
                schedule={broadcastSourceSchedule}
                setSchedule={setBroadcastSourceSchedule}
                audience={audience}
                setAudience={setAudience}
              />
            )}
          </div>

          <footer className="px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-surface">
            {(stage === "broadcast-source-2" || !lockdown) && (
              <button
                type="button"
                onClick={() => {
                  if (stage === "broadcast-source-2") setStage("broadcast-source-1");
                  else onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
                data-testid="trigger-wizard-back"
              >
                <ArrowLeft className="w-4 h-4" />
                {stage === "broadcast-source-2" ? "Back" : "Cancel"}
              </button>
            )}
            <div className="flex items-center gap-2">
              {stage === "broadcast-source-1" && (
                <button
                  type="button"
                  onClick={() => setStage("broadcast-source-2")}
                  data-testid="trigger-wizard-next"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {(stage === "config" || stage === "broadcast" || stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={
                    (isGoogleSheet && !isGoogleSheetStep1Valid(googleSheetConfig)) ||
                    (isWebhook && !isWebhookStep1Valid(webhookConfig))
                  }
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepDot({ n, active, done, label, disabled }) {
  const bg = active
    ? "bg-primary text-white"
    : done
    ? "bg-emerald-500 text-white"
    : disabled
    ? "bg-slate-200 text-text-muted"
    : "bg-slate-200 text-text-secondary";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${bg}`}
      >
        {n}
      </span>
      <span
        className={`text-xs font-medium ${
          active ? "text-primary" : "text-text-secondary"
        } ${disabled ? "line-through opacity-60" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}
