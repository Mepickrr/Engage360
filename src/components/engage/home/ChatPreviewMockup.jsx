import React from "react";

export default function ChatPreviewMockup() {
  return (
    <div
      className="max-w-sm mx-auto bg-white rounded-xl shadow-xl overflow-hidden rotate-2"
      data-testid="chat-preview-mockup"
    >
      <div
        className="flex items-center gap-2 px-4 py-3 text-white"
        style={{ background: "#25D366" }}
      >
        <span className="w-2 h-2 rounded-full bg-white" />
        <span className="text-sm font-semibold">Fastrr Journey</span>
      </div>
      <div className="flex flex-col gap-2 p-4 bg-app-bg">
        <div className="bg-white/90 text-slate-900 text-sm rounded-lg rounded-bl-none px-3 py-2 self-start shadow-sm max-w-[85%]">
          Cart reminder sent
        </div>
        <div className="bg-white/60 text-slate-900 text-sm rounded-lg rounded-br-none px-3 py-2 self-end shadow-sm max-w-[85%]">
          "Yes, still interested!"
        </div>
        <div className="bg-white text-slate-900 text-sm rounded-lg rounded-bl-none px-3 py-2 self-start shadow-sm font-medium max-w-[85%]">
          ✅ Order confirmed
        </div>
      </div>
    </div>
  );
}
