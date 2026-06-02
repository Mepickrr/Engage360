import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  fetchConversation,
  fetchLlmModels,
  generateArtefact,
  sendMessage,
} from "@/lib/engageApi";
import { createFlow } from "@/lib/flowsApi";
import { useConversationStore } from "@/store/uiStore";
import AgentRoster from "./AgentRoster";
import MessageList from "./MessageList";
import ArtefactPanel from "./ArtefactPanel";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function ConversationPanel() {
  const navigate = useNavigate();
  const {
    isOpen,
    conversationId,
    pinnedAgent,
    seedMessage,
    source,
    mode,
    activeArtefactMessageId,
    consumeSeedMessage,
    setConversationId,
    setPinnedAgent,
    enterBuildMode,
    exitBuildMode,
    close,
  } = useConversationStore();

  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [pendingSend, setPendingSend] = useState(false);
  const [artefactLoadingIds, setArtefactLoadingIds] = useState(new Set());

  // Reset thread state when panel closes / opens
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setText("");
      setPendingSend(false);
      setArtefactLoadingIds(new Set());
    }
  }, [isOpen]);

  // Load existing conversation if opened with an id
  const { data: convoData } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    enabled: !!conversationId && isOpen,
    staleTime: 0,
  });

  useEffect(() => {
    if (convoData?.messages) {
      setMessages(convoData.messages);
    }
  }, [convoData]);

  const { data: modelsData } = useQuery({
    queryKey: ["llm-models"],
    queryFn: fetchLlmModels,
    staleTime: 5 * 60_000,
    enabled: isOpen,
  });
  const currentModel = modelsData?.default_model || "default";

  // Bootstrapping: open with seed message → create conversation
  const initRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      initRef.current = false;
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    const seed = consumeSeedMessage();
    const needBootstrap = !conversationId;

    const run = async () => {
      try {
        if (needBootstrap) {
          const optimisticUser = seed
            ? [
                {
                  id: `temp-user-${Date.now()}`,
                  role: "user",
                  content: seed,
                  created_at: new Date().toISOString(),
                  conversation_id: "pending",
                },
              ]
            : [];
          setMessages(optimisticUser);
          if (seed) setPendingSend(true);

          const resp = await createConversation({
            seed_message: seed,
            pinned_agent: pinnedAgent,
            source,
          });
          if (resp?.conversation?.id) {
            setConversationId(resp.conversation.id);
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
          if (resp?.messages?.length) {
            setMessages(resp.messages);
          }
          setPendingSend(false);

          // Auto-generate artefact if routing requested one
          const agentMsg = (resp?.messages || []).find(
            (m) => m.role === "agent" && m.pending_artefact_type,
          );
          if (agentMsg && resp.conversation?.id) {
            enterBuildMode(agentMsg.id);
            kickArtefactGeneration(resp.conversation.id, agentMsg.id);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("We couldn't start the conversation. Try again.");
        setPendingSend(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendMut = useMutation({
    mutationFn: ({ convId, content, pin }) =>
      sendMessage(convId, { content, pinned_agent: pin }),
    onError: () => {
      setPendingSend(false);
      toast.error(
        "We hit a snag generating that response. Try again or rephrase.",
      );
    },
  });

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    if (pendingSend) return;
    setText("");

    let convId = conversationId;
    if (!convId) {
      try {
        const resp = await createConversation({
          seed_message: null,
          pinned_agent: pinnedAgent,
          source,
        });
        convId = resp.conversation?.id;
        if (convId) setConversationId(convId);
      } catch {
        toast.error("Could not start a conversation.");
        return;
      }
    }

    const tempId = `temp-user-${Date.now()}`;
    const userMsg = {
      id: tempId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
      conversation_id: convId,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPendingSend(true);

    try {
      const resp = await sendMut.mutateAsync({
        convId,
        content,
        pin: pinnedAgent,
      });
      const newMsgs = resp?.messages || [];
      // Replace temp user msg with returned ones and keep prior history
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return [...withoutTemp, ...newMsgs];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      const agentMsg = newMsgs.find(
        (m) => m.role === "agent" && m.pending_artefact_type,
      );
      if (agentMsg) {
        enterBuildMode(agentMsg.id);
        kickArtefactGeneration(convId, agentMsg.id);
      }
    } catch (err) {
      // sendMut.onError already surfaced the toast — log for diagnostics.
      console.error("ConversationPanel: send failed", err);
    } finally {
      setPendingSend(false);
    }
  };

  const kickArtefactGeneration = async (convId, msgId) => {
    setArtefactLoadingIds((prev) => new Set(prev).add(msgId));
    try {
      const updated = await generateArtefact(convId, msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, ...updated } : m)),
      );
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate the artefact. Continuing in chat mode.");
      exitBuildMode();
    } finally {
      setArtefactLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
  };

  const activeMessage = useMemo(
    () => messages.find((m) => m.id === activeArtefactMessageId) || null,
    [messages, activeArtefactMessageId],
  );

  const isArtefactGenerating =
    activeArtefactMessageId && artefactLoadingIds.has(activeArtefactMessageId);

  const onApproveFlow = async () => {
    if (!conversationId) {
      toast.error("No brief to hand off — start a new conversation first.");
      return;
    }
    // Look up the artefact in the active agent message so we can carry its name.
    const briefMsg = messages.find(
      (m) =>
        m.role === "agent" && m.artefact && m.artefact.type === "flow_brief",
    );
    const briefName = briefMsg?.artefact?.payload?.name || undefined;

    toast.message("Building flow from brief...");
    try {
      const flow = await createFlow({
        from_brief_id: conversationId,
        name: briefName,
      });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-counts"] });
      toast.success("Flow created. Review and publish when ready.");
      exitBuildMode();
      close();
      navigate(`/flows/builder/${flow.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't create the flow from this brief.");
    }
  };
  const onSaveSegment = () => {
    toast.success("Segment saved — Phase 2 will publish to your audience list.");
    exitBuildMode();
  };
  const onUseCreative = () => {
    toast.success("Variant queued for your next campaign.");
  };

  const buildMode = mode === "build" && activeArtefactMessageId;
  const widthClass = buildMode ? "sm:max-w-[95vw]" : "sm:max-w-[640px]";

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className={`w-full ${widthClass} p-0 flex flex-col`}
        data-testid="conversation-panel"
      >
        <SheetHeader className="px-5 py-3 border-b border-border">
          <SheetTitle className="text-[14px]">
            Your AI team
            <span className="ml-2 text-[11px] text-text-muted font-normal">
              · powered by {currentModel}
            </span>
          </SheetTitle>
        </SheetHeader>

        <AgentRoster pinnedAgent={pinnedAgent} onPinChange={setPinnedAgent} />

        <div className="flex-1 flex min-h-0">
          <div
            className={`flex flex-col min-h-0 ${
              buildMode ? "w-[55%] border-r border-border" : "w-full"
            }`}
          >
            <MessageList
              messages={messages}
              isPending={pendingSend}
              pinnedAgent={pinnedAgent}
              onEnterBuild={(messageId) => {
                enterBuildMode(messageId);
                // If artefact not yet generated and conversation known, kick it off
                const target = messages.find((m) => m.id === messageId);
                if (target && !target.artefact && conversationId) {
                  kickArtefactGeneration(conversationId, messageId);
                }
              }}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="border-t border-border bg-surface px-4 py-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder={
                    pinnedAgent
                      ? `Message ${pinnedAgent}... (Enter to send)`
                      : "Ask your AI team..."
                  }
                  data-testid="conversation-input"
                  className="flex-1 resize-none rounded-md border border-border bg-white px-3 py-2 text-[14px] focus:border-primary/60 focus:outline-none min-h-[40px] max-h-[140px]"
                />
                <button
                  type="submit"
                  disabled={pendingSend || !text.trim()}
                  data-testid="conversation-send"
                  className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-1.5 text-[10px] text-text-muted">
                Model: {currentModel}
              </div>
            </form>
          </div>

          {buildMode && (
            <div className="w-[45%] bg-app-bg" data-testid="build-mode-panel">
              <ArtefactPanel
                message={activeMessage}
                isGenerating={isArtefactGenerating}
                onCollapse={exitBuildMode}
                onApproveFlow={onApproveFlow}
                onSaveSegment={onSaveSegment}
                onUseCreative={onUseCreative}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
