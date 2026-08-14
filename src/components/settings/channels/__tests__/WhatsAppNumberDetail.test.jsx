import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import WhatsAppNumberDetail from "../WhatsAppNumberDetail";
import * as PreviewHeaderModule from "@/components/common/PreviewHeader";

const NUMBER = {
  id: "wa_1", number: "+91 74360 36062", username: "herbalroots",
  isExistingNumber: true, isDefaultForCampaigns: true,
  apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
  voiceCallEnabled: false, businessDescription: "Grow naturally, feel beautifully.",
  messagesConsumed: 0, messagingLimit: 100000,
  about: "Hey, there! I am using WhatsApp.",
  businessAddress: "", businessEmail: "support@herbalroots.com", businessWebsite: "https://herbalroots.com/",
  catalogId: "1175317264111343", catalogAllowAccess: true, removeOutOfStock: false,
  brandName: "herbal-roots", brandLogoUrl: "",
  wabaId: "328175003703387", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
};

const NON_DEFAULT_NUMBER = { ...NUMBER, id: "wa_2", isDefaultForCampaigns: false, quality: "Medium" };

describe("WhatsAppNumberDetail — header and badges", () => {
  it("shows the number and username in the header, and the relocated provider/quality badges in the summary row", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    // The number now also appears unmasked in the big preview, so assert at least one match.
    expect(screen.getAllByText("+91 74360 36062").length).toBeGreaterThan(0);
    expect(screen.getByText("@herbalroots")).toBeInTheDocument();
    expect(screen.getByText("Provider: TSP Karix")).toBeInTheDocument();
    expect(screen.getByText("Quality: High")).toBeInTheDocument();
  });

  it("shows a Default for Campaigns badge and a Migrate provider button when this number is the default", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("Default for Campaigns")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /migrate provider/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /make default for campaigns/i })).not.toBeInTheDocument();
  });

  it("shows a Make Default for Campaigns button when this number is not the default, and calls onMakeDefault", () => {
    const onMakeDefault = jest.fn();
    render(<WhatsAppNumberDetail number={NON_DEFAULT_NUMBER} onBack={jest.fn()} onMakeDefault={onMakeDefault} />);
    expect(screen.queryByText("Default for Campaigns")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /migrate provider/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /make default for campaigns/i }));
    expect(onMakeDefault).toHaveBeenCalledWith("wa_2");
  });

  it("calls onBack when the back arrow is clicked", () => {
    const onBack = jest.fn();
    render(<WhatsAppNumberDetail number={NUMBER} onBack={onBack} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-detail-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("WhatsAppNumberDetail — metadata summary bar", () => {
  it("shows Provider, Quality, WABA ID, and an MM Lite tag on the first summary row", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const row1 = screen.getByTestId("whatsapp-summary-row-1");
    expect(row1).toHaveTextContent("Provider: TSP Karix");
    expect(row1).toHaveTextContent("Quality: High");
    expect(row1).toHaveTextContent("WABA ID: 328175003703387");
    expect(row1).toHaveTextContent("MM Lite");
  });

  it("shows Messaging limit, Default badge, and Migrate provider on the second summary row when default", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const row2 = screen.getByTestId("whatsapp-summary-row-2");
    expect(row2).toHaveTextContent("100000");
    expect(row2).toHaveTextContent("Default for Campaigns");
    expect(within(row2).getByRole("button", { name: /migrate provider/i })).toBeInTheDocument();
  });

  it("shows a Make Default for Campaigns button on the second row when not default", () => {
    const onMakeDefault = jest.fn();
    render(<WhatsAppNumberDetail number={NON_DEFAULT_NUMBER} onBack={jest.fn()} onMakeDefault={onMakeDefault} />);
    const row2 = screen.getByTestId("whatsapp-summary-row-2");
    fireEvent.click(within(row2).getByRole("button", { name: /make default for campaigns/i }));
    expect(onMakeDefault).toHaveBeenCalledWith("wa_2");
  });
});

describe("WhatsAppNumberDetail — message consumed / messaging limit refresh", () => {
  let randomSpy;
  beforeEach(() => { randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5); });
  afterEach(() => { randomSpy.mockRestore(); });

  it("changes the displayed messages-consumed value when its refresh icon is clicked", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-messages-consumed-value")).toHaveTextContent("0");
    fireEvent.click(screen.getByTestId("whatsapp-messages-consumed-refresh"));
    expect(screen.getByTestId("whatsapp-messages-consumed-value")).toHaveTextContent("250");
  });

  it("changes the displayed messaging-limit value when its refresh icon is clicked", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-messaging-limit-refresh"));
    expect(screen.getByTestId("whatsapp-messaging-limit-value")).toHaveTextContent("50000");
  });
});

describe("WhatsAppNumberDetail — editable rows and live preview", () => {
  it("edits About via the preview and reflects the new value", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-about"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-about-input"), { target: { value: "New about text" } });
    fireEvent.keyDown(screen.getByTestId("whatsapp-preview-about-input"), { key: "Enter" });
    expect(screen.getAllByText("New about text").length).toBeGreaterThan(0);
  });
});

describe("WhatsAppNumberDetail — account overview and Facebook Catalog", () => {
  it("renders the TSP onboarding and A/B testing links, and the MM Lite banner", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/test now/i)).toBeInTheDocument();
    expect(screen.getByText(/powered by mm lite api/i)).toBeInTheDocument();
  });

  it("hides the Business Portfolio ID, Phone Number, and WABA Provider fields", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.queryByDisplayValue("1379257819643222")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("TSPENGAGE")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("328175003703387")).not.toBeInTheDocument();
    expect(screen.queryByText("Available")).not.toBeInTheDocument();
  });

  it("renders the Facebook Catalog card with catalog id and access toggle", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("1175317264111343")).toBeInTheDocument();
    expect(screen.getByLabelText(/allow customer to access catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/remove out of stock products/i)).toBeInTheDocument();
  });
});

