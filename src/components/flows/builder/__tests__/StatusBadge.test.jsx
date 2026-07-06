import React from "react";
import { render, screen } from "@testing-library/react";

// Mock dependencies that BuilderTopbar imports
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({}),
}));
jest.mock("@/store/flowBuilderStore", () => ({
  useFlowBuilderStore: () => ({}),
}));
jest.mock("../SaveJourneyModal", () => () => null);
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

import { StatusBadge, STATUS_CONFIG } from "../BuilderTopbar";

describe("StatusBadge", () => {
  it("renders a label for every status in STATUS_CONFIG", () => {
    Object.keys(STATUS_CONFIG).forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
      unmount();
    });
  });

  it("covers all 11 required statuses", () => {
    const required = [
      "draft", "active", "archived", "test", "paused", "completed",
      "scheduled", "rerun_completed", "dnd", "error", "inprogress",
    ];
    required.forEach((key) => expect(STATUS_CONFIG).toHaveProperty(key));
  });

  it("labels the active status as Live", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("falls back to the draft config for an unknown status", () => {
    render(<StatusBadge status="not-a-real-status" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
