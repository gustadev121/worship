"use client";

import { useMemo, useState } from "react";
import {
  convertTwoLineToChordPro,
  type TwoLineConversionResult,
} from "@/core/domain/chord-converter";
import type { SectionTimestamp } from "@/core/domain/song";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Modal } from "@/presentation/components/ui/modal";

export interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    chordProText: string;
    sectionTimestamps: SectionTimestamp[];
    detectedKey: string | null;
  }) => void;
  currentKey?: string;
}

export function SmartPasteModal({
  isOpen,
  onClose,
  onApply,
  currentKey,
}: SmartPasteModalProps) {
  const [rawText, setRawText] = useState("");

  const conversion: TwoLineConversionResult = useMemo(() => {
    if (!rawText.trim()) {
      return {
        chordProText: "",
        extractedTimestamps: [],
        detectedKey: null,
        lineCount: 0,
        chordsCount: 0,
        warnings: [],
      };
    }
    return convertTwoLineToChordPro(rawText);
  }, [rawText]);

  function handleApply() {
    if (!conversion.chordProText.trim()) return;

    onApply({
      chordProText: conversion.chordProText,
      sectionTimestamps: conversion.extractedTimestamps,
      detectedKey: conversion.detectedKey,
    });

    onClose();
  }

  function handlePasteExample() {
    const example = `[Intro]
G  D/F#  Em7  Cadd9

[Verso 1 - 0:35]
G                D/F#
En tu presencia hay plenitud
Em7              Cadd9
En tu mirada paz y quietud

[Coro - 1:15]
Cadd9            G
Aleluya al Rey eterno
D/F#             Em7
Santo es Tu gran nombre`;
    setRawText(example);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Paste: Conversor de Acordes Clásicos"
      description="Pega texto de páginas web (LaCuerda, Ultimate Guitar) con acordes sobre la letra. Se convertirán automáticamente a formato ChordPro."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteExample}
            >
              Pegar Ejemplo
            </Button>
            {rawText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRawText("")}
              >
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!conversion.chordProText.trim()}
              onClick={handleApply}
            >
              Aplicar al Editor
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Statistics & Insights Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {currentKey && (
            <Badge variant="outline" size="sm">
              Tono actual: {currentKey}
            </Badge>
          )}
          <Badge variant="outline" size="sm">
            Líneas: {conversion.lineCount}
          </Badge>
          <Badge
            variant={conversion.chordsCount > 0 ? "roleMember" : "outline"}
            size="sm"
          >
            Acordes detectados: {conversion.chordsCount}
          </Badge>
          {conversion.detectedKey && (
            <Badge variant="statusReady" size="sm">
              Tono sugerido: {conversion.detectedKey}
            </Badge>
          )}
          {conversion.extractedTimestamps.length > 0 && (
            <Badge variant="roleAdmin" size="sm">
              Secciones con tiempo: {conversion.extractedTimestamps.length}
            </Badge>
          )}
        </div>

        {/* Two-Pane Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Pane: Raw Text Input */}
          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="raw-chord-input"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Texto sin formato (Acordes arriba, letra abajo)
            </label>
            <textarea
              id="raw-chord-input"
              rows={14}
              placeholder={`G                D/F#\nEn tu presencia hay plenitud\nEm7              Cadd9\nEn tu mirada paz y quietud`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden resize-none h-[320px]"
            />
          </div>

          {/* Right Pane: Live ChordPro Preview */}
          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="converted-chordpro-preview"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between"
            >
              <span>Resultado ChordPro Generado</span>
              {conversion.chordProText && (
                <span className="text-[11px] text-chord-accent font-medium">
                  Listo para aplicar
                </span>
              )}
            </label>
            <textarea
              id="converted-chordpro-preview"
              readOnly
              rows={14}
              placeholder="El formato ChordPro con [Acordes] entre corchetes aparecerá aquí en tiempo real..."
              value={conversion.chordProText}
              className="w-full p-3 text-xs font-mono rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 resize-none h-[320px]"
            />
          </div>
        </div>

        {/* Extracted Timestamps Preview */}
        {conversion.extractedTimestamps.length > 0 && (
          <div className="p-2.5 rounded-lg border border-border bg-muted/40 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">
              Tiempos de ensayo extraídos:
            </span>
            {conversion.extractedTimestamps.map((ts) => (
              <span
                key={`${ts.label}-${ts.startSeconds}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-secondary text-foreground font-mono"
              >
                <span className="font-semibold">{ts.label}:</span>
                <span className="text-muted-foreground">
                  {Math.floor(ts.startSeconds / 60)}:
                  {(ts.startSeconds % 60).toString().padStart(2, "0")}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
