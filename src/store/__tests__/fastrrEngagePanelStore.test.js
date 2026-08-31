import { useFastrrEngagePanelStore } from "../fastrrEngagePanelStore";

const getState = () => useFastrrEngagePanelStore.getState();

describe("fastrrEngagePanelStore", () => {
  beforeEach(() => {
    getState().close();
  });

  it("starts closed", () => {
    expect(getState().isOpen).toBe(false);
  });

  it("open() sets isOpen to true", () => {
    getState().open();
    expect(getState().isOpen).toBe(true);
  });

  it("close() sets isOpen to false", () => {
    getState().open();
    getState().close();
    expect(getState().isOpen).toBe(false);
  });
});
