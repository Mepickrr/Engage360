import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogDetailDrawer from "../LogDetailDrawer";

const WHATSAPP_ROW = {
  id: "log-0001", sentAt: "2026-08-10T08:00:00Z", engageId: "ENG-1", phone: "+91 90000 00001", email: null,
  type: "Campaign", templateName: "order_confirmation_v2", channel: "WhatsApp", senderPhone: "+91 79771 12200",
  senderEmail: null, deliveryStatus: "Delivered", aiCallDurationSec: null, errorResponse: null, updatedAt: "2026-08-10T09:00:00Z",
};

const AI_CALL_ROW = { ...WHATSAPP_ROW, channel: "AI Calling", aiCallDurationSec: 120 };

describe("LogDetailDrawer", () => {
  test("renders nothing when row is null", () => {
    render(<LogDetailDrawer row={null} onClose={() => {}} />);
    expect(screen.queryByTestId("log-detail-drawer")).not.toBeInTheDocument();
  });

  test("renders the row's fields when open", () => {
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={() => {}} />);
    expect(screen.getByTestId("log-detail-field-engageId").textContent).toContain("ENG-1");
    expect(screen.getByTestId("log-detail-field-templateName").textContent).toContain("order_confirmation_v2");
  });

  test("omits AI Call Duration for non-AI-Calling channels", () => {
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={() => {}} />);
    expect(screen.queryByTestId("log-detail-field-aiCallDurationSec")).not.toBeInTheDocument();
  });

  test("shows AI Call Duration for AI Calling rows", () => {
    render(<LogDetailDrawer row={AI_CALL_ROW} onClose={() => {}} />);
    expect(screen.getByTestId("log-detail-field-aiCallDurationSec").textContent).toContain("120s");
  });

  test("calls onClose when the sheet's close button is clicked", () => {
    const onClose = jest.fn();
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
