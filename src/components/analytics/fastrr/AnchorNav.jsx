import React, { useEffect, useState } from "react";
import { findActiveSectionId } from "./scrollSpy";

export default function AnchorNav({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);

  useEffect(() => {
    function handleScroll() {
      const tops = sections.map((s) => {
        const el = document.getElementById(s.id);
        return { id: s.id, top: el ? el.getBoundingClientRect().top + window.scrollY : 0 };
      });
      setActiveId(findActiveSectionId(tops, window.scrollY));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <nav data-testid="fastrr-anchor-nav" className="sticky top-[41px] z-10 bg-surface border-b border-border overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 px-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            data-testid={`fastrr-anchor-${s.id}`}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`px-3 py-2 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeId === s.id ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
