import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SettingsPage from "../Settings";

describe("SettingsPage", () => {
  it("shows Connected channels in the nav (not the old Channels/WhatsApp/RCS/SMS/Email items) and renders it by default when clicked", () => {
    render(<SettingsPage />);
    const nav = within(screen.getByTestId("settings-nav"));
    expect(nav.getByText("Connected channels")).toBeInTheDocument();
    expect(nav.queryByText(/^Channels$/)).not.toBeInTheDocument();
    expect(nav.queryByText(/^WhatsApp$/)).not.toBeInTheDocument();
    expect(nav.queryByText(/^RCS$/)).not.toBeInTheDocument();
    expect(nav.queryByText(/^SMS$/)).not.toBeInTheDocument();
    expect(nav.queryByText(/^Email$/)).not.toBeInTheDocument();

    fireEvent.click(nav.getByText("Connected channels"));
    expect(screen.getByTestId("connected-channels-panel")).toBeInTheDocument();
  });

  it("still renders the Account tab by default", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("settings-account")).toBeInTheDocument();
  });

  it("hides Billing and API Keys from the nav, and lists the remaining items in the requested order", () => {
    render(<SettingsPage />);
    const nav = within(screen.getByTestId("settings-nav"));

    expect(nav.queryByText("Billing")).not.toBeInTheDocument();
    expect(nav.queryByText("API Keys")).not.toBeInTheDocument();

    const labels = nav.getAllByRole("button").map((btn) => btn.textContent);
    expect(labels).toEqual([
      "Account",
      "Connected channels",
      "Integrations",
      "Revenue Attribution",
      "Delivery Controls",
      "Team",
      "Notifications",
    ]);
  });
});
