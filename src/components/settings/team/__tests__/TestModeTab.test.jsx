import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestModeTab from "../TestModeTab";
import {
  DEFAULT_TEST_PHONE_NUMBERS,
  DEFAULT_TEST_INSTAGRAM_HANDLES,
  DEFAULT_TEST_EMAILS,
} from "../constants";

describe("TestModeTab", () => {
  it("renders the three sections with their seeded chips", () => {
    render(<TestModeTab />);
    expect(screen.getByTestId("test-mode-phone-section")).toHaveTextContent("Phone number");
    expect(screen.getByTestId("test-mode-instagram-section")).toHaveTextContent("Instagram test accounts");
    expect(screen.getByTestId("test-mode-email-section")).toHaveTextContent("Test Emails");

    DEFAULT_TEST_PHONE_NUMBERS.forEach((p) => {
      expect(screen.getByTestId(`test-mode-phone-chip-${p}`)).toBeInTheDocument();
    });
    DEFAULT_TEST_INSTAGRAM_HANDLES.forEach((h) => {
      expect(screen.getByTestId(`test-mode-instagram-chip-${h}`)).toBeInTheDocument();
    });
    expect(DEFAULT_TEST_EMAILS).toHaveLength(0);
  });

  it("adds a phone number chip on Enter and clears the input", () => {
    render(<TestModeTab />);
    const input = screen.getByTestId("test-mode-phone-input");
    fireEvent.change(input, { target: { value: "+919999999999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("test-mode-phone-chip-+919999999999")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("does not add a duplicate phone number chip", () => {
    render(<TestModeTab />);
    const input = screen.getByTestId("test-mode-phone-input");
    fireEvent.change(input, { target: { value: DEFAULT_TEST_PHONE_NUMBERS[0] } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByTestId(`test-mode-phone-chip-${DEFAULT_TEST_PHONE_NUMBERS[0]}`)).toHaveLength(1);
  });

  it("removes a phone number chip when its remove button is clicked", () => {
    render(<TestModeTab />);
    fireEvent.click(screen.getByTestId(`test-mode-phone-remove-${DEFAULT_TEST_PHONE_NUMBERS[0]}`));
    expect(screen.queryByTestId(`test-mode-phone-chip-${DEFAULT_TEST_PHONE_NUMBERS[0]}`)).not.toBeInTheDocument();
  });

  it("adds an Instagram handle chip on Enter", () => {
    render(<TestModeTab />);
    const input = screen.getByTestId("test-mode-instagram-input");
    fireEvent.change(input, { target: { value: "bikspace_" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("test-mode-instagram-chip-bikspace_")).toBeInTheDocument();
  });

  it("shows the Instagram permission callout", () => {
    render(<TestModeTab />);
    expect(screen.getByTestId("test-mode-instagram-section")).toHaveTextContent(
      "To initiate a journey, user permission is required through messaging a business."
    );
  });

  it("adds a test email chip on Enter", () => {
    render(<TestModeTab />);
    const input = screen.getByTestId("test-mode-email-input");
    fireEvent.change(input, { target: { value: "example@gmail.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("test-mode-email-chip-example@gmail.com")).toBeInTheDocument();
  });

  describe("searching existing team member profiles from the input itself", () => {
    const members = [
      { id: "a@x.com", email: "a@x.com", phone: "+911111111111", instagram: "@a.profile" },
      { id: "b@x.com", email: "b@x.com", phone: null, instagram: null },
    ];

    it("shows no suggestions until the user types something matching a member profile", () => {
      render(<TestModeTab members={members} />);
      expect(screen.queryByTestId("test-mode-phone-suggestions")).not.toBeInTheDocument();
      fireEvent.change(screen.getByTestId("test-mode-phone-input"), { target: { value: "9111" } });
      expect(screen.getByTestId("test-mode-phone-suggestions")).toBeInTheDocument();
      expect(screen.getByTestId("test-mode-phone-suggestion-+911111111111")).toBeInTheDocument();
    });

    it("clicking a suggestion adds it as a chip and clears the input", () => {
      render(<TestModeTab members={members} />);
      const input = screen.getByTestId("test-mode-phone-input");
      fireEvent.change(input, { target: { value: "9111" } });
      fireEvent.click(screen.getByTestId("test-mode-phone-suggestion-+911111111111"));
      expect(screen.getByTestId("test-mode-phone-chip-+911111111111")).toBeInTheDocument();
      expect(input).toHaveValue("");
    });

    it("offers Instagram and email member suggestions the same way", () => {
      render(<TestModeTab members={members} />);
      fireEvent.change(screen.getByTestId("test-mode-instagram-input"), { target: { value: "a.pro" } });
      expect(screen.getByTestId("test-mode-instagram-suggestion-@a.profile")).toBeInTheDocument();

      fireEvent.change(screen.getByTestId("test-mode-email-input"), { target: { value: "a@x" } });
      expect(screen.getByTestId("test-mode-email-suggestion-a@x.com")).toBeInTheDocument();
    });

    it("does not suggest a member profile that's already in the list", () => {
      render(<TestModeTab members={members} />);
      const input = screen.getByTestId("test-mode-phone-input");
      fireEvent.change(input, { target: { value: "9111" } });
      fireEvent.click(screen.getByTestId("test-mode-phone-suggestion-+911111111111"));
      fireEvent.change(input, { target: { value: "9111" } });
      expect(screen.queryByTestId("test-mode-phone-suggestions")).not.toBeInTheDocument();
    });
  });
});
