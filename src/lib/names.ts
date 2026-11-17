import { z } from "zod";

/** Kunci login dari nama: tidak peka huruf besar/kecil dan spasi berlebih. */
export function loginKeyOf(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export const nameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Nama minimal 2 karakter.").max(100, "Maksimal 100 karakter."));
