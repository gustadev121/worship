"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Modal } from "@/presentation/components/ui/modal";

export interface AdminLabel {
  id: string;
  name: string;
  slug: string;
  colorHex: string;
  createdAt?: string;
}

// 8 stage-friendly curated preset colors
const PRESET_SWATCHES = [
  { hex: "#6366F1", name: "Índigo" },
  { hex: "#8B5CF6", name: "Púrpura" },
  { hex: "#EC4899", name: "Rosa" },
  { hex: "#EF4444", name: "Carmesí" },
  { hex: "#F59E0B", name: "Ámbar" },
  { hex: "#10B981", name: "Esmeralda" },
  { hex: "#06B6D4", name: "Cian" },
  { hex: "#3B82F6", name: "Azul" },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function LabelAdmin({ initial }: { initial: AdminLabel[] }) {
  const router = useRouter();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColorHex, setCreateColorHex] = useState("#6366F1");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal state
  const [editingLabel, setEditingLabel] = useState<AdminLabel | null>(null);
  const [editName, setEditName] = useState("");
  const [editColorHex, setEditColorHex] = useState("#6366F1");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation state
  const [deletingLabel, setDeletingLabel] = useState<AdminLabel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered labels
  const filteredLabels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initial;
    return initial.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q),
    );
  }, [initial, searchQuery]);

  // Open Edit modal
  function openEditModal(label: AdminLabel) {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColorHex(label.colorHex);
    setEditError(null);
  }

  // Submit Create
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const trimmedName = createName.trim();
    if (!trimmedName) {
      setCreateError("El nombre de la etiqueta es obligatorio");
      return;
    }

    const hex = createColorHex.trim().toUpperCase();
    if (!HEX_REGEX.test(hex)) {
      setCreateError('El color debe tener formato hexadecimal como "#4F46E5"');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, colorHex: hex }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setCreateError(data?.error ?? "Error al crear etiqueta");
        setIsCreating(false);
        return;
      }

      setCreateName("");
      setCreateColorHex("#6366F1");
      setIsCreateModalOpen(false);
      setIsCreating(false);
      router.refresh();
    } catch {
      setCreateError("Error de conexión al crear etiqueta");
      setIsCreating(false);
    }
  }

  // Submit Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLabel) return;
    setEditError(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("El nombre de la etiqueta es obligatorio");
      return;
    }

    const hex = editColorHex.trim().toUpperCase();
    if (!HEX_REGEX.test(hex)) {
      setEditError('El color debe tener formato hexadecimal como "#4F46E5"');
      return;
    }

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/labels/${editingLabel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, colorHex: hex }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setEditError(data?.error ?? "Error al actualizar etiqueta");
        setIsSavingEdit(false);
        return;
      }

      setEditingLabel(null);
      setIsSavingEdit(false);
      router.refresh();
    } catch {
      setEditError("Error de conexión al actualizar etiqueta");
      setIsSavingEdit(false);
    }
  }

  // Submit Delete
  async function handleConfirmDelete() {
    if (!deletingLabel) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/labels/${deletingLabel.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDeleteError(data?.error ?? "Error al eliminar etiqueta");
        setIsDeleting(false);
        return;
      }

      setDeletingLabel(null);
      setIsDeleting(false);
      router.refresh();
    } catch {
      setDeleteError("Error de conexión al eliminar etiqueta");
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Filter and Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: "1 1 260px", maxWidth: "380px" }}>
          <Input
            placeholder="Buscar por nombre o slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar etiquetas"
          />
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
        >
          + Nueva Etiqueta
        </Button>
      </div>

      {/* Label Management Data Table */}
      <div className="wf-table-container">
        <table className="wf-table">
          <thead>
            <tr>
              <th className="wf-th">Etiqueta</th>
              <th className="wf-th">Identificador (Slug)</th>
              <th className="wf-th">Color Hex</th>
              <th className="wf-th">Vista Previa</th>
              <th className="wf-th" style={{ textAlign: "right" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLabels.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="wf-td"
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  No se encontraron etiquetas registradas.
                </td>
              </tr>
            ) : (
              filteredLabels.map((label) => (
                <tr key={label.id} className="wf-tr">
                  {/* Name */}
                  <td className="wf-td" style={{ fontWeight: 600 }}>
                    {label.name}
                  </td>

                  {/* Slug */}
                  <td
                    className="wf-td"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {label.slug}
                  </td>

                  {/* Hex swatch & code */}
                  <td className="wf-td">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: label.colorHex,
                          border: "1px solid rgba(0,0,0,0.2)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {label.colorHex}
                      </span>
                    </div>
                  </td>

                  {/* Rendered Badge Preview */}
                  <td className="wf-td">
                    <Badge
                      variant="custom"
                      customColorHex={label.colorHex}
                      size="sm"
                    >
                      {label.name}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="wf-td" style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(label)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingLabel(label);
                        }}
                        aria-label={`Eliminar etiqueta ${label.name}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE LABEL MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Etiqueta de Repertorio"
        description="Agrega una etiqueta taxonómica para clasificar las canciones del ministerio."
      >
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {createError && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid var(--destructive)",
                color: "var(--destructive)",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 0.8rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              {createError}
            </div>
          )}

          <Input
            label="Nombre de la Etiqueta *"
            placeholder="ej. Alabanza, Adoración, Navidad, Comunión..."
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
            maxLength={100}
          />

          {/* Hex Color Swatch Picker */}
          <div className="wf-form-field">
            <span className="wf-label">Paleta de Colores Escénicos</span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              {PRESET_SWATCHES.map((swatch) => {
                const isSelected =
                  createColorHex.toUpperCase() === swatch.hex.toUpperCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setCreateColorHex(swatch.hex)}
                    title={`${swatch.name} (${swatch.hex})`}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: swatch.hex,
                      border: isSelected
                        ? "3px solid var(--foreground)"
                        : "1px solid rgba(0,0,0,0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                      transition: "transform 0.1s ease",
                      boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Código Hexadecimal *"
            placeholder="#6366F1"
            value={createColorHex}
            onChange={(e) => setCreateColorHex(e.target.value)}
            maxLength={7}
            helperText='Ingresa un código hexadecimal como "#6366F1" o elige un color arriba.'
          />

          {/* Live Preview Pill */}
          <div
            style={{
              padding: "0.875rem",
              backgroundColor: "var(--muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
              }}
            >
              Previsualización:
            </span>
            <Badge
              variant="custom"
              customColorHex={
                HEX_REGEX.test(createColorHex) ? createColorHex : "#6366F1"
              }
              size="md"
            >
              {createName.trim() || "Etiqueta de Prueba"}
            </Badge>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Crear Etiqueta
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT LABEL MODAL */}
      {editingLabel && (
        <Modal
          isOpen={true}
          onClose={() => setEditingLabel(null)}
          title={`Editar Etiqueta: ${editingLabel.name}`}
          description="Actualiza el nombre o color asignado a esta etiqueta."
        >
          <form
            onSubmit={handleSaveEdit}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {editError && (
              <div
                role="alert"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--destructive)",
                  color: "var(--destructive)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.6rem 0.8rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                {editError}
              </div>
            )}

            <Input
              label="Nombre de la Etiqueta *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              maxLength={100}
            />

            {/* Hex Color Swatch Picker */}
            <div className="wf-form-field">
              <span className="wf-label">Paleta de Colores Escénicos</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                {PRESET_SWATCHES.map((swatch) => {
                  const isSelected =
                    editColorHex.toUpperCase() === swatch.hex.toUpperCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setEditColorHex(swatch.hex)}
                      title={`${swatch.name} (${swatch.hex})`}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: swatch.hex,
                        border: isSelected
                          ? "3px solid var(--foreground)"
                          : "1px solid rgba(0,0,0,0.2)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.1s ease",
                        boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            color: "#ffffff",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Código Hexadecimal *"
              value={editColorHex}
              onChange={(e) => setEditColorHex(e.target.value)}
              maxLength={7}
            />

            {/* Live Preview Pill */}
            <div
              style={{
                padding: "0.875rem",
                backgroundColor: "var(--muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                }}
              >
                Previsualización:
              </span>
              <Badge
                variant="custom"
                customColorHex={
                  HEX_REGEX.test(editColorHex) ? editColorHex : "#6366F1"
                }
                size="md"
              >
                {editName.trim() || "Etiqueta"}
              </Badge>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingLabel(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isSavingEdit}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingLabel && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingLabel(null)}
          title="Confirmar Eliminación de Etiqueta"
          description={`¿Estás seguro de que deseas eliminar la etiqueta "${deletingLabel.name}"?`}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {deleteError && (
              <div
                role="alert"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--destructive)",
                  color: "var(--destructive)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.6rem 0.8rem",
                  fontSize: "0.8125rem",
                }}
              >
                {deleteError}
              </div>
            )}

            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
              }}
            >
              Quitar esta etiqueta no eliminará las canciones asociadas a ella.
              Simplemente se desvinculará del catálogo taxonómico.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingLabel(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Eliminar Etiqueta
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
