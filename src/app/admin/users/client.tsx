"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Modal } from "@/presentation/components/ui/modal";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

type SortField = "username" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

function SortIndicator({
  field,
  currentField,
  direction,
}: {
  field: string;
  currentField: string;
  direction: "asc" | "desc";
}) {
  if (field !== currentField) return null;
  return (
    <svg
      className={`w-3 h-3 inline-block ml-1 text-primary transition-transform ${
        direction === "desc" ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function UserAdmin({
  initial,
  currentUserId,
}: {
  initial: AdminUser[];
  currentUserId?: string;
}) {
  const router = useRouter();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("username");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("MEMBER");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("MEMBER");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const roleFilterSelectId = useId();
  const editRoleSelectId = useId();
  const createRoleSelectId = useId();

  // Handle column sort
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return initial
      .filter((u) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query);
        const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
        return matchesQuery && matchesRole;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? "";
        let valB = b[sortField] ?? "";

        if (sortField === "createdAt") {
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [initial, searchQuery, roleFilter, sortField, sortDirection]);

  // Open Edit User modal
  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    setEditError(null);
  }

  // Submit Create User
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: createUsername.trim().toLowerCase(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setCreateError(data?.error ?? "Error al crear usuario");
        setIsCreating(false);
        return;
      }

      setCreateUsername("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("MEMBER");
      setIsCreateModalOpen(false);
      setIsCreating(false);
      router.refresh();
    } catch {
      setCreateError("Error de conexión al crear usuario");
      setIsCreating(false);
    }
  }

  // Submit Edit User
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setIsSavingEdit(true);

    try {
      const payload: Record<string, unknown> = {
        email: editEmail.trim(),
        role: editRole,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setEditError(data?.error ?? "Error al actualizar usuario");
        setIsSavingEdit(false);
        return;
      }

      setEditingUser(null);
      setIsSavingEdit(false);
      router.refresh();
    } catch {
      setEditError("Error de conexión al actualizar usuario");
      setIsSavingEdit(false);
    }
  }

  // Submit Delete User
  async function handleConfirmDelete() {
    if (!deletingUser) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDeleteError(data?.error ?? "Error al eliminar usuario");
        setIsDeleting(false);
        return;
      }

      setDeletingUser(null);
      setIsDeleting(false);
      router.refresh();
    } catch {
      setDeleteError("Error de conexión al eliminar usuario");
      setIsDeleting(false);
    }
  }

  function getInitials(name: string): string {
    return name.slice(0, 2).toUpperCase();
  }

  function formatDate(isoString?: string): string {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flex: "1 1 320px",
            flexWrap: "wrap",
          }}
        >
          {/* Search Input */}
          <div style={{ flex: "1 1 200px" }}>
            <Input
              placeholder="Buscar por usuario o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </div>

          {/* Role Filter Select */}
          <div style={{ width: "160px" }}>
            <select
              id={roleFilterSelectId}
              className="wf-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filtrar por rol"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Solo ADMIN</option>
              <option value="MEMBER">Solo MEMBER</option>
            </select>
          </div>
        </div>

        {/* Create User CTA */}
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
        >
          + Invitar / Crear Usuario
        </Button>
      </div>

      {/* Users Data Table */}
      <div className="wf-table-container">
        <table className="wf-table">
          <thead>
            <tr>
              <th
                className="wf-th"
                onClick={() => handleSort("username")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Usuario
                <SortIndicator
                  field="username"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </th>
              <th
                className="wf-th"
                onClick={() => handleSort("email")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Correo Electrónico
                <SortIndicator
                  field="email"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </th>
              <th
                className="wf-th"
                onClick={() => handleSort("role")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Rol
                <SortIndicator
                  field="role"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </th>
              <th
                className="wf-th"
                onClick={() => handleSort("createdAt")}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Creado
                <SortIndicator
                  field="createdAt"
                  currentField={sortField}
                  direction={sortDirection}
                />
              </th>
              <th className="wf-th" style={{ textAlign: "right" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
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
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = currentUserId === user.id;

                return (
                  <tr key={user.id} className="wf-tr">
                    {/* User Avatar + Username */}
                    <td className="wf-td">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor:
                              user.role === "ADMIN"
                                ? "var(--role-admin-bg)"
                                : "var(--role-member-bg)",
                            color:
                              user.role === "ADMIN"
                                ? "var(--role-admin)"
                                : "var(--role-member)",
                            border: `1px solid ${
                              user.role === "ADMIN"
                                ? "var(--role-admin-border)"
                                : "var(--role-member-border)"
                            }`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {getInitials(user.username)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--foreground)",
                            }}
                          >
                            {user.username}
                          </div>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              (Tú)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td
                      className="wf-td"
                      style={{ color: "var(--foreground)" }}
                    >
                      {user.email}
                    </td>

                    {/* Role Badge */}
                    <td className="wf-td">
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "roleAdmin" : "roleMember"
                        }
                        size="sm"
                      >
                        {user.role}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td
                      className="wf-td"
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {formatDate(user.createdAt)}
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
                          onClick={() => openEditModal(user)}
                        >
                          Editar
                        </Button>
                        {!isSelf && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingUser(user);
                            }}
                            aria-label={`Eliminar a ${user.username}`}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        description="Ingresa los datos para registrar a un miembro del ministerio."
      >
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
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
            label="Nombre de Usuario *"
            placeholder="ej. juan.perez"
            value={createUsername}
            onChange={(e) => setCreateUsername(e.target.value)}
            required
            helperText="3-32 caracteres en minúsculas, dígitos, . o -"
          />

          <Input
            label="Correo Electrónico *"
            type="email"
            placeholder="juan@ejemplo.com"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña *"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
            helperText="Mínimo 8 caracteres"
          />

          <div className="wf-form-field">
            <label htmlFor={createRoleSelectId} className="wf-label">
              Rol de Usuario
            </label>
            <select
              id={createRoleSelectId}
              className="wf-input"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
            >
              <option value="MEMBER">MEMBER (Músico / Voluntario)</option>
              <option value="ADMIN">ADMIN (Administrador)</option>
            </select>
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
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Editar Usuario: ${editingUser.username}`}
          description="Modifica los datos de acceso o el rol asignado en la plataforma."
        >
          <form
            onSubmit={handleSaveEdit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
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
              label="Correo Electrónico *"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />

            <div className="wf-form-field">
              <label htmlFor={editRoleSelectId} className="wf-label">
                Rol de Usuario
              </label>
              <select
                id={editRoleSelectId}
                className="wf-input"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="MEMBER">MEMBER (Músico / Voluntario)</option>
                <option value="ADMIN">ADMIN (Administrador)</option>
              </select>
            </div>

            {/* Role Elevation Guard Warning */}
            {editRole === "ADMIN" && editingUser.role !== "ADMIN" && (
              <div
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  border: "1px solid var(--role-admin-border)",
                  color: "var(--role-admin)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.45,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5"
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
                <div>
                  <strong>Aviso de elevación de rol:</strong> Al asignar el rol
                  ADMIN, este usuario tendrá control total para gestionar el
                  repertorio, usuarios y configuraciones de la plataforma.
                </div>
              </div>
            )}

            <Input
              label="Nueva Contraseña (Opcional)"
              type="password"
              placeholder="Dejar en blanco para mantener la actual"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              helperText="Si no deseas cambiar la contraseña, deja este campo vacío."
            />

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
                onClick={() => setEditingUser(null)}
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
      {deletingUser && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingUser(null)}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar permanentemente a "${deletingUser.username}"?`}
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
              Esta acción no se puede deshacer. Se eliminarán todas las
              asignaciones de roles y votos asociados a esta cuenta.
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
                onClick={() => setDeletingUser(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Sí, Eliminar Usuario
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
