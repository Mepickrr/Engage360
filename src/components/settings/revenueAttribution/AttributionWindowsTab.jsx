import React, { useState } from "react";
import { previewToast } from "@/components/common/PreviewHeader";
import { Pencil, Save, Lock, Megaphone, Share2, Info } from "lucide-react";

const ATTRIBUTION_TYPES = ["First Click", "Last Click", "Open", "Delivered"];

// Helpdesk and AI agents are hidden for now — not ready to surface attribution
// for those sources yet.
const INITIAL_CARDS = [
  { id: "campaigns", label: "Campaigns", Icon: Megaphone, window: 3, type: "First Click" },
  { id: "journeys", label: "Journeys", Icon: Share2, window: 3, type: "First Click" },
];

function AttributionCard({ card, editing, onChange }) {
  const { id, label, Icon, window: windowDays, type } = card;

  return (
    <div className="bg-surface border border-border rounded-lg p-5" data-testid={`revenue-attribution-card-${id}`}>
      <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border">
        <span className="w-8 h-8 rounded-md bg-slate-50 border border-border flex items-center justify-center">
          <Icon className="w-4 h-4 text-text-secondary" />
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <span>Your attribution window is</span>
          <span className="relative">
            <input
              type="number"
              min={1}
              disabled={!editing}
              value={windowDays}
              onChange={(e) => onChange(id, { window: e.target.value === "" ? "" : Math.max(1, Number(e.target.value)) })}
              data-testid={`revenue-attribution-${id}-window`}
              className="w-16 px-2 py-1.5 pr-6 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
            />
            {!editing && <Lock className="w-3 h-3 text-text-muted absolute right-1.5 top-1/2 -translate-y-1/2" />}
          </span>
          <span>days</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-text-primary">
          <span>Your attribution Type is based on </span>
          <select
            disabled={!editing}
            value={type}
            onChange={(e) => onChange(id, { type: e.target.value })}
            data-testid={`revenue-attribution-${id}-type`}
            className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
          >
            {ATTRIBUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function AttributionWindowsTab() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [editing, setEditing] = useState(false);

  function handleChange(id, patch) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function handleEditToggle() {
    if (editing) previewToast();
    setEditing((v) => !v);
  }

  return (
    <div data-testid="settings-revenue-attribution-windows">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Revenue attribution</h2>
          <p className="text-sm text-text-secondary mt-1">
            Define how revenue will be attributed what attribution window will be{" "}
            <button
              type="button"
              onClick={() => previewToast()}
              data-testid="revenue-attribution-learn-more"
              className="text-primary underline hover:text-primary-hover"
            >
              Learn more
            </button>
          </p>
        </div>
        <button
          type="button"
          onClick={handleEditToggle}
          data-testid="revenue-attribution-edit"
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium flex-shrink-0"
        >
          {editing ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          {editing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <AttributionCard key={card.id} card={card} editing={editing} onChange={handleChange} />
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 bg-slate-50 border border-border rounded-lg p-4">
        <Info className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
        <ul className="text-[12px] text-text-secondary space-y-1.5">
          <li>
            <span className="font-semibold text-text-primary">First Click:</span> attributes orders to a message
            based on the first link a customer clicks within a specific window, even if they click other links
            afterwards.
          </li>
          <li>
            <span className="font-semibold text-text-primary">Last Click:</span> attributes orders to a message
            based on the most recent link a customer clicked within a specific window before placing the order.
          </li>
          <li>
            <span className="font-semibold text-text-primary">Open:</span> attributes orders to a message if
            placed within a specific window after the customer opens the message.
          </li>
          <li>
            <span className="font-semibold text-text-primary">Delivered:</span> attributes orders to a message
            if placed within a specific window after the message is delivered to the customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
