// Extend the API client with flow endpoints (Phase 2).
//
// The original Phase 1 helpers stay in /lib/engageApi.js; we just append new
// flow ones here.

import { api } from "@/lib/api";

export const fetchFlows = () => api.get("/flows");
export const fetchFlow = (id) => api.get(`/flows/${id}`);
export const createFlow = (body) => api.post("/flows", body);
export const updateFlow = (id, body) => api.put(`/flows/${id}`, body);
export const publishFlow = (id) => api.post(`/flows/${id}/publish`);
export const pauseFlow = (id) => api.post(`/flows/${id}/pause`);
export const resumeFlow = (id) => api.post(`/flows/${id}/resume`);
export const deleteFlow = (id) => api.del(`/flows/${id}`);

export const fetchFlowConversation = (id) =>
  api.get(`/flows/${id}/conversation`);
export const sendFlowMessage = (id, content) =>
  api.post(`/flows/${id}/messages`, { content });
export const aiModifyFlow = (id, message) =>
  api.post(`/flows/${id}/ai-modify`, { message });
