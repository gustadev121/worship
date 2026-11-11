"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseScreenWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

export function useScreenWakeLock(
  autoRequest = false,
): UseScreenWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef(autoRequest);

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  const request = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      setError("Screen Wake Lock no es soportado por este navegador.");
      return;
    }

    try {
      shouldBeActiveRef.current = true;
      setError(null);
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener("release", () => {
        sentinelRef.current = null;
        setIsActive(false);
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al solicitar Screen Wake Lock";
      setError(message);
      setIsActive(false);
    }
  }, []);

  const release = useCallback(async () => {
    shouldBeActiveRef.current = false;
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Ignore release errors
      }
      sentinelRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Automatic re-acquisition on document visibility change
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        shouldBeActiveRef.current &&
        !sentinelRef.current
      ) {
        await request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [request]);

  // Initial autoRequest trigger if enabled
  useEffect(() => {
    if (
      autoRequest &&
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator
    ) {
      request();
    }

    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [autoRequest, request]);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
  };
}
