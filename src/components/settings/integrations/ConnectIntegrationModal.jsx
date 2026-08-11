import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INTEGRATION_TYPES, CONNECT_INTEGRATION_GROUPS } from "./data/mockIntegrations";

function findType(typeId) {
  for (const group of CONNECT_INTEGRATION_GROUPS) {
    const found = group.types.find((t) => t.id === typeId);
    if (found) return found;
  }
  return null;
}

export default function ConnectIntegrationModal({ open, onClose, onConnect, initialTypeId, connectedIds = [] }) {
  const [step, setStep] = useState(initialTypeId ? { type: "form", typeId: initialTypeId } : { type: "picker" });

  useEffect(() => {
    if (open) setStep(initialTypeId ? { type: "form", typeId: initialTypeId } : { type: "picker" });
  }, [open, initialTypeId]);

  const handleClose = () => onClose();

  const selectedType = step.type === "form" ? findType(step.typeId) : null;

  const visibleGroups = CONNECT_INTEGRATION_GROUPS.map((group) => ({
    ...group,
    types: group.types.filter((t) => !connectedIds.includes(t.id)),
  })).filter((group) => group.types.length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="connect-integration-modal">
        {step.type === "picker" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create new integration</DialogTitle>
              <p className="text-[13px] text-text-secondary">Choose an integration to connect to your store</p>
            </DialogHeader>
            <div className="space-y-6">
              {visibleGroups.map((group) => (
                <div key={group.group}>
                  <div className="text-[13px] font-semibold text-text-primary mb-2">{group.group}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {group.types.map((t) => {
                      const meta = INTEGRATION_TYPES[t.id];
                      const Icon = meta.Icon;
                      return (
                        <div key={`${group.group}-${t.id}`} data-testid={`connect-integration-type-${t.id}`} className="border border-border rounded-lg p-4 flex flex-col gap-2">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                          </div>
                          <div className="text-[13px] font-semibold text-text-primary">{meta.label}</div>
                          <p className="text-[11px] text-text-muted flex-1">{t.desc}</p>
                          <button
                            type="button"
                            onClick={() => setStep({ type: "form", typeId: t.id })}
                            data-testid={`connect-integration-type-${t.id}-btn`}
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
          <ConnectForm
            type={selectedType}
            showBack={!initialTypeId}
            onBack={() => setStep({ type: "picker" })}
            onConnect={(values) => { onConnect(step.typeId, values); handleClose(); }}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectForm({ type, showBack, onBack, onConnect, onCancel }) {
  const [value, setValue] = useState("");
  const meta = INTEGRATION_TYPES[type.id];

  return (
    <>
      <DialogHeader>
        {showBack && (
          <button type="button" onClick={onBack} data-testid="connect-integration-form-back" className="text-[12px] text-text-secondary mb-1 text-left">← Back</button>
        )}
        <DialogTitle>Connect {meta.label}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 max-w-sm">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{type.formField.label}</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type.formField.placeholder}
            data-testid="connect-integration-form-input"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} data-testid="connect-integration-form-cancel" className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary">Cancel</button>
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => onConnect({ [type.formField.key]: value.trim() })}
            data-testid="connect-integration-form-submit"
            className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        </div>
      </div>
    </>
  );
}
