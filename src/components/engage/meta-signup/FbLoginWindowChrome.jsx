import React from "react";
import { Facebook, Minus, Square, X } from "lucide-react";

export default function FbLoginWindowChrome({ children }) {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="fb-login-window-chrome">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
          <span className="text-[11px] text-slate-700">Facebook Login for Business - Google Chrome</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Minus className="w-3 h-3" />
          <Square className="w-3 h-3" />
          <X className="w-3 h-3" />
        </div>
      </div>
      <div className="px-3 py-1 bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 flex-shrink-0">
        facebook.com/v18.0/dialog/oauth?app_id=2158101317955389&c...
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
