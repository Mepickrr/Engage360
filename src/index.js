import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ──────────────────────────────────────────────────────────────────────
// External error filter
// ──────────────────────────────────────────────────────────────────────
// The Emergent preview shell installs its own window.onerror /
// unhandledrejection handlers that surface a red overlay. That overlay
// catches EVERYTHING on the page — including errors thrown by browser
// extensions (chrome-extension://…/frame_ant), PostHog analytics, and the
// Emergent preview's own scripts. None of those originate from our app.
//
// We register capture-phase listeners that run BEFORE the overlay's
// handlers, identify external errors by stack/URL fingerprint, and
// preventDefault + stopImmediatePropagation so the overlay never sees
// them. App-origin errors still bubble through and reach the React
// ErrorBoundary / dev tools.

function isExternalError(eventOrReason) {
  try {
    const stack =
      eventOrReason?.error?.stack ||
      eventOrReason?.reason?.stack ||
      (typeof eventOrReason?.reason === "string" ? eventOrReason.reason : "") ||
      eventOrReason?.filename ||
      "";
    const url = eventOrReason?.filename || "";
    const message =
      eventOrReason?.message ||
      eventOrReason?.error?.message ||
      eventOrReason?.reason?.message ||
      "";
    const blob = `${stack}\n${url}\n${message}`;
    return (
      blob.includes("chrome-extension://") ||
      blob.includes("moz-extension://") ||
      blob.includes("safari-extension://") ||
      blob.includes("posthog.com") ||
      blob.includes("assets.emergent.sh") ||
      blob.includes("emergentagent.com/scripts/") ||
      blob.includes("frame_ant") ||
      // Generic "Failed to fetch" with no app-source stack frame.
      // Our bundle paths contain `/static/js/` (CRA) or `/src/`.
      (blob.includes("TypeError: Failed to fetch") &&
        !blob.includes("/static/js/") &&
        !blob.includes("/src/")) ||
      // React Flow / browser ResizeObserver benign notification — not a real error.
      blob.includes("ResizeObserver loop completed with undelivered notifications") ||
      blob.includes("ResizeObserver loop limit exceeded")
    );
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  // Capture-phase so we run BEFORE the Emergent overlay's listener.
  window.addEventListener(
    "error",
    (e) => {
      if (isExternalError(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        // Silent — keep console clean for app debugging.
        return false;
      }
      // eslint-disable-next-line no-console
      console.error("[app:error]", e?.error || e?.message);
      return undefined;
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (e) => {
      if (isExternalError(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      // eslint-disable-next-line no-console
      console.error("[app:rejection]", e?.reason);
      return undefined;
    },
    true,
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
