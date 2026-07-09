import { CHANNEL_META } from "../flowMeta";

describe("CHANNEL_META", () => {
  it("includes an AI Voice entry for the aicallingv2 channel", () => {
    expect(CHANNEL_META.aicallingv2).toEqual({
      label: "AI Voice",
      color: "#4F46E5",
      Icon: expect.any(Object),
    });
  });

  it("still includes the original 5 channels", () => {
    expect(Object.keys(CHANNEL_META)).toEqual(
      expect.arrayContaining(["whatsapp", "email", "sms", "push", "inapp", "rcs"]),
    );
  });
});
