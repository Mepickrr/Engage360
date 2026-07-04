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

import { FlowTagPill, FLOW_TAG_OPTIONS } from "../BuilderTopbar";

describe("FlowTagPill", () => {
  it("renders the current tag", () => {
    render(<FlowTagPill tag="Retention" onClick={() => {}} />);
    expect(screen.getByText("Retention")).toBeInTheDocument();
  });

  it("defaults to Promotional when no tag is given", () => {
    render(<FlowTagPill onClick={() => {}} />);
    expect(screen.getByText("Promotional")).toBeInTheDocument();
  });

  it("calls onClick when the pill is clicked", () => {
    const onClick = jest.fn();
    render(<FlowTagPill tag="Broadcast" onClick={onClick} />);
    fireEvent.click(screen.getByTestId("builder-tag-pill"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("exposes all four tag options", () => {
    expect(FLOW_TAG_OPTIONS).toEqual(["Transactional", "Promotional", "Broadcast", "Retention"]);
  });
});
