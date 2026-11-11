"use client";

import type { ChordProSheet } from "@/core/domain/chordpro";

export interface ChordSheetProps {
  sheet: ChordProSheet;
  fontSizeRem?: number;
  className?: string;
  onSectionClick?: (sectionTitle: string) => void;
  activeSectionTitle?: string | null;
  onUserScroll?: () => void;
}

export function ChordSheet({
  sheet,
  fontSizeRem = 1.125,
  className = "",
  onSectionClick,
  activeSectionTitle,
  onUserScroll,
}: ChordSheetProps) {
  if (!sheet || sheet.sections.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay acordes o letras disponibles para esta canción.
      </div>
    );
  }

  return (
    <div
      className={`chord-sheet-container select-text text-foreground space-y-8 p-4 sm:p-6 ${className}`}
      style={{
        fontSize: `${fontSizeRem}rem`,
      }}
      onWheel={onUserScroll}
      onTouchMove={onUserScroll}
    >
      {sheet.sections.map((section) => {
        const isActive =
          activeSectionTitle?.toLowerCase() === section.title.toLowerCase();

        return (
          <section
            key={section.sectionId}
            id={`section-${section.sectionId}`}
            data-section-title={section.title}
            data-active-section={isActive ? "true" : undefined}
            aria-current={isActive ? "step" : undefined}
            className={`chord-section rounded-xl p-4 sm:p-5 transition-all duration-300 border ${
              isActive
                ? "bg-card/95 border-[var(--chord-accent)] shadow-lg shadow-[var(--chord-accent)]/15 ring-2 ring-[var(--chord-accent)]/80"
                : "bg-card/40 border-border/40 hover:border-border"
            }`}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => onSectionClick?.(section.title)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-[var(--chord-accent)] text-stone-950 font-bold shadow-xs"
                    : "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30"
                }`}
              >
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse"
                    aria-hidden="true"
                  />
                )}
                <span>{section.title}</span>
                {section.timestampSeconds !== undefined ? (
                  <span className="opacity-75 font-mono text-[10px]">
                    {Math.floor(section.timestampSeconds / 60)}:
                    {String(Math.floor(section.timestampSeconds % 60)).padStart(
                      2,
                      "0",
                    )}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Section Lines */}
            <div className="space-y-4">
              {section.lines.map((line) => {
                const hasAnyChord = line.pairs.some((p) => p.chord !== null);
                const isEmptyLine =
                  line.pairs.length === 1 &&
                  line.pairs[0].lyrics === "" &&
                  !line.pairs[0].chord;

                if (isEmptyLine) {
                  return <div key={line.lineNumber} className="h-4" />;
                }

                return (
                  <div
                    key={line.lineNumber}
                    className="chord-line flex flex-wrap items-end gap-y-2 leading-tight"
                  >
                    {line.pairs.map((pair, idx) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: pairs are positional tokens within an immutable chord line
                        key={`${line.lineNumber}-${idx}`}
                        className="chord-pair inline-flex flex-col vertical-bottom min-w-fit"
                      >
                        {hasAnyChord ? (
                          pair.chord ? (
                            <span
                              className="chord-pill font-mono font-bold select-none text-[0.875em] text-[var(--chord-accent)] pb-0.5 leading-none tracking-tight"
                              style={{
                                color: "var(--chord-accent, #fbbf24)",
                                textShadow: "0 0 12px rgba(251, 191, 36, 0.4)",
                              }}
                            >
                              {pair.chord}
                            </span>
                          ) : (
                            <span
                              className="h-[1.1em] select-none invisible pointer-events-none"
                              aria-hidden="true"
                            >
                              &nbsp;
                            </span>
                          )
                        ) : null}
                        <span className="chord-lyric text-foreground whitespace-pre text-[1em]">
                          {pair.lyrics || (pair.chord ? " " : "")}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
