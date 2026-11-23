import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplateGalleryPanel from "../TemplateGalleryPanel";
import { WHATSAPP_CATALOG_TEMPLATES } from "../templateCatalog";

describe("TemplateGalleryPanel", () => {
  it("renders a card for every catalog template", () => {
    render(<TemplateGalleryPanel onSelect={jest.fn()} onEdit={jest.fn()} />);
    WHATSAPP_CATALOG_TEMPLATES.forEach((t) => {
      expect(screen.getByTestId(`gallery-card-${t.id}`)).toBeInTheDocument();
    });
  });

  it("calls onSelect with the raw catalog entry when Confirm is clicked", () => {
    const onSelect = jest.fn();
    render(<TemplateGalleryPanel onSelect={onSelect} onEdit={jest.fn()} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-confirm-${first.id}`));
    expect(onSelect).toHaveBeenCalledWith(first);
  });

  it("calls onEdit with the raw catalog entry when Edit is clicked", () => {
    const onEdit = jest.fn();
    render(<TemplateGalleryPanel onSelect={jest.fn()} onEdit={onEdit} />);
    const first = WHATSAPP_CATALOG_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`gallery-edit-${first.id}`));
    expect(onEdit).toHaveBeenCalledWith(first);
  });
});
