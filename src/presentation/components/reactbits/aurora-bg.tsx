"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface AuroraBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean; // Default: true (subtle vignette mask)
  intensity?: "subtle" | "vibrant"; // Default: "subtle"
  speed?: "slow" | "normal"; // Default: "slow" (60s loop)
}

export function AuroraBackground({
  children,
  showRadialGradient = true,
  intensity = "subtle",
  speed = "slow",
  className,
  style,
  ...restProps
}: AuroraBackgroundProps) {
  const animationDuration = speed === "normal" ? "30s" : "60s";
  const blobOpacity = intensity === "vibrant" ? 0.65 : 0.45;

  return (
    <div
      className={`aurora-bg-container wf-aurora-bg ${className ?? ""}`.trim()}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--background, #090d16)",
        ...style,
      }}
      {...restProps}
    >
      <style>{`
        @keyframes aurora-drift {
          0% {
            background-position: 0% 50%, 50% 50%, 100% 50%;
          }
          50% {
            background-position: 100% 50%, 0% 50%, 50% 100%;
          }
          100% {
            background-position: 0% 50%, 50% 50%, 100% 50%;
          }
        }
        .wf-aurora-blobs {
          position: absolute;
          inset: -50%;
          filter: blur(60px);
          background-image:
            radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 40%, rgba(168, 85, 247, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%);
          background-size: 200% 200%;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .wf-aurora-blobs {
            animation: none;
            background-position: 50% 50%;
            opacity: 0.25;
          }
        }
      `}</style>
      <div
        className="aurora-blob-layer wf-aurora-blobs"
        aria-hidden="true"
        style={{
          opacity: blobOpacity,
          animation: `aurora-drift ${animationDuration} ease-in-out infinite alternate`,
        }}
      />
      {showRadialGradient && (
        <div
          className="aurora-vignette"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, transparent 35%, var(--background, #090d16) 85%)",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
