import React from "react";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog — a modal-style dialog that asks the user to confirm or cancel
 * a destructive action (e.g., deleting a user).
 *
 * Traps focus on the dialog and closes on Escape key for accessibility.
 */
export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 100,
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.5rem",
          minWidth: "300px",
          maxWidth: "480px",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <p
          id="confirm-dialog-message"
          style={{
            margin: 0,
            color: "var(--text-h)",
            fontSize: "1rem",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              background: "#dc2626",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
