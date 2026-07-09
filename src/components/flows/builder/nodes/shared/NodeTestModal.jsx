import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MOCK_TEST_USERS, CHANNEL_INPUT } from "./mockTestUsers";

export default function NodeTestModal({ open, onClose, channel }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [manualEntry, setManualEntry] = useState("");

  const inputCfg = CHANNEL_INPUT[channel] ?? CHANNEL_INPUT.whatsapp;

  const toggleUser = (id) =>
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const recipientCount = selectedUserIds.length + (manualEntry.trim() ? 1 : 0);

  const handleRun = () => {
    if (recipientCount === 0) return;
    toast.success(`Test triggered for ${recipientCount} recipient${recipientCount > 1 ? "s" : ""}`);
    setSelectedUserIds([]);
    setManualEntry("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="node-test-modal" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Test this step</DialogTitle>
        </DialogHeader>

        <div className="text-[12px] font-medium text-text-primary mb-1.5">Select system users</div>
        <div className="border border-border rounded-md max-h-40 overflow-y-auto mb-3">
          {MOCK_TEST_USERS.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedUserIds.includes(u.id)}
                onChange={() => toggleUser(u.id)}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-text-primary truncate">{u.name}</div>
                <div className="text-[10px] text-text-muted truncate">
                  {channel === "email" ? u.email : u.phone}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="text-[12px] font-medium text-text-primary mb-1.5">
          Or add an external {inputCfg.label.toLowerCase()}
        </div>
        <input
          type={inputCfg.type}
          data-testid="node-test-manual-input"
          value={manualEntry}
          onChange={(e) => setManualEntry(e.target.value)}
          placeholder={inputCfg.placeholder}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4"
        />

        <button
          type="button"
          data-testid="node-test-run-btn"
          disabled={recipientCount === 0}
          onClick={handleRun}
          className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40"
        >
          Run test{recipientCount > 0 ? ` (${recipientCount})` : ""}
        </button>
      </DialogContent>
    </Dialog>
  );
}
