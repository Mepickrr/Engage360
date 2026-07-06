import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock dependencies that BuilderTopbar imports
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({}),
}));
jest.mock("@/store/flowBuilderStore", () => ({
  useFlowBuilderStore: () => ({}),
}));
jest.mock("../SaveJourneyModal", () => () => null);

import { WarningBadge } from "../BuilderTopbar";

describe("WarningBadge", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<WarningBadge count={0} onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when count is undefined", () => {
    const { container } = render(<WarningBadge onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the issue count when count is positive", () => {
    render(<WarningBadge count={2} onClick={() => {}} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<WarningBadge count={3} onClick={onClick} />);
    fireEvent.click(screen.getByTestId("builder-warning-badge"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
