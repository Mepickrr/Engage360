import React, { useEffect, useState } from "react";
import { Zap, Clock, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WhatsAppBubblePreview from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview";
import { previewToast } from "@/components/common/PreviewHeader";
import { WAIT_LABEL, RATE_CARD } from "./data";

const MARKETING_RATE = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").price;

export default function JourneyPreviewModal({ journey, otherAudienceJourney, onClose, onActivate }) {
  const open = !!journey;
  // otherAudienceJourney is listing-page-only (JourneyListingCard passes the
  // sibling audience variant); the dashboard's JourneysTable never passes
  // it, so this whole toggle is invisible there and displayedJourney always
  // just equals journey — no behavior change for that consumer.
  const hasBothAudiences = open && !!otherAudienceJourney;

  const [previewAudience, setPreviewAudience] = useState("Known");
  // Reset to Known every time the modal is freshly opened, regardless of
  // which tab was active on the card that opened it.
  useEffect(() => {
    if (open) setPreviewAudience("Known");
  }, [open]);

  const displayedJourney = hasBothAudiences
    ? [journey, otherAudienceJourney].find((j) => j.audience === previewAudience)
    : journey;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="journey-preview-modal">
        {journey && (
          <>
            <DialogHeader>
              <DialogTitle>{displayedJourney.journeyType}</DialogTitle>
              <Badge variant="outline" className="w-fit">
                {displayedJourney.audience}
              </Badge>
              <DialogDescription data-testid="journey-preview-description">
                {displayedJourney.tooltip}
              </DialogDescription>
            </DialogHeader>

            {hasBothAudiences && (
              <div className="flex p-0.5 rounded-md bg-app-bg border border-border" role="tablist">
                {["Known", "Fastrr Identified"].map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    role="tab"
                    aria-selected={previewAudience === audience}
                    data-testid={`journey-preview-audience-tab-${
                      audience === "Known" ? "known" : "identified"
                    }`}
                    onClick={() => setPreviewAudience(audience)}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                      previewAudience === audience
                        ? "bg-surface text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {audience}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 py-6 overflow-x-auto">
              <div
                className="w-[200px] flex-shrink-0 bg-white border-2 rounded-xl"
                style={{ borderColor: "#6C3AE8" }}
                data-testid="preview-trigger-block"
              >
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: "#6C3AE8" }}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                      Trigger
                    </div>
                    <div className="text-[12px] font-semibold text-text-primary leading-tight">
                      {displayedJourney.triggerLabel}
                    </div>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

              <div
                className="w-[140px] flex-shrink-0 bg-white border-2 rounded-lg"
                style={{ borderColor: "#64748B" }}
                data-testid="preview-wait-block"
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: "#64748B" }}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-wide font-semibold"
                      style={{ color: "#64748B" }}
                    >
                      Wait
                    </div>
                    <div className="text-[12px] font-semibold text-text-primary">{WAIT_LABEL}</div>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

              <div className="w-[240px] flex-shrink-0" data-testid="preview-whatsapp-block">
                <WhatsAppBubblePreview draft={displayedJourney.waDraft} />
              </div>
            </div>

            <div
              className="text-xs text-text-secondary mb-2"
              data-testid="journey-preview-cost"
            >
              {`1 WhatsApp Marketing: ${MARKETING_RATE}`}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => previewToast()}
                data-testid="journey-preview-edit-on-engage"
              >
                Edit on Engage
              </Button>
              <Button
                type="button"
                onClick={() => onActivate(displayedJourney.id)}
                data-testid="journey-preview-activate"
              >
                Activate Now
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
