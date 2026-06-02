// Extra API helpers (built on top of /app/frontend/src/lib/api.js).
// Phase 1 endpoints used by Agent Home + Conversation Panel.

import { api } from "@/lib/api";

export const fetchAgents = () => api.get("/agents");
export const fetchStoreStats = () => api.get("/store-stats");
export const fetchIntelligenceCards = () => api.get("/intelligence-cards");
export const refreshIntelligenceCard = (id) =>
  api.post(`/intelligence-cards/${id}/refresh`);
export const fetchReports = () => api.get("/reports");
export const fetchReport = (id) => api.get(`/reports/${id}`);
export const fetchAskAiSuggestions = () => api.get("/ask-ai/suggestions");

export const fetchTasks = (status) =>
  api.get(`/tasks${status ? `?status=${status}` : ""}`);
export const fetchTaskCounts = () => api.get("/tasks/counts");
export const approveTask = (id) => api.post(`/tasks/${id}/approve`);
export const rejectTask = (id) => api.post(`/tasks/${id}/reject`);

export const fetchConversations = () => api.get("/conversations");
export const fetchConversation = (id) => api.get(`/conversations/${id}`);
export const createConversation = (body) => api.post("/conversations", body);
export const sendMessage = (conversationId, body) =>
  api.post(`/conversations/${conversationId}/messages`, body);
export const generateArtefact = (conversationId, messageId) =>
  api.post(
    `/conversations/${conversationId}/messages/${messageId}/generate-artefact`,
  );

export const fetchLlmModels = () => api.get("/llm/models");
export const setDefaultLlmModel = (model) =>
  api.post("/llm/default-model", { model });
