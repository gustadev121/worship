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
      className={`stage-utility-bar sticky top-16 z-30 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4 ${className}`}
    >
      {/* 1. Transposition Stepper */}
      <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/50">
        <span className="text-[11px] font-medium text-muted-foreground uppercase px-1 hidden sm:inline">
          Tono
        </span>
        <button
          type="button"
          onClick={onStepDownKey}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-card hover:bg-accent text-foreground font-bold text-sm border border-border shadow-xs active:scale-95 transition-all"
          title="Bajar medio tono (-1 semitono)"
          aria-label="Bajar medio tono"
        >
          -1
        </button>
        <button
          type="button"
          onClick={onResetKey}
          className="px-2 py-1 min-w-[3.5rem] text-center text-xs font-mono font-bold rounded-md bg-card border border-border/70 text-foreground hover:border-[var(--chord-accent)] transition-colors"
          title={`Tono original: ${originalKey}. Clic para restablecer.`}
        >
          <span className="text-[var(--chord-accent)]">{currentKey}</span>
          {semitoneDelta !== 0 ? (
            <span className="text-[10px] text-muted-foreground ml-1">
              ({semitoneDelta > 0 ? `+${semitoneDelta}` : semitoneDelta})
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onStepUpKey}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-card hover:bg-accent text-foreground font-bold text-sm border border-border shadow-xs active:scale-95 transition-all"
          title="Subir medio tono (+1 semitono)"
          aria-label="Subir medio tono"
        >
          +1
        </button>
      </div>

      {/* 2. Font Scaling Stepper */}
      <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1 border border-border/50">
        <button
          type="button"
          onClick={onScaleDownFont}
          disabled={fontSizeRem <= 0.875}
          className="h-8 px-2 inline-flex items-center justify-center rounded-md bg-card hover:bg-accent disabled:opacity-40 text-foreground font-bold text-xs border border-border active:scale-95 transition-all"
          title="Disminuir tamaño de letra"
          aria-label="Disminuir tamaño de letra"
        >
          A-
        </button>
        <span className="text-xs font-mono font-medium px-1.5 text-muted-foreground min-w-[2.75rem] text-center">
          {fontPercent}%
        </span>
        <button
          type="button"
          onClick={onScaleUpFont}
          disabled={fontSizeRem >= 1.75}
          className="h-8 px-2 inline-flex items-center justify-center rounded-md bg-card hover:bg-accent disabled:opacity-40 text-foreground font-bold text-xs border border-border active:scale-95 transition-all"
          title="Aumentar tamaño de letra"
          aria-label="Aumentar tamaño de letra"
        >
          A+
        </button>
      </div>

      {/* 3. Hands-Free Auto-Scroll Controls */}
      <div className="flex items-center gap-2 bg-secondary/60 rounded-lg p-1 border border-border/50">
        <button
          type="button"
          onClick={onToggleAutoScroll}
          className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-md font-semibold text-xs border transition-all active:scale-95 ${
            isAutoScrolling
              ? isTemporarilyPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                : "bg-primary text-white border-primary shadow-xs"
              : "bg-card text-foreground hover:bg-accent border-border"
          }`}
          title={
            isAutoScrolling
              ? isTemporarilyPaused
                ? "Scroll pausado por toque de usuario"
                : "Pausar auto-scroll"
              : "Iniciar auto-scroll manos libres"
          }
        >
          <span>
            {isAutoScrolling
              ? isTemporarilyPaused
                ? "⏸ En pausa"
                : "⏹ Detener"
              : "▶ Auto-Scroll"}
          </span>
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
          className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-card hover:bg-accent text-foreground text-xs border border-border transition-all active:scale-95"
          title="Ir al inicio de la canción"
          aria-label="Ir al inicio"
        >
          ↑
        </button>
      </div>

      {/* 4. Screen Wake Lock & Fullscreen Indicators */}
      <div className="flex items-center gap-2">
        {/* Screen Wake Lock Button */}
        {wakeLockSupported ? (
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs font-medium border transition-colors ${
              wakeLockActive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
            }`}
            title={
              wakeLockActive
                ? "Wake Lock activo: La pantalla no se apagará"
                : "Wake Lock inactivo: Clic para evitar que la pantalla se apague"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
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
          className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
            isFullscreen
              ? "bg-[var(--chord-accent)] text-stone-950 border-[var(--chord-accent)] font-bold shadow-xs"
              : "bg-card text-foreground hover:bg-accent border-border"
          }`}
          title={
            isFullscreen
              ? "Salir de modo escenario pantalla completa (ESC)"
              : "Modo Escenario Pantalla Completa"
          }
        >
          <span>{isFullscreen ? "✕ Salir" : "⛶ Escenario"}</span>
        </button>
      </div>
    </div>
  );
}
