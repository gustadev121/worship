"use client";

import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
  useState,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightAction?: ReactNode;
  enablePasswordToggle?: boolean;
}

export function Input({
  label,
  helperText,
  errorMessage,
  leftIcon,
  rightAction,
  enablePasswordToggle = true,
  type = "text",
  className = "",
  id: explicitId,
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;

  const describedBy = [
    errorMessage ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ");

  const inputClasses = [
    "wf-input",
    leftIcon && "wf-input-with-left-icon",
    (rightAction || (isPassword && enablePasswordToggle)) &&
      "wf-input-with-right-action",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="wf-form-field">
      {label && (
        <label htmlFor={id} className="wf-label">
          {label}
        </label>
      )}
      <div className="wf-input-wrapper">
        {leftIcon && <span className="wf-input-left-icon">{leftIcon}</span>}
        <input
          id={id}
          type={effectiveType}
          className={inputClasses}
          aria-invalid={errorMessage ? "true" : undefined}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {isPassword && enablePasswordToggle ? (
          <button
            type="button"
            className="wf-input-right-action wf-btn-icon"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : (
          rightAction && (
            <span className="wf-input-right-action">{rightAction}</span>
          )
        )}
      </div>
      {errorMessage && (
        <span id={errorId} className="wf-input-error" role="alert">
          {errorMessage}
        </span>
      )}
      {!errorMessage && helperText && (
        <span id={helperId} className="wf-input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export function Textarea({
  label,
  helperText,
  errorMessage,
  className = "",
  id: explicitId,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = [
    errorMessage ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="wf-form-field">
      {label && (
        <label htmlFor={id} className="wf-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`wf-textarea ${className}`}
        aria-invalid={errorMessage ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {errorMessage && (
        <span id={errorId} className="wf-input-error" role="alert">
          {errorMessage}
        </span>
      )}
      {!errorMessage && helperText && (
        <span id={helperId} className="wf-input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
}
