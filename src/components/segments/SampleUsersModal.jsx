import React from "react";
import { X, User } from "lucide-react";

const SAMPLE_NAMES = [
  { name: "Aanya Sharma", email: "aanya.s@example.com", lastActive: "2 hours ago" },
  { name: "Rohan Mehta", email: "rohan.m@example.com", lastActive: "5 hours ago" },
  { name: "Ishaan Kapoor", email: "ishaan@example.com", lastActive: "1 day ago" },
  { name: "Sneha Iyer", email: "sneha.i@example.com", lastActive: "3 hours ago" },
  { name: "Karthik Rao", email: "karthik.r@example.com", lastActive: "6 hours ago" },
  { name: "Meera Pillai", email: "meera.p@example.com", lastActive: "12 hours ago" },
];

// Lightweight modal listing a handful of mock synthetic users matching a
// segment's general shape — not a real query result (no backend).
export default function SampleUsersModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" data-testid="sample-users-modal">
      <div className="bg-surface rounded-lg border border-border shadow-lg w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">Sample users</span>
          <button
            type="button"
            onClick={onClose}
            data-testid="sample-users-close"
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {SAMPLE_NAMES.map((u) => (
            <div key={u.email} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text-primary truncate">{u.name}</div>
                <div className="text-[12px] text-text-muted truncate">{u.email}</div>
              </div>
              <div className="text-[12px] text-text-muted flex-shrink-0">{u.lastActive}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
