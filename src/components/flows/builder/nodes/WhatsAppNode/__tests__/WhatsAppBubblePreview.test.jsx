import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppBubblePreview from "../WhatsAppBubblePreview";

describe("WhatsAppBubblePreview", () => {
  it("renders body text and buttons for previewKind=standard", () => {
    render(<WhatsAppBubblePreview previewKind="standard" draft={{ body: "Hello {{customer.name}}", footer: "Reply STOP", buttons: [{ label: "Shop Now" }] }} />);
    expect(screen.getByText("{{customer.name}}")).toBeInTheDocument();
    expect(screen.getByText("Reply STOP")).toBeInTheDocument();
    expect(screen.getByText("Shop Now")).toBeInTheDocument();
  });

  it("renders a fixed copy-code button for authentication drafts with codeButtonLabel and no buttons", () => {
    render(<WhatsAppBubblePreview previewKind="standard" draft={{ body: "Your code is {{otp}}", codeButtonLabel: "Copy Code" }} />);
    expect(screen.getByText("Copy Code")).toBeInTheDocument();
  });

  it("renders one card strip entry per card for previewKind=carousel", () => {
    render(<WhatsAppBubblePreview previewKind="carousel" draft={{ body: "New arrivals", cards: [{ cardBody: "Card A" }, { cardBody: "Card B" }] }} />);
    expect(screen.getByText("Card A")).toBeInTheDocument();
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("renders a View Options list button for previewKind=list", () => {
    render(<WhatsAppBubblePreview previewKind="list" draft={{ body: "Pick a plan", buttonText: "Choose an option" }} />);
    expect(screen.getByText(/Choose an option/i)).toBeInTheDocument();
  });

  it("renders product chips for previewKind=catalog", () => {
    render(<WhatsAppBubblePreview previewKind="catalog" draft={{ body: "Bestsellers", productNames: "Rosemary Water, Hair Oil" }} />);
    expect(screen.getByText("Rosemary Water")).toBeInTheDocument();
    expect(screen.getByText("Hair Oil")).toBeInTheDocument();
  });

  it("renders the address caption for previewKind=location", () => {
    render(<WhatsAppBubblePreview previewKind="location" draft={{ body: "See you soon", addressLabel: "123 Rosemary Lane" }} />);
    expect(screen.getByText("123 Rosemary Lane")).toBeInTheDocument();
  });

  it("renders the audio label for previewKind=audio", () => {
    render(<WhatsAppBubblePreview previewKind="audio" draft={{ body: "Listen to this", audioLabel: "Founder note · 0:32" }} />);
    expect(screen.getByText("Founder note · 0:32")).toBeInTheDocument();
  });

  it("renders the question and input-type chip for previewKind=collectInput", () => {
    render(<WhatsAppBubblePreview previewKind="collectInput" draft={{ questionMessage: "What's your email?", inputType: "email" }} />);
    expect(screen.getByText("What's your email?")).toBeInTheDocument();
    expect(screen.getByText(/📧.*email/)).toBeInTheDocument();
  });
});
