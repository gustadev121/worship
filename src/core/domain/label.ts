import { ValidationError } from "./errors";

export interface Label {
  id: string;
  name: string;
  slug: string;
  colorHex: string;
}

export function createLabelName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 100
  ) {
    throw new ValidationError(
      "El nombre de la etiqueta debe tener 1-100 caracteres",
    );
  }
  return value.trim();
}

export function createSlug(name: unknown): string {
  if (typeof name !== "string") {
    throw new ValidationError("El nombre de la etiqueta debe ser un texto");
  }
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length === 0) {
    throw new ValidationError(
      "El nombre de la etiqueta debe contener al menos una letra o un dígito",
    );
  }
  return slug;
}

export function createColorHex(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new ValidationError('El color debe ser hexadecimal como "#4F46E5"');
  }
  return value;
}

export function createLabel(input: {
  id: unknown;
  name: unknown;
  slug?: unknown;
  colorHex: unknown;
}): Label {
  if (typeof input.id !== "string" || input.id.length === 0) {
    throw new ValidationError("El id de la etiqueta es requerido");
  }
  const name = createLabelName(input.name);
  return {
    id: input.id,
    name,
    slug: input.slug === undefined ? createSlug(name) : createSlug(input.slug),
    colorHex: createColorHex(input.colorHex),
  };
}
