import React, { useState } from "react";
import { MessageCircle, Mail, MessageSquare, MessageCircleMore, PhoneCall } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const CHANNEL_OPTIONS = [
  { channel: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "#25D366" },
  { channel: "email", label: "Email", Icon: Mail, color: "#3B82F6" },
  { channel: "rcs", label: "RCS", Icon: MessageCircleMore, color: "#6366F1" },
  { channel: "sms", label: "SMS", Icon: MessageSquare, color: "#F59E0B" },
  { channel: "aicallingv2", label: "AI Voice", Icon: PhoneCall, color: "#4F46E5" },
];

export default function ChannelPickerModal({
  open,
  title = "Choose your primary channel",
  excludeChannels = [],
  onSelect,
  onClose,
}) {
  const [selected, setSelected] = useState(null);
  const options = CHANNEL_OPTIONS.filter((o) => !excludeChannels.includes(o.channel));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="channel-picker-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2">
          {options.map(({ channel, label, Icon, color }) => (
            <button
              key={channel}
              type="button"
              data-testid={`channel-option-${channel}`}
              onClick={() => setSelected(channel)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                selected === channel ? "border-primary bg-primary-tint" : "border-border hover:bg-slate-50"
              }`}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </span>
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="channel-picker-continue"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </DialogContent>
    </Dialog>
  );
}
