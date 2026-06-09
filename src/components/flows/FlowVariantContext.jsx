import { createContext, useContext } from "react";

// Carries variant-specific feature overrides for the flow builder.
// V1 builder never wraps with this provider — all consumers return null and
// fall back to their defaults. V2 builder provides a config object.
//
// To re-enable a hidden feature in V2, add its ID to the relevant array in
// FlowBuilderV2.jsx's V2_VARIANT constant.
export const FlowVariantContext = createContext(null);

export function useFlowVariant() {
  return useContext(FlowVariantContext) ?? {};
}
