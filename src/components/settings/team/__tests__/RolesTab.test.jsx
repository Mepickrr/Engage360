import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RolesTab from "../RolesTab";
import { DEFAULT_ROLES, DEFAULT_MEMBERS } from "../constants";

function renderTab(roles = DEFAULT_ROLES, overrides = {}) {
  const props = {
    roles,
    members: DEFAULT_MEMBERS,
    onTogglePermission: jest.fn(),
    onCreateRole: jest.fn(),
    onDeleteRole: jest.fn(),
    onRenameRole: jest.fn(),
    onViewRoleMembers: jest.fn(),
    ...overrides,
  };
  render(<RolesTab {...props} />);
  return props;
}

describe("RolesTab", () => {
  it("selects Admin by default and disables its checkboxes", () => {
    renderTab();
    expect(screen.getByTestId("role-perm-admin-segments-view")).toBeDisabled();
    expect(screen.getByTestId("role-perm-admin-segments-view")).toBeChecked();
  });

  it("toggles a permission checkbox for an editable role", () => {
    const onTogglePermission = jest.fn();
    renderTab(DEFAULT_ROLES, { onTogglePermission });
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    fireEvent.click(screen.getByTestId("role-perm-manager-revenueConfig-createManage"));
    expect(onTogglePermission).toHaveBeenCalledWith("manager", "revenueConfig", "createManage", true);
  });

  it("creates a new custom role from the sidebar", () => {
    const onCreateRole = jest.fn();
    renderTab(DEFAULT_ROLES, { onCreateRole });
    fireEvent.click(screen.getByTestId("role-create-btn"));
    fireEvent.change(screen.getByTestId("role-new-name-input"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByTestId("role-new-confirm"));
    expect(onCreateRole).toHaveBeenCalledWith({ id: "custom-growth", name: "Growth" });
  });

  it("shows a delete action only for custom roles", () => {
    const customRole = { id: "custom-growth", name: "Growth", type: "custom", locked: false, permissions: DEFAULT_ROLES[0].permissions };
    renderTab([...DEFAULT_ROLES, customRole]);
    expect(screen.queryByTestId("role-delete-admin")).not.toBeInTheDocument();
    expect(screen.getByTestId("role-delete-custom-growth")).toBeInTheDocument();
  });

  it("shows an editable name input for a custom role and calls onRenameRole on change", () => {
    const onRenameRole = jest.fn();
    const customRole = { id: "custom-growth", name: "Growth", type: "custom", locked: false, permissions: DEFAULT_ROLES[0].permissions };
    renderTab([...DEFAULT_ROLES, customRole], { onRenameRole });
    fireEvent.click(screen.getByTestId("role-nav-custom-growth"));
    const input = screen.getByTestId("role-name-input-custom-growth");
    fireEvent.change(input, { target: { value: "Growth Team" } });
    expect(onRenameRole).toHaveBeenCalledWith("custom-growth", "Growth Team");
  });

  it("does not show an editable name input for a default role", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    expect(screen.queryByTestId("role-name-input-manager")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Manager");
  });

  it("shows the number of users assigned to the selected role", () => {
    renderTab();
    expect(screen.getByTestId("role-user-count-admin")).toHaveTextContent("1 user with this role");
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    expect(screen.getByTestId("role-user-count-manager")).toHaveTextContent("1 user with this role");
  });

  it("calls onViewRoleMembers with the role id when the user count is clicked", () => {
    const onViewRoleMembers = jest.fn();
    renderTab(DEFAULT_ROLES, { onViewRoleMembers });
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    fireEvent.click(screen.getByTestId("role-user-count-manager"));
    expect(onViewRoleMembers).toHaveBeenCalledWith("manager");
  });

  it("deletes a custom role after confirmation", () => {
    const onDeleteRole = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const customRole = { id: "custom-growth", name: "Growth", type: "custom", locked: false, permissions: DEFAULT_ROLES[0].permissions };
    renderTab([...DEFAULT_ROLES, customRole], { onDeleteRole });
    fireEvent.click(screen.getByTestId("role-delete-custom-growth"));
    expect(onDeleteRole).toHaveBeenCalledWith("custom-growth");
    window.confirm.mockRestore();
  });
});
