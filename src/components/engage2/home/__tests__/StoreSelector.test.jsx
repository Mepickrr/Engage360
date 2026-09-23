import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StoreSelector from "../StoreSelector";

describe("StoreSelector", () => {
  it("shows the store name and no menu initially", () => {
    render(<StoreSelector />);
    expect(screen.getByTestId("store-selector-trigger")).toHaveTextContent("Mystore1");
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
  });

  it("clicking the trigger opens a menu with the store checked", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    expect(screen.getByTestId("store-selector-menu")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option")).toHaveTextContent("Mystore1");
  });

  it("clicking the option closes the menu", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    fireEvent.click(screen.getByTestId("store-selector-option"));
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
  });
});
