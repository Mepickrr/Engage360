import React, { useState } from "react";
import { TrendingUp, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { OPPORTUNITY_CARDS } from "@/data/segmentsHomeData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PAGE_SIZE = 3;

export default function OpportunityCarousel() {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, OPPORTUNITY_CARDS.length - PAGE_SIZE);
  const visible = OPPORTUNITY_CARDS.slice(start, start + PAGE_SIZE);

  return (
    <section data-testid="opportunity-carousel" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-1.5">
          Opportunities to grow revenue
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-text-muted cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                Revenue based on past customer behavior and typical conversion rates. Results may vary.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="opportunity-carousel-prev"
            disabled={start === 0}
            onClick={() => setStart((s) => Math.max(0, s - PAGE_SIZE))}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="opportunity-carousel-next"
            disabled={start >= maxStart}
            onClick={() => setStart((s) => Math.min(maxStart, s + PAGE_SIZE))}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((card) => (
          <div key={card.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug">{card.headline}</h3>
            <p className="mt-1 text-[12px] text-text-muted">{card.description}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-[11px] text-text-muted">Estimated gain</div>
                <div className="text-[15px] font-semibold text-emerald-700">{card.gain}</div>
              </div>
              <button
                type="button"
                disabled={!card.boostEnabled}
                className="px-3 py-1.5 rounded-md border border-primary text-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted hover:bg-primary/5"
              >
                Boost sales
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
