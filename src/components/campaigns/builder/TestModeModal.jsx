import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TestModeModal({ open, onClose }) {
  const [phone, setPhone] = useState("");

  const handleSend = () => {
    if (!phone.trim()) return;
    toast.success(`Test message sent to ${phone}`);
    setPhone("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="test-mode-modal" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send a test message</DialogTitle>
        </DialogHeader>
        <input
          type="tel"
          data-testid="test-mode-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-3"
        />
        <button
          type="button"
          data-testid="test-mode-send-btn"
          disabled={!phone.trim()}
          onClick={handleSend}
          className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40"
        >
          Send Test
        </button>
      </DialogContent>
    </Dialog>
  );
}
