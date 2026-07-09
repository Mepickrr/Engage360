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

jest.mock("@/components/flows/builder/trigger/StartTriggerWizard", () => (props) => (
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
import { createFlow, deleteFlow } from "@/lib/flowsApi";

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
});
