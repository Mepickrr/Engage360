import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InviteMemberModal from "../InviteMemberModal";
import { DEFAULT_ROLES } from "../constants";

describe("InviteMemberModal", () => {
  it("disables Invite until at least one email chip exists", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    expect(screen.getByTestId("invite-modal-submit")).toBeDisabled();
  });

  it("adds a row per email chip, defaulting its role to the first unlocked role", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    expect(screen.getByTestId("invite-modal-row-new@x.com")).toBeInTheDocument();
    expect(screen.getByTestId("invite-modal-row-role-new@x.com")).toHaveValue("manager");
    expect(screen.getByTestId("invite-modal-submit")).not.toBeDisabled();
  });

  it("does not render a bulk role dropdown — 'Assign Role and teams' is a static heading", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    expect(screen.getByText("Assign Role and teams")).toBeInTheDocument();
    expect(screen.queryByTestId("invite-modal-bulk-role")).not.toBeInTheDocument();
  });

  it("lets each row's role be set independently", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "a@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(emailInput, { target: { value: "b@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(screen.getByTestId("invite-modal-row-role-a@x.com"), { target: { value: "support" } });
    expect(screen.getByTestId("invite-modal-row-role-a@x.com")).toHaveValue("support");
    expect(screen.getByTestId("invite-modal-row-role-b@x.com")).toHaveValue("manager");
  });

  it("submits one member per row, using the email's local-part as a fallback name, and resets/closes", () => {
    const onInvite = jest.fn();
    const onClose = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={onClose} onInvite={onInvite} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(onInvite).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "new@x.com",
        email: "new@x.com",
        name: "new",
        roleId: "manager",
        instagram: null,
        isTestUser: false,
      }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("lets an invitee's Instagram handle and test-user flag be set per row", () => {
    const onInvite = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={onInvite} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(screen.getByTestId("invite-modal-row-instagram-new@x.com"), { target: { value: "@new.tester" } });
    fireEvent.click(screen.getByTestId("invite-modal-row-test-user-new@x.com"));
    fireEvent.click(screen.getByTestId("invite-modal-submit"));
    expect(onInvite).toHaveBeenCalledWith([
      expect.objectContaining({ instagram: "@new.tester", isTestUser: true }),
    ]);
  });

  it("cancel closes without inviting", () => {
    const onInvite = jest.fn();
    const onClose = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={onClose} onInvite={onInvite} />);
    fireEvent.click(screen.getByTestId("invite-modal-cancel"));
    expect(onInvite).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  describe("edit mode", () => {
    const editMember = {
      id: "riya@tspkarix.com",
      name: "Riya Sharma",
      email: "riya@tspkarix.com",
      roleId: "manager",
      phone: "+91 90000 11111",
      instagram: null,
      isTestUser: true,
    };

    it("pre-fills the email, name, and role from editMember and titles the modal for editing", () => {
      render(<InviteMemberModal open roles={DEFAULT_ROLES} editMember={editMember} onClose={jest.fn()} onSave={jest.fn()} />);
      expect(screen.getByText("Edit team member")).toBeInTheDocument();
      expect(screen.getByTestId("edit-member-email")).toHaveTextContent("riya@tspkarix.com");
      expect(screen.getByTestId("edit-member-name-input")).toHaveValue("Riya Sharma");
      expect(screen.getByTestId("edit-member-role-select")).toHaveValue("manager");
      expect(screen.getByTestId("edit-member-phone-input")).toHaveValue("+91 90000 11111");
      expect(screen.getByTestId("edit-member-instagram-input")).toHaveValue("");
      expect(screen.getByTestId("edit-member-test-user-checkbox")).toBeChecked();
      expect(screen.queryByTestId("invite-modal-emails-input")).not.toBeInTheDocument();
    });

    it("saves the edited name, role, phone, Instagram, and test-user flag via onSave, keyed by the member's id", () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      render(<InviteMemberModal open roles={DEFAULT_ROLES} editMember={editMember} onClose={onClose} onSave={onSave} />);
      fireEvent.change(screen.getByTestId("edit-member-name-input"), { target: { value: "Riya S." } });
      fireEvent.change(screen.getByTestId("edit-member-role-select"), { target: { value: "developer" } });
      fireEvent.change(screen.getByTestId("edit-member-instagram-input"), { target: { value: "@riya.s" } });
      fireEvent.click(screen.getByTestId("edit-member-test-user-checkbox"));
      fireEvent.click(screen.getByTestId("invite-modal-save"));
      expect(onSave).toHaveBeenCalledWith(
        "riya@tspkarix.com",
        expect.objectContaining({
          name: "Riya S.",
          roleId: "developer",
          phone: "+91 90000 11111",
          instagram: "@riya.s",
          isTestUser: false,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });

    it("cancel in edit mode closes without saving", () => {
      const onSave = jest.fn();
      render(<InviteMemberModal open roles={DEFAULT_ROLES} editMember={editMember} onClose={jest.fn()} onSave={onSave} />);
      fireEvent.click(screen.getByTestId("invite-modal-cancel"));
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
