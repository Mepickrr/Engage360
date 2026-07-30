import React, { useState } from "react";
import { Info } from "lucide-react";

export default function SecurityTab() {
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState(30);

  return (
    <div data-testid="security-tab">
      <h2 className="text-base font-semibold text-text-primary mb-4">Secure your platform</h2>

      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            data-testid="security-session-toggle"
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
              enabled ? "bg-primary" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                enabled ? "translate-x-5" : ""
              }`}
            />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-text-primary">Session duration</span>
              <Info
                className="w-3.5 h-3.5 text-text-muted"
                title="Controls how long a user can stay signed in without activity before they're logged out automatically."
              />
            </div>
            <p className="text-[12px] text-text-secondary mt-1 max-w-xl">
              After logging in, users stay signed in until they choose to sign out. Turn this on to
              automatically sign users out after a period of inactivity.
            </p>

            {enabled && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min={1}
                  data-testid="security-session-days-input"
                  value={days}
                  onChange={(e) => setDays(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                  className="w-24 px-3 py-2 border border-border rounded-md text-sm"
                />
                <span className="text-sm font-semibold text-text-primary">Days</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
