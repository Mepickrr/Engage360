import { defaultDataForPaletteItem, rendererTypeForKind } from "../flowMeta";

jest.mock(
  "@/components/flows/builder/nodes/JudgeMeNode/data/mockData",
  () => ({ defaultJudgeMeNodeData: { label: "Collect Review", channel: "whatsapp" } }),
);
// Silence all other mockData imports
jest.mock("@/components/flows/builder/nodes/AiCallingNode/data/mockData",      () => ({ defaultAiCallingNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiCallingV2Node/data/mockData",    () => ({ defaultAiCallingV2NodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiChatbotNode/data/mockData",      () => ({ defaultAiChatbotNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/RCSNode/data/mockData",            () => ({ defaultRCSNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiPredictNode/data/mockData",      () => ({ defaultAiPredictNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/StartFlowNode/data/mockData",      () => ({ defaultStartFlowNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/RazorpayNode/data/mockData",       () => ({ defaultRazorpayNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/SMSNode/data/mockData",            () => ({ defaultSMSNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/PushNode/data/mockData",           () => ({ defaultPushNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/ConditionalSplitNode/data/mockData",() => ({ defaultConditionalSplitData: {} }));
jest.mock("@/components/flows/builder/nodes/EmailNode/data/mockData",          () => ({ defaultEmailNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/OnsiteNode/data/mockData",         () => ({ defaultOnsiteNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/InAppNode/data/mockData",          () => ({ defaultInAppNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/NextBestActionNode/data/mockData", () => ({ defaultNBANodeData: {} }));
jest.mock("@/components/flows/builder/nodes/SmartFlowOptimizerNode/data/mockData",() => ({ defaultSFONodeData: {} }));
jest.mock("@/components/flows/builder/nodes/WebhookNode/data/mockData",        () => ({ defaultWebhookNodeData: {} }));

describe("flowMeta — judgeme", () => {
  it("defaultDataForPaletteItem returns judgeme defaults for kind:judgeme", () => {
    const data = defaultDataForPaletteItem({ kind: "judgeme" });
    expect(data.label).toBe("Collect Review");
    expect(data.channel).toBe("whatsapp");
  });

  it("rendererTypeForKind returns judgeme for kind:judgeme", () => {
    expect(rendererTypeForKind("judgeme")).toBe("judgeme");
  });
});
