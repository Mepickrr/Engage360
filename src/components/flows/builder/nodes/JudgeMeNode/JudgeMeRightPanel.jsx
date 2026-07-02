import React from "react";
import { Star } from "lucide-react";

export default function JudgeMeRightPanel({ node, updateNodeData, removeNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <Star size={16} className="text-yellow-500" />
        <span className="text-sm font-semibold text-slate-800">Judge.me — Collect Review</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs text-slate-500">Configuration panel coming soon.</p>
      </div>
    </div>
  );
}
