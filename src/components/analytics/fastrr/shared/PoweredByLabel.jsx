import React from "react";

// TODO: confirm source system for every section that uses this label.
export default function PoweredByLabel({ source }) {
  return <span className="text-[10px] text-text-muted italic">{`Powered by ${source}`}</span>;
}
