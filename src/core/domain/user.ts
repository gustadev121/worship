import { ValidationError } from "./errors";

export type UserRole = "ADMIN" | "MEMBER";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createUsername(value: unknown): string {
  if (typeof value !== "string" || !USERNAME_PATTERN.test(value)) {
    throw new ValidationError(
      "El usuario debe tener 3-32 caracteres: minúsculas, dígitos, ., _, -",
    );
  }
  return value;
}

export function createEmail(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !EMAIL_PATTERN.test(value)
  ) {
    throw new ValidationError("Correo electrónico inválido");
  }
  return value.toLowerCase();
}

export function createPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new ValidationError("La contraseña debe tener 8-128 caracteres");
  }
  return value;
}

export function createUserRole(value: unknown): UserRole {
  if (value !== "ADMIN" && value !== "MEMBER") {
    throw new ValidationError('El rol debe ser "ADMIN" o "MEMBER"');
  }
  return value;
}

export function createUser(input: {
  id: unknown;
  username: unknown;
  email: unknown;
  passwordHash: unknown;
  role?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}): User {
  if (typeof input.id !== "string" || input.id.length === 0) {
    throw new ValidationError("El id del usuario es requerido");
  }
  if (
    typeof input.passwordHash !== "string" ||
    input.passwordHash.length === 0
  ) {
    throw new ValidationError("El passwordHash es requerido");
  }
  const now = new Date().toISOString();
  return {
    id: input.id,
    username: createUsername(input.username),
    email: createEmail(input.email),
    passwordHash: input.passwordHash,
    role: input.role === undefined ? "MEMBER" : createUserRole(input.role),
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now,
  };
}

export function updateUser(
  user: User,
  patch: { username?: unknown; email?: unknown; role?: unknown },
): User {
  return {
    ...user,
    username:
      patch.username === undefined
        ? user.username
        : createUsername(patch.username),
    email: patch.email === undefined ? user.email : createEmail(patch.email),
    role: patch.role === undefined ? user.role : createUserRole(patch.role),
    updatedAt: new Date().toISOString(),
  };
}
