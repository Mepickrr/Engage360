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
import { mockedAudienceCount, emptyConditionBlock } from "./triggerHelpers";

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

// Find an event card by name across the whole catalogue.
function findEvent(name) {
  for (const h of Object.keys(catalogueData.catalogue)) {
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
}) {
  // "picker" | "step1" | "step2" | "broadcast" | "broadcast-source-1" | "broadcast-source-2"
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

  const [count, setCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

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
      if (initialConfig?.kind === "date_relative") {
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
        setIsDateRelative(false);
        if (ev?.name === "Saved segment" || ev?.name === "CSV upload") {
          setBroadcastSourceType(ev.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(initialConfig.broadcastSourceConfig || emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(initialConfig.broadcastSourceSchedule || emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else {
        setIsDateRelative(false);
        setStage("step1");
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
      setDateConfig(emptyDateConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
    setCount(null);
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
  const skipStep2 = !isDateRelative && primaryCard && !primaryCard.audience_qualification_allow;

  // Picker callbacks
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      setTriggerGroups([emptyGroup(card.name)]);
      if (card.header === "Broadcast") {
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
        setIsDateRelative(false);
      } else if (card.date_relative) {
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig());
        setStage("step1");
      } else {
        setIsDateRelative(false);
        setStage("step1");
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
      setStage("step1");
    }
  };

  const onShowCount = () => {
    setLoadingCount(true);
    setTimeout(() => {
      setCount(mockedAudienceCount());
      setLoadingCount(false);
    }, 600);
  };

  const handleFinish = () => {
    let config;
    if (isBroadcastSource) {
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
      : "1. When will users enter the flow → 2. Who will enter the flow";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="max-w-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
          data-testid="trigger-wizard"
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
          </header>

          {stage !== "broadcast" && !stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot n={1} active={stage === "step1"} done={stage === "step2"} label="When" />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "step2"}
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

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {stage === "step1" && isDateRelative && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && (
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
            {stage === "step2" && (
              <Step2WhoContent
                audience={audience}
                setAudience={setAudience}
                showCount={onShowCount}
                count={count}
                loadingCount={loadingCount}
              />
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
            <button
              type="button"
              onClick={() => {
                if (stage === "step2") setStage("step1");
                else if (stage === "broadcast-source-2") setStage("broadcast-source-1");
                else onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
              data-testid="trigger-wizard-back"
            >
              <ArrowLeft className="w-4 h-4" />
              {stage === "step2" || stage === "broadcast-source-2" ? "Back" : "Cancel"}
            </button>
            <div className="flex items-center gap-2">
              {stage === "step1" && !skipStep2 && (
                <button
                  type="button"
                  onClick={() => setStage("step2")}
                  data-testid="trigger-wizard-next"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
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
              {(stage === "step2" ||
                (stage === "step1" && skipStep2) ||
                stage === "broadcast" ||
                stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
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
