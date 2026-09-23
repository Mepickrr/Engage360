import React from "react";
import { render, screen } from "@testing-library/react";
import SelectRecapStep from "../SelectRecapStep";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("SelectRecapStep", () => {
  it("lists each distinct selected journey type once, even when both audience variants are selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    useJourneySelectionStore2.getState().toggle("abandoned-cart-identified");
    render(<SelectRecapStep />);
    const types = screen.getByTestId("select-recap-types");
    expect(types.children).toHaveLength(1);
    expect(types).toHaveTextContent("Abandoned Cart");
  });

  it("has a link back to the home page to change the selection", () => {
    render(<SelectRecapStep />);
    expect(screen.getByTestId("select-recap-change-link")).toHaveAttribute(
      "href",
      "/fastrr-engage-2"
    );
  });
});