describe("WhatsAppNumberDetail — single-column section order", () => {
  it("renders the summary bar before the Catalog card, and the Catalog card before the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const summary = screen.getByTestId("whatsapp-summary-row-1");
    const catalog = screen.getByTestId("whatsapp-catalog-manage");
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(summary.compareDocumentPosition(catalog) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(catalog.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("WhatsAppNumberDetail — big editable preview", () => {
  it("renders the brand name and about text inside the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(within(preview).getByText("herbal-roots")).toBeInTheDocument();
    expect(within(preview).getByText("Hey, there! I am using WhatsApp.")).toBeInTheDocument();
  });

  it("edits the brand name in place by clicking it in the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-brand-name"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-brand-name-input"), { target: { value: "Herbal Roots Co" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-brand-name-input"));
    expect(screen.getByTestId("whatsapp-preview-brand-name")).toHaveTextContent("Herbal Roots Co");
  });

  it("edits About in place by clicking it in the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-about"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-about-input"), { target: { value: "New about text" } });
    fireEvent.keyDown(screen.getByTestId("whatsapp-preview-about-input"), { key: "Enter" });
    expect(screen.getByTestId("whatsapp-preview-about")).toHaveTextContent("New about text");
  });

  it("cancels an in-progress edit back to the last saved value when Escape is pressed", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-about"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-about-input"), { target: { value: "Unsaved draft text" } });
    fireEvent.keyDown(screen.getByTestId("whatsapp-preview-about-input"), { key: "Escape" });
    expect(screen.getByTestId("whatsapp-preview-about")).toHaveTextContent("Hey, there! I am using WhatsApp.");
    expect(screen.queryByTestId("whatsapp-preview-about-input")).not.toBeInTheDocument();
  });

  it("shows a photo edit affordance that triggers the placeholder stub", () => {
    const toastSpy = jest.spyOn(PreviewHeaderModule, "previewToast").mockImplementation(() => {});
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const photoEditButton = screen.getByTestId("whatsapp-preview-photo-edit");
    expect(photoEditButton).toBeInTheDocument();
    fireEvent.click(photoEditButton);
    expect(toastSpy).toHaveBeenCalledTimes(1);
    toastSpy.mockRestore();
  });
});

describe("WhatsAppNumberDetail — description, category, address, email, and website all inline in the preview", () => {
  it("edits Business description inline inside the big preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-description"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-description-input"), { target: { value: "New description" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-description-input"));
    expect(screen.getByTestId("whatsapp-preview-description")).toHaveTextContent("New description");
  });

  it("inserts a newline instead of committing when Enter is pressed in the description textarea", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-description"));
    const textarea = screen.getByTestId("whatsapp-preview-description-input");
    fireEvent.change(textarea, { target: { value: "Line one" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    // Enter has no special handling on the textarea — it should not commit/close the editor.
    expect(screen.getByTestId("whatsapp-preview-description-input")).toBeInTheDocument();
    expect(screen.queryByTestId("whatsapp-preview-description")).not.toBeInTheDocument();
  });

  it("shows the actual phone number (not masked) as a static (non-editable) line in the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(within(preview).getByTestId("whatsapp-preview-phone-number")).toHaveTextContent(NUMBER.number);
  });

  it("defaults Category to Shopping and Retail and allows editing it in place inside the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(within(preview).getByTestId("whatsapp-preview-category")).toHaveTextContent("Shopping and Retail");
    fireEvent.click(screen.getByTestId("whatsapp-preview-category"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-category-input"), { target: { value: "Health and Beauty" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-category-input"));
    expect(screen.getByTestId("whatsapp-preview-category")).toHaveTextContent("Health and Beauty");
  });

  it("edits Business address in place inside the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-address"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-address-input"), { target: { value: "2 Road Pune Maharashtra India 411037" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-address-input"));
    expect(screen.getByTestId("whatsapp-preview-address")).toHaveTextContent("2 Road Pune Maharashtra India 411037");
  });

  it("renders Support Email and Website as inline-editable fields inside the preview, with no separate boxes outside it", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const preview = screen.getByTestId("whatsapp-big-preview");
    expect(within(preview).getByTestId("whatsapp-preview-email")).toHaveTextContent("support@herbalroots.com");
    expect(within(preview).getByTestId("whatsapp-preview-website")).toHaveTextContent("https://herbalroots.com/");
    // The old standalone edit-in-place list below the preview no longer exists.
    expect(screen.queryByTestId("whatsapp-category")).not.toBeInTheDocument();
    expect(screen.queryByTestId("whatsapp-address")).not.toBeInTheDocument();
    expect(screen.queryByTestId("whatsapp-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("whatsapp-website")).not.toBeInTheDocument();
  });

  it("edits Support Email and Website in place inside the preview", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    fireEvent.click(screen.getByTestId("whatsapp-preview-email"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-email-input"), { target: { value: "support@home.com" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-email-input"));
    expect(screen.getByTestId("whatsapp-preview-email")).toHaveTextContent("support@home.com");

    fireEvent.click(screen.getByTestId("whatsapp-preview-website"));
    fireEvent.change(screen.getByTestId("whatsapp-preview-website-input"), { target: { value: "https://www.hopeng.com" } });
    fireEvent.blur(screen.getByTestId("whatsapp-preview-website-input"));
    expect(screen.getByTestId("whatsapp-preview-website")).toHaveTextContent("https://www.hopeng.com");
  });
});
