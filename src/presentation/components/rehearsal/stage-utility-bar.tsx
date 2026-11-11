"use client";

export interface StageUtilityBarProps {
  // Transposition
  originalKey: string;
  currentKey: string;
  semitoneDelta: number;
  onStepDownKey: () => void;
  onStepUpKey: () => void;
  onResetKey: () => void;

  // Font Scaling
  fontSizeRem: number;
  onScaleDownFont: () => void;
  onScaleUpFont: () => void;

  // Auto Scroll
  isAutoScrolling: boolean;
  isTemporarilyPaused: boolean;
  autoScrollSpeed: number;
  onToggleAutoScroll: () => void;
  onSpeedChange: (speed: number) => void;
  onResetToTop: () => void;

  // Auto Follow Section
  autoFollowActive?: boolean;
  onToggleAutoFollow?: () => void;
  hasSections?: boolean;

  // Screen Wake Lock
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  onToggleWakeLock?: () => void;

  // Fullscreen Mode
  isFullscreen: boolean;
  onToggleFullscreen: () => void;

  className?: string;
}

export function StageUtilityBar({
  originalKey,
  currentKey,
  semitoneDelta,
  onStepDownKey,
  onStepUpKey,
  onResetKey,
  fontSizeRem,
  onScaleDownFont,
  onScaleUpFont,
  isAutoScrolling,
  isTemporarilyPaused,
  autoScrollSpeed,
  onToggleAutoScroll,
  onSpeedChange,
  onResetToTop,
  autoFollowActive = true,
  onToggleAutoFollow,
  hasSections = false,
  wakeLockActive,
  wakeLockSupported,
  onToggleWakeLock,
  isFullscreen,
  onToggleFullscreen,
  className = "",
}: StageUtilityBarProps) {
  const fontPercent = Math.round((fontSizeRem / 1.125) * 100);

  return (
    <div
      className={`stage-utility-bar sticky top-16 z-30 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xs p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${className}`}
    >
      {/* 1. Transposition Stepper */}
      <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/60">
        <span className="text-[11px] font-medium text-muted-foreground uppercase px-1 hidden sm:inline">
          Tono
        </span>
        <button
          type="button"
          onClick={onStepDownKey}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-card hover:bg-secondary text-foreground font-bold text-xs border border-border/70 active:scale-95 transition-all"
          title="Bajar medio tono (-1 semitono)"
          aria-label="Bajar medio tono"
        >
          -1
        </button>
        <button
          type="button"
          onClick={onResetKey}
          className="px-2 py-0.5 min-w-[3.5rem] text-center text-xs font-mono font-bold rounded-md bg-card border border-border/70 text-foreground hover:border-chord-accent transition-colors"
          title={`Tono original: ${originalKey}. Clic para restablecer.`}
        >
          <span className="text-chord-accent">{currentKey}</span>
          {semitoneDelta !== 0 ? (
            <span className="text-[10px] text-muted-foreground ml-1">
              ({semitoneDelta > 0 ? `+${semitoneDelta}` : semitoneDelta})
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onStepUpKey}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-card hover:bg-secondary text-foreground font-bold text-xs border border-border/70 active:scale-95 transition-all"
          title="Subir medio tono (+1 semitono)"
          aria-label="Subir medio tono"
        >
          +1
        </button>
      </div>

      {/* 2. Font Scaling Stepper */}
      <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1 border border-border/60">
        <button
          type="button"
          onClick={onScaleDownFont}
          disabled={fontSizeRem <= 0.875}
          className="h-7 px-2 inline-flex items-center justify-center rounded-md bg-card hover:bg-secondary disabled:opacity-40 text-foreground font-bold text-xs border border-border/70 active:scale-95 transition-all"
          title="Disminuir tamaño de letra"
          aria-label="Disminuir tamaño de letra"
        >
          A-
        </button>
        <span className="text-xs font-mono font-medium px-1.5 text-muted-foreground min-w-[2.5rem] text-center">
          {fontPercent}%
        </span>
        <button
          type="button"
          onClick={onScaleUpFont}
          disabled={fontSizeRem >= 1.75}
          className="h-7 px-2 inline-flex items-center justify-center rounded-md bg-card hover:bg-secondary disabled:opacity-40 text-foreground font-bold text-xs border border-border/70 active:scale-95 transition-all"
          title="Aumentar tamaño de letra"
          aria-label="Aumentar tamaño de letra"
        >
          A+
        </button>
      </div>

      {/* 3. Hands-Free Auto-Scroll Controls */}
      <div className="flex items-center gap-2 bg-secondary/60 rounded-lg p-1 border border-border/60">
        <button
          type="button"
          onClick={onToggleAutoScroll}
          className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md font-semibold text-xs border transition-all active:scale-95 ${
            isAutoScrolling
              ? isTemporarilyPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                : "bg-primary text-white border-primary shadow-xs"
              : "bg-card text-foreground hover:bg-secondary border-border/70"
          }`}
          title={
            isAutoScrolling
              ? isTemporarilyPaused
                ? "Scroll pausado por toque de usuario"
                : "Pausar auto-scroll"
              : "Iniciar auto-scroll manos libres"
          }
        >
          {isAutoScrolling ? (
            isTemporarilyPaused ? (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>Pausado</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                <span>Detener</span>
              </>
            )
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Auto-Scroll</span>
            </>
          )}
        </button>

        {isAutoScrolling ? (
          <div className="hidden sm:flex items-center gap-1.5 px-1">
            <span className="text-[10px] text-muted-foreground">Vel:</span>
            <input
              type="range"
              min="10"
              max="80"
              step="2"
              value={autoScrollSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-16 h-1.5 accent-primary cursor-pointer"
              aria-label="Velocidad de desplazamiento"
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={onResetToTop}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-card hover:bg-secondary text-foreground text-xs border border-border/70 transition-all active:scale-95"
          title="Ir al inicio de la canción"
          aria-label="Ir al inicio"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>

        {hasSections && onToggleAutoFollow ? (
          <button
            type="button"
            onClick={onToggleAutoFollow}
            className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
              autoFollowActive
                ? "bg-[var(--chord-accent)]/20 text-[var(--chord-accent)] border-[var(--chord-accent)]/50 shadow-xs"
                : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary"
            }`}
            title={
              autoFollowActive
                ? "Seguir sección activo: La pantalla acompaña la canción en vivo"
                : "Seguir sección inactivo: Clic para acompañar la sección en reproducción"
            }
            aria-pressed={autoFollowActive}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoFollowActive
                  ? "bg-[var(--chord-accent)] animate-pulse"
                  : "bg-muted-foreground"
              }`}
              aria-hidden="true"
            />
            <span>Seguir</span>
          </button>
        ) : null}
      </div>

      {/* 4. Screen Wake Lock & Fullscreen Indicators */}
      <div className="flex items-center gap-2">
        {/* Screen Wake Lock Button */}
        {wakeLockSupported ? (
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs font-medium border transition-colors ${
              wakeLockActive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
            }`}
            title={
              wakeLockActive
                ? "Wake Lock activo: La pantalla no se apagará"
                : "Wake Lock inactivo: Clic para evitar que la pantalla se apague"
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wakeLockActive
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="hidden md:inline">
              {wakeLockActive ? "Pantalla activa" : "Mantener pantalla"}
            </span>
          </button>
        ) : null}

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
            isFullscreen
              ? "bg-chord-accent text-stone-950 border-chord-accent font-bold shadow-xs"
              : "bg-card text-foreground hover:bg-secondary border-border/70"
          }`}
          title={
            isFullscreen
              ? "Salir de modo escenario pantalla completa (ESC)"
              : "Modo Escenario Pantalla Completa"
          }
        >
          {isFullscreen ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
              <span>Salir</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span>Escenario</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
