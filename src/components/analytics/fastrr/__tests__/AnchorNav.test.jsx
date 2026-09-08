import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AnchorNav from "../AnchorNav";

const SECTIONS = [
  { id: "fastrr-hero", label: "Overview" },
  { id: "fastrr-funnel", label: "Funnel" },
];

describe("AnchorNav", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    document.body.innerHTML = '<div id="fastrr-hero"></div><div id="fastrr-funnel"></div>';
  });

  test("renders one button per section", () => {
    render(<AnchorNav sections={SECTIONS} />);
    expect(screen.getByTestId("fastrr-anchor-fastrr-hero")).toHaveTextContent("Overview");
    expect(screen.getByTestId("fastrr-anchor-fastrr-funnel")).toHaveTextContent("Funnel");
  });

  test("clicking a section button smooth-scrolls to it", () => {
    render(<AnchorNav sections={SECTIONS} />);
    fireEvent.click(screen.getByTestId("fastrr-anchor-fastrr-funnel"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
