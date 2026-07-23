import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ImportSegmentCsvModal from "../ImportSegmentCsvModal";

function makeFile(name = "customers.csv") {
  return new File(["a,b,c"], name, { type: "text/csv" });
}

describe("ImportSegmentCsvModal", () => {
  test("renders title, subtitle, and helper text while name is empty", () => {
    render(<ImportSegmentCsvModal open onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByText("Import segment from CSV upload")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by uploading a CSV file that contains a list of customers and their contact details.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Please add name before uploading the file")).toBeInTheDocument();
    expect(screen.getByTestId("import-csv-upload-btn")).toBeDisabled();
  });

  test("Create segment button stays disabled until both name and file are set", () => {
    render(<ImportSegmentCsvModal open onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByTestId("import-csv-create-btn")).toBeDisabled();

    fireEvent.change(screen.getByTestId("import-csv-name-input"), { target: { value: "My CSV segment" } });
    expect(screen.getByTestId("import-csv-create-btn")).toBeDisabled();
    expect(screen.getByTestId("import-csv-upload-btn")).not.toBeDisabled();

    const input = screen.getByTestId("import-csv-file-input");
    fireEvent.change(input, { target: { files: [makeFile()] } });
    expect(screen.getByTestId("import-csv-create-btn")).not.toBeDisabled();
    expect(screen.getByText("customers.csv")).toBeInTheDocument();
  });

  test("Create segment calls onCreated with a csv-tagged segment and closes", () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    render(<ImportSegmentCsvModal open onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByTestId("import-csv-name-input"), { target: { value: "My CSV segment" } });
    fireEvent.change(screen.getByTestId("import-csv-file-input"), { target: { files: [makeFile()] } });
    fireEvent.click(screen.getByTestId("import-csv-create-btn"));

    expect(onCreated).toHaveBeenCalledTimes(1);
    const created = onCreated.mock.calls[0][0];
    expect(created.name).toBe("My CSV segment");
    expect(created.creationMethod).toBe("csv");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
