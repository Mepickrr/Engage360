import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlow,
  fetchFlow,
  updateFlow,
} from "@/lib/flowsApi";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import BuilderTopbar from "@/components/flows/builder/BuilderTopbar";
import NodePalette from "@/components/flows/builder/NodePalette";
import Canvas from "@/components/flows/builder/Canvas";
import RightPanel from "@/components/flows/builder/RightPanel";
import { toast } from "sonner";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (serverFlow) hydrate(serverFlow);
  }, [serverFlow, hydrate]);

  // --- Bootstrap a flow when the user drops the FIRST node on /new ---
  const createMut = useMutation({
    mutationFn: createFlow,
    onSuccess: (doc) => {
      hydrate(doc);
      setFlowId(doc.id);
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      // Replace URL to /flows/builder/<id> without re-mounting the page.
      navigate(`/flows/builder/${doc.id}`, { replace: true });
    },
    onError: () => {
      toast.error("Couldn't create the flow. Try again.");
    },
  });

  const onCanvasDrop = useCallback(
    async (newNode) => {
      // If we already have a flow id, just add the node to the store.
      // Autosave will persist it.
      if (flowId) {
        upsertNode(newNode);
        return;
      }
      // First drop on a fresh /new — create flow with this single node.
      createMut.mutate({
        name: "Untitled flow",
        nodes: [newNode],
        edges: [],
      });
    },
    [flowId, upsertNode, createMut],
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
        await updateFlow(flowId, { nodes, edges });
        lastSavedRef.current = { nodes, edges };
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
  }, [flowId, nodes, edges, setAutosaveStatus, queryClient]);

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
      const hasEdges = edges.some(
        (ed) => ed.source === selectedNodeId || ed.target === selectedNodeId,
      );
      if (hasEdges && !window.confirm("Delete this node and its connections?"))
        return;
      removeNode(selectedNodeId);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedNodeId, edges, removeNode]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-3rem)] -m-6 bg-app-bg"
      data-testid="flow-builder"
    >
      <BuilderTopbar />
      <div className="flex-1 flex min-h-0">
        <NodePalette />
        <ReactFlowProvider>
          <Canvas onCanvasDrop={onCanvasDrop} />
        </ReactFlowProvider>
        <RightPanel />
      </div>
    </div>
  );
}
