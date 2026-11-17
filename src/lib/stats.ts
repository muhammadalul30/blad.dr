import type { IntakeRow, VoidRow } from "@/db/schema";
import { DRINKS, EVENING_FROM, SYMPTOMS, URGENCY_EPISODE_MIN, drinkLabel, type SymptomKey } from "./constants";
import { dayOf, timeOf } from "./time";

export type DayStat = {
  day: string;
  voids: number;
  dayVoids: number;
  nightVoids: number;
  /** Jumlah BAK yang volumenya diukur. */
  measuredVoids: number;
  voidVolume: number;
  nightVolume: number;
  maxVoid: number | null;
  urgencyEpisodes: number;
  leakEpisodes: number;
  intakeCount: number;
  intakeVolume: number;
};

export function buildDayStats(days: string[], voids: VoidRow[], intakes: IntakeRow[]): DayStat[] {
  const byDay = new Map<string, DayStat>(
    days.map((day) => [
      day,
      {
        day,
        voids: 0,
        dayVoids: 0,
        nightVoids: 0,
        measuredVoids: 0,
        voidVolume: 0,
        nightVolume: 0,
        maxVoid: null,
        urgencyEpisodes: 0,
        leakEpisodes: 0,
        intakeCount: 0,
        intakeVolume: 0,
      },
    ]),
  );

  for (const v of voids) {
    const stat = byDay.get(dayOf(v.occurredAt));
    if (!stat) continue;
    stat.voids += 1;
    if (v.wokeFromSleep) stat.nightVoids += 1;
    else stat.dayVoids += 1;
    if (v.volumeMl != null) {
      stat.measuredVoids += 1;
      stat.voidVolume += v.volumeMl;
      if (v.wokeFromSleep) stat.nightVolume += v.volumeMl;
      stat.maxVoid = Math.max(stat.maxVoid ?? 0, v.volumeMl);
    }
    if (v.urgency >= URGENCY_EPISODE_MIN) stat.urgencyEpisodes += 1;
    if (v.leakage > 0) stat.leakEpisodes += 1;
  }

  for (const i of intakes) {
    const stat = byDay.get(dayOf(i.occurredAt));
    if (!stat) continue;
    stat.intakeCount += 1;
    stat.intakeVolume += i.volumeMl;
  }

  return [...byDay.values()];
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const mean = (values: number[]) => (values.length ? sum(values) / values.length : null);

export type Summary = ReturnType<typeof summarize>;

/**
 * Rata-rata harian dihitung terhadap hari yang punya catatan, bukan seluruh
 * hari kalender dalam periode, agar hari tanpa catatan tidak menurunkan angka.
 */
export function summarize(dayStats: DayStat[], voids: VoidRow[], intakes: IntakeRow[]) {
  const voidDays = dayStats.filter((d) => d.voids > 0);
  const intakeDays = dayStats.filter((d) => d.intakeCount > 0);
  // Keluaran 24 jam hanya sahih bila semua BAK hari itu diukur.
  const measuredDays = voidDays.filter((d) => d.measuredVoids === d.voids);
  const volumes = voids.flatMap((v) => (v.volumeMl != null ? [v.volumeMl] : []));
  const measuredTotal = sum(measuredDays.map((d) => d.voidVolume));

  const symptoms = Object.fromEntries(
    SYMPTOMS.map((s) => [s.key, voids.filter((v) => v[s.key]).length]),
  ) as Record<SymptomKey, number>;

  const intakeTotal = sum(intakes.map((i) => i.volumeMl));
  const perIntakeDay = (rows: IntakeRow[]) =>
    intakeDays.length ? sum(rows.map((i) => i.volumeMl)) / intakeDays.length : null;

  const byKind = DRINKS.map((d) => {
    const volume = sum(intakes.filter((i) => i.kind === d.value).map((i) => i.volumeMl));
    return { kind: d.value, label: drinkLabel(d.value), volume, share: intakeTotal ? volume / intakeTotal : 0 };
  })
    .filter((k) => k.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  const kindsWhere = (flag: "caffeine" | "alcohol") =>
    new Set<string>(DRINKS.filter((d) => d[flag]).map((d) => d.value));
  const caffeine = kindsWhere("caffeine");
  const alcohol = kindsWhere("alcohol");

  return {
    periodDays: dayStats.length,
    voidDays: voidDays.length,
    intakeDays: intakeDays.length,
    measuredDays: measuredDays.length,

    totalVoids: voids.length,
    avgVoids: mean(voidDays.map((d) => d.voids)),
    minVoids: voidDays.length ? Math.min(...voidDays.map((d) => d.voids)) : null,
    maxVoids: voidDays.length ? Math.max(...voidDays.map((d) => d.voids)) : null,
    avgDayVoids: mean(voidDays.map((d) => d.dayVoids)),
    avgNightVoids: mean(voidDays.map((d) => d.nightVoids)),

    measuredCount: volumes.length,
    avgVoidVolume: mean(volumes),
    minVoidVolume: volumes.length ? Math.min(...volumes) : null,
    maxVoidVolume: volumes.length ? Math.max(...volumes) : null,
    avgOutput: mean(measuredDays.map((d) => d.voidVolume)),
    /** Porsi volume BAK saat terbangun malam terhadap total, pada hari yang terukur lengkap. */
    nightVolumeShare: measuredTotal ? sum(measuredDays.map((d) => d.nightVolume)) / measuredTotal : null,

    urgencyEpisodes: sum(dayStats.map((d) => d.urgencyEpisodes)),
    leakEpisodes: sum(dayStats.map((d) => d.leakEpisodes)),
    symptoms,

    avgIntake: mean(intakeDays.map((d) => d.intakeVolume)),
    avgCaffeine: perIntakeDay(intakes.filter((i) => caffeine.has(i.kind))),
    avgAlcohol: perIntakeDay(intakes.filter((i) => alcohol.has(i.kind))),
    avgEvening: perIntakeDay(intakes.filter((i) => timeOf(i.occurredAt) >= EVENING_FROM)),
    byKind,
  };
}

const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Angka untuk tampilan; null menjadi tanda pisah. */
export function fmt(value: number | null | undefined, kind: "int" | "decimal" = "int"): string {
  if (value == null || Number.isNaN(value)) return "–";
  return (kind === "int" ? integerFormat : numberFormat).format(value);
}

export function pct(value: number | null | undefined): string {
  return value == null ? "–" : `${integerFormat.format(value * 100)}%`;
}
