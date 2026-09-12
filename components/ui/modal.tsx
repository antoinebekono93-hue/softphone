"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function useModalBehavior(open: boolean, onClose: () => void) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);
}

function ModalHeader({
  title,
  description,
  onClose,
}: Pick<ModalProps, "title" | "description" | "onClose">) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  useModalBehavior(open, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] shadow-2xl ${sizeClass[size]} ${className || ""}`}
      >
        <ModalHeader title={title} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
  useModalBehavior(open, onClose);
  if (!open || typeof document === "undefined") return null;

  const sideClass = side === "right" ? "right-0" : "left-0";

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`absolute top-0 ${sideClass} flex h-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] shadow-2xl ${className || ""}`}
      >
        {title && <ModalHeader title={title} description={description} onClose={onClose} />}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}