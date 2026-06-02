import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import ConfigTab from "./panels/ConfigTab";
import AiTab from "./panels/AiTab";
import AnalyticsTab from "./panels/AnalyticsTab";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

export default function RightPanel() {
  const [tab, setTab] = useState("config");
  const meta = useFlowBuilderStore((s) => s.meta);
  // Tab is always clickable; AnalyticsTab itself renders an analytics-disabled
  // placeholder when status === "draft" (so users see helpful copy instead of a
  // dead disabled tab).

  return (
    <aside
      data-testid="builder-right-panel"
      className="w-[360px] border-l border-border bg-app-bg flex-shrink-0 flex flex-col"
    >
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="flex border-b border-border bg-surface rounded-none p-0 h-10 flex-shrink-0">
          <TabsTrigger
            value="config"
            data-testid="right-tab-config"
            className="flex-1 text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Config
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            data-testid="right-tab-ai"
            className="flex-1 text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            AI (Dev)
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            data-testid="right-tab-analytics"
            className="flex-1 text-[12px] data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="config" className="flex-1 min-h-0 m-0">
          <ConfigTab />
        </TabsContent>
        <TabsContent value="ai" className="flex-1 min-h-0 m-0">
          <AiTab />
        </TabsContent>
        <TabsContent value="analytics" className="flex-1 min-h-0 m-0">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
