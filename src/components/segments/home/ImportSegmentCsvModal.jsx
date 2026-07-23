import React, { useRef, useState } from "react";
import { Users, Upload, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createSegment, emptySegmentAudience } from "@/data/segmentsData";

export default function ImportSegmentCsvModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const canCreate = Boolean(name.trim()) && Boolean(file);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const segment = createSegment({
      name: name.trim(),
      audience: emptySegmentAudience(),
      creationMethod: "csv",
    });
    onCreated(segment);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="import-csv-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import segment from CSV upload</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-text-secondary">
          Segments can be created by uploading a CSV file that contains a list of customers and their contact
          details.
        </p>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Segment name</label>
          <input
            data-testid="import-csv-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
          />
          {!name.trim() && (
            <div className="mt-1 text-[11px] text-text-muted">Please add name before uploading the file</div>
          )}
        </div>

        <div className="mt-4 border border-dashed border-border rounded-lg p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-sm font-semibold text-text-primary">Add a csv file of your customers</div>
          <button
            type="button"
            data-testid="import-csv-upload-btn"
            disabled={!name.trim()}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Upload customers
          </button>
          <input
            ref={fileInputRef}
            data-testid="import-csv-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mt-2 text-[12px] text-text-muted">or drag and drop a file here</div>
          <a href="#sample-csv" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary font-medium">
            <Download className="w-3.5 h-3.5" />
            Download sample file
          </a>
          {file && (
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-[12px] text-text-primary">
              {file.name}
              <button type="button" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            data-testid="import-csv-create-btn"
            disabled={!canCreate}
            onClick={handleCreate}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create segment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
