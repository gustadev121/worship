"use client";

import {
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spotlightColor?: string; // Default: "var(--glow-spotlight)"
  spotlightSize?: number; // Default: 350 (radius in pixels)
  borderColor?: string; // Default: "var(--spotlight-border)"
  borderGlow?: boolean; // Default: true (illuminates card border gradient)
  as?: "div" | "article" | "section";
}

/**
 * Pure coordinate calculation relative to element bounding rectangle.
 */
export function calculateSpotlightCoordinates(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number },
): { x: number; y: number } {
  return {
    x: Math.round(clientX - rect.left),
    y: Math.round(clientY - rect.top),
  };
}

/**
 * Verifies whether dynamic spotlight cursor tracking should run.
 * Disabled for touchscreen devices (coarse pointer) and reduced motion preference.
 */
export function shouldEnableSpotlight(
  isReducedMotion: boolean,
  isCoarsePointer: boolean,
): boolean {
  return !isReducedMotion && !isCoarsePointer;
}

export function SpotlightCard({
  children,
  spotlightColor = "var(--glow-spotlight)",
  spotlightSize = 350,
  borderColor = "var(--spotlight-border)",
  borderGlow = true,
  as = "div",
  className,
  style,
  onMouseMove,
  ...restProps
}: SpotlightCardProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");

    setIsReducedMotion(motionQuery.matches);
    setIsCoarsePointer(pointerQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    const handlePointerChange = (e: MediaQueryListEvent) => {
      setIsCoarsePointer(e.matches);
    };

    motionQuery.addEventListener?.("change", handleMotionChange);
    pointerQuery.addEventListener?.("change", handlePointerChange);

    return () => {
      motionQuery.removeEventListener?.("change", handleMotionChange);
      pointerQuery.removeEventListener?.("change", handlePointerChange);
    };
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);

    if (!shouldEnableSpotlight(isReducedMotion, isCoarsePointer)) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = calculateSpotlightCoordinates(e.clientX, e.clientY, rect);

    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const Component = as;
  const effectiveBorderColor = borderGlow ? borderColor : "var(--border)";

  const inlineStyles: React.CSSProperties = {
    ...style,
    // Provide CSS custom properties for radial gradient shader
    ["--spotlight-color" as string]: spotlightColor,
    ["--spotlight-size" as string]: `${spotlightSize}px`,
    ["--spotlight-border" as string]: effectiveBorderColor,
  };

  const classes = ["spotlight-card", "wf-spotlight-card", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      className={classes}
      style={inlineStyles}
      onMouseMove={handleMouseMove}
      {...restProps}
    >
      {children}
    </Component>
  );
}
