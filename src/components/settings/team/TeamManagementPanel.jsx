import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MembersTab from "./MembersTab";
import RolesTab from "./RolesTab";
import SecurityTab from "./SecurityTab";
import TestModeTab from "./TestModeTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES, UNASSIGNED_ROLE_ID, allPermissions } from "./constants";

export default function TeamManagementPanel() {
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [activeTab, setActiveTab] = useState("members");
  const [roleFilter, setRoleFilter] = useState("");

  function handleViewRoleMembers(roleId) {
    setRoleFilter(roleId);
    setActiveTab("members");
  }

  function handleAddMembers(newMembers) {
    setMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const genuinelyNew = newMembers.filter((m) => !existingIds.has(m.id));
      return [...prev, ...genuinelyNew];
    });
  }

  function handleUpdateMember(memberId, patch) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
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

  function handleRenameRole(roleId, name) {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, name } : r)));
  }

  function handleCreateRole({ id, name }) {
    setRoles((prev) => [...prev, { id, name, type: "custom", locked: false, permissions: allPermissions(false) }]);
  }

  function handleDeleteRole(roleId) {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setMembers((prev) => prev.map((m) => (m.roleId === roleId ? { ...m, roleId: UNASSIGNED_ROLE_ID } : m)));
  }

  return (
    <div data-testid="settings-team">
      <h2 className="text-base font-semibold text-text-primary mb-3">Team</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="members" data-testid="team-tab-members">Team Members</TabsTrigger>
          <TabsTrigger value="roles" data-testid="team-tab-roles">Role Management</TabsTrigger>
          <TabsTrigger value="security" data-testid="team-tab-security">Security</TabsTrigger>
          <TabsTrigger value="testmode" data-testid="team-tab-testmode">Test Mode</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTab
            members={members}
            roles={roles}
            onAddMembers={handleAddMembers}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab
            roles={roles}
            members={members}
            onTogglePermission={handleTogglePermission}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
            onRenameRole={handleRenameRole}
            onViewRoleMembers={handleViewRoleMembers}
          />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="testmode">
          <TestModeTab members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
