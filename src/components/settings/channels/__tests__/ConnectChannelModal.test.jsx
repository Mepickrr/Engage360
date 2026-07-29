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

describe("ConnectChannelModal — form step", () => {
  it("renders the field for the selected type with its placeholder", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));
    expect(screen.getByPlaceholderText("+91 98765 43210")).toBeInTheDocument();
  });

  it("disables Connect until the field has a value, then calls onConnect and closes", () => {
    const onConnect = jest.fn();
    const onClose = jest.fn();
    render(<ConnectChannelModal open onClose={onClose} onConnect={onConnect} />);
    fireEvent.click(screen.getByTestId("connect-type-whatsapp-btn"));

    const submitBtn = screen.getByTestId("connect-form-submit");
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId("connect-form-input"), { target: { value: "+91 90000 00000" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(onConnect).toHaveBeenCalledWith("whatsapp", { number: "+91 90000 00000" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("goes back to the picker step from the form", () => {
    render(<ConnectChannelModal open onClose={jest.fn()} onConnect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("connect-type-instagram-btn"));
    fireEvent.click(screen.getByTestId("connect-form-back"));
    expect(screen.getByText("Business messaging")).toBeInTheDocument();
  });
});
