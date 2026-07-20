import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DateRelativeTriggerContent, {
  emptyDateConfig,
  getAttributeLabel,
} from "../DateRelativeTriggerContent";

function Harness({ initial }) {
  const [dateConfig, setDateConfig] = useState(initial);
  return <DateRelativeTriggerContent dateConfig={dateConfig} setDateConfig={setDateConfig} />;
}

describe("emptyDateConfig", () => {
  it("defaults to no attribute selected, before/7/days, repeat annually on", () => {
    expect(emptyDateConfig()).toEqual({
      attribute: "",
      customFieldKey: "",
      direction: "before",
      value: 7,
      unit: "days",
      repeat_annually: true,
    });
  });

  it("pre-selects the given attribute", () => {
    expect(emptyDateConfig("date_of_birth").attribute).toBe("date_of_birth");
  });
});

describe("getAttributeLabel", () => {
  it("resolves known attribute keys to display labels", () => {
    expect(getAttributeLabel("date_of_birth")).toBe("Date of Birth");
    expect(getAttributeLabel("custom_date_attribute")).toBe("Custom date attribute");
  });
});

describe("DateRelativeTriggerContent — custom date field", () => {
  it("shows the custom field key input when attribute is custom_date_attribute", () => {
    render(<Harness initial={emptyDateConfig("custom_date_attribute")} />);
    expect(screen.getByTestId("date-relative-custom-field-key")).toBeInTheDocument();
  });

  it("hides the custom field key input for a standard attribute", () => {
    render(<Harness initial={emptyDateConfig("date_of_birth")} />);
    expect(screen.queryByTestId("date-relative-custom-field-key")).not.toBeInTheDocument();
  });

  it("updates customFieldKey as the seller types", () => {
    render(<Harness initial={emptyDateConfig("custom_date_attribute")} />);
    fireEvent.change(screen.getByTestId("date-relative-custom-field-key"), {
      target: { value: "subscription_renewal_date" },
    });
    expect(screen.getByTestId("date-relative-custom-field-key")).toHaveValue("subscription_renewal_date");
  });
});
