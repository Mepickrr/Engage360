import React from "react";
import { render, screen } from "@testing-library/react";

// Mock dependencies that BuilderTopbar imports
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({}),
}));
jest.mock("@/store/flowBuilderStore", () => ({
  useFlowBuilderStore: () => ({}),
}));
jest.mock("../SaveJourneyModal", () => () => null);

import { SaveIndicator } from "../BuilderTopbar";

describe("SaveIndicator", () => {
  it("shows Saving… while saving, without an author", () => {
    render(<SaveIndicator status="saving" lastSavedBy="Meenal K." />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("shows Save failed on error, without an author", () => {
    render(<SaveIndicator status="error" lastSavedBy="Meenal K." />);
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("appends the author name after the saved-time label", () => {
    render(
      <SaveIndicator status="saved" lastSavedAt={Date.now()} lastSavedBy="Meenal K." />
    );
    expect(screen.getByText("Just saved · Meenal K.")).toBeInTheDocument();
  });

  it("omits the author suffix when lastSavedBy is not provided", () => {
    render(<SaveIndicator status="saved" lastSavedAt={Date.now()} />);
    expect(screen.getByText("Just saved")).toBeInTheDocument();
  });
});
