import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "keyOriginal"
  | "key-original"
  | "keyPractice"
  | "key-practice"
  | "roleAdmin"
  | "role-admin"
  | "roleMember"
  | "role-member"
  | "statusReady"
  | "status-ready"
  | "statusPracticing"
  | "status-practicing"
  | "statusPending"
  | "status-pending"
  | "tierP1"
  | "tier-p1"
  | "tierP2"
  | "tier-p2"
  | "tierP3"
  | "tier-p3"
  | "tierP4"
  | "tier-p4"
  | "custom";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  customColorHex?: string;
  size?: "sm" | "md";
  dot?: boolean;
  children: ReactNode;
}

function normalizeVariant(variant: BadgeVariant): string {
  switch (variant) {
    case "keyOriginal":
      return "key-original";
    case "keyPractice":
      return "key-practice";
    case "roleAdmin":
      return "role-admin";
    case "roleMember":
      return "role-member";
    case "statusReady":
      return "status-ready";
    case "statusPracticing":
      return "status-practicing";
    case "statusPending":
      return "status-pending";
    case "tierP1":
      return "tier-p1";
    case "tierP2":
      return "tier-p2";
    case "tierP3":
      return "tier-p3";
    case "tierP4":
      return "tier-p4";
    default:
      return variant;
  }
}

export function Badge({
  variant = "default",
  customColorHex,
  size = "md",
  dot = false,
  className = "",
  style,
  children,
  ...props
}: BadgeProps) {
  const normVariant = normalizeVariant(variant);
  const isCustom = normVariant === "custom" || !!customColorHex;

  const customStyle: CSSProperties =
    isCustom && customColorHex
      ? {
          backgroundColor: `${customColorHex}25`,
          borderColor: `${customColorHex}60`,
          color: customColorHex,
          ...style,
        }
      : style || {};

  const classes = [
    "wf-badge",
    `wf-badge-${size}`,
    !isCustom && `wf-badge-${normVariant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={customStyle} {...props}>
      {dot && <span className="wf-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
