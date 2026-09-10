import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup";

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only under Jest's default "node" condition). Every other
// test in this repo works around this by mocking "react-router-dom" as a virtual
// module (see e.g. BuilderTopbar.test.jsx). This page only needs MemoryRouter as
// a passthrough wrapper and Link rendered as a plain anchor.
jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("EngageAccountSetupPage", () => {
  it("renders both columns and an exit-setup link back to /fastrr-engage", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-engage-account-setup")).toBeInTheDocument();
    expect(screen.getByTestId("setup-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByTestId("exit-setup-link")).toHaveAttribute("href", "/fastrr-engage");
  });
});
