import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";

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

import { VersionHistoryMenu } from "../BuilderTopbar";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderMenu(props) {
  return render(
    <TooltipProvider>
      <VersionHistoryMenu {...props} />
    </TooltipProvider>
  );
}

describe("VersionHistoryMenu", () => {
  it("is closed by default", () => {
    renderMenu({ versions: [] });
    expect(screen.queryByTestId("builder-version-history-list")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no versions", () => {
    renderMenu({ versions: [] });
    fireEvent.click(screen.getByTestId("builder-version-history"));
    expect(screen.getByText("No live versions yet")).toBeInTheDocument();
  });

  it("lists each version with its live date and editor", () => {
    renderMenu({
      versions: [{ id: "v1", liveAt: "2026-06-01", editedBy: "Meenal K." }],
    });
    fireEvent.click(screen.getByTestId("builder-version-history"));
    const list = screen.getByTestId("builder-version-history-list");
    expect(within(list).getByText("2026-06-01")).toBeInTheDocument();
    expect(within(list).getByText("Meenal K.")).toBeInTheDocument();
  });

  it("toggles closed when the trigger is clicked again", () => {
    renderMenu({ versions: [] });
    const trigger = screen.getByTestId("builder-version-history");
    fireEvent.click(trigger);
    expect(screen.getByTestId("builder-version-history-list")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByTestId("builder-version-history-list")).not.toBeInTheDocument();
  });
});
