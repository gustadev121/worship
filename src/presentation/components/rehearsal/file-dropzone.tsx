"use client";

import { type DragEvent, useRef, useState } from "react";
import {
  extractChordProMetadata,
  type ImportedSongMetadata,
} from "@/core/domain/chord-converter";

export interface FileDropzoneProps {
  onFileImported: (metadata: ImportedSongMetadata) => void;
  hasExistingContent?: boolean;
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500KB
const ACCEPTED_EXTENSIONS = [".chordpro", ".cho", ".pro", ".txt", ".chopro"];

export function FileDropzone({
  onFileImported,
  hasExistingContent = false,
  disabled = false,
  className = "",
}: FileDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function processFile(file: File) {
    setErrorMessage(null);
    setImportSummary(null);

    // Validate extension
    const nameLower = file.name.toLowerCase();
    const isAccepted = ACCEPTED_EXTENSIONS.some((ext) =>
      nameLower.endsWith(ext),
    );
    if (!isAccepted) {
      setErrorMessage(
        `Formato no soportado (${file.name}). Usa archivos .chordpro, .cho, .pro o .txt.`,
      );
      return;
    }

    // Validate size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("El archivo supera el límite máximo permitido de 500KB.");
      return;
    }

    // Overwrite confirmation
    if (hasExistingContent) {
      const confirmOverwrite = window.confirm(
        `¿Deseas reemplazar los datos del editor con el archivo "${file.name}"?`,
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== "string") {
          setErrorMessage("Error al leer el contenido del archivo.");
          return;
        }

        const metadata = extractChordProMetadata(content);
        onFileImported(metadata);

        // Feedback summary
        const extractedItems: string[] = [];
        if (metadata.title) extractedItems.push(`Título: "${metadata.title}"`);
        if (metadata.artist)
          extractedItems.push(`Artista: "${metadata.artist}"`);
        if (metadata.originalKey)
          extractedItems.push(`Tono: ${metadata.originalKey}`);
        if (metadata.bpm) extractedItems.push(`BPM: ${metadata.bpm}`);
        if (metadata.sectionTimestamps.length > 0) {
          extractedItems.push(`${metadata.sectionTimestamps.length} secciones`);
        }

        setImportSummary(
          `Archivo importado correctamente. ${
            extractedItems.length > 0
              ? `Datos detectados: ${extractedItems.join(", ")}.`
              : ""
          }`,
        );
      } catch {
        setErrorMessage("Ocurrió un error inesperado al procesar el archivo.");
      }
    };

    reader.onerror = () => {
      setErrorMessage("No se pudo leer el archivo seleccionado.");
    };

    reader.readAsText(file, "UTF-8");
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      processFile(files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      processFile(files[0]);
    }
    // Reset file input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <section
        aria-label="Zona para arrastrar archivos de acordes"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
          isDragging
            ? "border-primary bg-primary/10 shadow-xs"
            : "border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              Subir o arrastrar archivo de acordes
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Soporta archivos <code>.chordpro</code>, <code>.cho</code>,{" "}
              <code>.pro</code> o <code>.txt</code> (máx. 500KB)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          className="h-8 px-3 inline-flex items-center text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition-colors shrink-0 cursor-pointer"
        >
          Examinar archivo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".chordpro,.cho,.pro,.txt,.chopro"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Seleccionar archivo de acordes"
        />
      </section>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Summary Feedback */}
      {importSummary && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-xs text-primary flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{importSummary}</span>
        </div>
      )}
    </div>
  );
}
