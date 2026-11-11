"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAutoScrollOptions {
  initialSpeed?: number; // Pixels per second (range: 10 to 80, default: 28)
  pauseDurationMs?: number; // Touch/wheel pause duration, default: 3000ms
}

export interface UseAutoScrollReturn {
  isScrolling: boolean;
  isTemporarilyPaused: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  startScrolling: () => void;
  stopScrolling: () => void;
  toggleScrolling: () => void;
  resetToTop: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useAutoScroll(
  options: UseAutoScrollOptions = {},
): UseAutoScrollReturn {
  const { initialSpeed = 28, pauseDurationMs = 3000 } = options;

  const [isScrolling, setIsScrolling] = useState(false);
  const [isTemporarilyPaused, setIsTemporarilyPaused] = useState(false);
  const [speed, setSpeedState] = useState(initialSpeed);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatedScrollRef = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(isScrolling);
  const isTemporarilyPausedRef = useRef(isTemporarilyPaused);
  const speedRef = useRef(speed);

  isScrollingRef.current = isScrolling;
  isTemporarilyPausedRef.current = isTemporarilyPaused;
  speedRef.current = speed;

  const setSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(10, Math.min(80, newSpeed));
    setSpeedState(clamped);
    speedRef.current = clamped;
  }, []);

  const stopScrolling = useCallback(() => {
    setIsScrolling(false);
    setIsTemporarilyPaused(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    lastTimeRef.current = null;
    accumulatedScrollRef.current = 0;
  }, []);

  const startScrolling = useCallback(() => {
    setIsScrolling(true);
    setIsTemporarilyPaused(false);
    lastTimeRef.current = null;
    accumulatedScrollRef.current = 0;
  }, []);

  const toggleScrolling = useCallback(() => {
    if (isScrollingRef.current) {
      stopScrolling();
    } else {
      startScrolling();
    }
  }, [startScrolling, stopScrolling]);

  const resetToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Main requestAnimationFrame loop
  useEffect(() => {
    if (!isScrolling) return;

    function step(timestamp: number) {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const container = scrollContainerRef.current;
      if (
        container &&
        isScrollingRef.current &&
        !isTemporarilyPausedRef.current
      ) {
        accumulatedScrollRef.current += speedRef.current * deltaTime;

        if (accumulatedScrollRef.current >= 1) {
          const pixelsToScroll = Math.floor(accumulatedScrollRef.current);
          container.scrollTop += pixelsToScroll;
          accumulatedScrollRef.current -= pixelsToScroll;

          // Check if bottom reached
          const isAtBottom =
            container.scrollTop + container.clientHeight >=
            container.scrollHeight - 2;
          if (isAtBottom) {
            stopScrolling();
            return;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    }

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isScrolling, stopScrolling]);

  // Handle user touch / wheel interaction to trigger temporary pause
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function handleUserInteraction() {
      if (!isScrollingRef.current) return;

      setIsTemporarilyPaused(true);
      isTemporarilyPausedRef.current = true;

      if (pauseTimerRef.current !== null) {
        clearTimeout(pauseTimerRef.current);
      }

      pauseTimerRef.current = setTimeout(() => {
        setIsTemporarilyPaused(false);
        isTemporarilyPausedRef.current = false;
        lastTimeRef.current = null;
      }, pauseDurationMs);
    }

    container.addEventListener("wheel", handleUserInteraction, {
      passive: true,
    });
    container.addEventListener("touchstart", handleUserInteraction, {
      passive: true,
    });

    return () => {
      container.removeEventListener("wheel", handleUserInteraction);
      container.removeEventListener("touchstart", handleUserInteraction);
      if (pauseTimerRef.current !== null) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [pauseDurationMs]);

  return {
    isScrolling,
    isTemporarilyPaused,
    speed,
    setSpeed,
    startScrolling,
    stopScrolling,
    toggleScrolling,
    resetToTop,
    scrollContainerRef,
  };
}
