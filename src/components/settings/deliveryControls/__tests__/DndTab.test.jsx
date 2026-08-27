import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DndTab from "../DndTab";

describe("DndTab", () => {
  test("renders one Utility row and one Marketing row per channel", () => {
    render(<DndTab />);
    ["whatsapp", "email", "sms", "rcs", "mobilepush"].forEach((id) => {
      expect(screen.getByTestId(`dnd-row-${id}-utility`)).toBeInTheDocument();
      expect(screen.getByTestId(`dnd-row-${id}-marketing`)).toBeInTheDocument();
    });
    expect(screen.getByTestId("dnd-row-whatsapp-utility").textContent).toContain("Utility");
    expect(screen.getByTestId("dnd-row-whatsapp-marketing").textContent).toContain("Marketing");
  });

  test("Utility and Marketing toggles for the same channel are independent", () => {
    render(<DndTab />);
    fireEvent.click(screen.getByTestId("dnd-row-whatsapp-utility-enabled"));
    expect(screen.getByTestId("dnd-row-whatsapp-utility-enabled")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("dnd-row-whatsapp-marketing-enabled")).toHaveAttribute("aria-checked", "false");
  });

  test("start/end time inputs stay disabled until that row's toggle is enabled", () => {
    render(<DndTab />);
    expect(screen.getByTestId("dnd-row-whatsapp-marketing-start")).toBeDisabled();
    fireEvent.click(screen.getByTestId("dnd-row-whatsapp-marketing-enabled"));
    expect(screen.getByTestId("dnd-row-whatsapp-marketing-start")).not.toBeDisabled();
  });

  test("save/discard dirty tracking works across the flattened rule list", () => {
    render(<DndTab />);
    expect(screen.getByTestId("dnd-save")).toBeDisabled();
    fireEvent.click(screen.getByTestId("dnd-row-sms-utility-enabled"));
    expect(screen.getByTestId("dnd-save")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("dnd-discard"));
    expect(screen.getByTestId("dnd-row-sms-utility-enabled")).toHaveAttribute("aria-checked", "false");
  });
});
