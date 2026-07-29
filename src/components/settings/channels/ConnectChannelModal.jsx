import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHANNEL_TYPES } from "./channelIcons";
import { CONNECT_CHANNEL_GROUPS } from "./data/mockChannels";

function findType(typeId) {
  for (const group of CONNECT_CHANNEL_GROUPS) {
    const found = group.types.find((t) => t.id === typeId);
    if (found) return found;
  }
  return null;
}

export default function ConnectChannelModal({ open, onClose, onConnect }) {
  const [step, setStep] = useState({ type: "picker" });

  const handleClose = () => {
    setStep({ type: "picker" });
    onClose();
  };

  const selectedType = step.type === "form" ? findType(step.typeId) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl" data-testid="connect-channel-modal">
        {step.type === "picker" ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect channels</DialogTitle>
              <p className="text-[13px] text-text-secondary">Please choose a channel and the type of message you'd like to send</p>
            </DialogHeader>
            <div className="space-y-6">
              {CONNECT_CHANNEL_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="text-[13px] font-semibold text-text-primary mb-2">{group.group}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {group.types.map((t) => {
                      const meta = CHANNEL_TYPES[t.id];
                      const Icon = meta.Icon;
                      return (
                        <div key={t.id} data-testid={`connect-type-${t.id}`} className="border border-border rounded-lg p-4 flex flex-col gap-2">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                          </div>
                          <div className="text-[13px] font-semibold text-text-primary">{meta.label}</div>
                          <p className="text-[11px] text-text-muted flex-1">{t.desc}</p>
                          <button
                            type="button"
                            onClick={() => setStep({ type: "form", typeId: t.id })}
                            data-testid={`connect-type-${t.id}-btn`}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-primary text-primary hover:bg-primary-tint"
                          >
                            Connect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button type="button" onClick={() => setStep({ type: "picker" })} data-testid="connect-form-back" className="text-[12px] text-text-secondary mb-1 text-left">← Back</button>
              <DialogTitle>Connect {CHANNEL_TYPES[selectedType.id].label}</DialogTitle>
            </DialogHeader>
            <button type="button" onClick={handleClose} className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary w-fit">Cancel</button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
