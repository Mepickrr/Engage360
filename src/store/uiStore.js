// Global conversation panel state.
// Owns whether the panel is open, what it's pinned to, and the active
// artefact being shown in Build Mode.

import { create } from "zustand";

export const useConversationStore = create((set, get) => ({
  isOpen: false,
  conversationId: null,
  pinnedAgent: null,
  seedMessage: null,        // consumed once the panel opens
  source: "ask_ai",
  mode: "conversational",   // "conversational" | "build"
  activeArtefactMessageId: null,

  openWith: ({ seedMessage = null, pinnedAgent = null, source = "ask_ai", conversationId = null } = {}) =>
    set({
      isOpen: true,
      conversationId,
      pinnedAgent,
      seedMessage,
      source,
      mode: "conversational",
      activeArtefactMessageId: null,
    }),

  consumeSeedMessage: () => {
    const seed = get().seedMessage;
    set({ seedMessage: null });
    return seed;
  },

  setConversationId: (id) => set({ conversationId: id }),
  setPinnedAgent: (id) => set({ pinnedAgent: id }),
  enterBuildMode: (messageId) =>
    set({ mode: "build", activeArtefactMessageId: messageId }),
  exitBuildMode: () =>
    set({ mode: "conversational", activeArtefactMessageId: null }),

  close: () =>
    set({
      isOpen: false,
      mode: "conversational",
      activeArtefactMessageId: null,
    }),
}));
