import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BroadcastSourceStep2 from "../BroadcastSourceStep2";

function Harness() {
  const [schedule, setSchedule] = useState({ type: "immediate" });
  const [audience, setAudience] = useState({ include_all: false, include: null, exclude_enabled: false });
  return (
    <BroadcastSourceStep2
      schedule={schedule}
      setSchedule={setSchedule}
      audience={audience}
      setAudience={setAudience}
    />
  );
}

describe("BroadcastSourceStep2 — audience filter tabs", () => {
  it("does not offer a User affinity tab in the include filter builder", () => {
    render(<Harness />);
    expect(screen.getByText("User property")).toBeInTheDocument();
    expect(screen.getByText("User behavior")).toBeInTheDocument();
    expect(screen.getByText("Custom segment")).toBeInTheDocument();
    expect(screen.queryByText("User affinity")).not.toBeInTheDocument();
  });
});
