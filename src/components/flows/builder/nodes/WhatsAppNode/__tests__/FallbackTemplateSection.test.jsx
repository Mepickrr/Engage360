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

  it("calls onSaveCustomTemplate with the saved template when a new fallback template is created", () => {
    const patch = jest.fn();
    const onSaveCustomTemplate = jest.fn();
    render(
      <FallbackTemplateSection
        data={{ fallback: { enabled: true, template: null } }}
        patch={patch}
        onSaveCustomTemplate={onSaveCustomTemplate}
      />,
    );

    // Open the fallback picker modal.
    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    // Start a new template draft.
    fireEvent.click(screen.getByText("+ Create new"));
    // Save the (blank) draft.
    fireEvent.click(screen.getByText("Save"));

    expect(onSaveCustomTemplate).toHaveBeenCalledTimes(1);
    const savedTpl = onSaveCustomTemplate.mock.calls[0][0];
    expect(savedTpl.id).toMatch(/^tpl_standard_/);
    // patch() should also receive the same template on fallback.template, as before.
    expect(patch).toHaveBeenCalledWith({ fallback: { enabled: true, template: savedTpl } });
  });

  it("does not throw when onSaveCustomTemplate is not provided (standalone usage)", () => {
    const patch = jest.fn();
    render(
      <FallbackTemplateSection data={{ fallback: { enabled: true, template: null } }} patch={patch} />,
    );

    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    fireEvent.click(screen.getByText("+ Create new"));
    expect(() => fireEvent.click(screen.getByText("Save"))).not.toThrow();
  });

  it("passes customTemplates through to the fallback UnifiedTemplateModal's browse view", () => {
    const customTemplates = [
      { id: "custom_fallback_1", name: "my_custom_fallback", body: "Custom fallback body" },
    ];
    render(
      <FallbackTemplateSection
        data={{ fallback: { enabled: true, template: null } }}
        patch={jest.fn()}
        customTemplates={customTemplates}
      />,
    );

    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    expect(screen.getByText("my_custom_fallback")).toBeInTheDocument();
  });
});
