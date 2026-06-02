import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAskAiSuggestions,
  fetchLlmModels,
  setDefaultLlmModel,
} from "@/lib/engageApi";
import { useConversationStore } from "@/store/uiStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sparkles, ChevronDown, SendHorizontal } from "lucide-react";

const PLACEHOLDERS = [
  "Ask your team anything...",
  "What's my checkout recovery status?",
  "Build a re-engagement flow for lapsed users",
  "Who are my highest-intent unconverted users?",
];

export default function AskAiBar({ large = false }) {
  const queryClient = useQueryClient();
  const openWith = useConversationStore((s) => s.openWith);
  const [text, setText] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["ask-ai-suggestions"],
    queryFn: fetchAskAiSuggestions,
    staleTime: 5 * 60_000,
  });

  const { data: modelsData } = useQuery({
    queryKey: ["llm-models"],
    queryFn: fetchLlmModels,
    staleTime: 5 * 60_000,
  });

  const setModelMut = useMutation({
    mutationFn: setDefaultLlmModel,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["llm-models"] }),
  });

  // Rotating placeholder
  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    const seed = text.trim();
    if (!seed) return;
    setText("");
    openWith({ seedMessage: seed, pinnedAgent: null, source: "ask_ai" });
  };

  const currentModel = modelsData?.default_model;
  const currentModelLabel =
    modelsData?.models?.find((m) => m.id === currentModel)?.label ||
    currentModel ||
    "Default model";

  return (
    <section
      className="rounded-xl border border-border bg-surface shadow-[0_1px_4px_rgba(108,58,232,0.06)] bg-gradient-to-br from-white to-[#FAF8FF]"
      style={{ padding: large ? "20px 24px" : "16px" }}
      data-testid="ask-ai-bar"
    >
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
      >
        <div className={`flex gap-3 ${large ? "items-start" : "items-center"}`}>
          <Sparkles className={`text-primary flex-shrink-0 ${large ? "w-5 h-5 mt-1" : "w-4 h-4"}`} />
          <div className="flex-1 min-w-0">
            {large ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                data-testid="ask-ai-input"
                rows={4}
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-text-muted resize-none leading-relaxed"
              />
            ) : (
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                data-testid="ask-ai-input"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-text-muted py-1.5"
              />
            )}
          </div>
        </div>

        <div className={`flex items-center justify-between ${large ? "mt-3 pt-3 border-t border-border/60" : "mt-0"}`}>
          {large ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="ask-ai-model-trigger"
                  className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded-md border border-border bg-white"
                >
                  <span className="font-medium truncate max-w-[200px]">{currentModelLabel}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Default LLM model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(modelsData?.models || []).map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    data-testid={`ask-ai-model-option-${m.id.replace(/[^a-z0-9]/gi, "-")}`}
                    onSelect={() => setModelMut.mutate(m.id)}
                    className={`text-xs ${m.id === currentModel ? "bg-primary-tint text-primary font-semibold" : ""}`}
                  >
                    {m.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-testid="ask-ai-model-trigger"
                    className="hidden md:inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded-md border border-border bg-white"
                  >
                    <span className="font-medium truncate max-w-[180px]">{currentModelLabel}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Default LLM model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(modelsData?.models || []).map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      data-testid={`ask-ai-model-option-${m.id.replace(/[^a-z0-9]/gi, "-")}`}
                      onSelect={() => setModelMut.mutate(m.id)}
                      className={`text-xs ${m.id === currentModel ? "bg-primary-tint text-primary font-semibold" : ""}`}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <button
            type="submit"
            data-testid="ask-ai-send"
            className={`rounded-md bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-1.5 transition-colors ${large ? "px-4 py-2 text-sm font-medium" : "w-9 h-9"}`}
            aria-label="Send"
          >
            <SendHorizontal className={large ? "w-4 h-4" : "w-4 h-4"} />
            {large && <span>Send</span>}
          </button>
        </div>
      </form>

      {!!suggestions.length && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          data-testid="ask-ai-suggestions"
        >
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              data-testid={`ask-ai-suggestion-${s.agent_id}`}
              onClick={() => setText(s.label)}
              className="px-3 py-1 text-[11px] rounded-full border border-border bg-white hover:bg-slate-50 text-text-secondary transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
