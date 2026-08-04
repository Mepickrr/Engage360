import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AnalyticsPage from "../Analytics";

// Mock the Calendar component to avoid Jest transformation issues with
// react-day-picker/date-fns ESM exports (same workaround used in
// TimeRangeFilter.test.jsx, which TimeRangeFilter — rendered here via
// AnalyticsPage — pulls in transitively).
jest.mock("@/components/ui/calendar", () => {
  return {
    Calendar: ({ mode, selected, onSelect, numberOfMonths, ...props }) => (
      <div data-testid="calendar-mock" {...props}>
        Calendar Mock
      </div>
    ),
  };
});

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only under Jest's default "node" condition, and forcing
// resolution to its CJS build in turn requires browser globals — TextEncoder,
// ReadableStream, etc. — that jsdom's test environment doesn't provide). Every
// other test in this repo works around this by mocking "react-router-dom" as a
// virtual module (see e.g. BuilderTopbar.test.jsx, CampaignBuilderPage.test.jsx).
// This suite needs real path matching for the ":tab" param and useNavigate, so
// the mock below reimplements just enough of MemoryRouter/Routes/Route/
// useNavigate/useParams to do that against an in-memory current path.
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    const RouterCtx = React.createContext(null);
    const ParamsCtx = React.createContext({});

    function matchPath(pattern, pathname) {
      const patternParts = pattern.split("/").filter(Boolean);
      const pathParts = pathname.split("/").filter(Boolean);
      if (patternParts.length !== pathParts.length) return null;
      const params = {};
      for (let i = 0; i < patternParts.length; i++) {
        const part = patternParts[i];
        const seg = pathParts[i];
        if (part.startsWith(":")) {
          params[part.slice(1)] = seg;
        } else if (part !== seg) {
          return null;
        }
      }
      return params;
    }

    function MemoryRouter({ initialEntries = ["/"], children }) {
      const [path, setPath] = React.useState(initialEntries[0]);
      const value = React.useMemo(() => ({ path, setPath }), [path]);
      return React.createElement(RouterCtx.Provider, { value }, children);
    }

    function Routes({ children }) {
      const ctx = React.useContext(RouterCtx);
      const routes = React.Children.toArray(children);
      for (const route of routes) {
        const params = matchPath(route.props.path, ctx.path);
        if (params) {
          return React.createElement(ParamsCtx.Provider, { value: params }, route.props.element);
        }
      }
      return null;
    }

    function Route() {
      return null;
    }

    function useNavigate() {
      const ctx = React.useContext(RouterCtx);
      return (to) => ctx.setPath(typeof to === "string" ? to : to.pathname);
    }

    function useParams() {
      return React.useContext(ParamsCtx);
    }

    return { MemoryRouter, Routes, Route, useNavigate, useParams };
  },
  { virtual: true },
);

function renderAtTab(tab) {
  return render(
    <MemoryRouter initialEntries={[`/analytics/${tab}`]}>
      <Routes>
        <Route path="/analytics/:tab" element={<AnalyticsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AnalyticsPage", () => {
  test("defaults to the Overview tab content and shows the time filter", () => {
    renderAtTab("overview");
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByTestId("time-range-trigger")).toBeInTheDocument();
  });

  test("switching to Campaign, Journey, Reports renders their coming-soon panels", () => {
    renderAtTab("overview");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Campaign" }));
    expect(screen.getByTestId("analytics-tab-campaign")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Journey" }));
    expect(screen.getByTestId("analytics-tab-journey")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Reports" }));
    expect(screen.getByTestId("analytics-tab-reports")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Overview" }));
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
  });

  test("changing the time range re-renders Overview with different numbers", () => {
    renderAtTab("overview");
    const before = screen.getByTestId("metric-revenue-overall").textContent;
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    fireEvent.click(screen.getByTestId("time-range-option-this_month"));
    expect(screen.getByTestId("metric-revenue-overall").textContent).not.toBe(before);
  });

  test("page contains no BIK or Avimee strings", () => {
    const { container } = renderAtTab("overview");
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });

  test("an unknown tab value falls back to rendering Overview", () => {
    renderAtTab("bogus");
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
  });
});
