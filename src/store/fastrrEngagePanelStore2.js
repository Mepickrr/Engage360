// Global state for the Fastrr Journey pitch panel (right-side Sheet).
// Mirrors the minimal shape of the conversation panel's isOpen/open/close.

import { create } from "zustand";

export const useFastrrEngagePanelStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
