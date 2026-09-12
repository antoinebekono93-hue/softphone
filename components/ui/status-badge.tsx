import * as React from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS_MAP: Record<string, BadgeVariant> = {
  active: "success",
  online: "success",
  connected: "success",
  paid: "success",
  success: "success",
  completed: "success",
  delivered: "success",
  approved: "success",
  ready: "success",
  running: "info",
  ringing: "info",
  processing: "info",
  pending: "warning",
  scheduled: "warning",
  busy: "warning",
  paused: "warning",
  waiting: "warning",
  draft: "neutral",
  inactive: "neutral",
  offline: "neutral",
  canceled: "neutral",
  cancelled: "neutral",
  archived: "neutral",
  failed: "danger",
  error: "danger",
  unpaid: "danger",
  suspended: "danger",
  expired: "danger",
  disconnected: "danger",
  declined: "danger",
  missed: "danger",
  spam: "danger",
  rejected: "danger",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: React.ReactNode;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const key = String(status ?? "").toLowerCase();
  const variant = STATUS_MAP[key] ?? "neutral";
  return (
    <Badge variant={variant} className={className} {...props}>
      {status}
    </Badge>
  );
}