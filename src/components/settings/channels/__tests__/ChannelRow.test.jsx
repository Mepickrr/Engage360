import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChannelRow from "../ChannelRow";

describe("ChannelRow", () => {
  it("renders title, subtitle, and metadata, and fires onClick", () => {
    const onClick = jest.fn();
    render(
      <ChannelRow
        title="+91 74360 36062"
        subtitle="@herbalroots"
        metadata={<span>Existing number</span>}
        onClick={onClick}
        testId="row-1"
      />
    );

    expect(screen.getByText("+91 74360 36062")).toBeInTheDocument();
    expect(screen.getByText("@herbalroots")).toBeInTheDocument();
    expect(screen.getByText("Existing number")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("row-1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders without a subtitle when none is given", () => {
    render(<ChannelRow title="Herbal Roots" onClick={jest.fn()} testId="row-2" />);
    expect(screen.getByText("Herbal Roots")).toBeInTheDocument();
  });

  it("fires onClick on Enter key for keyboard accessibility", () => {
    const onClick = jest.fn();
    render(<ChannelRow title="Herbal Roots" onClick={onClick} testId="row-3" />);
    fireEvent.keyDown(screen.getByTestId("row-3"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
