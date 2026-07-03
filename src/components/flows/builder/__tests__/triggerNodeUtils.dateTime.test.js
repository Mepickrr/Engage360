import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — date_relative", () => {
  const baseConfig = {
    kind: "date_relative",
    dateConfig: { attribute: "date_of_birth", direction: "before", value: 7, unit: "days", repeat_annually: true },
    audience: { include_all: true },
  };

  it("marks the summary as date-relative with a human-readable offset line", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isDateRelative).toBe(true);
    expect(summary.isEventOffset).toBe(false);
    expect(summary.isWebhook).toBe(false);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.offsetLine).toBe("7 days before Date of Birth");
  });

  it("shows the recurrence line only when repeat_annually is true", () => {
    expect(summariseTriggerConfig(baseConfig).recurrenceLine).toBe("Repeats yearly");
    const noRepeat = { ...baseConfig, dateConfig: { ...baseConfig.dateConfig, repeat_annually: false } };
    expect(summariseTriggerConfig(noRepeat).recurrenceLine).toBeNull();
  });

  it("uses the custom field key as the label for custom_date_attribute", () => {
    const custom = {
      ...baseConfig,
      dateConfig: { attribute: "custom_date_attribute", customFieldKey: "renewal_date", direction: "after", value: 3, unit: "days", repeat_annually: false },
    };
    expect(summariseTriggerConfig(custom).offsetLine).toBe("3 days after renewal_date");
  });

  it("omits the value/unit for the on-the-date direction", () => {
    const onDate = { ...baseConfig, dateConfig: { ...baseConfig.dateConfig, direction: "on" } };
    expect(summariseTriggerConfig(onDate).offsetLine).toBe("On Date of Birth");
  });

  it("derives audience fields from the shared audience summariser", () => {
    const withAudience = {
      ...baseConfig,
      audience: {
        include_all: false,
        audience_kind: "all",
        include: { blocks: [{ type: "property", conditions: [{ property: "city", operator: "is", value: "Mumbai" }] }] },
      },
    };
    expect(summariseTriggerConfig(withAudience).whoLine).toContain("city");
  });
});

describe("summariseTriggerConfig — event_offset", () => {
  const baseConfig = {
    kind: "event_offset",
    eventOffsetConfig: { event: "Back in Stock", value: 2, unit: "Hours" },
    audience: { include_all: true },
  };

  it("marks the summary as event-offset with no recurrence", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isEventOffset).toBe(true);
    expect(summary.isDateRelative).toBe(false);
    expect(summary.offsetLine).toBe("2 Hours after Back in Stock");
    expect(summary.recurrenceLine).toBeNull();
  });

  it("has no exit condition", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
  });
});
