import React from "react";

interface ErrorMessageProps {
  message: string;
}

/**
 * ErrorMessage — displays a user-facing error string in a styled alert box.
 */
export function ErrorMessage({ message }: ErrorMessageProps): React.JSX.Element {
  return (
    <div
      role="alert"
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "6px",
        border: "1px solid #f87171",
        backgroundColor: "rgba(248, 113, 113, 0.1)",
        color: "#dc2626",
        fontSize: "0.9rem",
        lineHeight: "1.4",
      }}
    >
      {message}
    </div>
  );
}
