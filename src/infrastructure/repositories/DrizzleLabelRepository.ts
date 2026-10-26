import { eq } from "drizzle-orm";
import type { ILabelRepository } from "@/core/application/ports";
import { ConflictError } from "@/core/domain/errors";
import type { Label } from "@/core/domain/label";
import type { Db } from "../db/client";
import { labels, songLabels } from "../db/schema";

function toDomain(row: {
  id: string;
  name: string;
  slug: string;
  colorHex: string;
}): Label {
  return { id: row.id, name: row.name, slug: row.slug, colorHex: row.colorHex };
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed|unique/i.test(message);
}

export class DrizzleLabelRepository implements ILabelRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<Label[]> {
    const rows = await this.db.select().from(labels);
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Label | null> {
    const rows = await this.db.select().from(labels).where(eq(labels.id, id));
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Label | null> {
    const rows = await this.db
      .select()
      .from(labels)
      .where(eq(labels.slug, slug));
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async create(label: Label): Promise<Label> {
    try {
      await this.db.insert(labels).values(label);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Label slug already taken");
      }
      throw error;
    }
    return label;
  }

  async update(label: Label): Promise<Label> {
    try {
      await this.db
        .update(labels)
        .set({ name: label.name, slug: label.slug, colorHex: label.colorHex })
        .where(eq(labels.id, label.id));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Label slug already taken");
      }
      throw error;
    }
    return label;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(labels).where(eq(labels.id, id));
  }

  async setSongLabels(songId: string, labelIds: string[]): Promise<void> {
    await this.db.delete(songLabels).where(eq(songLabels.songId, songId));
    const uniqueIds = [...new Set(labelIds)];
    for (const labelId of uniqueIds) {
      await this.db.insert(songLabels).values({ songId, labelId });
    }
  }

  async getSongLabelIds(songId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(songLabels)
      .where(eq(songLabels.songId, songId));
    return rows.map((row) => row.labelId);
  }
}
