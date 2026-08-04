import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import ComingSoonPanel from "../ComingSoonPanel";

jest.mock("sonner", () => ({ toast: jest.fn() }));

describe("ComingSoonPanel", () => {
  test("renders the tab name and a preview-toast button", () => {
    render(<ComingSoonPanel tabName="Campaign" testId="campaign-tab" />);
    const panel = screen.getByTestId("campaign-tab");
    expect(panel).toHaveTextContent("Campaign");
    fireEvent.click(screen.getByTestId("coming-soon-notify-btn"));
    expect(toast).toHaveBeenCalled();
  });
});
