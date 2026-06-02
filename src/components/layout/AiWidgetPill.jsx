import React from "react";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConversationStore } from "@/store/uiStore";

export const AiWidgetPill = () => {
  const openWith = useConversationStore((s) => s.openWith);

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="ai-widget-pill"
            aria-label="Ask your AI team"
            onClick={() => openWith({})}
            className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#6C3AE8] to-[#8B5CF6] text-white shadow-lg shadow-[rgba(108,58,232,0.45)] flex items-center justify-center animate-pulse-soft hover:from-[#5A2FD0] hover:to-[#7C4FF0] hover:scale-105 active:scale-95 transition-transform z-50"
          >
            <Sparkles className="w-6 h-6" strokeWidth={2.25} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={10}>
          Ask your AI team
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AiWidgetPill;
