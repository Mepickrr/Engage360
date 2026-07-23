import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Trophy } from "lucide-react";
import SegmentCard from "../SegmentCard";

describe("SegmentCard", () => {
  test("renders name, icon, updated, description, and footer stat", () => {
    render(
      <SegmentCard
        testId="card-champions"
        name="Champions"
        Icon={Trophy}
        updated="11:25 PM, 22nd Jul"
        description="Your top fans - they buy often, spend the most, and purchased recently. Treat them like VIPs."
        users="1,63,073"
        footerRight="Average revenue per user : ₹3,733"
      />,
    );
    expect(screen.getByTestId("card-champions")).toBeInTheDocument();
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText(/Updated 11:25 PM, 22nd Jul/)).toBeInTheDocument();
    expect(screen.getByText(/Your top fans/)).toBeInTheDocument();
    expect(screen.getByText("1,63,073")).toBeInTheDocument();
    expect(screen.getByText("Average revenue per user : ₹3,733")).toBeInTheDocument();
  });

  test("renders a badge and a clickable overflow menu when provided", () => {
    const onMenuClick = jest.fn();
    render(<SegmentCard testId="card-shop-1" name="Last 30 days" badge="New" onMenuClick={onMenuClick} />);
    expect(screen.getByText("New")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("card-shop-1-menu"));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  test("omits users footer and menu button when not provided", () => {
    render(<SegmentCard testId="card-plain" name="Plain card" />);
    expect(screen.queryByTestId("card-plain-menu")).not.toBeInTheDocument();
  });
});
