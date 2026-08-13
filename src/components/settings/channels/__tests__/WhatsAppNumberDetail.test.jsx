import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import WhatsAppNumberDetail from "../WhatsAppNumberDetail";

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
  it("shows the number, username, provider, and quality badges", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByText("+91 74360 36062")).toBeInTheDocument();
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
  it("shows Provider, Quality, and WABA ID on the first summary row", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    const row1 = screen.getByTestId("whatsapp-summary-row-1");
    expect(row1).toHaveTextContent("Provider: TSP Karix");
    expect(row1).toHaveTextContent("Quality: High");
    expect(row1).toHaveTextContent("WABA ID: 328175003703387");
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

  it("renders Business Portfolio ID and WABA Provider with Available pills, and does not duplicate WABA ID here", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByDisplayValue("1379257819643222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TSPENGAGE")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("328175003703387")).not.toBeInTheDocument();
    expect(screen.getAllByText("Available").length).toBe(2);
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

  it("shows a photo edit affordance that triggers the placeholder stub", () => {
    render(<WhatsAppNumberDetail number={NUMBER} onBack={jest.fn()} onMakeDefault={jest.fn()} />);
    expect(screen.getByTestId("whatsapp-preview-photo-edit")).toBeInTheDocument();
  });
});
