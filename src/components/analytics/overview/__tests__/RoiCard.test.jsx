import React from "react";
import { render, screen } from "@testing-library/react";
import RoiCard from "../RoiCard";

describe("RoiCard", () => {
  test("renders the headline ROI figure, revenue/cost, and per-channel tiles", () => {
    render(
      <RoiCard
        testId="roi-card"
        value={10.85}
        totalRevenue={3460000}
        totalCost={320000}
        byChannel={{ whatsapp: 10.85, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 }}
      />
    );
    const card = screen.getByTestId("roi-card");
    expect(card).toHaveTextContent("10.85X");
    expect(card).toHaveTextContent("₹34.6L");
    expect(card).toHaveTextContent("₹3.2L");
    expect(screen.getByTestId("roi-channel-whatsapp")).toHaveTextContent("10.85X");
    expect(screen.getByTestId("roi-channel-aiChatbot")).toHaveTextContent("0.00X");
  });
});
