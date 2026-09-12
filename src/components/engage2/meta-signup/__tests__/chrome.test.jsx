import React from "react";
import { render, screen } from "@testing-library/react";
import MetaTopBarChrome from "../MetaTopBarChrome";
import FbLoginWindowChrome from "../FbLoginWindowChrome";
import StepRail from "../StepRail";

describe("MetaTopBarChrome", () => {
  it("renders its children inside the chrome", () => {
    render(
      <MetaTopBarChrome>
        <div data-testid="mock-child">Hello</div>
      </MetaTopBarChrome>
    );
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("mock-child")).toBeInTheDocument();
  });
});

describe("FbLoginWindowChrome", () => {
  it("renders its children inside the chrome", () => {
    render(
      <FbLoginWindowChrome>
        <div data-testid="mock-child-2">World</div>
      </FbLoginWindowChrome>
    );
    expect(screen.getByTestId("fb-login-window-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("mock-child-2")).toBeInTheDocument();
  });
});

describe("StepRail", () => {
  it("renders `count` dots, marking indices before activeIndex as done", () => {
    render(<StepRail activeIndex={1} count={4} />);
    expect(screen.getByTestId("step-rail-dot-0")).toBeInTheDocument();
    expect(screen.getByTestId("step-rail-dot-3")).toBeInTheDocument();
    expect(screen.queryByTestId("step-rail-dot-4")).not.toBeInTheDocument();
  });
});
