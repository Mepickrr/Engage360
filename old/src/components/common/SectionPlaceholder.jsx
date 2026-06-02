import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

/**
 * SectionPlaceholder
 * Shared "Coming soon" card used by every Phase 0 route.
 * Visuals match the design tokens: white surface, soft border, calm typography.
 */
export const SectionPlaceholder = ({
  title,
  description,
  phase = "Coming soon",
  testId = "section-placeholder",
}) => {
  return (
    <div className="animate-fade-in-up" data-testid={testId}>
      {/* Page title row */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1
            className="text-2xl font-semibold tracking-tight text-text-primary"
            data-testid={`${testId}-title`}
          >
            {title}
          </h1>
          <p className="text-sm text-text-secondary max-w-xl">
            {description}
          </p>
        </div>
        <Badge
          className="bg-primary-tint text-primary border-transparent hover:bg-primary-tint font-medium px-3 py-1 rounded-full"
          data-testid={`${testId}-badge`}
        >
          {phase}
        </Badge>
      </div>

      {/* Card body */}
      <Card className="border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
          <div className="w-14 h-14 rounded-2xl bg-primary-tint flex items-center justify-center mb-5">
            <Sparkles className="w-6 h-6 text-primary" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {title} module is on its way
          </h2>
          <p className="text-sm text-text-secondary mt-2 max-w-md">
            We&apos;re assembling the workflows, dashboards, and AI helpers for
            this section. It will light up in an upcoming phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionPlaceholder;
