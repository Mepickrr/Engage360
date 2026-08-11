import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AttributionWindowsTab from "@/components/settings/revenueAttribution/AttributionWindowsTab";
import PrioritiesTab from "@/components/settings/revenueAttribution/PrioritiesTab";

export default function RevenueAttributionTab() {
  const [activeTab, setActiveTab] = useState("attributionWindows");

  return (
    <div data-testid="settings-revenue-attribution">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="attributionWindows" data-testid="revenue-attribution-tab-windows">
            Attribution Windows
          </TabsTrigger>
          <TabsTrigger value="priorities" data-testid="revenue-attribution-tab-priorities">
            Priorities
          </TabsTrigger>
        </TabsList>
        <TabsContent value="attributionWindows">
          <AttributionWindowsTab />
        </TabsContent>
        <TabsContent value="priorities">
          <PrioritiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
