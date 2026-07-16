import React, { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function UploadListModal({ open, onClose, onCreated }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);

  const addFile = (files) => {
    const csv = Array.from(files).find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csv) setFile(csv);
  };

  const handleUpload = () => {
    if (!file) return;
    onCreated({
      id: `hist_custom_${Date.now()}`,
      name: file.name,
      rowCount: 0,
      uploadedAt: "just now",
      columns: ["phone_number"],
    });
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setFile(null); onClose(); } }}>
      <DialogContent data-testid="upload-list-modal" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload new list</DialogTitle>
        </DialogHeader>

        {file ? (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-800 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-emerald-400 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            data-testid="upload-list-dropzone"
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-slate-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFile(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-text-muted mb-2" />
            <div className="text-sm font-medium text-text-primary">Drop a CSV file here or click to browse</div>
            <div className="text-xs text-text-muted mt-1">Must include a phone number column.</div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              data-testid="upload-list-file-input"
              onChange={(e) => addFile(e.target.files)}
            />
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            data-testid="upload-list-submit"
            disabled={!file}
            onClick={handleUpload}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Upload list
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
