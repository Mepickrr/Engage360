import React, { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronDown, ChevronRight, Search, Lock } from "lucide-react";
import nodeComponentsData from "@/data/nodeComponents.json";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

// LRU of recently used node slugs (in-memory, per session)
const RECENT_LIMIT = 5;
let RECENT_USED = [];
const _listeners = new Set();
function notifyRecent() {
  _listeners.forEach((cb) => cb([...RECENT_USED]));
}
function pushRecent(slug) {
  RECENT_USED = [slug, ...RECENT_USED.filter((s) => s !== slug)].slice(
    0,
    RECENT_LIMIT,
  );
  notifyRecent();
}
function useRecent() {
  const [r, setR] = useState(RECENT_USED);
  React.useEffect(() => {
    _listeners.add(setR);
    return () => _listeners.delete(setR);
  }, []);
  return r;
}

export default function NodePalette() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const triggerExists = nodes.some((n) => n.type === "trigger");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const recent = useRecent();

  const categories = nodeComponentsData.categories;
  const recentItems = useMemo(() => {
    const byslug = {};
    categories.forEach((c) =>
      c.items.forEach((i) => (byslug[i.slug] = { ...i, category: c.name })),
    );
    return recent.map((s) => byslug[s]).filter(Boolean);
  }, [recent, categories]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [q, categories]);

  const onDragStart = (event, item, categoryName, categoryColor) => {
    const payload = { ...item, category: categoryName, categoryColor };
    event.dataTransfer.setData(
      "application/reactflow-item",
      JSON.stringify(payload),
    );
    event.dataTransfer.effectAllowed = "move";
    pushRecent(item.slug);
  };

  return (
    <aside
      data-testid="node-palette"
      className="w-[280px] border-r border-border bg-surface overflow-y-auto flex-shrink-0"
    >
      <div className="px-3 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-text-muted" />
          <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
            Components
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            data-testid="palette-search"
            className="w-full pl-7 pr-2 py-1.5 text-[12px] rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>

      <div className="px-2 py-3 space-y-4">
        {/* Recently used */}
        {!q && (
          <CategorySection
            name="Recently Used"
            color="#94A3B8"
            bg="#F1F5F9"
            collapsed={collapsed["__recent"]}
            onToggle={() =>
              setCollapsed((c) => ({ ...c, __recent: !c.__recent }))
            }
            count={recentItems.length}
            testId="palette-cat-recent"
          >
            {recentItems.length === 0 ? (
              <div className="px-2 py-3 text-[11px] text-text-muted italic text-center">
                Drop a node to track it here
              </div>
            ) : (
              <NodeGrid
                items={recentItems}
                categoryName={"Recent"}
                categoryColor={"#94A3B8"}
                triggerExists={triggerExists}
                onDragStart={onDragStart}
              />
            )}
          </CategorySection>
        )}

        {filtered.map((cat) => {
          const isCollapsed = collapsed[cat.id];
          return (
            <CategorySection
              key={cat.id}
              name={cat.name}
              color={cat.color}
              bg={cat.bg}
              count={cat.items.length}
              collapsed={isCollapsed}
              onToggle={() =>
                setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))
              }
              testId={`palette-cat-${cat.id}`}
            >
              <NodeGrid
                items={cat.items}
                categoryName={cat.name}
                categoryColor={cat.color}
                triggerExists={triggerExists}
                onDragStart={onDragStart}
              />
            </CategorySection>
          );
        })}
      </div>
    </aside>
  );
}

function CategorySection({
  name,
  color,
  bg,
  count,
  collapsed,
  onToggle,
  children,
  testId,
}) {
  return (
    <div data-testid={testId}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
      >
        <span
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-primary flex-1 text-left">
          {name}
        </span>
        <span
          className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
          style={{ color, backgroundColor: bg }}
        >
          {count}
        </span>
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        )}
      </button>
      {!collapsed && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

function NodeGrid({
  items,
  categoryName,
  categoryColor,
  triggerExists,
  onDragStart,
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      {items.map((it) => {
        const Icon = LucideIcons[it.icon] || LucideIcons.Box;
        const disabled = it.kind === "trigger" && triggerExists;
        return (
          <div
            key={it.slug}
            draggable={!disabled}
            onDragStart={(e) =>
              !disabled && onDragStart(e, it, categoryName, categoryColor)
            }
            data-testid={`palette-item-${it.slug}`}
            className={`group rounded-lg border bg-white p-2 flex flex-col items-center justify-center text-center transition-all select-none min-h-[68px] ${
              disabled
                ? "opacity-40 cursor-not-allowed border-border"
                : "border-border hover:border-text-muted/40 hover:shadow-sm cursor-grab active:cursor-grabbing"
            }`}
            style={{ borderLeftWidth: 2, borderLeftColor: categoryColor }}
            title={it.name}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white mb-1"
              style={{ backgroundColor: it.color || categoryColor }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] font-medium text-text-primary leading-tight line-clamp-2">
              {it.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
