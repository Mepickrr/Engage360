import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";

import FastrrEngagePage2 from "@/pages/FastrrEngage2";
import EngageSetupPage2 from "@/pages/EngageSetup2";
import MetaEmbeddedSignup2 from "@/pages/MetaEmbeddedSignup2";
import FastrrJourneyPage2 from "@/pages/FastrrJourney2";

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only under Jest's default "node" condition). These pages
// only need MemoryRouter/Link as passthroughs and useNavigate as a stub — see
// e.g. FastrrJourney2.test.jsx / FastrrEngage2.test.jsx for the same workaround.
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const appSource = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");

/**
 * Asserts that App.js wires `routePath` to `<componentName ... />` via a
 * <Route path="..." element={<Component ... />} /> declaration. This fails
 * if the route is ever removed, its path typo'd, or repointed at the wrong
 * component.
 */
function expectRouteWiredTo(routePath, componentName) {
  const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const routeRegex = new RegExp(
    `<Route\\s+path=["']${escapedPath}["']\\s+element=\\{<${componentName}\\b[^}]*/>\\}`
  );
  expect(appSource).toMatch(routeRegex);
}

describe("App.js v2 route wiring", () => {
  it("wires /fastrr-engage-2 to FastrrEngagePage2, whose wrapper testid is page-fastrr-engage", () => {
    expectRouteWiredTo("/fastrr-engage-2", "FastrrEngagePage2");
    render(<FastrrEngagePage2 />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
  });

  it("wires /engage-2/setup to EngageSetupPage2, whose wrapper testid is page-engage-setup", () => {
    expectRouteWiredTo("/engage-2/setup", "EngageSetupPage2");
    render(<EngageSetupPage2 />);
    expect(screen.getByTestId("page-engage-setup")).toBeInTheDocument();
  });

  it("wires /engage-2/meta-embedded-signup to MetaEmbeddedSignup2, whose wrapper testid is page-meta-embedded-signup", () => {
    expectRouteWiredTo("/engage-2/meta-embedded-signup", "MetaEmbeddedSignup2");
    render(<MetaEmbeddedSignup2 />);
    expect(screen.getByTestId("page-meta-embedded-signup")).toBeInTheDocument();
  });

  it("wires /fastrr-journey-2 to FastrrJourneyPage2, whose wrapper testid is page-fastrr-journey-2 (deliberately different from v1's page-fastrr-journey)", () => {
    expectRouteWiredTo("/fastrr-journey-2", "FastrrJourneyPage2");
    render(<FastrrJourneyPage2 />);
    expect(screen.getByTestId("page-fastrr-journey-2")).toBeInTheDocument();
  });
});
