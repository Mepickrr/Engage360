import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SaveAndScheduleModal from "../SaveAndScheduleModal";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";

jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });

jest.mock("@/lib/broadcastsApi", () => ({
  updateBroadcast: jest.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  useBroadcastBuilderStore.getState().reset();
  useBroadcastBuilderStore.getState().addPrimaryStep("whatsapp");
  useBroadcastBuilderStore.getState().setCampaignId("c1");
});

function renderModal(onClose = jest.fn()) {
  return render(
    <MemoryRouter>
      <SaveAndScheduleModal open onClose={onClose} />
    </MemoryRouter>,
  );
}

describe("SaveAndScheduleModal", () => {
  it("shows Estimated Audience Size and an AI Suggestion card", () => {
    renderModal();
    expect(screen.getByTestId("estimated-audience-size")).toBeInTheDocument();
    expect(screen.getByTestId("ai-suggestion-card")).toBeInTheDocument();
  });

  it("Confirm & Schedule is disabled until a schedule mode is chosen", () => {
    renderModal();
    expect(screen.getByTestId("confirm-schedule-btn")).toBeDisabled();
    fireEvent.click(screen.getByTestId("schedule-now-radio"));
    expect(screen.getByTestId("confirm-schedule-btn")).not.toBeDisabled();
  });

  it("choosing Schedule for reveals a datetime input", () => {
    renderModal();
    fireEvent.click(screen.getByTestId("schedule-later-radio"));
    expect(screen.getByTestId("schedule-datetime-input")).toBeInTheDocument();
  });

  it("Confirm & Schedule sets status and closes the modal", async () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByTestId("schedule-now-radio"));
    fireEvent.click(screen.getByTestId("confirm-schedule-btn"));
    await new Promise((r) => setTimeout(r, 0));
    expect(useBroadcastBuilderStore.getState().status).toBe("sending");
    expect(onClose).toHaveBeenCalled();
  });

  it("opens Test Mode as a secondary action without closing the modal", () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByTestId("save-schedule-test-mode-btn"));
    expect(screen.getByTestId("test-mode-modal")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
