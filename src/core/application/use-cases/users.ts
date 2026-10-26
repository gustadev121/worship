import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../domain/errors";
import {
  createEmail,
  createUser,
  createUsername,
  createUserRole,
  updateUser,
} from "../../domain/user";
import { toUserDTO, type UserDTO } from "../dtos";
import type {
  IPasswordHasherPort,
  IUserRepository,
  SessionPayload,
} from "../ports";

function newId(): string {
  return crypto.randomUUID();
}

function requireAdmin(actor: SessionPayload): void {
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("ADMIN only");
  }
}

export class LoginUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasherPort,
  ) {}

  async execute(input: {
    identifier: string;
    password: string;
  }): Promise<{ user: UserDTO }> {
    const user = await this.users.findByUsernameOrEmail(input.identifier);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }
    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Invalid credentials");
    }
    return { user: toUserDTO(user) };
  }
}

export class ListUsers {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: {
    actor: SessionPayload;
  }): Promise<{ users: UserDTO[] }> {
    requireAdmin(input.actor);
    const list = await this.users.list();
    return { users: list.map(toUserDTO) };
  }
}

export class CreateUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasherPort,
  ) {}

  async execute(input: {
    actor: SessionPayload;
    username: string;
    email: string;
    password: string;
    role?: "ADMIN" | "MEMBER";
  }): Promise<{ user: UserDTO }> {
    requireAdmin(input.actor);
    const now = new Date().toISOString();
    const { hash } = await this.hasher.hash(input.password);
    const user = createUser({
      id: newId(),
      username: createUsername(input.username),
      email: createEmail(input.email),
      passwordHash: hash,
      role: input.role === undefined ? undefined : createUserRole(input.role),
      createdAt: now,
      updatedAt: now,
    });
    return { user: toUserDTO(await this.users.create(user)) };
  }
}

export class UpdateUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasherPort,
  ) {}

  async execute(input: {
    actor: SessionPayload;
    id: string;
    username?: string;
    email?: string;
    password?: string;
    role?: "ADMIN" | "MEMBER";
  }): Promise<{ user: UserDTO }> {
    requireAdmin(input.actor);
    const existing = await this.users.findById(input.id);
    if (!existing) {
      throw new NotFoundError("User not found");
    }
    const patched = updateUser(existing, {
      username: input.username,
      email: input.email,
      role: input.role,
    });
    if (input.password !== undefined) {
      const { hash } = await this.hasher.hash(input.password);
      patched.passwordHash = hash;
    }
    return { user: toUserDTO(await this.users.update(patched)) };
  }
}

export class DeleteUser {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { actor: SessionPayload; id: string }): Promise<void> {
    requireAdmin(input.actor);
    await this.users.delete(input.id);
  }
}
