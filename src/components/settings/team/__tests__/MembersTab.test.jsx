import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MembersTab from "../MembersTab";
import { DEFAULT_MEMBERS, DEFAULT_ROLES } from "../constants";

function renderTab(overrides = {}) {
  const props = {
    members: DEFAULT_MEMBERS,
    roles: DEFAULT_ROLES,
    onAddMembers: jest.fn(),
    onChangeMemberRole: jest.fn(),
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

  it("calls onChangeMemberRole when a row's role select changes", () => {
    const onChangeMemberRole = jest.fn();
    renderTab({ onChangeMemberRole });
    fireEvent.change(screen.getByTestId("team-member-role-select-riya@tspkarix.com"), { target: { value: "developer" } });
    expect(onChangeMemberRole).toHaveBeenCalledWith("riya@tspkarix.com", "developer");
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
});
