import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Facebook } from "lucide-react";
import SimpleChannelDetail from "../SimpleChannelDetail";

const ITEM = { id: "fb_1", name: "Herbal Roots", url: "https://facebook.com/105513214301140" };

describe("SimpleChannelDetail", () => {
  it("renders the group label, name, and read-only identifier", () => {
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={jest.fn()} onDisconnect={jest.fn()}
      />
    );
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Herbal Roots")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://facebook.com/105513214301140")).toBeDisabled();
  });

  it("calls onUpdate with the new name on blur", () => {
    const onUpdate = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={onUpdate} onDisconnect={jest.fn()}
      />
    );
    const nameInput = screen.getByTestId("simple-detail-name");
    fireEvent.change(nameInput, { target: { value: "Herbal Roots Official" } });
    fireEvent.blur(nameInput);
    expect(onUpdate).toHaveBeenCalledWith("fb_1", { name: "Herbal Roots Official" });
  });

  it("calls onDisconnect with the item id", () => {
    const onDisconnect = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={jest.fn()} onUpdate={jest.fn()} onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByTestId("simple-detail-disconnect"));
    expect(onDisconnect).toHaveBeenCalledWith("fb_1");
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(
      <SimpleChannelDetail
        item={ITEM} groupLabel="Facebook" Icon={Facebook} iconColor="#1877F2"
        identifierLabel="Page URL" identifierKey="url"
        onBack={onBack} onUpdate={jest.fn()} onDisconnect={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("simple-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
