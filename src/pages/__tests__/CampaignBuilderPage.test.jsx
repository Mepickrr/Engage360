import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignBuilderPage from "../CampaignBuilderPage";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only under Jest's default "node" condition, and forcing
// resolution to its CJS build in turn requires browser globals — TextEncoder,
// ReadableStream, etc. — that jsdom's test environment doesn't provide). Every
// other test in this repo works around this by mocking "react-router-dom" as a
// virtual module (see e.g. BuilderTopbar.test.jsx). This suite is the first to
// need real route-matching behavior (switching between /campaigns/builder/new,
// /campaigns/builder/:id, and /campaigns), so the mock below reimplements just
// enough of MemoryRouter/Routes/Route/useNavigate/useParams to do real path
// matching (including ":id" params) against an in-memory current path.
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

beforeEach(() => {
  window.localStorage.clear();
  useCampaignBuilderStore.getState().reset();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/campaigns/builder/new" element={<CampaignBuilderPage />} />
        <Route path="/campaigns/builder/:id" element={<CampaignBuilderPage />} />
        <Route path="/campaigns" element={<div data-testid="campaigns-list-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CampaignBuilderPage", () => {
  it("opens the channel picker immediately for a new campaign", () => {
    renderAt("/campaigns/builder/new");
    expect(screen.getByTestId("channel-picker-modal")).toBeInTheDocument();
  });

  it("navigates back to /campaigns when the picker is closed without selecting", () => {
    renderAt("/campaigns/builder/new");
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.getByTestId("campaigns-list-page")).toBeInTheDocument();
  });

  it("creates the primary step and campaign on channel selection", async () => {
    renderAt("/campaigns/builder/new");
    fireEvent.click(screen.getByTestId("channel-option-whatsapp"));
    fireEvent.click(screen.getByTestId("channel-picker-continue"));

    await waitFor(() => expect(useCampaignBuilderStore.getState().campaignId).toBeTruthy());
    expect(useCampaignBuilderStore.getState().sequence).toHaveLength(1);
    expect(useCampaignBuilderStore.getState().sequence[0].channel).toBe("whatsapp");
    expect(screen.queryByTestId("channel-picker-modal")).not.toBeInTheDocument();
  });

  it("binds the header name input to store.meta.name", () => {
    renderAt("/campaigns/builder/new");
    const input = screen.getByTestId("campaign-name-input");
    fireEvent.change(input, { target: { value: "Diwali Blast" } });
    expect(useCampaignBuilderStore.getState().meta.name).toBe("Diwali Blast");
  });
});
