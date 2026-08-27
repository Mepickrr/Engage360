import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FrequencyCappingTab from "../FrequencyCappingTab";

describe("FrequencyCappingTab", () => {
  test("renders a Mode column with All/Campaign/Journey and Month replacing Week in the period dropdown", () => {
    render(<FrequencyCappingTab />);
    expect(screen.getByText("Mode")).toBeInTheDocument();
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Day-mode")).toBeInTheDocument();

    const periodSelect = screen.getByTestId("fc-rule-whatsapp__All__All__Day-limit-period");
    const optionValues = Array.from(periodSelect.options).map((o) => o.value);
    expect(optionValues).toEqual(["Hour", "Day", "Month"]);
  });

  test("Add rule creates a second rule row for the same channel with a different time range", () => {
    render(<FrequencyCappingTab />);
    fireEvent.click(screen.getByTestId("fc-channel-whatsapp-add-rule"));
    // Default WhatsApp rule is All/All/Day; the next free combo (same type+mode, next period) is All/All/Hour.
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Hour")).toBeInTheDocument();
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Day")).toBeInTheDocument();
  });

  test("two rules can share the same Type and Mode as long as the time range differs (the user's own example)", () => {
    render(<FrequencyCappingTab />);
    fireEvent.click(screen.getByTestId("fc-channel-whatsapp-add-rule"));
    // Both rules are WhatsApp / All / All — one Day, one Hour — which is allowed.
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Day-mode").value).toBe("All");
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Hour-mode").value).toBe("All");
  });

  test("removing a rule deletes only that row", () => {
    render(<FrequencyCappingTab />);
    fireEvent.click(screen.getByTestId("fc-channel-whatsapp-add-rule"));
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Hour")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("fc-rule-whatsapp__All__All__Hour-remove"));
    expect(screen.queryByTestId("fc-rule-whatsapp__All__All__Hour")).not.toBeInTheDocument();
    expect(screen.getByTestId("fc-rule-whatsapp__All__All__Day")).toBeInTheDocument();
  });

  test("a rule's Time Range dropdown never offers a period another rule on the channel already owns, and there is no warning to dismiss", () => {
    render(<FrequencyCappingTab />);
    fireEvent.click(screen.getByTestId("fc-channel-whatsapp-add-rule")); // adds All/All/Hour (Day is already taken)
    const dayRulePeriodSelect = screen.getByTestId("fc-rule-whatsapp__All__All__Day-limit-period");
    const hourRulePeriodSelect = screen.getByTestId("fc-rule-whatsapp__All__All__Hour-limit-period");
    // "Day" rule can still offer "Day" (itself) and "Month", but not "Hour" (taken by the other rule).
    expect(Array.from(dayRulePeriodSelect.options).map((o) => o.value)).toEqual(["Day", "Month"]);
    // "Hour" rule can still offer "Hour" (itself) and "Month", but not "Day" (taken).
    expect(Array.from(hourRulePeriodSelect.options).map((o) => o.value)).toEqual(["Hour", "Month"]);
  });

  test("Add rule is disabled once every Type/Mode/Time-Range combination for a channel is used", () => {
    render(<FrequencyCappingTab />);
    // Mobile Push has 1 Type x 3 Modes x 3 Periods = 9 combos, 1 used by default.
    for (let i = 0; i < 8; i += 1) {
      fireEvent.click(screen.getByTestId("fc-channel-mobilepush-add-rule"));
    }
    expect(screen.getByTestId("fc-channel-mobilepush-add-rule")).toBeDisabled();
  });
});
