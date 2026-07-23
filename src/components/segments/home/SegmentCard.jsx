import React from "react";
import { Users, MoreVertical } from "lucide-react";

export default function SegmentCard({
  testId,
  name,
  Icon,
  updated,
  description,
  users,
  footerRight,
  badge,
  onMenuClick,
}) {
  return (
    <div
      data-testid={testId}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-violet-600" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-text-primary truncate">{name}</div>
            {updated && <div className="text-[11px] text-text-muted">{`Updated ${updated}`}</div>}
          </div>
        </div>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-[12px] text-text-secondary leading-snug flex-1">{description}</p>
      )}

      {(users || footerRight || onMenuClick) && (
        <div className="mt-3 -mx-4 -mb-4 px-4 py-2.5 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-primary">
            {users && (
              <>
                <Users className="w-3.5 h-3.5 text-text-muted" />
                {users}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            {footerRight}
            {onMenuClick && (
              <button
                type="button"
                data-testid={`${testId}-menu`}
                onClick={onMenuClick}
                className="p-1 rounded hover:bg-slate-200 text-text-muted"
                aria-label="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
