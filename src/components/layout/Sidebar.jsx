import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  Terminal,
  Layers,
  MonitorDot,
  LayoutGrid,
  Megaphone,
  Bell,
  GitBranch,
  Instagram,
  PieChart,
  Users,
  Bot,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Home and AI Agents both land on `/` (the Agent surface IS the home page).
// We mark `forceActive` for the icons that should reflect the active style
// when the user is on `/` so both pills light up together.
export const SIDEBAR_ITEMS = [
  {
    label: "Home",
    icon: Home,
    route: "/",
    testId: "nav-home",
    matchPaths: ["/", "/agents"],
    hidden: true,
  },
  {
    label: "Home V2",
    icon: LayoutDashboard,
    route: "/home-v2",
    testId: "nav-home-v2",
    matchPaths: ["/home-v2"],
    hidden: true,
  },
  {
    label: "Home V3",
    icon: Terminal,
    route: "/home-v3",
    testId: "nav-home-v3",
    matchPaths: ["/home-v3"],
    hidden: true,
  },
  {
    label: "Home V4",
    icon: Layers,
    route: "/home-v4",
    testId: "nav-home-v4",
    matchPaths: ["/home-v4"],
    hidden: true,
  },
  {
    label: "Home V5",
    icon: MonitorDot,
    route: "/home-v5",
    testId: "nav-home-v5",
    matchPaths: ["/home-v5"],
  },
  {
    label: "Home V6",
    icon: LayoutGrid,
    route: "/home-v6",
    testId: "nav-home-v6",
    matchPaths: ["/home-v6", "/"],
  },
  { label: "Templates", icon: FileText, route: "/templates", testId: "nav-templates" },
  { label: "Campaigns", icon: Megaphone, route: "/campaigns", testId: "nav-campaigns" },
  { label: "Push", icon: Bell, route: "/push", testId: "nav-push" },
  { label: "Flows", icon: GitBranch, route: "/flows", testId: "nav-flows" },
  { label: "Flows V2", icon: GitBranch, route: "/flows-v2", testId: "nav-flows-v2", matchPaths: ["/flows-v2", "/flows-v2/create", "/flows-v2/builder"] },
  { label: "Instagram", icon: Instagram, route: "/instagram", testId: "nav-instagram" },
  { label: "Segments", icon: PieChart, route: "/segments", testId: "nav-segments" },
  { label: "Audience", icon: Users, route: "/audience", testId: "nav-audience" },
  {
    label: "AI Agents",
    icon: Bot,
    route: "/",
    testId: "nav-agents",
    matchPaths: ["/", "/agents"],
  },
  { label: "Analytics", icon: BarChart3, route: "/analytics", testId: "nav-analytics" },
  { label: "Settings", icon: Settings, route: "/settings", testId: "nav-settings" },
];

const FALLBACK_INITIALS = "HK";

export const Sidebar = () => {
  const { pathname } = useLocation();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Soft-fail — top bar already has a fallback identity.
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.warn("Sidebar fetchMe failed (using fallback):", e?.message);
    },
  });
  const initials = data?.user?.initials || FALLBACK_INITIALS;

  // Both `/` and `/agents` should light up the AI Agents tab AND the Home
  // tab (since both nav items point to `/`). We compute this manually
  // because NavLink's `isActive` would only match the route the item
  // itself navigates to.
  const isOnAgentHome = pathname === "/" || pathname === "/agents";

  return (
    <aside
      data-testid="sidebar"
      className="fixed top-12 left-0 bottom-0 w-14 bg-sidebar-bg text-slate-300 flex flex-col items-center justify-between py-2 z-30 border-r border-white/10"
    >
      <TooltipProvider delayDuration={120}>
        <nav className="flex flex-col items-center w-full" aria-label="Primary">
          {SIDEBAR_ITEMS.filter((item) => !item.hidden).map(({ label, icon: Icon, route, testId, matchPaths }) => {
            // Allow an item to declare additional active paths.
            const forcedActive =
              matchPaths?.includes(pathname) ||
              (matchPaths?.includes("/") && isOnAgentHome);
            return (
              <Tooltip key={testId}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={route}
                    end={route === "/"}
                    data-testid={testId}
                    className={({ isActive }) => {
                      const active = forcedActive || isActive;
                      return cn(
                        "relative w-14 h-12 flex items-center justify-center transition-colors group focus:outline-none",
                        active
                          ? "text-white bg-[rgba(108,58,232,0.18)]"
                          : "text-slate-300 hover:text-white hover:bg-white/[0.07]",
                      );
                    }}
                  >
                    {({ isActive }) => {
                      const active = forcedActive || isActive;
                      return (
                        <>
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                            />
                          )}
                          <Icon
                            className="w-5 h-5"
                            strokeWidth={2}
                          />
                        </>
                      );
                    }}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-testid="sidebar-avatar"
              className="w-8 h-8 rounded-full bg-primary text-white text-[12px] font-semibold flex items-center justify-center mb-1 hover:bg-primary-hover transition-colors"
              aria-label="Profile"
            >
              {initials}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Profile
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
};

export default Sidebar;
