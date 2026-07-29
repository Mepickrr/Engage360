import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectChannelModal from "../ConnectChannelModal";

describe("ConnectChannelModal — picker step", () => {
  it("renders both groups with every channel type", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.getByText("Business messaging")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-instagram")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-facebook")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-webpush")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-livechat")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-rcs")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-emails")).toBeInTheDocument();
    expect(screen.getByTestId("connect-type-emailmarketing")).toBeInTheDocument();
  });

  it("does not offer Shopify or SMS as connectable types", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.queryByTestId("connect-type-shopify")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-type-sms")).not.toBeInTheDocument();
  });

  it("moves to the form step when a type's Connect button is clicked", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    expect(screen.getByText(/connect whatsapp/i)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<ConnectChannelModal open={false} onClose={jest.fn()} onConnect={jest.fn()} />);
    expect(screen.queryByText("Business messaging")).not.toBeInTheDocument();
  });
});
