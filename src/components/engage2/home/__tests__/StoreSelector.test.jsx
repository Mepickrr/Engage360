import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StoreSelector from "../StoreSelector";

describe("StoreSelector", () => {
  it("shows the store name and no menu initially", () => {
    render(<StoreSelector />);
    expect(screen.getByTestId("store-selector-trigger")).toHaveTextContent("Mystore1");
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
  });

  it("clicking the trigger opens a menu with all 3 stores, Mystore1 checked by default", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    expect(screen.getByTestId("store-selector-menu")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option-mystore1")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option-mystore2")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option-all-stores")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option-mystore1")).toHaveTextContent("Mystore1");
  });

  it("clicking an option updates the trigger label and closes the menu", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    fireEvent.click(screen.getByTestId("store-selector-option-mystore2"));
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("store-selector-trigger")).toHaveTextContent("Mystore2");
  });
});
