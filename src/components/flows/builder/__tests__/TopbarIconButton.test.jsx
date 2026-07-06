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

import { TopbarIconButton } from "../BuilderTopbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Play } from "lucide-react";

function renderButton(props) {
  return render(
    <TooltipProvider>
      <TopbarIconButton icon={Play} label="Preview Flow" testId="tb-preview" {...props} />
    </TooltipProvider>
  );
}

describe("TopbarIconButton", () => {
  it("renders a button with the given testId", () => {
    renderButton({ onClick: () => {} });
    expect(screen.getByTestId("tb-preview")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    renderButton({ onClick });
    fireEvent.click(screen.getByTestId("tb-preview"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled is true", () => {
    renderButton({ onClick: () => {}, disabled: true });
    expect(screen.getByTestId("tb-preview")).toBeDisabled();
  });

  it("exposes the label as accessible tooltip content", () => {
    renderButton({ onClick: () => {} });
    fireEvent.focus(screen.getByTestId("tb-preview"));
    expect(screen.getAllByText("Preview Flow").length).toBeGreaterThan(0);
  });
});
