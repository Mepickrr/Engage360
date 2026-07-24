import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TeamManagementPanel from "../TeamManagementPanel";

describe("TeamManagementPanel", () => {
  it("shows the Team Members tab by default", () => {
    render(<TeamManagementPanel />);
    expect(screen.getByTestId("team-members-tab")).toBeInTheDocument();
  });

  it("switches to the Role Management tab", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    expect(screen.getByTestId("team-roles-tab")).toBeInTheDocument();
  });

  it("an invited member appears in the Team Members table", () => {
    render(<TeamManagementPanel />);
    fireEvent.click(screen.getByTestId("team-invite-btn"));
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "grace@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(screen.getByTestId("team-member-row-grace@x.com")).toBeInTheDocument();
  });

  it("toggling a permission in Role Management persists across tab switches", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    fireEvent.click(screen.getByTestId("role-perm-manager-revenueConfig-createManage"));
    expect(screen.getByTestId("role-perm-manager-revenueConfig-createManage")).toBeChecked();
    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-nav-manager"));
    expect(screen.getByTestId("role-perm-manager-revenueConfig-createManage")).toBeChecked();
  });

  it("renaming a custom role updates the sidebar nav button", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-create-btn"));
    fireEvent.change(screen.getByTestId("role-new-name-input"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByTestId("role-new-confirm"));

    fireEvent.change(screen.getByTestId("role-name-input-custom-growth"), { target: { value: "Growth Team" } });

    expect(screen.getByTestId("role-nav-custom-growth")).toHaveTextContent("Growth Team");
  });

  it("re-inviting an existing member's email does not overwrite their role", () => {
    render(<TeamManagementPanel />);
    fireEvent.click(screen.getByTestId("team-invite-btn"));
    fireEvent.change(screen.getByTestId("invite-modal-bulk-role"), { target: { value: "developer" } });
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "riya@tspkarix.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(screen.getByTestId("team-member-role-select-riya@tspkarix.com")).toHaveValue("manager");
  });

  it("deleting a custom role reassigns its members to No role", () => {
    render(<TeamManagementPanel />);
    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    fireEvent.click(screen.getByTestId("role-create-btn"));
    fireEvent.change(screen.getByTestId("role-new-name-input"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByTestId("role-new-confirm"));

    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    fireEvent.change(screen.getByTestId("team-member-role-select-riya@tspkarix.com"), { target: { value: "custom-growth" } });

    fireEvent.mouseDown(screen.getByTestId("team-tab-roles"));
    jest.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByTestId("role-delete-custom-growth"));
    window.confirm.mockRestore();

    fireEvent.mouseDown(screen.getByTestId("team-tab-members"));
    expect(screen.getByTestId("team-member-role-select-riya@tspkarix.com")).toHaveValue("unassigned");
  });
});
