import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import BuilderTopbar from "../BuilderTopbar";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { toast } from "sonner";

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only and Jest's resolver fails on it even for a bare
// `import { MemoryRouter } from "react-router-dom"` with no other code — see
// task-8-report.md for the isolated repro). BuilderTopbar only calls
// useNavigate() and never touches any other routing context, so MemoryRouter
// can be safely mocked as a plain passthrough wrapper here, consistent with
// the virtual-mock convention used by every other test in this directory.
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => children,
}), { virtual: true });

jest.mock("@/lib/flowsApi", () => ({
  updateFlow: jest.fn(() => Promise.resolve({})),
  publishFlow: jest.fn(() => Promise.resolve({})),
  pauseFlow: jest.fn(() => Promise.resolve({})),
  resumeFlow: jest.fn(() => Promise.resolve({})),
}));

jest.mock("sonner", () => ({ toast: { info: jest.fn(), success: jest.fn(), error: jest.fn() } }));

function renderTopbar(metaOverrides = {}) {
  useFlowBuilderStore.setState({
    flowId: "flow-1",
    meta: { name: "Diwali Sale Flow", status: "active", ...metaOverrides },
    nodes: [],
    edges: [],
    autosaveStatus: "idle",
  });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BuilderTopbar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BuilderTopbar integration", () => {
  it("renders the flow tag pill and status badge", () => {
    renderTopbar();
    expect(screen.getByTestId("builder-tag-pill")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows Version History and View all Customer Chat once the flow has been live", () => {
    renderTopbar({ status: "active" });
    expect(screen.getByTestId("builder-version-history")).toBeInTheDocument();
    expect(screen.getByTestId("builder-chats")).toBeInTheDocument();
  });

  it("hides Version History and View all Customer Chat for a draft flow", () => {
    renderTopbar({ status: "draft" });
    expect(screen.queryByTestId("builder-version-history")).not.toBeInTheDocument();
    expect(screen.queryByTestId("builder-chats")).not.toBeInTheDocument();
  });

  it("shows a coming-soon toast when Undo is clicked", () => {
    renderTopbar();
    fireEvent.click(screen.getByTestId("builder-undo"));
    expect(toast.info).toHaveBeenCalledWith("Undo coming soon");
  });

  it("shows a coming-soon toast when Redo is clicked", () => {
    renderTopbar();
    fireEvent.click(screen.getByTestId("builder-redo"));
    expect(toast.info).toHaveBeenCalledWith("Redo coming soon");
  });
});
