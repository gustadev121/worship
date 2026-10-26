"use client";

import { useEffect, useRef, useState } from "react";

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

export function RehearsalPlayer({
  youtubeVideoId,
  sections,
  lyricsAndChords,
  practiceKey,
  viewerRole,
}: {
  youtubeVideoId: string | null;
  sections: RehearsalSection[];
  lyricsAndChords: string;
  practiceKey: string | null;
  viewerRole: ViewerRole | null;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loopRef = useRef<{ a: number; b: number | null }>({ a: 0, b: null });
  const [loop, setLoop] = useState<{ a: number; b: number | null }>({
    a: 0,
    b: null,
  });
  const [speed, setSpeed] = useState(1);

  loopRef.current = loop;

  useEffect(() => {
    if (!youtubeVideoId) {
      return;
    }
    let cancelled = false;
    let player: YTPlayer | null = null;

    function create() {
      if (cancelled || !mountRef.current || !window.YT) {
        return;
      }
      player = new window.YT.Player(mountRef.current, {
        videoId: youtubeVideoId as string,
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

    const timer = setInterval(() => {
      const { a, b } = loopRef.current;
      const p = playerRef.current;
      if (b === null || !p) {
        return;
      }
      try {
        if (p.getCurrentTime() >= b) {
          p.seekTo(a, true);
        }
      } catch {
        // Player not ready yet; retry on next tick.
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(timer);
      try {
        player?.destroy();
      } catch {
        // Ignore teardown errors.
      }
      playerRef.current = null;
    };
  }, [youtubeVideoId]);

  if (!youtubeVideoId) {
    return <p>No rehearsal video attached to this song yet.</p>;
  }

  function setRate(rate: number) {
    setSpeed(rate);
    try {
      playerRef.current?.setPlaybackRate(rate);
    } catch {
      // Ignore until the player is ready.
    }
  }

  function seek(seconds: number) {
    try {
      playerRef.current?.seekTo(seconds, true);
    } catch {
      // Ignore until the player is ready.
    }
  }

  return (
    <section>
      <div ref={mountRef} />
      <div>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => setRate(s)}
          >
            {s}x
          </button>
        ))}
      </div>
      <div>
        {sections.map((s) => (
          <button
            key={`${s.label}-${s.startSeconds}`}
            type="button"
            onClick={() => seek(s.startSeconds)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div>
        <button
          type="button"
          onClick={() => {
            try {
              setLoop((prev) => ({
                ...prev,
                a: playerRef.current?.getCurrentTime() ?? 0,
              }));
            } catch {
              // Ignore.
            }
          }}
        >
          Set A ({loop.a.toFixed(1)}s)
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
              // Ignore.
            }
          }}
        >
          Set B ({loop.b === null ? "—" : `${loop.b.toFixed(1)}s`})
        </button>
        <button type="button" onClick={() => setLoop({ a: 0, b: null })}>
          Clear loop
        </button>
      </div>
      {practiceKey ? <p>Practice key: {practiceKey}</p> : null}
      {viewerRole ? (
        <p>
          Your part: {viewerRole.roleType}
          {viewerRole.harmonyOrPartNotes
            ? ` — ${viewerRole.harmonyOrPartNotes}`
            : ""}
        </p>
      ) : null}
      <pre>{lyricsAndChords}</pre>
    </section>
  );
}
