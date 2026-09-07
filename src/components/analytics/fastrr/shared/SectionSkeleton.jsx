import React from "react";

export default function SectionSkeleton({ testId, rows = 3 }) {
  return (
    <div data-testid={testId} className="bg-surface border border-border rounded-lg p-4 space-y-3 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}
