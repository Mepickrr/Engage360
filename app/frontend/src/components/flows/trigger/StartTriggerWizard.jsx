import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";
import EventPickerModal from "./EventPickerModal";
import Step1WhenContent, { emptyGroup } from "./Step1WhenContent";
import Step2WhoContent from "./Step2WhoContent";
import BroadcastConfig from "./BroadcastConfig";
import { mockedAudienceCount } from "./triggerHelpers";

function emptyAudience() {
  return {
    include_all: true,
    include: { conditions: [], combinator: "AND" },
    exclude_enabled: false,
    exclude: { conditions: [], combinator: "AND" },
    limit_enabled: false,
    limit_days: 30,
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
  // "picker" | "step1" | "step2" | "broadcast"
  const [stage, setStage] = useState("picker");
  // Index in triggerGroups currently awaiting an event from the picker.
  const [pickingForGroupIdx, setPickingForGroupIdx] = useState(null);

  const [triggerGroups, setTriggerGroups] = useState([]);
  const [groupsCombinator, setGroupsCombinator] = useState("AND");
  const [exitTrigger, setExitTrigger] = useState(null);
  const [audience, setAudience] = useState(emptyAudience());
  const [broadcast, setBroadcast] = useState(emptyBroadcast());

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
      if (ev?.header === "Broadcast") setStage("broadcast");
      else setStage("step1");
    } else {
      setTriggerGroups([]);
      setGroupsCombinator("AND");
      setExitTrigger(null);
      setAudience(emptyAudience());
      setBroadcast(emptyBroadcast());
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
  const skipStep2 = primaryCard && !primaryCard.audience_qualification_allow;

  // Picker callbacks
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      // Initial pick — set first trigger group + decide path.
      setTriggerGroups([emptyGroup(card.name)]);
      if (card.header === "Broadcast") setStage("broadcast");
      else setStage("step1");
    } else {
      // Adding/replacing a trigger group event.
      const idx = pickingForGroupIdx;
      setTriggerGroups((prev) => {
        const next = [...prev];
        if (idx < next.length) {
          next[idx] = { ...next[idx], event: card.name };
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
    const config = isBroadcast
      ? { kind: "broadcast", triggerGroups, broadcast }
      : {
          kind: "event",
          triggerGroups,
          groupsCombinator,
          exitTrigger,
          audience: skipStep2 ? null : audience,
        };
    onComplete(config);
  };

  // ──────────── Render ────────────
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

  // Wizard frame (step1, step2, broadcast)
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : "1. When will users enter the flow → 2. Who will enter the flow";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="max-w-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
          data-testid="trigger-wizard"
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
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-slate-100 text-text-muted"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Step indicator — only for event path */}
          {stage !== "broadcast" && (
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

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {stage === "step1" && (
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
          </div>

          <footer className="px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-surface">
            <button
              type="button"
              onClick={() => {
                if (stage === "step2") setStage("step1");
                else onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
              data-testid="trigger-wizard-back"
            >
              <ArrowLeft className="w-4 h-4" />
              {stage === "step2" ? "Back" : "Cancel"}
            </button>
            <div className="flex items-center gap-2">
              {stage === "step1" && !skipStep2 && (
                <button
                  type="button"
                  onClick={() => setStage("step2")}
                  data-testid="trigger-wizard-next"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
                  }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {(stage === "step2" ||
                (stage === "step1" && skipStep2) ||
                stage === "broadcast") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
                  }}
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
