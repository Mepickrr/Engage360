import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { previewToast } from "@/components/common/PreviewHeader";
import EmailChipInput from "./EmailChipInput";
import { initialsOf, colorForSeed, UNASSIGNED_ROLE_ID } from "./constants";

export default function InviteMemberModal({ open, roles, onClose, onInvite, editMember, onSave }) {
  const isEdit = Boolean(editMember);
  const defaultRoleId = roles.find((r) => !r.locked)?.id || roles[0].id;
  const [rows, setRows] = useState([]);
  const [editName, setEditName] = useState("");
  const [editRoleId, setEditRoleId] = useState(defaultRoleId);
  const [editPhone, setEditPhone] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editIsTestUser, setEditIsTestUser] = useState(false);

  useEffect(() => {
    if (open) {
      if (editMember) {
        setEditName(editMember.name);
        setEditRoleId(editMember.roleId);
        setEditPhone(editMember.phone || "");
        setEditInstagram(editMember.instagram || "");
        setEditIsTestUser(Boolean(editMember.isTestUser));
      } else {
        setRows([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editMember]);

  function handleEmailsChange(newEmails) {
    setRows((prev) => {
      const byEmail = new Map(prev.map((r) => [r.email, r]));
      return newEmails.map(
        (email) =>
          byEmail.get(email) || {
            email,
            name: "",
            roleId: defaultRoleId,
            phone: "",
            instagram: "",
            isTestUser: false,
          }
      );
    });
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
        lastActive: null,
        phone: r.phone.trim() || null,
        instagram: r.instagram.trim() || null,
        isTestUser: r.isTestUser,
      };
    });
    onInvite(newMembers);
    previewToast(`Invite sent to ${newMembers.length} member${newMembers.length > 1 ? "s" : ""}`);
    onClose();
  }

  function handleSaveEdit() {
    const name = editName.trim() || editMember.email.split("@")[0];
    onSave(editMember.id, {
      name,
      initials: initialsOf(name),
      roleId: editRoleId,
      phone: editPhone.trim() || null,
      instagram: editInstagram.trim() || null,
      isTestUser: editIsTestUser,
    });
    previewToast(`${name}'s details updated`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="invite-modal" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit team member" : "Invite members"}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Email address</div>
              <div
                data-testid="edit-member-email"
                className="px-3 py-2 border border-border rounded-md text-sm bg-slate-50 text-text-secondary"
              >
                {editMember.email}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Name</div>
              <input
                type="text"
                data-testid="edit-member-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">
                Phone number <span className="normal-case text-text-muted font-normal">(optional)</span>
              </div>
              <input
                type="text"
                data-testid="edit-member-phone-input"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">
                Instagram handle <span className="normal-case text-text-muted font-normal">(optional)</span>
              </div>
              <input
                type="text"
                data-testid="edit-member-instagram-input"
                value={editInstagram}
                onChange={(e) => setEditInstagram(e.target.value)}
                placeholder="@handle"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                data-testid="edit-member-test-user-checkbox"
                checked={editIsTestUser}
                onChange={(e) => setEditIsTestUser(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Include as a test user
            </label>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Assign Role and teams</div>
              <select
                data-testid="edit-member-role-select"
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                {editRoleId === UNASSIGNED_ROLE_ID && <option value={UNASSIGNED_ROLE_ID}>No role</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
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

            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Assign Role and teams</div>

            {rows.length > 0 && (
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Member(s)</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Instagram (optional)</th>
                      <th className="px-3 py-2 font-medium text-center">Test user</th>
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
                          <input
                            type="text"
                            data-testid={`invite-modal-row-instagram-${r.email}`}
                            value={r.instagram}
                            placeholder="@handle"
                            onChange={(e) => handleRowChange(r.email, { instagram: e.target.value })}
                            className="w-full px-2 py-1 border border-border rounded-md text-[12px]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            data-testid={`invite-modal-row-test-user-${r.email}`}
                            checked={r.isTestUser}
                            onChange={(e) => handleRowChange(r.email, { isTestUser: e.target.checked })}
                            className="w-4 h-4 accent-primary"
                          />
                        </td>
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
        )}

        <DialogFooter>
          <button
            type="button"
            data-testid="invite-modal-cancel"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-border text-text-secondary text-sm font-medium"
          >
            Cancel
          </button>
          {isEdit ? (
            <button
              type="button"
              data-testid="invite-modal-save"
              onClick={handleSaveEdit}
              className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
            >
              Save changes
            </button>
          ) : (
            <button
              type="button"
              data-testid="invite-modal-submit"
              disabled={rows.length === 0}
              onClick={handleInvite}
              className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Invite
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
