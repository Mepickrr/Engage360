import React, { useState } from "react";
import { X } from "lucide-react";

export default function EmailChipInput({ value, onChange, placeholder, testId = "email-chip-input" }) {
  const [text, setText] = useState("");

  function commit(raw) {
    const chip = raw.trim();
    if (!chip) return;
    if (value.includes(chip)) {
      setText("");
      return;
    }
    onChange([...value, chip]);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(text);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeChip(chip) {
    onChange(value.filter((v) => v !== chip));
  }

  return (
    <div
      data-testid={testId}
      className="w-full min-h-[42px] px-2 py-1.5 border border-border rounded-md flex flex-wrap items-center gap-1.5 focus-within:ring-1 focus-within:ring-ring"
    >
      {value.map((chip) => (
        <span
          key={chip}
          data-testid={`${testId}-chip-${chip}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-slate-100 text-text-secondary"
        >
          {chip}
          <button
            type="button"
            data-testid={`${testId}-remove-${chip}`}
            onClick={() => removeChip(chip)}
            aria-label={`Remove ${chip}`}
            className="hover:text-rose-600"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        data-testid={`${testId}-input`}
        value={text}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(text)}
        className="flex-1 min-w-[120px] text-sm outline-none py-0.5"
      />
    </div>
  );
}
