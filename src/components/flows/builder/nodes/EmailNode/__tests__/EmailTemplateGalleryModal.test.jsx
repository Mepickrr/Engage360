import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailTemplateGalleryModal from "../EmailTemplateGalleryModal";
import { MOCK_EMAIL_TEMPLATES } from "../data/mockData";

const noop = () => {};

describe("EmailTemplateGalleryModal", () => {
  it("renders nothing when closed", () => {
    render(<EmailTemplateGalleryModal open={false} templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    expect(screen.queryByText("Select Email Template")).not.toBeInTheDocument();
  });

  it("shows the gallery title, a Create new button, and every seeded template's name", () => {
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    expect(screen.getByText("Select Email Template")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
    expect(screen.getByText("Cart Recovery — Minimal")).toBeInTheDocument();
    expect(screen.getByText("Welcome Series — Day 1")).toBeInTheDocument();
  });

  it("filters templates by the search input", () => {
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/search templates/i), { target: { value: "welcome" } });
    expect(screen.getByText("Welcome Series — Day 1")).toBeInTheDocument();
    expect(screen.queryByText("Cart Recovery — Minimal")).not.toBeInTheDocument();
  });

  it("calls onSelect with the clicked template", () => {
    const onSelect = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={onSelect} onCreateNew={noop} onClose={noop} />);
    fireEvent.click(screen.getByText("Cart Recovery — Minimal"));
    expect(onSelect).toHaveBeenCalledWith(MOCK_EMAIL_TEMPLATES[0]);
  });

  it("calls onCreateNew when the Create new button is clicked", () => {
    const onCreateNew = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={onCreateNew} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("calls onClose when Cancel or the close button is clicked", () => {
    const onClose = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
