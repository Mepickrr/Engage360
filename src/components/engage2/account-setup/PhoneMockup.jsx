import React from "react";

const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 720;

function StatusBar() {
  return (
    <div
      className="relative h-11 flex items-end justify-between px-5 pb-2 bg-white flex-shrink-0"
      data-testid="phone-mockup-status-bar"
    >
      <span className="text-[11px] font-semibold text-slate-900">9:41</span>
      <div
        className="w-[100px] h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1"
        data-testid="phone-mockup-notch"
      />
      <div className="flex items-center gap-1 text-[10px] text-slate-900">
        <span>●●●</span>
        <span>Wi-Fi</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function PhoneMockup({ children }) {
  return (
    <div className="relative" data-testid="phone-mockup">
      <div
        className="absolute inset-0 -m-8 rounded-[3rem] blur-2xl opacity-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)",
        }}
      />
      <div
        className="relative bg-slate-100 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, maxHeight: "calc(100vh - 5rem)" }}
      >
        <StatusBar />
        <div className="flex-1 overflow-y-auto bg-white" data-testid="phone-mockup-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
