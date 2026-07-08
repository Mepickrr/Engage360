import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowVariantContext } from "../../../../FlowVariantContext";
import WhatsAppRightPanel from "../WhatsAppRightPanel";

// Static render — data never changes across interactions (used when the test
// doesn't need patch()es to actually mutate the rendered node).
function renderPanel(nodeData) {
  const updateNodeData = jest.fn();
  const removeNode = jest.fn();
  const node = { id: "node_1", data: nodeData };
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
      <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
    </FlowVariantContext.Provider>
  );
  return { updateNodeData, removeNode };
}

// Stateful render — mimics the real app: updateNodeData() actually merges the
// patch into node.data and re-renders, so we can drive a full
// create -> save -> reopen round trip through the UI.
function renderStatefulPanel(initialData, onUpdate) {
  const removeNode = jest.fn();
  function Harness() {
    const [data, setData] = useState(initialData);
    const node = { id: "node_1", data };
    const updateNodeData = (id, patch) => {
      if (onUpdate) onUpdate(patch);
      setData((d) => ({ ...d, ...patch }));
    };
    return (
      <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
        <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
      </FlowVariantContext.Provider>
    );
  }
  render(<Harness />);
  return { removeNode };
}

describe("TemplateTab carousel re-edit round trip", () => {
  it("shows the real saved content when reopening a hand-authored carousel template for edit", () => {
    renderPanel({
      wabaNumberId: "waba_1",
      templateStyle: "carousel",
      template: {
        isCarousel: true,
        id: "carousel_test_1",
        name: "test_carousel",
        category: "Marketing",
        language: "en",
        body: "My carousel body",
        cards: [
          { mediaUrl: "", cardBody: "Card one text", buttons: [{ type: "QUICK_REPLY", label: "Shop" }] },
          { mediaUrl: "", cardBody: "Card two text", buttons: [{ type: "QUICK_REPLY", label: "Shop" }] },
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByPlaceholderText(/main message body/i)).toHaveValue("My carousel body");
  });

  it("does NOT lose freshly-typed content when a newly created carousel template is reopened for edit (regression for the isCarousel-tagging bug)", () => {
    renderStatefulPanel({ wabaNumberId: "waba_1", templateStyle: "carousel", template: null });

    // Empty state -> opens UnifiedTemplateModal in browse mode.
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    // Browse view's own "+ Create new" opens a blank CarouselForm edit view.
    fireEvent.click(screen.getByRole("button", { name: /\+ Create new/ }));

    fireEvent.change(screen.getByPlaceholderText(/main message body/i), {
      target: { value: "Fresh carousel content" },
    });
    fireEvent.click(screen.getByRole("button", { name: /apply template/i }));

    // Template is now saved onto node data; summary card should show and let us reopen it.
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // Assert against the reopened form's own body textarea (not the background
    // summary card, which still shows the saved text regardless of this bug) —
    // this is what actually goes blank when isCarousel isn't tagged on save.
    expect(screen.getByPlaceholderText(/main message body/i)).toHaveValue("Fresh carousel content");
  });
});

describe("TemplateTab fallback template selection", () => {
  it("writes the selected template to fallback.template without touching the primary template", () => {
    const onUpdate = jest.fn();
    renderStatefulPanel(
      {
        wabaNumberId: "waba_1",
        templateStyle: "carousel",
        template: {
          isCarousel: true,
          id: "carousel_test_1",
          name: "test_carousel",
          category: "Marketing",
          language: "en",
          body: "My carousel body",
          cards: [
            { mediaUrl: "", cardBody: "Card one text", buttons: [{ type: "QUICK_REPLY", label: "Shop" }] },
            { mediaUrl: "", cardBody: "Card two text", buttons: [{ type: "QUICK_REPLY", label: "Shop" }] },
          ],
        },
      },
      onUpdate
    );

    // Primary template summary card is showing "test_carousel".
    expect(screen.getByText("test_carousel")).toBeInTheDocument();

    // Enable the "Fallback Template" toggle.
    const fallbackLabel = screen.getByText("Fallback Template");
    const toggle = fallbackLabel.parentElement.children[1];
    fireEvent.click(toggle);

    fireEvent.click(screen.getByText(/click to select approved fallback template/i));

    // Select a seeded mock Standard template from the fallback modal's browse grid.
    fireEvent.click(screen.getByText("TRUST_NOTE_J"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        fallback: expect.objectContaining({
          template: expect.objectContaining({ name: "TRUST_NOTE_J" }),
        }),
      })
    );

    // Primary template is unchanged.
    expect(screen.getByText("test_carousel")).toBeInTheDocument();
  });
});
