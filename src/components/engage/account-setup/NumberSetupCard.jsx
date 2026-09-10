import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_VIRTUAL_NUMBERS } from "./data";

const MODES = [
  { value: "has_number", label: "I have a number" },
  { value: "needs_virtual_number", label: "Need a virtual number" },
  { value: "has_app", label: "I have an app" },
];

export default function NumberSetupCard({
  mode,
  onModeChange,
  numberValue,
  onNumberValueChange,
  virtualNumberValue,
  onVirtualNumberChange,
  appId,
  onAppIdChange,
  apiKeySecret,
  onApiKeySecretChange,
}) {
  return (
    <div
      className="bg-primary-tint border border-primary/20 rounded-lg p-3 mb-4"
      data-testid="number-setup-card"
    >
      <h4 className="text-[13px] font-semibold text-text-primary mb-2">
        Connect Your WhatsApp Number
      </h4>

      <div className="grid grid-cols-3 gap-1 mb-3" data-testid="number-setup-mode-toggle">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            data-testid={`number-setup-mode-${m.value}`}
            onClick={() => onModeChange(m.value)}
            className={`text-[10px] font-medium px-2 py-1.5 rounded-md leading-tight transition-colors ${
              mode === m.value
                ? "bg-primary text-white"
                : "bg-white text-text-secondary border border-border"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "has_number" && (
        <div className="flex items-center gap-2" data-testid="number-setup-has-number-fields">
          <span className="text-[13px] text-text-secondary">+91</span>
          <Input
            value={numberValue}
            onChange={(e) => onNumberValueChange(e.target.value)}
            placeholder="98765 43210"
            data-testid="number-setup-phone-input"
            className="bg-white"
          />
        </div>
      )}

      {mode === "needs_virtual_number" && (
        <div data-testid="number-setup-virtual-number-fields">
          <Select value={virtualNumberValue} onValueChange={onVirtualNumberChange}>
            <SelectTrigger data-testid="number-setup-virtual-number-select" className="bg-white">
              <SelectValue placeholder="Choose a virtual number" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_VIRTUAL_NUMBERS.map((vn) => (
                <SelectItem key={vn.number} value={vn.number}>
                  {`${vn.number} — ${vn.priceLabel}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode === "has_app" && (
        <div className="flex flex-col gap-2" data-testid="number-setup-has-app-fields">
          <Input
            value={appId}
            onChange={(e) => onAppIdChange(e.target.value)}
            placeholder="App ID"
            data-testid="number-setup-app-id-input"
            className="bg-white"
          />
          <Input
            type="password"
            value={apiKeySecret}
            onChange={(e) => onApiKeySecretChange(e.target.value)}
            placeholder="API Key Secret"
            data-testid="number-setup-api-key-input"
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
}
