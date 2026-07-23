import React from "react";
import { Filter, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function NewSegmentModal({ open, onSelectFilters, onSelectCsv, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="new-segment-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new segment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <button
            type="button"
            data-testid="new-segment-option-filters"
            onClick={onSelectFilters}
            className="w-full text-left border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Filter className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Create Segment via filters</div>
              <div className="text-[12px] text-text-muted mt-1">
                Segments can be created by filtering customers on the basis of the events they performed, their user
                properties or existing segments.
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="new-segment-option-csv"
            onClick={onSelectCsv}
            className="w-full text-left border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <UploadCloud className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Upload CSV</div>
              <div className="text-[12px] text-text-muted mt-1">
                Segments can be created by uploading a csv file that contains a list of customers and their contact
                details.
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
