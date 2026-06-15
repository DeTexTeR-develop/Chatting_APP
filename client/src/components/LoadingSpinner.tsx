import React from "react";

/**
 * LoadingSpinner — a centered, animated spinner used during async operations
 * and session verification on app load.
 */
export function LoadingSpinner(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "2rem",
          height: "2rem",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        Loading...
      </span>
    </div>
  );
}
