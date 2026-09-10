import React from "react";
import { Infinity as InfinityIcon, RefreshCw, User } from "lucide-react";

export default function MetaTopBarChrome({ children }) {
  return (
    <div className="flex flex-col h-full" data-testid="meta-top-bar-chrome">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <InfinityIcon className="w-5 h-5 text-primary" />
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
