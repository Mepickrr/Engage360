import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

const mockNavigate = jest.fn();
let mockParams = { id: "new" };
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}), { virtual: true });

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
}), { virtual: true });

jest.mock("@/components/flows/builder/Canvas", () => () => <div data-testid="canvas" />);
jest.mock("@/components/flows/builder/NodePalette", () => () => <div data-testid="node-palette" />);
jest.mock("@/components/flows/builder/RightPanel", () => () => <div data-testid="right-panel" />);
jest.mock("@/components/flows/builder/nodes/AiCallingNode/AiCallingGlobalWizard", () => () => null);
jest.mock("@/components/flows/builder/nodes/AiChatbotNode/AiChatbotGlobalWizard", () => () => null);

jest.mock("@/components/flows/builder/BuilderTopbar", () => (props) => (
  <div data-testid="topbar" data-locked={String(!!props.locked)} />
));

jest.mock("@/components/flows/builder/triggerV2/StartTriggerWizard", () => (props) => (
  props.open ? (
    <div data-testid="wizard" data-lockdown={String(!!props.lockdown)}>
      <button data-testid="wizard-save-draft" onClick={props.onSaveDraft}>Save draft</button>
      <button data-testid="wizard-delete-flow" onClick={props.onDeleteFlow}>Delete flow</button>
    </div>
  ) : null
));

jest.mock("@/lib/flowsApi", () => ({
  createFlow: jest.fn(() => Promise.resolve({ id: "flow-99" })),
  fetchFlow: jest.fn(() => Promise.resolve(null)),
  updateFlow: jest.fn(() => Promise.resolve({})),
  deleteFlow: jest.fn(() => Promise.resolve({})),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import FlowBuilderV2 from "../FlowBuilderV2";
import { createFlow, deleteFlow, fetchFlow } from "@/lib/flowsApi";

function renderBuilder() {
  mockNavigate.mockClear();
  createFlow.mockClear();
  deleteFlow.mockClear();
  useFlowBuilderStore.getState().reset();
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <FlowBuilderV2 />
    </QueryClientProvider>
  );
}

describe("FlowBuilderV2 — start-trigger lockdown wiring", () => {
  beforeEach(() => {
    mockParams = { id: "new" };
  });

  it("opens the wizard in lockdown mode and locks the topbar for a new flow with no nodes", () => {
    renderBuilder();
    expect(screen.getByTestId("wizard")).toHaveAttribute("data-lockdown", "true");
    expect(screen.getByTestId("topbar")).toHaveAttribute("data-locked", "true");
  });

  it("Save draft creates a flow and navigates to the v2 flows list when no flow exists yet", async () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-save-draft"));
    await waitFor(() => expect(createFlow).toHaveBeenCalledWith({
      name: "Untitled flow",
      nodes: [],
      edges: [],
    }));
    expect(mockNavigate).toHaveBeenCalledWith("/flows-v2");
  });

  it("Delete flow navigates to the v2 flows list without calling deleteFlow when no flow exists yet", () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-delete-flow"));
    expect(deleteFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/flows-v2");
  });

  it("force-opens the wizard in lockdown when reopening an existing flow with no trigger node", async () => {
    mockParams = { id: "flow-42" };
    fetchFlow.mockResolvedValueOnce({
      id: "flow-42",
      name: "Untitled flow",
      nodes: [],
      edges: [],
    });
    renderBuilder();
    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toHaveAttribute("data-lockdown", "true");
      expect(screen.getByTestId("topbar")).toHaveAttribute("data-locked", "true");
    });
  });

  it("does not force-open the wizard when reopening a flow that already has a trigger node", async () => {
    mockParams = { id: "flow-42" };
    fetchFlow.mockResolvedValueOnce({
      id: "flow-42",
      name: "Configured flow",
      nodes: [
        {
          id: "start-trigger-node",
          type: "start-trigger",
          position: { x: 260, y: 60 },
          data: { config: { kind: "event", triggerGroups: [] } },
        },
        {
          id: "n1",
          type: "email",
          position: { x: 500, y: 60 },
          data: {},
        },
      ],
      edges: [],
    });
    renderBuilder();
    await waitFor(() => {
      expect(screen.getByTestId("topbar")).toHaveAttribute("data-locked", "false");
    });
    const wizard = screen.queryByTestId("wizard");
    if (wizard) {
      expect(wizard).toHaveAttribute("data-lockdown", "false");
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
