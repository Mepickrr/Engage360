import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChannelPickerModal, { CHANNEL_OPTIONS } from "../ChannelPickerModal";

describe("ChannelPickerModal", () => {
  it("lists all 5 channel options by default", () => {
    render(<ChannelPickerModal open onSelect={jest.fn()} onClose={jest.fn()} />);
    CHANNEL_OPTIONS.forEach(({ channel }) => {
      expect(screen.getByTestId(`channel-option-${channel}`)).toBeInTheDocument();
    });
  });

  it("excludes channels listed in excludeChannels", () => {
    render(
      <ChannelPickerModal open excludeChannels={["whatsapp"]} onSelect={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.queryByTestId("channel-option-whatsapp")).not.toBeInTheDocument();
    expect(screen.getByTestId("channel-option-sms")).toBeInTheDocument();
  });

  it("disables Continue until a channel is selected, then calls onSelect", () => {
    const onSelect = jest.fn();
    render(<ChannelPickerModal open onSelect={onSelect} onClose={jest.fn()} />);
    expect(screen.getByTestId("channel-picker-continue")).toBeDisabled();
    fireEvent.click(screen.getByTestId("channel-option-sms"));
    expect(screen.getByTestId("channel-picker-continue")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("channel-picker-continue"));
    expect(onSelect).toHaveBeenCalledWith("sms");
  });
});
