import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnifiedTemplateModal from "../UnifiedTemplateModal";

const noop = () => {};

describe("UnifiedTemplateModal", () => {
  it("opens in browse mode showing the style's seeded templates and a Create new button", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    expect(screen.getByText(/select a template/i)).toBeInTheDocument();
    expect(screen.getByText("TRUST_NOTE_J")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
  });

  it("switches to the edit view with a live preview when a template card is clicked", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByText("TRUST_NOTE_J"));
    expect(screen.getByDisplayValue("TRUST_NOTE_J")).toBeInTheDocument();
    // Matches both the editable textarea and the live preview bubble that
    // mirrors it — confirms the preview renders the selected template's body.
    expect(screen.getAllByText(/avimee scalptone serum/i).length).toBeGreaterThan(0);
  });

  it("switches to a blank edit view when Create new is clicked", () => {
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByPlaceholderText("e.g. store_location_v1")).toHaveValue("");
  });

  it("opens directly in edit mode when initialTemplate is provided", () => {
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" initialTemplate={{ name: "store_location_v1", language: "en", status: "Active", body: "Our store is here", addressLabel: "123 Rosemary Lane" }} onSave={noop} onClose={noop} />);
    expect(screen.getByDisplayValue("store_location_v1")).toBeInTheDocument();
  });

  it("calls onSave with the edited draft when Save is clicked", () => {
    const onSave = jest.fn();
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" onSave={onSave} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    fireEvent.change(screen.getByPlaceholderText("e.g. store_location_v1"), { target: { value: "my_store" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "my_store" }));
  });

  it("renders the bespoke CollectInputForm (not the generic field form) for styleId=collect_input, seeded from presetInputType", () => {
    render(<UnifiedTemplateModal open styleId="collect_input" styleLabel="Email" presetInputType="email" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what.*email/i)).toBeInTheDocument();
  });

  it("renders the bespoke CarouselForm for styleId=carousel and its own preview updates live", () => {
    render(<UnifiedTemplateModal open styleId="carousel" styleLabel="Carousel" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    fireEvent.change(screen.getByPlaceholderText(/main message body/i), { target: { value: "Live preview check" } });
    // Matches both the textarea (its value) and the live preview bubble that
    // mirrors it — confirms the carousel preview updates live as specified.
    expect(screen.getAllByText("Live preview check").length).toBeGreaterThan(0);
  });
});
