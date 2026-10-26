import { eq, or } from "drizzle-orm";
import type { IUserRepository } from "@/core/application/ports";
import { ConflictError } from "@/core/domain/errors";
import type { User } from "@/core/domain/user";
import type { Db } from "../db/client";
import { users } from "../db/schema";

interface UserRow {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role === "ADMIN" ? "ADMIN" : "MEMBER",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed|unique/i.test(message);
}

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    const lowered = identifier.toLowerCase();
    const rows = await this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, identifier),
          eq(users.email, identifier),
          eq(users.email, lowered),
        ),
      );
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async list(): Promise<User[]> {
    const rows = await this.db.select().from(users);
    return rows.map(toDomain);
  }

  async create(user: User): Promise<User> {
    try {
      await this.db.insert(users).values({
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Username or email already taken");
      }
      throw error;
    }
    return user;
  }

  async update(user: User): Promise<User> {
    try {
      await this.db
        .update(users)
        .set({
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          updatedAt: user.updatedAt,
        })
        .where(eq(users.id, user.id));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Username or email already taken");
      }
      throw error;
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
