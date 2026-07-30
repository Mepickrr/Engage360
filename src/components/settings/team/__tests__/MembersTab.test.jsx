import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MembersTab from "../MembersTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES } from "../constants";

function renderTab(overrides = {}) {
  const props = {
    members: DEFAULT_MEMBERS,
    roles: DEFAULT_ROLES,
    onAddMembers: jest.fn(),
    onUpdateMember: jest.fn(),
    onDeleteMember: jest.fn(),
    ...overrides,
  };
  render(<MembersTab {...props} />);
  return props;
}

describe("MembersTab", () => {
  it("renders all members by default", () => {
    renderTab();
    DEFAULT_MEMBERS.forEach((m) => {
      expect(screen.getByTestId(`team-member-row-${m.id}`)).toBeInTheDocument();
    });
  });

  it("filters by search query across name and email", () => {
    renderTab();
    fireEvent.change(screen.getByTestId("team-members-search"), { target: { value: "riya" } });
    expect(screen.getByTestId("team-member-row-riya@tspkarix.com")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-row-himanshu@tspkarix.com")).not.toBeInTheDocument();
  });

  it("shows the role as a static badge in the list", () => {
    renderTab();
    expect(screen.getByTestId("team-member-role-badge-riya@tspkarix.com")).toHaveTextContent("Manager");
  });

  it("clicking the edit icon opens the invite modal pre-filled with that member's details", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("team-member-edit-riya@tspkarix.com"));
    expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
    expect(screen.getByText("Edit team member")).toBeInTheDocument();
    expect(screen.getByTestId("edit-member-email")).toHaveTextContent("riya@tspkarix.com");
    expect(screen.getByTestId("edit-member-name-input")).toHaveValue("Riya Sharma");
    expect(screen.getByTestId("edit-member-role-select")).toHaveValue("manager");
  });

  it("saving the edit modal calls onUpdateMember with the updated name and role", () => {
    const onUpdateMember = jest.fn();
    renderTab({ onUpdateMember });
    fireEvent.click(screen.getByTestId("team-member-edit-riya@tspkarix.com"));
    fireEvent.change(screen.getByTestId("edit-member-name-input"), { target: { value: "Riya S." } });
    fireEvent.change(screen.getByTestId("edit-member-role-select"), { target: { value: "developer" } });
    fireEvent.click(screen.getByTestId("invite-modal-save"));
    expect(onUpdateMember).toHaveBeenCalledWith(
      "riya@tspkarix.com",
      expect.objectContaining({ name: "Riya S.", roleId: "developer" })
    );
  });

  it("calls onDeleteMember after confirming deletion", () => {
    const onDeleteMember = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    renderTab({ onDeleteMember });
    fireEvent.click(screen.getByTestId("team-member-delete-riya@tspkarix.com"));
    expect(onDeleteMember).toHaveBeenCalledWith("riya@tspkarix.com");
    window.confirm.mockRestore();
  });

  it("does not delete when the confirmation is cancelled", () => {
    const onDeleteMember = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderTab({ onDeleteMember });
    fireEvent.click(screen.getByTestId("team-member-delete-riya@tspkarix.com"));
    expect(onDeleteMember).not.toHaveBeenCalled();
    window.confirm.mockRestore();
  });

  it("opens the invite modal from the Invite team mate button", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("team-invite-btn"));
    expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
  });

  it("shows each member's last active date, or Never if they haven't logged in", () => {
    renderTab({ members: [...DEFAULT_MEMBERS, { id: "new@x.com", name: "New", email: "new@x.com", initials: "N", color: "#000", roleId: "manager", lastActive: null }] });
    expect(screen.getByTestId("team-member-last-active-riya@tspkarix.com")).toHaveTextContent("2026-07-27");
    expect(screen.getByTestId("team-member-last-active-new@x.com")).toHaveTextContent("Never");
  });

  it("filters the list by role, and calls onRoleFilterChange when the filter changes", () => {
    const onRoleFilterChange = jest.fn();
    renderTab({ onRoleFilterChange });
    fireEvent.change(screen.getByTestId("team-members-role-filter"), { target: { value: "analyst" } });
    expect(onRoleFilterChange).toHaveBeenCalledWith("analyst");
  });

  it("shows only members matching the roleFilter prop", () => {
    renderTab({ roleFilter: "analyst" });
    expect(screen.getByTestId("team-member-row-arjun@tspkarix.com")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-row-riya@tspkarix.com")).not.toBeInTheDocument();
  });

  it("shows each member's phone and Instagram handle, or a dash when unset", () => {
    renderTab();
    expect(screen.getByTestId("team-member-phone-riya@tspkarix.com")).toHaveTextContent("+91 90000 11111");
    expect(screen.getByTestId("team-member-instagram-riya@tspkarix.com")).toHaveTextContent("—");
    expect(screen.getByTestId("team-member-phone-arjun@tspkarix.com")).toHaveTextContent("—");
    expect(screen.getByTestId("team-member-instagram-arjun@tspkarix.com")).toHaveTextContent("@arjun.patel");
  });

  it("shows a Test badge next to members flagged as test users", () => {
    renderTab();
    expect(screen.getByTestId("team-member-test-badge-riya@tspkarix.com")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-test-badge-arjun@tspkarix.com")).not.toBeInTheDocument();
  });
});
