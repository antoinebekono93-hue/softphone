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

const modalStack: HTMLElement[] = [];
let originalOverflow = "";
function useModalBehavior(open: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  React.useEffect(() => {
    const root = ref.current;
    if (!open || !root) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (modalStack.length === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    modalStack.push(root);
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.closest('[inert]') && el.getClientRects().length > 0);
    const topmost = () => modalStack[modalStack.length - 1] === root;
    const focusFirst = () => (focusable()[0] || root).focus();
    if (!root.contains(document.activeElement)) focusFirst();
    const onKey = (event: KeyboardEvent) => {
      if (!topmost()) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onCloseRef.current(); }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); root.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root)) { event.preventDefault(); first.focus(); }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (topmost() && !root.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      const wasTop = topmost();
      modalStack.splice(modalStack.indexOf(root), 1);
      if (!modalStack.length) document.body.style.overflow = originalOverflow;
      if (wasTop && previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  return ref;
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
        className="min-h-11 min-w-11 grid place-items-center rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
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
  const dialogRef = useModalBehavior(open, onClose);
  const titleId = React.useId();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Panneau"}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl md:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] shadow-2xl ${sizeClass[size]} ${className || ""}`}
      >
        <ModalHeader title={<span id={titleId}>{title}</span>} description={description} onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
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
  side?: "right" | "left" | "bottom";
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
  const dialogRef = useModalBehavior(open, onClose);
  const titleId = React.useId();
  if (!open || typeof document === "undefined") return null;

  const isBottom = side === "bottom";
  const sideClass = isBottom
    ? "bottom-0 inset-x-0 max-h-[85dvh] flex-col rounded-t-2xl border-b-0"
    : `top-0 ${side === "right" ? "right-0" : "left-0"} h-full max-w-md flex-col border-l`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70]"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Panneau"}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`absolute flex w-full ${sideClass} border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] shadow-2xl ${className || ""}`}
      >
        {title && <ModalHeader title={<span id={titleId}>{title}</span>} description={description} onClose={onClose} />}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}