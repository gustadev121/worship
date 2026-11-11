import type { HTMLAttributes, ReactNode } from "react";

export type GlowColor = "indigo" | "amber" | "emerald" | "cyan";

export interface AnimatedGlowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: GlowColor;
  intensity?: "subtle" | "vibrant";
  isActive?: boolean;
  pulse?: boolean;
}

export function AnimatedGlow({
  children,
  glowColor = "indigo",
  intensity = "subtle",
  isActive = true,
  pulse = false,
  className = "",
  style,
  ...props
}: AnimatedGlowProps) {
  const classes = [
    "wf-glow",
    `wf-glow-${glowColor}`,
    isActive && "wf-glow-active",
    isActive && pulse && "wf-glow-pulse",
    intensity === "vibrant" && "wf-glow-vibrant",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
}
