import { createBlankScreen, createComponent, FLOW_TYPE_PRESETS, MOCK_FLOW_FORMS } from "../mockFlowForms";

describe("mockFlowForms data helpers", () => {
  it("creates a blank screen with a Continue button and no components", () => {
    const screen = createBlankScreen("Your form");
    expect(screen.title).toBe("Your form");
    expect(screen.components).toEqual([]);
    expect(screen.continueLabel).toBe("Continue");
    expect(screen.id).toBeTruthy();
  });

  it("creates a component with correct default shape per kind", () => {
    expect(createComponent("large_heading")).toMatchObject({ kind: "large_heading", text: "" });
    expect(createComponent("image")).toMatchObject({ kind: "image", url: "", height: 400 });
    expect(createComponent("short_answer")).toMatchObject({
      kind: "short_answer", inputType: "text", label: "", instructions: "", required: true,
    });
    expect(createComponent("single_choice")).toMatchObject({ kind: "single_choice", label: "", options: ["", ""], required: true });
    expect(createComponent("multi_choice").options).toEqual([""]);
    expect(createComponent("opt_in")).toMatchObject({
      kind: "opt_in", consentLabel: "", readMoreUrl: "", required: true,
      editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" },
    });
  });

  it("gives every component a unique id", () => {
    const a = createComponent("body");
    const b = createComponent("body");
    expect(a.id).not.toBe(b.id);
  });

  it("defines all four flow type presets with seed screens", () => {
    expect(Object.keys(FLOW_TYPE_PRESETS).sort()).toEqual(["custom", "event", "signup", "survey"]);
    Object.values(FLOW_TYPE_PRESETS).forEach((preset) => {
      expect(preset.label).toBeTruthy();
      expect(preset.desc).toBeTruthy();
      expect(preset.seedScreens.length).toBeGreaterThan(0);
    });
  });

  it("defines mock flow forms with screens", () => {
    expect(MOCK_FLOW_FORMS.length).toBeGreaterThanOrEqual(2);
    MOCK_FLOW_FORMS.forEach((f) => {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.screens.length).toBeGreaterThan(0);
    });
  });
});
