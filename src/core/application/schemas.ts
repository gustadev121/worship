import { z } from "zod";
import { MUSICAL_KEYS } from "../domain/keys";
import { PRACTICE_STATUSES, ROLE_TYPES } from "../domain/role-assignment";

/** Zod mirrors of domain rules so HTTP input fails fast at the route boundary. */

export const usernameSchema = z
  .string()
  .regex(/^[a-z0-9._-]{3,32}$/, "Nombre de usuario inválido");
export const emailSchema = z
  .string()
  .email("Correo electrónico inválido")
  .max(254);
export const passwordSchema = z
  .string()
  .min(8, "Contraseña demasiado corta")
  .max(128);
export const userRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export const musicalKeySchema = z
  .string()
  .refine(
    (v) => (MUSICAL_KEYS as readonly string[]).includes(v),
    "Tonalidad musical inválida",
  );

export const bpmSchema = z.number().int().min(30).max(300);
export const timeSignatureSchema = z
  .string()
  .regex(/^\d{1,2}\/\d{1,2}$/, 'El compás debe tener el formato "4/4"');
export const youtubeInputSchema = z.string().min(1).max(500);

const finiteNumber = z
  .number()
  .refine(Number.isFinite, "Debe ser un número finito");

export const sectionTimestampSchema = z
  .object({
    label: z.string().min(1).max(100),
    startSeconds: finiteNumber.min(0),
    endSeconds: finiteNumber.optional(),
  })
  .refine((s) => s.endSeconds === undefined || s.endSeconds > s.startSeconds, {
    message: "endSeconds debe ser mayor que startSeconds",
    path: ["endSeconds"],
  });

export const roleTypeSchema = z.enum(ROLE_TYPES);
export const practiceStatusSchema = z.enum(PRACTICE_STATUSES);

export const colorHexSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal como "#4F46E5"');
export const slugInputSchema = z.string().min(1).max(100);

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.optional(),
});

export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  role: userRoleSchema.optional(),
});

export const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  originalKey: musicalKeySchema,
  practiceKey: musicalKeySchema.nullable().optional(),
  bpm: bpmSchema.optional(),
  timeSignature: timeSignatureSchema.nullable().optional(),
  lyricsAndChords: z.string().optional(),
  youtubeVideoId: youtubeInputSchema.nullable().optional(),
  sectionTimestamps: z.array(sectionTimestampSchema).optional(),
});

export const updateSongSchema = createSongSchema.partial();

export const assignRoleSchema = z.object({
  songId: z.string().min(1),
  userId: z.string().min(1),
  roleType: roleTypeSchema,
  instrumentName: z.string().min(2).max(50).nullish(),
  harmonyOrPartNotes: z.string().max(5000).nullish(),
  referenceTimestamps: z.array(sectionTimestampSchema).nullish(),
  practiceStatus: practiceStatusSchema.optional(),
});

export const updateRoleAssignmentSchema = z.object({
  harmonyOrPartNotes: z.string().max(5000).nullish(),
  referenceTimestamps: z.array(sectionTimestampSchema).nullish(),
  practiceStatus: practiceStatusSchema.optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugInputSchema.optional(),
  colorHex: colorHexSchema,
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: slugInputSchema.optional(),
  colorHex: colorHexSchema.optional(),
});

export const setSongLabelsSchema = z.object({
  labelIds: z.array(z.string().min(1)),
});

export const songFilterQuerySchema = z.object({
  q: z.string().optional(),
  labels: z.string().optional(),
  practiceKey: z.string().optional(),
  memberId: z.string().optional(),
  roleType: z.string().optional(),
});

export const youtubeSearchSchema = z.object({
  q: z.string().min(1),
});
