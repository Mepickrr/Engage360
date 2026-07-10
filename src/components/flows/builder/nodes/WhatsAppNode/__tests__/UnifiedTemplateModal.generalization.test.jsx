import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnifiedTemplateModal from "../UnifiedTemplateModal";

const noop = () => {};

const FAKE_REGISTRY = {
  fake_style: {
    defaultDraft: { name: "", body: "" },
    mockTemplates: [{ id: "fake_1", name: "Fake Template", body: "Fake body" }],
    isValid: (draft) => Boolean(draft.name),
  },
};

function FakePreview({ draft }) {
  return <div data-testid="fake-preview">{draft.body}</div>;
}

describe("UnifiedTemplateModal generalization", () => {
  it("uses a custom configRegistry instead of the WhatsApp TEMPLATE_STYLE_CONFIGS", () => {
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        onSave={noop}
        onClose={noop}
      />
    );
    expect(screen.getByText("Fake Template")).toBeInTheDocument();
  });

  it("renders customFormRenderer instead of the generic field form, and PreviewComponent instead of WhatsAppBubblePreview", () => {
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        PreviewComponent={FakePreview}
        customFormRenderer={({ draft, patch }) => (
          <input
            placeholder="fake name field"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        )}
        onSave={noop}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByPlaceholderText("fake name field")).toBeInTheDocument();
    expect(screen.getByTestId("fake-preview")).toBeInTheDocument();
  });

  it("disables Save until config.isValid passes, and calls onSave with the draft once valid", () => {
    const onSave = jest.fn();
    render(
      <UnifiedTemplateModal
        open
        styleId="fake_style"
        styleLabel="Fake"
        configRegistry={FAKE_REGISTRY}
        customFormRenderer={({ draft, patch }) => (
          <input
            placeholder="fake name field"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        )}
        onSave={onSave}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("fake name field"), { target: { value: "Named" } });
    expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Named" }));
  });

  it("still resolves styleId through the default TEMPLATE_STYLE_CONFIGS when configRegistry is omitted (WhatsApp path unchanged)", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    expect(screen.getByText("TRUST_NOTE_J")).toBeInTheDocument();
  });
});
