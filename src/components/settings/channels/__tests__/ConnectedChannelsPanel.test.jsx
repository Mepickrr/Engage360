import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ConnectedChannelsPanel from "../ConnectedChannelsPanel";

describe("ConnectedChannelsPanel — list view", () => {
  it("renders the header and one section per connected group with the right row counts", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.getByText("Connected channels")).toBeInTheDocument();
    expect(screen.getByTestId("connect-channel-btn")).toBeInTheDocument();

    const shopify = screen.getByTestId("channel-group-shopify");
    expect(within(shopify).getByText("Herbal Roots")).toBeInTheDocument();

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    expect(within(whatsapp).getAllByText("+91 74360 36062").length).toBeGreaterThan(0);
    expect(within(whatsapp).getByText("Default for Campaigns")).toBeInTheDocument();
    expect(within(whatsapp).getByText("Facebook Catalog")).toBeInTheDocument();

    const facebook = screen.getByTestId("channel-group-facebook");
    expect(within(facebook).getByText("Herbal Roots Hair")).toBeInTheDocument();

    const emails = screen.getByTestId("channel-group-emails");
    expect(within(emails).getByText("marketing@herbalroots.com")).toBeInTheDocument();
  });

  it("does not render a section for groups with zero connected items (Live Chat, RCS)", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.queryByTestId("channel-group-livechat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("channel-group-rcs")).not.toBeInTheDocument();
  });
});

describe("ConnectedChannelsPanel — navigation to detail views", () => {
  it("opens ShopifyDetail on click and returns to the list on back", () => {
    render(<ConnectedChannelsPanel />);
    const shopify = screen.getByTestId("channel-group-shopify");
    fireEvent.click(within(shopify).getByText("Herbal Roots").closest('[role="button"]'));
    expect(screen.getByTestId("shopify-detail")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("shopify-detail-back"));
    expect(screen.getByTestId("channel-group-shopify")).toBeInTheDocument();
  });

  it("opens WhatsAppNumberDetail for the clicked number", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getAllByText("+91 74360 36065")[0].closest('[role="button"]'));
    expect(screen.getByTestId("whatsapp-number-detail")).toBeInTheDocument();
    expect(screen.getByText("Quality: Medium")).toBeInTheDocument();
  });

  it("making a number default in its detail view is reflected back in the list", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getAllByText("+91 74360 36065")[0].closest('[role="button"]'));
    fireEvent.click(screen.getByTestId("whatsapp-make-default"));
    fireEvent.click(screen.getByTestId("whatsapp-detail-back"));

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    const row65 = within(whatsapp).getAllByText("+91 74360 36065")[0].closest('[data-testid^="channel-row-"]');
    expect(within(row65).getByText("Default for Campaigns")).toBeInTheDocument();
  });

  it("opens SimpleChannelDetail for a Facebook page and disconnecting it removes the row", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getByText("Herbal Roots Hair").closest('[role="button"]'));
    expect(screen.getByTestId("simple-channel-detail")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("simple-detail-disconnect"));
    expect(screen.queryByText("Herbal Roots Hair")).not.toBeInTheDocument();
  });
});

describe("ConnectedChannelsPanel — connecting a new channel", () => {
  it("opens the modal, connects a new WhatsApp number, and shows it in the list", () => {
    render(<ConnectedChannelsPanel />);
    fireEvent.click(screen.getByTestId("connect-channel-btn"));
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "+91 90000 00000" } });
    fireEvent.click(screen.getByTestId("connect-form-submit"));

    const whatsapp = screen.getByTestId("channel-group-whatsapp");
    expect(within(whatsapp).getByText("+91 90000 00000")).toBeInTheDocument();
  });

  it("connecting a Live Chat widget creates a new Live Chat section", () => {
    render(<ConnectedChannelsPanel />);
    expect(screen.queryByTestId("channel-group-livechat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("connect-channel-btn"));
    fireEvent.click(screen.getByTestId("connect-type-livechat-btn"));
    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "Support Chat" } });
    fireEvent.click(screen.getByTestId("connect-form-submit"));

    expect(screen.getByTestId("channel-group-livechat")).toBeInTheDocument();
    expect(within(screen.getByTestId("channel-group-livechat")).getByText("Support Chat")).toBeInTheDocument();
  });
});
