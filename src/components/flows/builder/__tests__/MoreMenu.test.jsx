import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

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

import { MoreMenu } from "../BuilderTopbar";

describe("MoreMenu", () => {
  it("opens to show both download items", () => {
    render(<MoreMenu onDownload={() => {}} onDownloadError={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Download report")).toBeInTheDocument();
    expect(screen.getByText("Download error report")).toBeInTheDocument();
  });

  it("calls onDownloadError and closes when the error report item is clicked", () => {
    const onDownloadError = jest.fn();
    render(<MoreMenu onDownload={() => {}} onDownloadError={onDownloadError} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Download error report"));
    expect(onDownloadError).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Download error report")).not.toBeInTheDocument();
  });
});
