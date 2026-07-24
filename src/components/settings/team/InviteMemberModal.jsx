import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { previewToast } from "@/components/common/PreviewHeader";
import EmailChipInput from "./EmailChipInput";
import { initialsOf, colorForSeed } from "./constants";

export default function InviteMemberModal({ open, roles, onClose, onInvite }) {
  const defaultRoleId = roles.find((r) => !r.locked)?.id || roles[0].id;
  const [rows, setRows] = useState([]);
  const [bulkRoleId, setBulkRoleId] = useState(defaultRoleId);

  useEffect(() => {
    if (open) {
      setRows([]);
      setBulkRoleId(defaultRoleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleEmailsChange(newEmails) {
    setRows((prev) => {
      const byEmail = new Map(prev.map((r) => [r.email, r]));
      return newEmails.map((email) => byEmail.get(email) || { email, name: "", roleId: bulkRoleId });
    });
  }

  function handleBulkRoleChange(roleId) {
    setBulkRoleId(roleId);
    setRows((prev) => prev.map((r) => ({ ...r, roleId })));
  }

  function handleRowChange(email, patch) {
    setRows((prev) => prev.map((r) => (r.email === email ? { ...r, ...patch } : r)));
  }

  function handleInvite() {
    const newMembers = rows.map((r) => {
      const name = r.name.trim() || r.email.split("@")[0];
      return {
        id: r.email,
        name,
        email: r.email,
        initials: initialsOf(name),
        color: colorForSeed(r.email),
        roleId: r.roleId,
      };
    });
    onInvite(newMembers);
    previewToast(`Invite sent to ${newMembers.length} member${newMembers.length > 1 ? "s" : ""}`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="invite-modal" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Email addresses</div>
            <EmailChipInput
              value={rows.map((r) => r.email)}
              onChange={handleEmailsChange}
              placeholder='Type the email ID(s) and press "Enter", separate by comma in case of more than one'
              testId="invite-modal-emails"
            />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Assign Role and teams</div>
            <select
              data-testid="invite-modal-bulk-role"
              value={bulkRoleId}
              onChange={(e) => handleBulkRoleChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {rows.length > 0 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Member(s)</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.email} className="border-t border-border" data-testid={`invite-modal-row-${r.email}`}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          data-testid={`invite-modal-row-name-${r.email}`}
                          value={r.name}
                          placeholder={r.email.split("@")[0]}
                          onChange={(e) => handleRowChange(r.email, { name: e.target.value })}
                          className="w-full px-2 py-1 border border-border rounded-md text-[12px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[12px] text-text-secondary">{r.email}</td>
                      <td className="px-3 py-2">
                        <select
                          data-testid={`invite-modal-row-role-${r.email}`}
                          value={r.roleId}
                          onChange={(e) => handleRowChange(r.email, { roleId: e.target.value })}
                          className="px-2 py-1 border border-border rounded-md text-[12px]"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            data-testid="invite-modal-cancel"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-border text-text-secondary text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="invite-modal-submit"
            disabled={rows.length === 0}
            onClick={handleInvite}
            className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invite
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
