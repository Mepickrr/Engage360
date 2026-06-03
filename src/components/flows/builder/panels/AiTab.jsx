import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFlowConversation,
  sendFlowMessage,
} from "@/lib/flowsApi";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { Loader2, SendHorizontal, Undo2 } from "lucide-react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Add a 24h wait after WhatsApp",
  "Add an email fallback if no purchase",
  "Move SMS before email",
  "Add an A/B split on the message",
];

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div
        className="flex justify-end"
        data-testid={`ai-msg-user-${msg.id}`}
      >
        <div className="max-w-[85%] bg-primary-tint text-text-primary rounded-2xl rounded-br-sm px-3 py-1.5 text-[12px] whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2" data-testid={`ai-msg-agent-${msg.id}`}>
      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-semibold bg-slate-500">
        D
      </div>
      <div className="text-[12px] text-text-primary whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  );
}

export default function AiTab() {
  const flowId = useFlowBuilderStore((s) => s.flowId);
  const setNodes = useFlowBuilderStore((s) => s.setNodes);
  const setEdges = useFlowBuilderStore((s) => s.setEdges);
  const takeAiSnapshot = useFlowBuilderStore((s) => s.takeAiSnapshot);
  const restoreAiSnapshot = useFlowBuilderStore((s) => s.restoreAiSnapshot);

  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef(null);

  const { data: convoData, refetch } = useQuery({
    queryKey: ["flow-convo", flowId],
    queryFn: () => fetchFlowConversation(flowId),
    enabled: !!flowId,
    staleTime: 0,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [convoData?.messages, pending]);

  const sendMut = useMutation({
    mutationFn: (content) => sendFlowMessage(flowId, content),
    onMutate: () => setPending(true),
    onSuccess: (resp) => {
      if (resp.modification) {
        takeAiSnapshot();
        setNodes(resp.modification.nodes || []);
        setEdges(resp.modification.edges || []);
        toast.success("Dev updated the flow", {
          action: {
            label: (
              <span className="inline-flex items-center gap-1">
                <Undo2 className="w-3 h-3" /> Undo
              </span>
            ),
            onClick: () => {
              restoreAiSnapshot();
              toast.info("Change undone");
            },
          },
          duration: 5000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["flow-convo", flowId] });
      queryClient.invalidateQueries({ queryKey: ["flow", flowId] });
      refetch();
    },
    onError: () => {
      toast.error("Couldn't reach Dev. Try again.");
    },
    onSettled: () => setPending(false),
  });

  const submit = (preset) => {
    const content = (preset ?? text).trim();
    if (!content || pending) return;
    setText("");
    sendMut.mutate(content);
  };

  return (
    <div className="absolute inset-0 flex flex-col" data-testid="right-ai-tab">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-500 text-white text-[10px] font-semibold flex items-center justify-center">
            D
          </div>
          <div className="text-[13px] font-semibold text-text-primary">
            Ask Dev to modify this flow
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {(convoData?.messages || []).map((m) => (
          <Message key={m.id} msg={m} />
        ))}
        {pending && (
          <div
            className="flex items-center gap-2 text-[12px] text-text-muted"
            data-testid="ai-thinking"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Dev is working on it...
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface px-3 py-2">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => submit(p)}
              disabled={pending || !flowId}
              data-testid={`ai-suggested-${p.slice(0, 12).replace(/\s/g, "-")}`}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-white hover:bg-slate-50 text-text-secondary disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-1.5"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask Dev to add, remove, or change steps..."
            disabled={pending || !flowId}
            data-testid="ai-input"
            className="flex-1 resize-none rounded-md border border-border bg-white px-2 py-1.5 text-[12px] focus:border-primary/60 focus:outline-none min-h-[34px] max-h-[100px] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            data-testid="ai-send"
            className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-50"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
