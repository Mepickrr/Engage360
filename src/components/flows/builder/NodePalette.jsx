/**
 * NodePalette — hover-expand component panel for the Flow Builder.
 *
 * Collapsed (52 px):  pin button + category icon column
 * Expanded  (268 px): pin button + search + recently-used + category accordion
 *
 * Hover mode (default): panel expands on mouseenter, collapses on mouseleave.
 *                        Category accordion opens on category row hover.
 * Pin mode:             panel stays expanded permanently.
 *                        Category accordion toggles on click.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle, Mail, MessageSquare, MessagesSquare,
  BellRing, Bell, PhoneCall, Bot, Sparkles, Award, BrainCog,
  ShoppingCart, Tag, Percent, ClipboardList, StickyNote,
  Plug, Star, CreditCard, Headphones,
  GitBranch, GitFork, Clock, Brain, Route, LogIn,
  Table, CirclePlus, Pencil, ArrowUpFromLine,
  UserCircle, Tags, Ticket, CalendarCheck,
  FilePlus, UserCheck, RefreshCw, FileText,
  Pin, Lock, Search, ChevronDown,
  Package, Truck, XCircle, RotateCcw, Barcode,
} from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

// ── color ramps (matches HTML reference exactly) ──────────────
const COLORS = {
  purple: { bg:"#EEEDFE", bg2:"#CECBF6", color:"#7F77DD", text:"#3C3489", border:"#AFA9EC" },
  coral:  { bg:"#FAECE7", bg2:"#F5C4B3", color:"#D85A30", text:"#993C1D", border:"#F0997B" },
  green:  { bg:"#EAF3DE", bg2:"#C0DD97", color:"#639922", text:"#3B6D11", border:"#97C459" },
  blue:   { bg:"#E6F1FB", bg2:"#B5D4F4", color:"#378ADD", text:"#185FA5", border:"#85B7EB" },
  teal:   { bg:"#E1F5EE", bg2:"#9FE1CB", color:"#1D9E75", text:"#0F6E56", border:"#5DCAA5" },
  pink:   { bg:"#FBEAF0", bg2:"#F4C0D1", color:"#D4537E", text:"#993556", border:"#ED93B1" },
  amber:  { bg:"#FAEEDA", bg2:"#FAC775", color:"#BA7517", text:"#854F0B", border:"#EF9F27" },
};

// ── full node catalogue ───────────────────────────────────────
const CATEGORIES = [
  {
    id: "communication", label: "Communication", Icon: MessageSquare, color: "purple",
    nodes: [
      { id:"whatsapp",     name:"WhatsApp",       Icon:MessageCircle,  kind:"whatsapp", subtype:"whatsapp" },
      { id:"email",        name:"Email",          Icon:Mail,           kind:"email",   subtype:null       },
      { id:"sms",          name:"SMS",            Icon:MessageSquare,  kind:"sms",     subtype:null       },
      { id:"rcs",          name:"RCS",            Icon:MessagesSquare, kind:"rcs",     subtype:"rcs"      },
      { id:"webpush",      name:"Push Notification", Icon:BellRing,     kind:"push",    subtype:null       },
      { id:"onsite",       name:"Onsite",          Icon:Bell,           kind:"onsite",  subtype:null       },
      { id:"inapp",        name:"InApp",           Icon:BellRing,       kind:"inapp",   subtype:null       },
      { id:"aicalling",    name:"AI Calling",     Icon:PhoneCall,      kind:"aicalling", subtype:"aicalling" },
      { id:"aichatbot",    name:"AI Chatbot",     Icon:Bot,            kind:"aichatbot", subtype:null },
    ],
  },
  {
    id: "action", label: "Action", Icon: Sparkles, color: "coral",
    nodes: [
      { id:"nextbestaction",    name:"Next Best Action",      Icon:BrainCog, kind:"nextbestaction",    subtype:null },
      { id:"smartflowoptimizer",name:"Smart Flow Optimizer",  Icon:Route,    kind:"smartflowoptimizer",subtype:null },
      { id:"aicontent", name:"AI Content",      Icon:Sparkles, kind:"action", subtype:"aicontent" },
      { id:"aisocial",  name:"AI Social Proof", Icon:Award,    kind:"action", subtype:"aisocial"  },
    ],
  },
  {
    id: "shopify", label: "Shopify", Icon: ShoppingCart, color: "green",
    nodes: [
      { id:"custtag",    name:"Customer Tag",  Icon:Tag,          kind:"action", subtype:"custtag"    },
      { id:"discount",   name:"Discount Code", Icon:Percent,      kind:"action", subtype:"discount"   },
      { id:"ordertag",   name:"Add Order Tag", Icon:ClipboardList,kind:"action", subtype:"ordertag"   },
      { id:"ordernotes", name:"Order Notes",   Icon:StickyNote,   kind:"action", subtype:"ordernotes" },
    ],
  },
  {
    id: "integrations", label: "Integrations", Icon: Plug, color: "blue",
    nodes: [
      { id:"judgeme",   name:"Judge Me",  Icon:Star,       kind:"action", subtype:"judgeme"  },
      { id:"razorpay",  name:"Razor Pay", Icon:CreditCard, kind:"razorpay", subtype:null },
      { id:"freshdesk", name:"Freshdesk", Icon:Headphones, kind:"action", subtype:"freshdesk"},
    ],
  },
  {
    id: "flowcontrol", label: "Flow Control", Icon: GitBranch, color: "teal",
    nodes: [
      { id:"condsplit",  name:"Conditional Split", Icon:GitFork, kind:"conditionalsplit", subtype:null },
      { id:"delay",      name:"Delay Node",        Icon:Clock,   kind:"wait",      subtype:null },
      { id:"aipredict",  name:"AI Predict",        Icon:Brain,   kind:"aipredict", subtype:null },
      { id:"aibestch",   name:"AI Best Channel",   Icon:Route,   kind:"action",    subtype:"aibestch"  },
      { id:"startflow",  name:"Start Flow",        Icon:LogIn,   kind:"startflow", subtype:null },
    ],
  },
  {
    id: "gsheets", label: "Google Sheets", Icon: Table, color: "green",
    nodes: [
      { id:"addrow",    name:"Add Row",      Icon:CirclePlus,      kind:"action", subtype:"addrow"    },
      { id:"updaterow", name:"Update Row",   Icon:Pencil,          kind:"action", subtype:"updaterow" },
      { id:"getrow",    name:"Get Row Data", Icon:ArrowUpFromLine, kind:"action", subtype:"getrow"    },
    ],
  },
  {
    id: "userprofile", label: "User Profile", Icon: UserCircle, color: "pink",
    nodes: [
      { id:"updatetag", name:"Update Profile Tag", Icon:Tags, kind:"action", subtype:"updatetag" },
    ],
  },
  {
    id: "ticket", label: "Ticket", Icon: Ticket, color: "amber",
    nodes: [
      { id:"addevent",     name:"Add Event",       Icon:CalendarCheck, kind:"action", subtype:"addevent"     },
      { id:"tktcreate",    name:"Ticket Creation", Icon:FilePlus,      kind:"action", subtype:"tktcreate"    },
      { id:"assigntkt",    name:"Assign Ticket",   Icon:UserCheck,     kind:"action", subtype:"assigntkt"    },
      { id:"changestatus", name:"Change Status",   Icon:RefreshCw,     kind:"action", subtype:"changestatus" },
    ],
  },
  {
    id: "notes", label: "Notes", Icon: FileText, color: "amber",
    nodes: [
      { id:"stickynote", name:"Sticky Notes", Icon:FileText, kind:"note", subtype:null },
    ],
  },
  {
    id: "shiprocket", label: "Shiprocket Checkout", Icon: Truck, color: "teal",
    nodes: [
      { id:"sr_shipment",  name:"Create Shipment",  Icon:Package,   kind:"action", subtype:"sr_shipment"  },
      { id:"sr_track",     name:"Track Order",      Icon:Truck,     kind:"action", subtype:"sr_track"     },
      { id:"sr_cancel",    name:"Cancel Shipment",  Icon:XCircle,   kind:"action", subtype:"sr_cancel"    },
      { id:"sr_return",    name:"Create Return",    Icon:RotateCcw, kind:"action", subtype:"sr_return"    },
      { id:"sr_awb",       name:"Get AWB",          Icon:Barcode,   kind:"action", subtype:"sr_awb"       },
    ],
  },
];

// Flat map for recently-used lookup
const NODE_MAP = {};
CATEGORIES.forEach((cat) => {
  cat.nodes.forEach((n) => { NODE_MAP[n.id] = { ...n, color: cat.color, catLabel: cat.label }; });
});

export default function NodePalette({ onNodeAdd, allowedNodeIds = null }) {
  const [pinned,    setPinned]    = useState(true);
  const [hovered,   setHovered]   = useState(false);
  // In pinned mode every category is open by default; null = all open.
  // In hover mode only one category is open at a time.
  const [activeCat, setActiveCat] = useState(null);
  // When pinned, track which cats are explicitly COLLAPSED.
  const [collapsedCats, setCollapsedCats] = useState(new Set());
  const [search,    setSearch]    = useState("");
  const [recent,    setRecent]    = useState([]);

  const leaveTimer = useRef(null);
  const isExpanded = pinned || hovered;

  const handleMouseEnter = () => {
    clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    if (!pinned) {
      leaveTimer.current = setTimeout(() => {
        setHovered(false);
        setActiveCat(null);
      }, 280);
    }
  };
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const togglePin = () => {
    setPinned((p) => {
      if (p) { setActiveCat(null); setCollapsedCats(new Set()); }
      return !p;
    });
  };

  const handleCatHover = (id) => { if (!pinned) setActiveCat(id); };
  const handleCatClick = (id) => {
    if (pinned) {
      setCollapsedCats((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setActiveCat((cur) => (cur === id ? null : id));
    }
  };

  // In pinned mode: a cat is "open" unless explicitly collapsed.
  // In hover mode:  a cat is "open" only if it equals activeCat.
  const isCatOpen = (id) => pinned ? !collapsedCats.has(id) : activeCat === id;

  const handleSearch = (q) => {
    setSearch(q);
    if (q) {
      const first = CATEGORIES.find((c) =>
        c.nodes.some((n) => n.name.toLowerCase().includes(q.toLowerCase())) ||
        c.label.toLowerCase().includes(q.toLowerCase()),
      );
      setActiveCat(first ? first.id : null);
    }
  };

  const onDragStart = useCallback((e, node, colorKey, catLabel) => {
    const item = { id: node.id, kind: node.kind, subtype: node.subtype, label: node.name, colorKey, catLabel };
    e.dataTransfer.setData("application/reactflow-item", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
    setRecent((prev) => [node.id, ...prev.filter((x) => x !== node.id)].slice(0, 4));
  }, []);

  const lq = search.trim().toLowerCase();
  const filteredCats = CATEGORIES.map((cat) => {
    // Apply allowlist filter first (V2 mode)
    const visibleNodes = allowedNodeIds
      ? cat.nodes.filter((n) => allowedNodeIds.includes(n.id))
      : cat.nodes;
    if (allowedNodeIds && visibleNodes.length === 0) return null;

    // Then apply search filter
    if (!lq) return { ...cat, nodes: visibleNodes };
    const matched = visibleNodes.filter((n) => n.name.toLowerCase().includes(lq));
    if (!matched.length && !cat.label.toLowerCase().includes(lq)) return null;
    return { ...cat, nodes: matched.length ? matched : visibleNodes };
  }).filter(Boolean);

  // ── shared inline-style helpers ───────────────────────────────
  const fadeIn  = { opacity: isExpanded ? 1 : 0, transition: "opacity 0.1s" };
  const slideIn = (delay = 0) => ({
    maxHeight: isExpanded ? 80 : 0,
    opacity: isExpanded ? 1 : 0,
    overflow: "hidden",
    transition: `max-height 0.2s ${delay}ms, opacity 0.15s ${delay}ms`,
    flexShrink: 0,
  });

  return (
    <aside
      data-testid="node-palette"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? 268 : 52,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRight: "0.5px solid #E5E7EB",
        height: "100%",
      }}
    >
      {/* Pin header */}
      <div style={{ height:42, display:"flex", alignItems:"center", borderBottom:"0.5px solid #E5E7EB", padding:"0 10px", gap:8, flexShrink:0 }}>
        <button
          type="button"
          onClick={togglePin}
          title={pinned ? "Unpin panel" : "Pin panel open"}
          style={{
            width:26, height:26, borderRadius:6, cursor:"pointer", flexShrink:0,
            border:`0.5px solid ${pinned ? "#AFA9EC" : "#E5E7EB"}`,
            background: pinned ? "#EEEDFE" : "transparent",
            color: pinned ? "#534AB7" : "#94A3B8",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s",
          }}
        >
          {pinned ? <Lock size={13}/> : <Pin size={13}/>}
        </button>
        <span style={{ fontSize:10, fontWeight:500, letterSpacing:"0.07em", color:"#94A3B8", textTransform:"uppercase", whiteSpace:"nowrap", flex:1, overflow:"hidden", ...fadeIn }}>
          Components
        </span>
      </div>

      {/* Search */}
      <div style={{ padding:"8px 10px", borderBottom:"0.5px solid #E5E7EB", ...slideIn(0) }}>
        <div style={{ position:"relative" }}>
          <Search size={13} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}/>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search nodes…"
            style={{ width:"100%", padding:"6px 8px 6px 26px", fontSize:12, border:"0.5px solid #E5E7EB", borderRadius:6, background:"#F7F8FA", color:"#0F172A", outline:"none" }}
          />
        </div>
      </div>

      {/* Recently used */}
      <div style={{ padding:"8px 10px", borderBottom:"0.5px solid #E5E7EB", ...slideIn(50) }}>
        <div style={{ fontSize:9, fontWeight:500, letterSpacing:"0.07em", color:"#94A3B8", textTransform:"uppercase", marginBottom:6 }}>
          Recently used
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto" }}>
          {recent.length === 0 ? (
            <span style={{ fontSize:10, color:"#94A3B8", fontStyle:"italic" }}>Drop a node to track it here</span>
          ) : recent.map((id) => {
            const n = NODE_MAP[id]; if (!n) return null;
            const col = COLORS[n.color]; const Icon = n.Icon;
            return (
              <div key={id} draggable
                onDragStart={(e) => onDragStart(e, n, n.color, n.catLabel)}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 7px", borderRadius:6, border:"0.5px solid #E5E7EB", background:"#F7F8FA", cursor:"grab", flexShrink:0, transition:"transform 0.1s" }}
                onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.04)"}
                onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}
              >
                <Icon size={12} style={{ color:col.color }}/>
                <span style={{ fontSize:10, color:"#475569", whiteSpace:"nowrap" }}>{n.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category accordion */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
        {filteredCats.map((cat) => {
          const col = COLORS[cat.color];
          const isOpen = isCatOpen(cat.id);
          const CatIcon = cat.Icon;
          const rowEvents = pinned
            ? { onClick: () => handleCatClick(cat.id) }
            : { onMouseEnter: () => handleCatHover(cat.id) };

          return (
            <div key={cat.id}>
              {/* Category row */}
              <div {...rowEvents} style={{
                display:"flex", alignItems:"center", padding:"8px 10px", gap:8,
                borderLeft:`3px solid ${isOpen ? col.color : "transparent"}`,
                background: isOpen ? col.bg : "transparent",
                cursor: "pointer",
                transition:"background 0.13s, border-color 0.13s",
                userSelect:"none",
              }}>
                <div style={{
                  width:30, height:30, borderRadius:7, flexShrink:0,
                  background: isOpen ? col.bg2 : "#F1F5F9",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"background 0.13s", position:"relative",
                }}>
                  <CatIcon size={15} style={{ color: isOpen ? col.color : "#94A3B8", transition:"color 0.13s" }}/>
                  {!isExpanded && (
                    <span style={{
                      position:"absolute", bottom:-4, right:-4, fontSize:8,
                      background:col.color, color:"#fff", borderRadius:4,
                      padding:"1px 3px", fontWeight:600, lineHeight:1, minWidth:12, textAlign:"center",
                    }}>
                      {cat.nodes.length}
                    </span>
                  )}
                </div>
                <span style={{ fontSize:12, fontWeight:500, color: isOpen ? col.text : "#0F172A", whiteSpace:"nowrap", flex:1, overflow:"hidden", ...fadeIn }}>
                  {cat.label}
                </span>
                <span style={{ fontSize:10, color:"#94A3B8", whiteSpace:"nowrap", ...fadeIn }}>
                  {cat.nodes.length}
                </span>
                <ChevronDown size={11} style={{
                  color:"#94A3B8", flexShrink:0,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition:"transform 0.2s, opacity 0.1s",
                  ...fadeIn,
                }}/>
              </div>

              {/* Node grid */}
              <div style={{ maxHeight: isOpen && isExpanded ? 700 : 0, overflow:"hidden", transition:"max-height 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:"4px 10px 10px" }}>
                  {cat.nodes.map((node) => {
                    const NIcon = node.Icon;
                    return (
                      <div
                        key={node.id}
                        draggable={!node.comingSoon}
                        onDragStart={node.comingSoon ? undefined : (e) => onDragStart(e, node, cat.color, cat.label)}
                        onClick={node.comingSoon ? undefined : () => onNodeAdd?.({ id: node.id, kind: node.kind, subtype: node.subtype, label: node.name, colorKey: cat.color, catLabel: cat.label })}
                        title={node.comingSoon ? "Coming soon" : "Click to add · Drag to position"}
                        style={{
                          display:"flex", flexDirection:"column", alignItems:"center",
                          justifyContent:"center", gap:5, padding:"9px 6px",
                          background:"#fff", border:`0.5px solid ${col.border}`,
                          borderRadius:8, position:"relative",
                          cursor: node.comingSoon ? "not-allowed" : "pointer",
                          opacity: node.comingSoon ? 0.5 : 1,
                          userSelect:"none", transition:"transform 0.1s",
                        }}
                        onMouseEnter={(e) => { if (!node.comingSoon) e.currentTarget.style.transform="scale(1.03)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform="scale(1)"; }}
                        onMouseDown={(e) => { if (!node.comingSoon) e.currentTarget.style.transform="scale(0.97)"; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform="scale(1)"; }}
                      >
                        <div style={{ width:26, height:26, borderRadius:6, background:col.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <NIcon size={13} style={{ color:col.color }}/>
                        </div>
                        <span style={{ fontSize:10, color:"#0F172A", textAlign:"center", lineHeight:1.3 }}>
                          {node.name}
                        </span>
                        {node.comingSoon && (
                          <span style={{ position:"absolute", top:-7, right:-4, fontSize:8, background:"#FAEEDA", color:"#854F0B", padding:"1px 5px", borderRadius:3, border:"0.5px solid #EF9F27", fontWeight:500, whiteSpace:"nowrap" }}>
                            Coming soon
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
