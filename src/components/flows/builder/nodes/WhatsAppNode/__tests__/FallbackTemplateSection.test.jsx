import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FallbackTemplateSection, normalizeFallback } from "../WhatsAppRightPanel";

const emptyFallback = {
  disabled: { enabled: false, action: "template", template: null },
  categoryChanged: { enabled: false, action: "template", template: null },
};

describe("normalizeFallback", () => {
  it("returns default shape when fallback is missing", () => {
    expect(normalizeFallback(undefined)).toEqual(emptyFallback);
  });

  it("migrates the legacy { enabled, template } shape into the 'disabled' trigger", () => {
    const legacyTemplate = { name: "std_fallback_v1" };
    expect(normalizeFallback({ enabled: true, template: legacyTemplate })).toEqual({
      disabled: { enabled: true, action: "template", template: legacyTemplate },
      categoryChanged: { enabled: false, action: "template", template: null },
    });
  });

  it("passes through the new shape untouched (filling in any missing keys)", () => {
    const fallback = {
      disabled: { enabled: true, action: "opt_out" },
      categoryChanged: { enabled: true, action: "template", template: { name: "cat_fallback" } },
    };
    expect(normalizeFallback(fallback)).toEqual({
      disabled: { enabled: true, action: "opt_out", template: null },
      categoryChanged: { enabled: true, action: "template", template: { name: "cat_fallback" } },
    });
  });
});

describe("FallbackTemplateSection", () => {
  it("toggles the disabled/paused trigger via patch", () => {
    const patch = jest.fn();
    render(<FallbackTemplateSection data={{ fallback: emptyFallback }} patch={patch} />);
    const toggleElement = screen.getByText("When template is disabled or paused by Meta").nextElementSibling;
    fireEvent.click(toggleElement);
    expect(patch).toHaveBeenCalledWith({
      fallback: { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } },
    });
  });

  it("toggles the category-changed trigger independently from the disabled/paused trigger", () => {
    const patch = jest.fn();
    render(<FallbackTemplateSection data={{ fallback: emptyFallback }} patch={patch} />);
    const toggleElement = screen.getByText("When template category changes").nextElementSibling;
    fireEvent.click(toggleElement);
    expect(patch).toHaveBeenCalledWith({
      fallback: { ...emptyFallback, categoryChanged: { enabled: true, action: "template", template: null } },
    });
  });

  it("shows a picker prompt for the template action when enabled with no template chosen yet", () => {
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } };
    render(<FallbackTemplateSection data={{ fallback }} patch={jest.fn()} />);
    expect(screen.getByText("Click to select approved fallback template")).toBeInTheDocument();
  });

  it("shows the fallback template name and a Remove action once one is set", () => {
    const patch = jest.fn();
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: { name: "std_fallback_v1" } } };
    render(<FallbackTemplateSection data={{ fallback }} patch={patch} />);
    expect(screen.getByText("std_fallback_v1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Remove"));
    expect(patch).toHaveBeenCalledWith({
      fallback: { ...fallback, disabled: { ...fallback.disabled, template: null } },
    });
  });

  it("switches to the opt-out action and shows the fixed opt-out line", () => {
    const patch = jest.fn();
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } };
    render(<FallbackTemplateSection data={{ fallback }} patch={patch} />);
    fireEvent.click(screen.getByText("Keep existing content + add opt-out line"));
    expect(patch).toHaveBeenCalledWith({
      fallback: { ...fallback, disabled: { ...fallback.disabled, action: "opt_out" } },
    });
  });

  it("renders the fixed opt-out line read-only when action is opt_out", () => {
    const fallback = { ...emptyFallback, categoryChanged: { enabled: true, action: "opt_out", template: null } };
    render(<FallbackTemplateSection data={{ fallback }} patch={jest.fn()} />);
    expect(screen.getByText(/Reply STOP to unsubscribe from promotional messages\./)).toBeInTheDocument();
  });

  it("calls onSaveCustomTemplate with the saved template when a new fallback template is created for the disabled trigger", () => {
    const patch = jest.fn();
    const onSaveCustomTemplate = jest.fn();
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } };
    render(
      <FallbackTemplateSection
        data={{ fallback }}
        patch={patch}
        onSaveCustomTemplate={onSaveCustomTemplate}
      />,
    );

    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    fireEvent.click(screen.getByText("+ Create new"));
    fireEvent.click(screen.getByText("Save"));

    expect(onSaveCustomTemplate).toHaveBeenCalledTimes(1);
    const savedTpl = onSaveCustomTemplate.mock.calls[0][0];
    expect(savedTpl.id).toMatch(/^tpl_standard_/);
    expect(patch).toHaveBeenCalledWith({
      fallback: { ...fallback, disabled: { ...fallback.disabled, template: savedTpl } },
    });
  });

  it("does not throw when onSaveCustomTemplate is not provided (standalone usage)", () => {
    const patch = jest.fn();
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } };
    render(<FallbackTemplateSection data={{ fallback }} patch={patch} />);

    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    fireEvent.click(screen.getByText("+ Create new"));
    expect(() => fireEvent.click(screen.getByText("Save"))).not.toThrow();
  });

  it("passes customTemplates through to the fallback UnifiedTemplateModal's browse view", () => {
    const customTemplates = [
      { id: "custom_fallback_1", name: "my_custom_fallback", body: "Custom fallback body" },
    ];
    const fallback = { ...emptyFallback, disabled: { enabled: true, action: "template", template: null } };
    render(
      <FallbackTemplateSection
        data={{ fallback }}
        patch={jest.fn()}
        customTemplates={customTemplates}
      />,
    );

    fireEvent.click(screen.getByText("Click to select approved fallback template"));
    expect(screen.getByText("my_custom_fallback")).toBeInTheDocument();
  });

  it("migrates legacy fallback data on render", () => {
    render(
      <FallbackTemplateSection
        data={{ fallback: { enabled: true, template: { name: "legacy_tpl" } } }}
        patch={jest.fn()}
      />,
    );
    expect(screen.getByText("legacy_tpl")).toBeInTheDocument();
  });
});
