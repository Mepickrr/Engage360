import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FallbackTemplateSection } from "../WhatsAppRightPanel";

describe("FallbackTemplateSection", () => {
  it("toggles fallback.enabled via patch", () => {
    const patch = jest.fn();
    render(<FallbackTemplateSection data={{ fallback: { enabled: false, template: null } }} patch={patch} />);
    // The Toggle is a sibling of the Label, inside the flex container
    const labelElement = screen.getByText("Fallback Template").closest("div");
    const toggleElement = labelElement.nextElementSibling;
    fireEvent.click(toggleElement);
    expect(patch).toHaveBeenCalledWith({ fallback: { enabled: true, template: null } });
  });

  it("shows the fallback template name and a Remove action once one is set", () => {
    const patch = jest.fn();
    render(
      <FallbackTemplateSection
        data={{ fallback: { enabled: true, template: { name: "std_fallback_v1" } } }}
        patch={patch}
      />,
    );
    expect(screen.getByText("std_fallback_v1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Remove"));
    expect(patch).toHaveBeenCalledWith({ fallback: { enabled: true, template: null } });
  });

  it("shows a picker prompt when enabled with no template chosen yet", () => {
    render(<FallbackTemplateSection data={{ fallback: { enabled: true, template: null } }} patch={jest.fn()} />);
    expect(screen.getByText("Click to select approved fallback template")).toBeInTheDocument();
  });
});
