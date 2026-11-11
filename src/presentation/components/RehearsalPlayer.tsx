"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateSemitoneDelta,
  parseChordPro,
  transposeChordSheet,
} from "@/core/domain/chordpro";
import { useAutoScroll } from "@/presentation/hooks/use-auto-scroll";
import { usePlaybackSync } from "@/presentation/hooks/use-playback-sync";
import { useScreenWakeLock } from "@/presentation/hooks/use-screen-wake-lock";
import { ChordSheet } from "./rehearsal/chord-sheet";
import { StageUtilityBar } from "./rehearsal/stage-utility-bar";

export interface RehearsalSection {
  label: string;
  startSeconds: number;
  endSeconds?: number;
}

export interface ViewerRole {
  roleType: string;
  harmonyOrPartNotes: string | null;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: { onReady?: (e: { target: YTPlayer }) => void };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  setPlaybackRate(rate: number): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  destroy(): void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25];

export interface RehearsalPlayerProps {
  songId?: string;
  songTitle?: string;
  songArtist?: string;
  youtubeVideoId: string | null;
  sections: RehearsalSection[];
  lyricsAndChords: string;
  originalKey?: string;
  practiceKey: string | null;
  viewerRole: ViewerRole | null;
}

export function RehearsalPlayer({
  songTitle = "Canción de Alabanza",
  songArtist = "Artista",
  youtubeVideoId,
  sections,
  lyricsAndChords,
  originalKey = "G",
  practiceKey,
  viewerRole,
}: RehearsalPlayerProps) {
  // Container & YouTube Player Refs
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  // Playback Loop & Speed State
  const loopRef = useRef<{ a: number; b: number | null }>({ a: 0, b: null });
  const [loop, setLoop] = useState<{ a: number; b: number | null }>({
    a: 0,
    b: null,
  });
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initial semitone delta
  const initialDelta = practiceKey
    ? calculateSemitoneDelta(originalKey, practiceKey)
    : 0;
  const [semitoneDelta, setSemitoneDelta] = useState<number>(initialDelta);
  const [fontSizeRem, setFontSizeRem] = useState<number>(1.125);

  // Screen Wake Lock & Auto Scroll Hooks
  const wakeLock = useScreenWakeLock(true);
  const autoScroll = useAutoScroll({ initialSpeed: 28 });

  // Real-time Playback Synchronization Hook
  const sync = usePlaybackSync({
    sections,
    playerRef,
    loop,
  });

  // Auto-follow: smoothly scroll to active section element when section transitions
  useEffect(() => {
    if (!sync.activeSectionLabel || !sync.autoFollow || sync.isUserOverriding) {
      return;
    }

    const container = autoScroll.scrollContainerRef.current;
    if (!container) return;

    const targetEl = container.querySelector<HTMLElement>(
      `[data-section-title="${CSS.escape(sync.activeSectionLabel)}"]`,
    );

    if (targetEl) {
      autoScroll.scrollToElement(targetEl);
    }
  }, [
    sync.activeSectionLabel,
    sync.autoFollow,
    sync.isUserOverriding,
    autoScroll.scrollToElement,
    autoScroll.scrollContainerRef,
  ]);

  // Parse and transpose ChordPro sheet
  const parsedSheet = useMemo(() => {
    return parseChordPro(lyricsAndChords, {
      title: songTitle,
      artist: songArtist,
      originalKey,
    });
  }, [lyricsAndChords, songTitle, songArtist, originalKey]);

  const transposedSheet = useMemo(() => {
    return transposeChordSheet(parsedSheet, semitoneDelta);
  }, [parsedSheet, semitoneDelta]);

  loopRef.current = loop;

  // Fullscreen change listener
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function toggleFullscreen() {
    const el = stageContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // Initialize YouTube Iframe API
  useEffect(() => {
    if (!youtubeVideoId) return;
    let cancelled = false;

    function create() {
      if (cancelled || !mountRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId: youtubeVideoId as string,
        playerVars: {
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
          },
        },
      });
    }

    if (window.YT) {
      create();
    } else {
      window.onYouTubeIframeAPIReady = create;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore teardown errors
      }
      playerRef.current = null;
    };
  }, [youtubeVideoId]);

  function setRate(rate: number) {
    setSpeed(rate);
    try {
      playerRef.current?.setPlaybackRate(rate);
    } catch {
      // Ignore
    }
  }

  return (
    <div
      ref={stageContainerRef}
      className={`rehearsal-studio-wrapper w-full transition-colors ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#090d16] text-[#f8fafc] overflow-y-auto p-4 sm:p-6"
          : "space-y-6"
      }`}
    >
      {/* Stage Utility Bar */}
      <StageUtilityBar
        originalKey={originalKey}
        currentKey={transposedSheet.currentKey}
        semitoneDelta={semitoneDelta}
        onStepDownKey={() => setSemitoneDelta((prev) => prev - 1)}
        onStepUpKey={() => setSemitoneDelta((prev) => prev + 1)}
        onResetKey={() => setSemitoneDelta(0)}
        fontSizeRem={fontSizeRem}
        onScaleDownFont={() =>
          setFontSizeRem((prev) => Math.max(0.875, prev - 0.125))
        }
        onScaleUpFont={() =>
          setFontSizeRem((prev) => Math.min(1.75, prev + 0.125))
        }
        isAutoScrolling={autoScroll.isScrolling}
        isTemporarilyPaused={autoScroll.isTemporarilyPaused}
        autoScrollSpeed={autoScroll.speed}
        onToggleAutoScroll={autoScroll.toggleScrolling}
        onSpeedChange={autoScroll.setSpeed}
        onResetToTop={autoScroll.resetToTop}
        autoFollowActive={sync.autoFollow}
        onToggleAutoFollow={() => sync.setAutoFollow((prev) => !prev)}
        hasSections={sections.length > 0}
        wakeLockActive={wakeLock.isActive}
        wakeLockSupported={wakeLock.isSupported}
        onToggleWakeLock={() => {
          if (wakeLock.isActive) {
            wakeLock.release();
          } else {
            wakeLock.request();
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Rehearsal Stage Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video & Media Practice Controls (hidden in full stage focus if desired) */}
        <div
          className={`${
            isFullscreen ? "hidden lg:block lg:col-span-4" : "lg:col-span-5"
          } space-y-4`}
        >
          {youtubeVideoId ? (
            <div className="rounded-xl overflow-hidden border border-border/80 bg-card shadow-md">
              <div className="aspect-video w-full bg-black relative">
                <div ref={mountRef} className="w-full h-full" />
              </div>

              {/* Speed Steppers */}
              <div className="p-3 bg-secondary/50 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Velocidad:
                </span>
                <div className="flex items-center gap-1">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={speed === s}
                      onClick={() => setRate(s)}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold border transition-all ${
                        speed === s
                          ? "bg-primary text-white border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* A-B Loop Controls */}
              <div className="p-3 bg-card border-t border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setLoop((prev) => ({
                          ...prev,
                          a: playerRef.current?.getCurrentTime() ?? 0,
                        }));
                      } catch {
                        // Ignore
                      }
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-secondary hover:bg-accent text-foreground border border-border font-medium"
                  >
                    Marcar A ({loop.a.toFixed(1)}s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setLoop((prev) => ({
                          ...prev,
                          b: playerRef.current?.getCurrentTime() ?? null,
                        }));
                      } catch {
                        // Ignore
                      }
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-secondary hover:bg-accent text-foreground border border-border font-medium"
                  >
                    Marcar B ({loop.b === null ? "—" : `${loop.b.toFixed(1)}s`})
                  </button>
                </div>

                {loop.b !== null ? (
                  <button
                    type="button"
                    onClick={() => setLoop({ a: 0, b: null })}
                    className="text-xs text-destructive hover:underline"
                  >
                    Limpiar Bucle
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
              No hay video de ensayo asignado para esta canción.
            </div>
          )}

          {/* Section Timestamps Navigator */}
          {sections && sections.length > 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Saltar a Sección
              </span>
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => {
                  const isActive = sync.activeSectionLabel === s.label;
                  return (
                    <button
                      key={`${s.label}-${s.startSeconds}`}
                      type="button"
                      onClick={() => sync.seekToSection(s.label)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-xs ring-2 ring-primary/40"
                          : "bg-secondary hover:bg-accent text-foreground border-border"
                      }`}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Viewer Assigned Role Note */}
          {viewerRole ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-1 text-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Tu Asignación
              </span>
              <p className="font-semibold text-foreground">
                {viewerRole.roleType}
              </p>
              {viewerRole.harmonyOrPartNotes ? (
                <p className="text-xs text-muted-foreground">
                  {viewerRole.harmonyOrPartNotes}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right Column: High-Contrast Syllable-Aligned Chord Sheet */}
        <div
          ref={autoScroll.scrollContainerRef}
          className={`${
            isFullscreen
              ? "lg:col-span-8 h-[calc(100vh-6rem)]"
              : "lg:col-span-7 max-h-[85vh]"
          } overflow-y-auto rounded-2xl border border-border bg-card/70 shadow-sm`}
        >
          <ChordSheet
            sheet={transposedSheet}
            fontSizeRem={fontSizeRem}
            activeSectionTitle={sync.activeSectionLabel}
            onUserScroll={sync.notifyUserGesture}
            onSectionClick={(title) => {
              sync.seekToSection(title);
            }}
          />
        </div>
      </div>
    </div>
  );
}
