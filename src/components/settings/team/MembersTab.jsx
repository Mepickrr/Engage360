import React, { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import { UNASSIGNED_ROLE_ID } from "./constants";

export default function MembersTab({ members, roles, onAddMembers, onChangeMemberRole, onDeleteMember }) {
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = members.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  function handleDelete(member) {
    if (window.confirm(`Remove ${member.name} from the team?`)) {
      onDeleteMember(member.id);
    }
  }

  return (
    <div data-testid="team-members-tab">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            data-testid="team-members-search"
            placeholder="Search by name or email.."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <button
          type="button"
          data-testid="team-invite-btn"
          onClick={() => setInviteOpen(true)}
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium whitespace-nowrap"
        >
          Invite team mate
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Teammate</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border" data-testid={`team-member-row-${m.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </div>
                    <span className="font-semibold text-text-primary text-[13px]">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{m.email}</td>
                <td className="px-4 py-3">
                  <select
                    data-testid={`team-member-role-select-${m.id}`}
                    value={m.roleId}
                    onChange={(e) => onChangeMemberRole(m.id, e.target.value)}
                    className="text-[12px] border border-border rounded-md px-2 py-1 bg-white"
                  >
                    {m.roleId === UNASSIGNED_ROLE_ID && <option value={UNASSIGNED_ROLE_ID}>No role</option>}
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    data-testid={`team-member-delete-${m.id}`}
                    onClick={() => handleDelete(m)}
                    aria-label={`Remove ${m.name}`}
                    className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-text-muted">
                  No teammates match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteMemberModal open={inviteOpen} roles={roles} onClose={() => setInviteOpen(false)} onInvite={onAddMembers} />
    </div>
  );
}
