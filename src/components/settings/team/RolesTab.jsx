import React, { useState } from "react";
import { Plus, Trash2, Lock, Users } from "lucide-react";
import { PERMISSION_COMPONENTS, PERMISSION_LEVELS, slugifyRoleName } from "./constants";

export default function RolesTab({ roles, members, onTogglePermission, onCreateRole, onDeleteRole, onRenameRole, onViewRoleMembers }) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id);
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = roles.find((r) => r.id === selectedId) || roles[0];

  function handleCreate() {
    const name = newRoleName.trim();
    if (!name) return;
    const id = slugifyRoleName(name, roles.map((r) => r.id));
    onCreateRole({ id, name });
    setSelectedId(id);
    setNewRoleName("");
    setCreating(false);
  }

  function handleDelete(role) {
    if (window.confirm(`Delete the "${role.name}" role?`)) {
      onDeleteRole(role.id);
      setSelectedId(roles.find((r) => r.id !== role.id)?.id);
    }
  }

  return (
    <div className="flex gap-4" data-testid="team-roles-tab">
      <div className="w-[220px] flex-shrink-0 bg-surface border border-border rounded-lg p-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center group">
            <button
              type="button"
              data-testid={`role-nav-${r.id}`}
              onClick={() => setSelectedId(r.id)}
              className={`flex-1 text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                selected?.id === r.id ? "bg-primary-tint text-primary font-semibold" : "text-text-secondary hover:bg-slate-50"
              }`}
            >
              {r.name}
            </button>
            {r.type === "custom" && (
              <button
                type="button"
                data-testid={`role-delete-${r.id}`}
                onClick={() => handleDelete(r)}
                aria-label={`Delete ${r.name}`}
                className="p-1.5 text-text-muted hover:text-rose-600 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {creating ? (
          <div className="p-2 space-y-2">
            <input
              type="text"
              autoFocus
              data-testid="role-new-name-input"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Role name"
              className="w-full px-2 py-1.5 border border-border rounded-md text-[12px]"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                data-testid="role-new-confirm"
                onClick={handleCreate}
                className="px-2 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
              >
                Add
              </button>
              <button
                type="button"
                data-testid="role-new-cancel"
                onClick={() => { setCreating(false); setNewRoleName(""); }}
                className="px-2 py-1 rounded-md border border-border text-[11px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            data-testid="role-create-btn"
            onClick={() => setCreating(true)}
            className="w-full mt-1 flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] text-primary hover:bg-primary-tint font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new role
          </button>
        )}
      </div>

      {selected && (
        <div className="flex-1 bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            {selected.type === "custom" ? (
              <input
                type="text"
                data-testid={`role-name-input-${selected.id}`}
                value={selected.name}
                onChange={(e) => onRenameRole(selected.id, e.target.value)}
                className="text-sm font-semibold text-text-primary border border-border rounded-md px-2 py-1"
              />
            ) : (
              <h3 className="text-sm font-semibold text-text-primary">{selected.name}</h3>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-slate-100 text-text-muted">
              {selected.type}
            </span>
            {selected.locked && <Lock className="w-3.5 h-3.5 text-text-muted" />}
          </div>

          <button
            type="button"
            data-testid={`role-user-count-${selected.id}`}
            onClick={() => onViewRoleMembers?.(selected.id)}
            className="inline-flex items-center gap-1.5 mb-4 text-[12px] text-text-secondary hover:text-primary hover:underline"
          >
            <Users className="w-3.5 h-3.5" />
            {members.filter((m) => m.roleId === selected.id).length} user
            {members.filter((m) => m.roleId === selected.id).length === 1 ? "" : "s"} with this role
          </button>

          <table className="w-full text-left">
            <thead className="text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="py-2 font-medium">Components</th>
                {PERMISSION_LEVELS.map((lvl) => (
                  <th key={lvl.key} className="py-2 font-medium text-center">{lvl.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_COMPONENTS.map((c) => (
                <tr key={c.key} className="border-t border-border" data-testid={`role-perm-row-${c.key}`}>
                  <td className="py-3 text-[13px] text-text-primary">{c.label}</td>
                  {PERMISSION_LEVELS.map((lvl) => (
                    <td key={lvl.key} className="py-3 text-center">
                      <input
                        type="checkbox"
                        data-testid={`role-perm-${selected.id}-${c.key}-${lvl.key}`}
                        checked={selected.permissions[c.key][lvl.key]}
                        disabled={selected.locked}
                        onChange={(e) => onTogglePermission(selected.id, c.key, lvl.key, e.target.checked)}
                        className="w-4 h-4 accent-primary disabled:cursor-not-allowed"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
