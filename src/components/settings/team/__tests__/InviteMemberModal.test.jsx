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

  it("changing the bulk role updates every row's role select", () => {
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={jest.fn()} onInvite={jest.fn()} />);
    const emailInput = screen.getByTestId("invite-modal-emails-input");
    fireEvent.change(emailInput, { target: { value: "new@x.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });
    fireEvent.change(screen.getByTestId("invite-modal-bulk-role"), { target: { value: "developer" } });
    expect(screen.getByTestId("invite-modal-row-role-new@x.com")).toHaveValue("developer");
  });

  it("lets a single row override the bulk role independently", () => {
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
      expect.objectContaining({ id: "new@x.com", email: "new@x.com", name: "new", roleId: "manager" }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("cancel closes without inviting", () => {
    const onInvite = jest.fn();
    const onClose = jest.fn();
    render(<InviteMemberModal open roles={DEFAULT_ROLES} onClose={onClose} onInvite={onInvite} />);
    fireEvent.click(screen.getByTestId("invite-modal-cancel"));
    expect(onInvite).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
