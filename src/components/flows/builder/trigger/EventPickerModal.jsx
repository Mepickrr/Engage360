import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";

// Two-column "Select Start Trigger" picker (Part 1).
export default function EventPickerModal({ open, onClose, onPick }) {
  const [activeHeader, setActiveHeader] = useState("All");
  const [search, setSearch] = useState("");

  // Left-rail headers: single "All" at position 0, then every real catalogue
  // header except the canonical "ALL" data bucket (we use it only as the
  // backing source for "All" mode — never as a clickable nav item).
  const headers = useMemo(
    () => [
      "All",
      ...Object.keys(catalogueData.catalogue).filter(
        (h) => h !== "All" && h !== "ALL",
      ),
    ],
    [],
  );

  const visibleSections = useMemo(() => {
    const cat = catalogueData.catalogue;
    const filterCard = (c) =>
      !search.trim()
        ? true
        : c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (c.description || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase());

    // "All" mode: render ONLY the canonical "ALL" data bucket (every event
    // grouped by section). Iterating every header would duplicate sections.
    if (activeHeader === "All") {
      const all = cat.ALL || cat.All || {};
      return Object.keys(all)
        .map((sec) => ({
          header: "All",
          section: sec,
          cards: all[sec].filter(filterCard),
        }))
        .filter((g) => g.cards.length > 0);
    }
    const h = cat[activeHeader] || {};
    return Object.keys(h)
      .map((sec) => ({
        header: activeHeader,
        section: sec,
        cards: h[sec].filter(filterCard),
      }))
      .filter((g) => g.cards.length > 0);
  }, [activeHeader, search]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 max-h-[90vh] flex flex-col overflow-hidden"
        data-testid="event-picker-modal"
      >
        <DialogTitle className="sr-only">Select Start Trigger</DialogTitle>
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-text-primary">
              Select Start Trigger
            </div>
            <div className="text-[12px] text-text-muted">
              Choose the event that will start this flow.
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Left nav */}
          <aside className="w-48 border-r border-border bg-slate-50/60 py-3 overflow-y-auto">
            {headers.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setActiveHeader(h)}
                data-testid={`event-picker-header-${h}`}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  activeHeader === h
                    ? "bg-primary-tint text-primary font-semibold border-l-2 border-primary"
                    : "text-text-secondary hover:bg-slate-100 border-l-2 border-transparent"
                }`}
              >
                {h}
              </button>
            ))}
          </aside>

          {/* Right column */}
          <section className="flex-1 flex flex-col min-w-0">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trigger events"
                  data-testid="event-picker-search"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {visibleSections.length === 0 && (
                <div className="text-center py-12 text-sm text-text-muted">
                  No events match "{search}"
                </div>
              )}
              {visibleSections.map((g) => (
                <div key={`${g.header}-${g.section}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[12px] uppercase tracking-wide text-text-muted font-semibold">
                      {g.section}
                    </h4>
                    <span className="text-[11px] text-text-muted">
                      · {g.cards.length} event{g.cards.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {g.cards.map((card) => (
                      <button
                        key={card.name}
                        type="button"
                        onClick={() => onPick(card)}
                        data-testid={`event-picker-card-${card.name}`}
                        className="text-left p-3 border border-border rounded-lg bg-surface hover:border-primary hover:shadow-sm transition-all"
                      >
                        <div className="text-sm font-semibold text-text-primary">
                          {card.name}
                        </div>
                        {card.description && (
                          <div className="text-[12px] text-text-secondary mt-0.5 mb-2">
                            {card.description}
                          </div>
                        )}
                        {card.source && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {card.source.split(", ").filter(Boolean).map((s) => (
                              <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
