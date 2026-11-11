"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  findActiveSection,
  type RehearsalSection,
} from "@/core/domain/rehearsal-sync";

export interface SyncPlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState?: () => number;
}

export interface UsePlaybackSyncOptions {
  sections: RehearsalSection[];
  playerRef: React.RefObject<SyncPlayer | null>;
  pollIntervalMs?: number; // Default: 250ms
  userOverrideBufferMs?: number; // Default: 3000ms
  initialAutoFollow?: boolean; // Default: true
  loop?: { a: number; b: number | null };
}

export interface UsePlaybackSyncReturn {
  currentTime: number;
  activeSection: RehearsalSection | null;
  activeSectionLabel: string | null;
  autoFollow: boolean;
  setAutoFollow: React.Dispatch<React.SetStateAction<boolean>>;
  isUserOverriding: boolean;
  notifyUserGesture: () => void;
  seekToSection: (sectionOrLabel: RehearsalSection | string) => void;
}

export function usePlaybackSync({
  sections,
  playerRef,
  pollIntervalMs = 250,
  userOverrideBufferMs = 3000,
  initialAutoFollow = true,
  loop = { a: 0, b: null },
}: UsePlaybackSyncOptions): UsePlaybackSyncReturn {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<RehearsalSection | null>(
    null,
  );
  const [autoFollow, setAutoFollow] = useState<boolean>(initialAutoFollow);
  const [isUserOverriding, setIsUserOverriding] = useState<boolean>(false);

  const loopRef = useRef(loop);
  loopRef.current = loop;

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const userOverrideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Notify when the user touches/scrolls the sheet manually
  const notifyUserGesture = useCallback(() => {
    setIsUserOverriding(true);
    if (userOverrideTimeoutRef.current) {
      clearTimeout(userOverrideTimeoutRef.current);
    }
    userOverrideTimeoutRef.current = setTimeout(() => {
      setIsUserOverriding(false);
    }, userOverrideBufferMs);
  }, [userOverrideBufferMs]);

  // Clean up override timer on unmount
  useEffect(() => {
    return () => {
      if (userOverrideTimeoutRef.current) {
        clearTimeout(userOverrideTimeoutRef.current);
      }
    };
  }, []);

  // Main playback polling & looping loop
  useEffect(() => {
    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      try {
        const time = player.getCurrentTime();
        if (typeof time !== "number" || Number.isNaN(time)) return;

        // Check A-B loop boundaries
        const currentLoop = loopRef.current;
        if (currentLoop.b !== null && time >= currentLoop.b) {
          player.seekTo(currentLoop.a, true);
          setCurrentTime(currentLoop.a);
          const loopedActive = findActiveSection(
            sectionsRef.current,
            currentLoop.a,
          );
          setActiveSection(loopedActive);
          return;
        }

        setCurrentTime(time);
        const resolved = findActiveSection(sectionsRef.current, time);
        setActiveSection((prev) => {
          if (prev?.label === resolved?.label) {
            return prev;
          }
          return resolved;
        });
      } catch {
        // Player not ready or iframe detached
      }
    }, pollIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [playerRef, pollIntervalMs]);

  // Programmatic seek to a section
  const seekToSection = useCallback(
    (sectionOrLabel: RehearsalSection | string) => {
      const targetLabel =
        typeof sectionOrLabel === "string"
          ? sectionOrLabel
          : sectionOrLabel.label;
      const matched = sectionsRef.current.find(
        (s) => s.label.toLowerCase() === targetLabel.toLowerCase(),
      );

      if (matched && playerRef.current) {
        try {
          playerRef.current.seekTo(matched.startSeconds, true);
          setCurrentTime(matched.startSeconds);
          setActiveSection(matched);
          // Seeking programmatically resets user override so auto-follow immediately centers
          setIsUserOverriding(false);
          if (userOverrideTimeoutRef.current) {
            clearTimeout(userOverrideTimeoutRef.current);
          }
        } catch {
          // Ignore seek errors
        }
      }
    },
    [playerRef],
  );

  return {
    currentTime,
    activeSection,
    activeSectionLabel: activeSection?.label ?? null,
    autoFollow,
    setAutoFollow,
    isUserOverriding,
    notifyUserGesture,
    seekToSection,
  };
}
