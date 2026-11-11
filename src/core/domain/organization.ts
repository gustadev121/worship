import { ValidationError } from "./errors";

export type OrganizationRole = "owner" | "admin" | "member";
export type InvitationStatus = "pending" | "accepted" | "rejected" | "canceled";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
  metadata: string | null;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  expiresAt: string;
  inviterId: string;
  createdAt: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createOrganizationName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > 100
  ) {
    throw new ValidationError(
      "El nombre de la organización debe tener entre 1 y 100 caracteres",
    );
  }
  return value.trim();
}

export function createOrganizationSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("El slug debe ser una cadena de texto");
  }
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length < 2 || normalized.length > 64) {
    throw new ValidationError(
      "El slug de la organización debe tener entre 2 y 64 caracteres",
    );
  }
  if (!SLUG_PATTERN.test(normalized)) {
    throw new ValidationError(
      "El slug debe contener únicamente letras minúsculas, números y guiones",
    );
  }
  return normalized;
}

export function createOrganizationRole(value: unknown): OrganizationRole {
  if (value === "owner" || value === "admin" || value === "member") {
    return value;
  }
  throw new ValidationError(
    'El rol de organización debe ser "owner", "admin" o "member"',
  );
}

export function createInvitationStatus(value: unknown): InvitationStatus {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "canceled"
  ) {
    return value;
  }
  throw new ValidationError(
    'El estado de invitación debe ser "pending", "accepted", "rejected" o "canceled"',
  );
}

export function createOrganization(input: {
  id: unknown;
  name: unknown;
  slug?: unknown;
  logo?: unknown;
  createdAt?: unknown;
  metadata?: unknown;
}): Organization {
  if (typeof input.id !== "string" || input.id.trim().length === 0) {
    throw new ValidationError("El ID de la organización es requerido");
  }
  const name = createOrganizationName(input.name);
  const slug =
    input.slug === undefined
      ? createOrganizationSlug(name)
      : createOrganizationSlug(input.slug);
  const logo = typeof input.logo === "string" ? input.logo.trim() : null;
  const createdAt =
    typeof input.createdAt === "string" && input.createdAt.length > 0
      ? input.createdAt
      : new Date().toISOString();
  const metadata = typeof input.metadata === "string" ? input.metadata : null;

  return {
    id: input.id.trim(),
    name,
    slug,
    logo,
    createdAt,
    metadata,
  };
}

export function createOrganizationMember(input: {
  id: unknown;
  organizationId: unknown;
  userId: unknown;
  role?: unknown;
  createdAt?: unknown;
}): OrganizationMember {
  if (typeof input.id !== "string" || input.id.trim().length === 0) {
    throw new ValidationError("El ID del miembro es requerido");
  }
  if (
    typeof input.organizationId !== "string" ||
    input.organizationId.trim().length === 0
  ) {
    throw new ValidationError("El ID de la organización es requerido");
  }
  if (typeof input.userId !== "string" || input.userId.trim().length === 0) {
    throw new ValidationError("El ID de usuario es requerido");
  }
  const role =
    input.role === undefined ? "member" : createOrganizationRole(input.role);
  const createdAt =
    typeof input.createdAt === "string" && input.createdAt.length > 0
      ? input.createdAt
      : new Date().toISOString();

  return {
    id: input.id.trim(),
    organizationId: input.organizationId.trim(),
    userId: input.userId.trim(),
    role,
    createdAt,
  };
}

export function createOrganizationInvitation(input: {
  id: unknown;
  organizationId: unknown;
  email: unknown;
  role?: unknown;
  status?: unknown;
  expiresAt: unknown;
  inviterId: unknown;
  createdAt?: unknown;
}): OrganizationInvitation {
  if (typeof input.id !== "string" || input.id.trim().length === 0) {
    throw new ValidationError("El ID de invitación es requerido");
  }
  if (
    typeof input.organizationId !== "string" ||
    input.organizationId.trim().length === 0
  ) {
    throw new ValidationError("El ID de la organización es requerido");
  }
  if (
    typeof input.email !== "string" ||
    input.email.length > 254 ||
    !EMAIL_PATTERN.test(input.email)
  ) {
    throw new ValidationError("Correo electrónico de invitación inválido");
  }
  if (
    typeof input.expiresAt !== "string" ||
    input.expiresAt.trim().length === 0
  ) {
    throw new ValidationError("La fecha de expiración es requerida");
  }
  if (
    typeof input.inviterId !== "string" ||
    input.inviterId.trim().length === 0
  ) {
    throw new ValidationError("El ID del invitador es requerido");
  }

  const role =
    input.role === undefined ? "member" : createOrganizationRole(input.role);
  const status =
    input.status === undefined
      ? "pending"
      : createInvitationStatus(input.status);
  const createdAt =
    typeof input.createdAt === "string" && input.createdAt.length > 0
      ? input.createdAt
      : new Date().toISOString();

  return {
    id: input.id.trim(),
    organizationId: input.organizationId.trim(),
    email: input.email.toLowerCase().trim(),
    role,
    status,
    expiresAt: input.expiresAt,
    inviterId: input.inviterId.trim(),
    createdAt,
  };
}
