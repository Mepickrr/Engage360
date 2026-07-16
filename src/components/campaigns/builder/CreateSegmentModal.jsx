import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function CreateSegmentModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreated({
      id: `bseg_custom_${Date.now()}`,
      name: name.trim(),
      userCount: 0,
      type: "dynamic",
      updatedAt: "just now",
      source: "Custom Segment",
    });
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="create-segment-modal" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create new segment</DialogTitle>
        </DialogHeader>
        <div>
          <label className="block text-[12px] font-medium text-text-secondary mb-1">Segment name</label>
          <input
            type="text"
            autoFocus
            data-testid="segment-name-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. High Intent Shoppers"
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-text-muted mt-2">
            You&apos;ll be able to define filters and rules for this segment from the Live Segments page.
          </p>
        </div>
        <DialogFooter>
          <button
            type="button"
            data-testid="create-segment-submit"
            disabled={!name.trim()}
            onClick={handleCreate}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create segment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
