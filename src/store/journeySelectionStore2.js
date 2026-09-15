// engage2-only cart: which journey ids the seller picked on the Listing
// page, carried through Recharge -> Account Setup -> Signup (all same-tab
// navigation, per the design's Technical Decision) to the Dashboard, which
// seeds its enabled-journeys state from this on arrival, then clears it.

import { create } from "zustand";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";

export const useJourneySelectionStore2 = create((set, get) => ({
  selected: {},
  toggle: (journeyId) =>
    set((s) => {
      const next = { ...s.selected };
      if (next[journeyId]) {
        delete next[journeyId];
      } else {
        next[journeyId] = true;
      }
      return { selected: next };
    }),
  isSelected: (journeyId) => !!get().selected[journeyId],
  selectedJourneys: () => JOURNEYS.filter((j) => get().selected[j.id]),
  clear: () => set({ selected: {} }),
}));
