import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "icon";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const classes = ["wf-btn", `wf-btn-${variant}`, `wf-btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled ? "true" : undefined}
      aria-busy={isLoading ? "true" : undefined}
      {...props}
    >
      {isLoading ? (
        <span className="wf-spinner" aria-hidden="true" />
      ) : (
        leftIcon && (
          <span className="wf-btn-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="wf-btn-icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
