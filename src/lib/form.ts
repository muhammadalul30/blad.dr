import { z } from "zod";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  ok?: boolean;
};

export function invalid(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"] };
}

/** Input angka opsional dari form: string kosong menjadi null. */
export function optionalInt(min: number, max: number, message: string) {
  return z.preprocess(
    (value) => (value === "" || value == null ? null : Number(value)),
    z.number({ error: message }).int(message).min(min, message).max(max, message).nullable(),
  );
}

export function requiredInt(min: number, max: number, message: string) {
  return z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number({ error: message }).int(message).min(min, message).max(max, message),
  );
}

export const checkbox = z.preprocess((value) => value === "on" || value === "true", z.boolean());

export const notes = z.string().trim().max(500, "Maksimal 500 karakter.").default("");
