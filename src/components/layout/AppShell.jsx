import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import AiWidgetPill from "./AiWidgetPill";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export const AppShell = () => {
  const { pathname } = useLocation();

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-app-bg" data-testid="app-shell">
      <TopBar />
      <Sidebar />
      <main
        data-testid="app-main"
        className="ml-14 mt-12 p-6 min-h-[calc(100vh-3rem)]"
      >
        <ErrorBoundary>
          {/* Re-mount key so each route fades in fresh. */}
          <div key={pathname} className="route-fade-in">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
      <AiWidgetPill />
    </div>
  );
};

export default AppShell;
