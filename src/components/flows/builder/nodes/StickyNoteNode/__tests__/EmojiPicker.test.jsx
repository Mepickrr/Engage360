import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmojiPicker from "../EmojiPicker";
import { STICKY_NOTE_EMOJIS } from "../data/mockData";

describe("EmojiPicker", () => {
  it("renders one button per curated emoji", () => {
    render(<EmojiPicker onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(STICKY_NOTE_EMOJIS.length);
  });

  it("calls onSelect with the clicked emoji", () => {
    const onSelect = jest.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={() => {}} />);
    fireEvent.click(screen.getByText(STICKY_NOTE_EMOJIS[0]));
    expect(onSelect).toHaveBeenCalledWith(STICKY_NOTE_EMOJIS[0]);
  });

  it("calls onClose when clicking outside the picker", () => {
    const onClose = jest.fn();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <EmojiPicker onSelect={() => {}} onClose={onClose} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onClose).toHaveBeenCalled();
  });
});
