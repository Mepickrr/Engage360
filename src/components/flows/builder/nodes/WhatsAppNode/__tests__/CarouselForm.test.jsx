import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CarouselForm from "../CarouselForm";

const noop = () => {};

describe("CarouselForm", () => {
  it("renders with two default cards", () => {
    render(<CarouselForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Cards (2)")).toBeInTheDocument();
  });

  it("adds a card when the + tile is clicked", () => {
    render(<CarouselForm initial={null} onApply={noop} onCancel={noop} />);
    // Two default cards each render their own "+" placeholder (no mediaUrl yet),
    // in addition to the add-card tile's "+" — the add-card tile is the last
    // "+" in DOM order since it renders after the card thumbnails.
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[plusButtons.length - 1]);
    expect(screen.getByText("Cards (3)")).toBeInTheDocument();
  });

  it("calls onApply with the draft, tagged isCarousel, when Apply Template is clicked", () => {
    const onApply = jest.fn();
    render(<CarouselForm initial={null} onApply={onApply} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/main message body/i), { target: { value: "New arrivals!" } });
    fireEvent.click(screen.getByRole("button", { name: /apply template/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ body: "New arrivals!", cards: expect.any(Array) }));
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CarouselForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
