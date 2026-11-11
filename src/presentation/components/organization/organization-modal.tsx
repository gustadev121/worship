"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/infrastructure/auth/auth-client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";

export interface OrganizationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly defaultMode?: "create" | "invite";
  readonly activeOrganizationId?: string | null;
}

export function OrganizationModal({
  isOpen,
  onClose,
  defaultMode = "create",
  activeOrganizationId,
}: OrganizationModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "invite">(defaultMode);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === "") {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  }

  async function handleCreateOrg(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (res.error) {
        setError(res.error.message || "Error al crear la organización");
        return;
      }

      setSuccess("¡Organización creada con éxito!");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 700);
    } catch {
      setError("Error de red al crear la organización");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInviteMember(e: FormEvent) {
    e.preventDefault();
    if (!activeOrganizationId) {
      setError("No hay una organización activa seleccionada");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await authClient.organization.inviteMember({
        email: email.trim(),
        role,
        organizationId: activeOrganizationId,
      });

      if (res.error) {
        setError(res.error.message || "Error al enviar la invitación");
        return;
      }

      setSuccess(`Invitación enviada a ${email}`);
      setEmail("");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setError("Error de red al enviar la invitación");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? "Nueva Organización / Campus"
          : "Invitar Miembro al Equipo"
      }
    >
      <div className="space-y-4">
        {/* Mode Switcher Tabs */}
        <div className="flex rounded-lg bg-secondary/80 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
              mode === "create"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Crear Organización
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("invite");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
              mode === "invite"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invitar Miembro
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium"
          >
            {success}
          </div>
        )}

        {mode === "create" ? (
          <form onSubmit={handleCreateOrg} className="space-y-3.5">
            <div>
              <label
                htmlFor="org-name"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Nombre de la organización o campus
              </label>
              <Input
                id="org-name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Iglesia Central, Ministerio Juvenil"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="org-slug"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Identificador (slug único)
              </label>
              <Input
                id="org-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="ej. iglesia-central"
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Letras minúsculas, números y guiones.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Organización"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleInviteMember} className="space-y-3.5">
            <div>
              <label
                htmlFor="invite-email"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Correo electrónico del voluntario
              </label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voluntario@iglesia.org"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="invite-role"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Rol dentro del equipo
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member")}
                disabled={isLoading}
                className="w-full h-9 px-3 text-xs rounded-lg bg-secondary/80 border border-border/80 text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="member">Músico / Miembro del equipo</option>
                <option value="admin">Administrador del campus</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Invitación"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
