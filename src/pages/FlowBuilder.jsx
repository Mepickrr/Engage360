import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlow,
  fetchFlow,
  updateFlow,
  deleteFlow,
} from "@/lib/flowsApi";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { defaultDataForPaletteItem } from "@/lib/flowMeta";
import BuilderTopbar from "@/components/flows/builder/BuilderTopbar";
import NodePalette from "@/components/flows/builder/NodePalette";
import Canvas from "@/components/flows/builder/Canvas";
import RightPanel from "@/components/flows/builder/RightPanel";
import { toast } from "sonner";
import StartTriggerWizard from "@/components/flows/builder/trigger/StartTriggerWizard";
import AiCallingGlobalWizard from "@/components/flows/builder/nodes/AiCallingNode/AiCallingGlobalWizard";
import AiChatbotGlobalWizard from "@/components/flows/builder/nodes/AiChatbotNode/AiChatbotGlobalWizard";
import { confirmAndRemoveNode } from "@/components/flows/builder/nodes/shared/nodeActions";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Show trigger-selection modal whenever the builder opens for a new flow
  const isNew = !id || id === "new";
  const [triggerModalOpen, setTriggerModalOpen] = useState(isNew);
  const [aiCallingWizardOpen,  setAiCallingWizardOpen]  = useState(false);
  const [aiChatbotWizardOpen,  setAiChatbotWizardOpen]  = useState(false);
  const queryClient = useQueryClient();

  const flowId = useFlowBuilderStore((s) => s.flowId);
  const hydrate = useFlowBuilderStore((s) => s.hydrate);
  const reset = useFlowBuilderStore((s) => s.reset);
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const edges = useFlowBuilderStore((s) => s.edges);
  const meta = useFlowBuilderStore((s) => s.meta);
  const upsertNode = useFlowBuilderStore((s) => s.upsertNode);
  const setFlowId = useFlowBuilderStore((s) => s.setFlowId);
  const setAutosaveStatus = useFlowBuilderStore((s) => s.setAutosaveStatus);
  const removeNode = useFlowBuilderStore((s) => s.removeNode);
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const aiCallingGlobal    = useFlowBuilderStore((s) => s.aiCallingGlobal);
  const setAiCallingGlobal = useFlowBuilderStore((s) => s.setAiCallingGlobal);
  const aiChatbotGlobal    = useFlowBuilderStore((s) => s.aiChatbotGlobal);
  const setAiChatbotGlobal = useFlowBuilderStore((s) => s.setAiChatbotGlobal);

  // Reset store when route changes or unmounts
  useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load flow when /flows/builder/:id
  const { data: serverFlow } = useQuery({
    queryKey: ["flow", id],
    queryFn: () => fetchFlow(id),
    enabled: !!id && id !== "new",
    staleTime: 0,
  });

  // Only hydrate from server when opening an existing saved flow (not after
  // navigating away from /new — the canvas already has the correct local state).
  const hydratedIdRef = useRef(null);
  useEffect(() => {
    if (serverFlow && hydratedIdRef.current !== serverFlow.id) {
      hydratedIdRef.current = serverFlow.id;
      hydrate(serverFlow);
      const hasTrigger = (serverFlow.nodes || []).some((n) => n.id === "start-trigger-node");
      if (!hasTrigger) setTriggerModalOpen(true);
    }
  }, [serverFlow, hydrate]);

  // --- Bootstrap a flow when the user drops the FIRST node on /new ---
  const createMut = useMutation({
    mutationFn: createFlow,
    onSuccess: (doc) => {
      // Mark this ID as already hydrated so the useEffect above doesn't
      // wipe the canvas state we've already built locally.
      hydratedIdRef.current = doc.id;
      setFlowId(doc.id);
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      navigate(`/flows/builder/${doc.id}`, { replace: true });
    },
    onError: () => {
      // Node already appeared on canvas via optimistic upsert — swallow silently.
      // A persistent backend-unavailable banner would be shown by the autosave indicator.
    },
  });

  const onCanvasDrop = useCallback(
    (newNode) => {
      // Always add immediately so the canvas responds even when backend is down.
      upsertNode(newNode);
      if (flowId) return; // Autosave will persist it.
      // First node on /new — create the flow in the background with ALL
      // current canvas nodes (start-trigger + this new one).
      createMut.mutate({
        name: "Untitled flow",
        nodes: [...(useFlowBuilderStore.getState().nodes), newNode],
        edges: useFlowBuilderStore.getState().edges,
      });
    },
    [flowId, upsertNode, createMut],
  );

  // Click-to-add from NodePalette — places node in a cascading grid position.
  const handlePaletteNodeAdd = useCallback(
    (item) => {
      const existingNodes = useFlowBuilderStore.getState().nodes;
      const idx = existingNodes.length;
      const newNode = {
        id: `n${Date.now()}`,
        type: item.kind,
        position: {
          x: 100 + (idx % 3) * 240,
          y: 200 + Math.floor(idx / 3) * 160,
        },
        data: defaultDataForPaletteItem(item),
      };
      onCanvasDrop(newNode);
    },
    [onCanvasDrop],
  );

  // Place / update the start-trigger node on the canvas with the full config
  const placeTriggerNode = useCallback(
    (config) => {
      upsertNode({
        id:       "start-trigger-node",
        type:     "start-trigger",
        position: { x: 260, y: 60 },
        data: {
          config,
          onEdit: () => setTriggerModalOpen(true),
        },
      });
    },
    [upsertNode],
  );

  // Derive existing trigger config from the canvas node (for edit pre-population)
  const existingTriggerConfig = nodes?.find((n) => n.id === "start-trigger-node")?.data?.config ?? null;

  const lockdown = !existingTriggerConfig;

  const handleSaveDraft = useCallback(async () => {
    setTriggerModalOpen(false);
    if (!flowId) {
      try {
        await createFlow({ name: "Untitled flow", nodes: [], edges: [] });
        queryClient.invalidateQueries({ queryKey: ["flows"] });
      } catch (e) {
        toast.error("Couldn't save the draft.");
      }
    }
    navigate("/flows");
  }, [flowId, navigate, queryClient]);

  const handleDeleteFlow = useCallback(async () => {
    setTriggerModalOpen(false);
    if (flowId) {
      try {
        await deleteFlow(flowId);
      } catch (e) {
        toast.error("Couldn't delete the flow, but you can safely leave it as a draft.");
      }
    }
    navigate("/flows");
  }, [flowId, navigate]);

  // Open AI Calling global wizard whenever an aicalling node is selected and not yet configured
  useEffect(() => {
    if (!selectedNodeId) return;
    const node = useFlowBuilderStore.getState().nodes.find((n) => n.id === selectedNodeId);
    if (node?.type === "aicalling" && !useFlowBuilderStore.getState().aiCallingGlobal?.configured) {
      setAiCallingWizardOpen(true);
    }
    if (node?.type === "aichatbot" && !useFlowBuilderStore.getState().aiChatbotGlobal?.configured) {
      setAiChatbotWizardOpen(true);
    }
  }, [selectedNodeId]);

  const handleAiCallingGlobalComplete = useCallback(
    (globalConfig) => {
      setAiCallingGlobal(globalConfig);
      setAiCallingWizardOpen(false);
      toast.success("AI Calling configured");
    },
    [setAiCallingGlobal],
  );

  const handleAiChatbotGlobalComplete = useCallback(
    (globalConfig) => {
      setAiChatbotGlobal(globalConfig);
      setAiChatbotWizardOpen(false);
      toast.success("AI Chatbot configured");
    },
    [setAiChatbotGlobal],
  );

  // Fires when the wizard completes (any path: step1-skip, step2-finish, broadcast)
  const handleTriggerComplete = useCallback(
    (config) => {
      setTriggerModalOpen(false);
      placeTriggerNode(config);
      toast.success("Trigger configured");
    },
    [placeTriggerNode],
  );

  // --- Autosave nodes/edges/meta to backend ---
  const lastSavedRef = useRef({ nodes: null, edges: null });
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!flowId) return;
    if (!nodes && !edges) return;
    // Skip the first hydrate where nodes/edges arrive from server.
    if (
      lastSavedRef.current.nodes === null &&
      lastSavedRef.current.edges === null
    ) {
      lastSavedRef.current = { nodes, edges };
      return;
    }
    if (
      lastSavedRef.current.nodes === nodes &&
      lastSavedRef.current.edges === edges
    ) {
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutosaveStatus("idle");
    debounceRef.current = setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        const saved = await updateFlow(flowId, { nodes, edges });
        lastSavedRef.current = { nodes, edges };
        // Seed flow was converted to a real/local copy — update URL + store ID
        if (saved?.id && saved.id !== flowId) {
          setFlowId(saved.id);
          navigate(`/flows/builder/${saved.id}`, { replace: true });
        }
        setAutosaveStatus("saved");
        queryClient.invalidateQueries({ queryKey: ["flows"] });
        setTimeout(() => setAutosaveStatus("idle"), 1500);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("[flow-builder] autosave failed:", e);
        }
        setAutosaveStatus("error");
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId, nodes, edges, setAutosaveStatus, setFlowId, navigate, queryClient]);

  // Autosave flow meta (name/description/audience) on change.
  const lastMetaRef = useRef(null);
  useEffect(() => {
    if (!flowId || !meta) return;
    const sig = `${meta.name}|${meta.description}`;
    if (lastMetaRef.current === sig) return;
    if (lastMetaRef.current === null) {
      lastMetaRef.current = sig;
      return;
    }
    const t = setTimeout(async () => {
      try {
        await updateFlow(flowId, {
          name: meta.name,
          description: meta.description,
        });
        lastMetaRef.current = sig;
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("[flow-builder] meta autosave failed:", e);
        }
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [flowId, meta]);

  // Backspace to delete selected node (with confirmation if it has edges).
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      // Ignore when typing in an input/textarea
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable)
        return;
      if (!selectedNodeId) return;
      confirmAndRemoveNode(selectedNodeId, edges, removeNode);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedNodeId, edges, removeNode]);

  return (
    <>
      <div
        className="flex flex-col h-[calc(100vh-3rem)] -m-6 bg-app-bg"
        data-testid="flow-builder"
      >
        <BuilderTopbar locked={triggerModalOpen && lockdown} />
        <div className="flex-1 flex min-h-0">
          <NodePalette onNodeAdd={handlePaletteNodeAdd} />
          {/* Only block the canvas + right panel while the trigger modal is being configured */}
          <div className="flex flex-1 min-w-0 min-h-0" style={triggerModalOpen ? { pointerEvents: "none" } : undefined}>
            <ReactFlowProvider>
              <Canvas onCanvasDrop={onCanvasDrop} />
            </ReactFlowProvider>
            <RightPanel />
          </div>
        </div>
      </div>

      <StartTriggerWizard
        open={triggerModalOpen}
        initialConfig={existingTriggerConfig}
        lockdown={lockdown}
        onClose={() => setTriggerModalOpen(false)}
        onComplete={handleTriggerComplete}
        onSaveDraft={handleSaveDraft}
        onDeleteFlow={handleDeleteFlow}
      />

      <AiCallingGlobalWizard
        open={aiCallingWizardOpen}
        initialGlobal={aiCallingGlobal}
        onClose={() => setAiCallingWizardOpen(false)}
        onComplete={handleAiCallingGlobalComplete}
      />

      <AiChatbotGlobalWizard
        open={aiChatbotWizardOpen}
        initialGlobal={aiChatbotGlobal}
        onClose={() => setAiChatbotWizardOpen(false)}
        onComplete={handleAiChatbotGlobalComplete}
      />
    </>
  );
}
