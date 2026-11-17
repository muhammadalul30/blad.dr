import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Waktu kejadian disimpan sebagai jam dinding lokal pengguna
// ("YYYY-MM-DDTHH:mm"), bukan UTC. Catatan harian dibaca per tanggal lokal,
// dan string ini terurut benar secara leksikografis.

/** Semua akun setara: tidak ada kolom peran dan tidak ada admin. */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    /** Disimpan huruf kecil. */
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    /** Ditanam di token sesi; diganti saat password berubah agar sesi lama gugur. */
    sessionKey: text("session_key").notNull(),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: integer("locked_until"),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    birthDate: text("birth_date"),
    sex: text("sex", { enum: ["L", "P"] }),
    fluidTargetMl: integer("fluid_target_ml").notNull().default(2000),
    sleepTime: text("sleep_time").notNull().default("22:00"),
    wakeTime: text("wake_time").notNull().default("05:00"),
    medicalHistory: text("medical_history").notNull().default(""),
    medications: text("medications").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const voids = sqliteTable(
  "voids",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    occurredAt: text("occurred_at").notNull(),
    volumeMl: integer("volume_ml"),
    /** 0–4, lihat URGENCY di lib/constants. */
    urgency: integer("urgency").notNull().default(0),
    /** 0–3, lihat LEAKAGE di lib/constants. */
    leakage: integer("leakage").notNull().default(0),
    wokeFromSleep: integer("woke_from_sleep", { mode: "boolean" }).notNull().default(false),
    /** 1–8, skala warna urin; null bila tidak diamati. */
    color: integer("color"),
    pain: integer("pain", { mode: "boolean" }).notNull().default(false),
    hematuria: integer("hematuria", { mode: "boolean" }).notNull().default(false),
    weakStream: integer("weak_stream", { mode: "boolean" }).notNull().default(false),
    straining: integer("straining", { mode: "boolean" }).notNull().default(false),
    intermittent: integer("intermittent", { mode: "boolean" }).notNull().default(false),
    incomplete: integer("incomplete", { mode: "boolean" }).notNull().default(false),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("voids_user_time_idx").on(t.userId, t.occurredAt)],
);

export const intakes = sqliteTable(
  "intakes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    occurredAt: text("occurred_at").notNull(),
    volumeMl: integer("volume_ml").notNull(),
    kind: text("kind").notNull().default("air"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("intakes_user_time_idx").on(t.userId, t.occurredAt)],
);

export const ipssEntries = sqliteTable(
  "ipss_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    takenOn: text("taken_on").notNull(),
    q1: integer("q1").notNull(),
    q2: integer("q2").notNull(),
    q3: integer("q3").notNull(),
    q4: integer("q4").notNull(),
    q5: integer("q5").notNull(),
    q6: integer("q6").notNull(),
    q7: integer("q7").notNull(),
    qol: integer("qol").notNull(),
    total: integer("total").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("ipss_user_date_idx").on(t.userId, t.takenOn)],
);

export type User = typeof users.$inferSelect;
export type VoidRow = typeof voids.$inferSelect;
export type IntakeRow = typeof intakes.$inferSelect;
export type IpssRow = typeof ipssEntries.$inferSelect;
