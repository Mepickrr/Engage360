import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UserPropertyConditionsV1 from "@/components/flows/builder/trigger/audience/UserPropertyConditions";
import UserPropertyConditionsV2 from "@/components/flows/builder/triggerV2/audience/UserPropertyConditions";

// Segments, Flow Builder v1 and Flow Builder v2 all show the Shiprocket Buyer
// attributes as "Fastrr Signals", with an inline tag — no provider required.
describe.each([
  ["v1 (Flow Builder)", UserPropertyConditionsV1],
  ["v2 (Flow Builder V2 + Segments)", UserPropertyConditionsV2],
])("UserPropertyConditions %s", (_, UserPropertyConditions) => {
  const block = { combinator: "AND", conditions: [{ property: "LIFETIME_AOV", operator: "", value: "" }] };

  it("tags a selected Fastrr Signals attribute inline", () => {
    render(<UserPropertyConditions block={block} onChange={() => {}} testIdPrefix="t" />);
    expect(screen.getByTestId("t-0-attr-trigger")).toHaveTextContent("LIFETIME_AOVFastrr Signals");
  });

  it("lists the group as Fastrr Signals, not Shiprocket Buyer", () => {
    render(<UserPropertyConditions block={block} onChange={() => {}} testIdPrefix="t" />);
    fireEvent.click(screen.getByTestId("t-0-attr-trigger"));
    const list = screen.getByTestId("t-0-attr-list");
    expect(list).toHaveTextContent("Fastrr Signals");
    expect(list).not.toHaveTextContent("Shiprocket Buyer");
  });
});
