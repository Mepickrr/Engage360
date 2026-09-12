// Global state for the Fastrr Journey wallet balance shown in JourneyHeader
// and topped up via WelcomeModal. Mirrors the minimal shape of the other
// small feature stores in this app (e.g. fastrrEngagePanelStore).

import { create } from "zustand";

export const useJourneyWalletStore = create((set) => ({
  balance: 0,
  credit: (amount) => set((s) => ({ balance: s.balance + amount })),
}));
