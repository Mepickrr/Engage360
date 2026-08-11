import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FrequencyCappingTab from "./FrequencyCappingTab";
import JourneyEntryCappingTab from "./JourneyEntryCappingTab";
import CampaignThrottlingTab from "./CampaignThrottlingTab";
import DndTab from "./DndTab";
import UnsubscribeTab from "./UnsubscribeTab";

export default function DeliveryControlsPanel() {
  const [activeTab, setActiveTab] = useState("frequencyCapping");

  return (
    <div data-testid="settings-delivery-controls">
      <h2 className="text-base font-semibold text-text-primary mb-1">Message Delivery Controls</h2>
      <p className="text-sm text-text-secondary mb-4">
        Configure frequency capping, automation limits, and global DND schedules.
      </p>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="frequencyCapping" data-testid="delivery-tab-frequency-capping">
            Frequency Capping
          </TabsTrigger>
          <TabsTrigger value="journeyEntryCapping" data-testid="delivery-tab-journey-entry-capping">
            Journey Entry Capping
          </TabsTrigger>
          <TabsTrigger value="campaignThrottling" data-testid="delivery-tab-campaign-throttling">
            Campaign Throttling
          </TabsTrigger>
          <TabsTrigger value="dnd" data-testid="delivery-tab-dnd">
            DND (Quiet Hours)
          </TabsTrigger>
          <TabsTrigger value="unsubscribe" data-testid="delivery-tab-unsubscribe">
            Unsubscribe
          </TabsTrigger>
        </TabsList>
        <TabsContent value="frequencyCapping">
          <FrequencyCappingTab />
        </TabsContent>
        <TabsContent value="journeyEntryCapping">
          <JourneyEntryCappingTab />
        </TabsContent>
        <TabsContent value="campaignThrottling">
          <CampaignThrottlingTab />
        </TabsContent>
        <TabsContent value="dnd">
          <DndTab />
        </TabsContent>
        <TabsContent value="unsubscribe">
          <UnsubscribeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
