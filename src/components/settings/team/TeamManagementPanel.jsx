import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MembersTab from "./MembersTab";
import RolesTab from "./RolesTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES, PERMISSION_COMPONENTS, UNASSIGNED_ROLE_ID } from "./constants";

function blankPermissions() {
  return PERMISSION_COMPONENTS.reduce((acc, { key }) => {
    acc[key] = { view: false, createManage: false, publish: false };
    return acc;
  }, {});
}

export default function TeamManagementPanel() {
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  function handleAddMembers(newMembers) {
    setMembers((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      newMembers.forEach((m) => byId.set(m.id, m));
      return Array.from(byId.values());
    });
  }

  function handleChangeMemberRole(memberId, roleId) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, roleId } : m)));
  }

  function handleDeleteMember(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  function handleTogglePermission(roleId, componentKey, levelKey, checked) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [componentKey]: { ...r.permissions[componentKey], [levelKey]: checked } } }
          : r
      )
    );
  }

  function handleCreateRole({ id, name }) {
    setRoles((prev) => [...prev, { id, name, type: "custom", locked: false, permissions: blankPermissions() }]);
  }

  function handleDeleteRole(roleId) {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setMembers((prev) => prev.map((m) => (m.roleId === roleId ? { ...m, roleId: UNASSIGNED_ROLE_ID } : m)));
  }

  return (
    <div data-testid="settings-team">
      <h2 className="text-base font-semibold text-text-primary mb-3">Team</h2>
      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members" data-testid="team-tab-members">Team Members</TabsTrigger>
          <TabsTrigger value="roles" data-testid="team-tab-roles">Role Management</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTab
            members={members}
            roles={roles}
            onAddMembers={handleAddMembers}
            onChangeMemberRole={handleChangeMemberRole}
            onDeleteMember={handleDeleteMember}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab
            roles={roles}
            onTogglePermission={handleTogglePermission}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
