import React from "react";
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
  // Dual mode is listing-page-only (JourneyListingCard passes the sibling
  // audience variant); the dashboard's JourneysTable never passes this prop,
  // so its rendering below is untouched.
  const isDual = open && !!otherAudienceJourney;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={isDual ? "max-w-3xl" : "max-w-2xl"} data-testid="journey-preview-modal">
        {journey && (
          <>
            <DialogHeader>
              <DialogTitle>{journey.journeyType}</DialogTitle>
              {!isDual && (
                <>
                  <Badge variant="outline" className="w-fit">
                    {journey.audience}
                  </Badge>
                  <DialogDescription data-testid="journey-preview-description">
                    {journey.tooltip}
                  </DialogDescription>
                </>
              )}
            </DialogHeader>

            {isDual ? (
              <div className="py-4" data-testid="preview-dual-audience">
                <p className="text-xs text-text-secondary text-center mb-4">
                  {`Both reach the same moment after the same ${WAIT_LABEL} wait — only the audience and message differ.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[journey, otherAudienceJourney].map((j) => (
                    <div
                      key={j.id}
                      className="border border-border rounded-lg p-3"
                      data-testid={`preview-dual-block-${j.id}`}
                    >
                      <Badge variant="outline" className="w-fit mb-2">
                        {j.audience}
                      </Badge>
                      <div className="text-[11px] font-semibold text-text-primary mb-2 leading-tight">
                        {j.triggerLabel}
                      </div>
                      <WhatsAppBubblePreview draft={j.waDraft} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
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
                        {journey.triggerLabel}
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
                  <WhatsAppBubblePreview draft={journey.waDraft} />
                </div>
              </div>
            )}

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
                onClick={() => onActivate(journey.id)}
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
