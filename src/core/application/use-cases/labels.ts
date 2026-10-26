import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../domain/errors";
import {
  createColorHex,
  createLabel,
  createLabelName,
  createSlug,
  type Label,
} from "../../domain/label";
import type { ILabelRepository, SessionPayload } from "../ports";

function newId(): string {
  return crypto.randomUUID();
}

function requireAdmin(actor: SessionPayload): void {
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("ADMIN only");
  }
}

export class ListLabels {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(): Promise<{ labels: Label[] }> {
    return { labels: await this.labels.list() };
  }
}

export class CreateLabel {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(input: {
    actor: SessionPayload;
    name: string;
    slug?: string;
    colorHex: string;
  }): Promise<{ label: Label }> {
    requireAdmin(input.actor);
    const name = createLabelName(input.name);
    const slug =
      input.slug === undefined ? createSlug(name) : createSlug(input.slug);
    if (await this.labels.findBySlug(slug)) {
      throw new ConflictError(`Label slug "${slug}" already exists`);
    }
    return {
      label: await this.labels.create(
        createLabel({
          id: newId(),
          name,
          slug,
          colorHex: createColorHex(input.colorHex),
        }),
      ),
    };
  }
}

export class UpdateLabel {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(input: {
    actor: SessionPayload;
    id: string;
    name?: string;
    slug?: string;
    colorHex?: string;
  }): Promise<{ label: Label }> {
    requireAdmin(input.actor);
    const existing = await this.labels.findById(input.id);
    if (!existing) {
      throw new NotFoundError("Label not found");
    }
    const name =
      input.name === undefined ? existing.name : createLabelName(input.name);
    const slug =
      input.slug === undefined
        ? input.name === undefined
          ? existing.slug
          : createSlug(name)
        : createSlug(input.slug);
    const clash = await this.labels.findBySlug(slug);
    if (clash && clash.id !== existing.id) {
      throw new ConflictError(`Label slug "${slug}" already exists`);
    }
    const colorHex =
      input.colorHex === undefined
        ? existing.colorHex
        : createColorHex(input.colorHex);
    return {
      label: await this.labels.update({ ...existing, name, slug, colorHex }),
    };
  }
}

export class DeleteLabel {
  constructor(private readonly labels: ILabelRepository) {}

  async execute(input: { actor: SessionPayload; id: string }): Promise<void> {
    requireAdmin(input.actor);
    await this.labels.delete(input.id);
  }
}
