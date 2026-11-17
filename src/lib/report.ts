import type { IpssRow } from "@/db/schema";
import {
  EVENING_FROM,
  IPSS_QOL_OPTIONS,
  IPSS_QUESTIONS,
  SYMPTOMS,
  URGENCY_EPISODE_MIN,
  ipssCategory,
  ipssSubscores,
} from "./constants";
import type { Profile } from "./dal";
import { fmt, pct, type DayStat, type Summary } from "./stats";
import { ageOn, formatDay } from "./time";

export const REPORT_TITLE = "RINGKASAN PEMANTAUAN GENITOURINARIA";

export type ReportRow = [label: string, value: string];
export type ReportSection = { title: string; rows: ReportRow[]; note?: string };

export type Report = {
  identity: ReportRow[];
  sections: ReportSection[];
  ipss: IpssRow[];
  days: DayStat[];
  definitions: string[];
};

function range(min: number | null, max: number | null, unit: string): string {
  return min == null || max == null ? "" : ` (rentang ${fmt(min)}–${fmt(max)}${unit})`;
}

export function buildReport(input: {
  profile: Profile;
  from: string;
  to: string;
  today: string;
  days: DayStat[];
  summary: Summary;
  /** Hasil IPSS yang ditampilkan: dalam periode, atau hasil terakhir bila periode kosong. */
  ipss: IpssRow[];
}): Report {
  const { profile, from, to, today, days, summary: s, ipss } = input;

  const identity: ReportRow[] = [
    ["Nama", profile.name],
    [
      "Tanggal lahir / usia",
      profile.birthDate
        ? `${formatDay(profile.birthDate, "long").replace(/^[^,]+, /, "")} / ${ageOn(profile.birthDate, today)} tahun`
        : "–",
    ],
    ["Jenis kelamin", profile.sex === "L" ? "Laki-laki" : profile.sex === "P" ? "Perempuan" : "–"],
    ["Periode", `${formatDay(from, "medium")} s.d. ${formatDay(to, "medium")} (${s.periodDays} hari)`],
    ["Dibuat", formatDay(today, "medium")],
  ];

  const sections: ReportSection[] = [];

  if (profile.medicalHistory || profile.medications) {
    sections.push({
      title: "Riwayat dan obat",
      rows: [
        ["Riwayat / diagnosis", profile.medicalHistory || "–"],
        ["Obat rutin", profile.medications || "–"],
      ],
    });
  }

  sections.push({
    title: "Catatan berkemih",
    note:
      s.voidDays === 0
        ? "Tidak ada catatan BAK pada periode ini."
        : `Rata-rata dihitung dari ${s.voidDays} hari yang memiliki catatan BAK.`,
    rows: [
      ["Hari dengan catatan", `${s.voidDays} dari ${s.periodDays} hari`],
      ["Total BAK tercatat", `${fmt(s.totalVoids)} kali`],
      ["Frekuensi per 24 jam", `${fmt(s.avgVoids, "decimal")} kali${range(s.minVoids, s.maxVoids, "")}`],
      ["Frekuensi siang", `${fmt(s.avgDayVoids, "decimal")} kali/hari`],
      ["Nokturia", `${fmt(s.avgNightVoids, "decimal")} kali/malam`],
      [
        "Volume per BAK",
        `${fmt(s.avgVoidVolume)} ml${range(s.minVoidVolume, s.maxVoidVolume, " ml")}; ${fmt(s.measuredCount)} dari ${fmt(s.totalVoids)} BAK diukur`,
      ],
      ["Volume BAK terbesar", `${fmt(s.maxVoidVolume)} ml`],
      [
        "Keluaran urin per 24 jam",
        s.avgOutput == null
          ? "– (tidak ada hari dengan semua BAK terukur)"
          : `${fmt(s.avgOutput)} ml (dari ${s.measuredDays} hari terukur lengkap)`,
      ],
      ["Porsi volume malam", s.nightVolumeShare == null ? "–" : pct(s.nightVolumeShare)],
      [`Episode urgensi (skala ≥ ${URGENCY_EPISODE_MIN})`, `${fmt(s.urgencyEpisodes)} kali`],
      ["Episode bocor / inkontinensia", `${fmt(s.leakEpisodes)} kali`],
    ],
  });

  sections.push({
    title: "Gejala saat berkemih",
    note: "Jumlah catatan BAK yang disertai gejala.",
    rows: SYMPTOMS.map((symptom) => [
      symptom.label,
      `${fmt(s.symptoms[symptom.key])} dari ${fmt(s.totalVoids)} BAK`,
    ]),
  });

  sections.push({
    title: "Asupan cairan",
    note:
      s.intakeDays === 0
        ? "Tidak ada catatan minum pada periode ini."
        : `Rata-rata dihitung dari ${s.intakeDays} hari yang memiliki catatan minum.`,
    rows: [
      ["Asupan per 24 jam", `${fmt(s.avgIntake)} ml (target ${fmt(profile.fluidTargetMl)} ml)`],
      [`Asupan setelah pukul ${EVENING_FROM}`, `${fmt(s.avgEvening)} ml/hari`],
      ["Minuman berkafein", `${fmt(s.avgCaffeine)} ml/hari`],
      ["Alkohol", `${fmt(s.avgAlcohol)} ml/hari`],
      ["Jenis minuman", s.byKind.map((k) => `${k.label} ${pct(k.share)}`).join(", ") || "–"],
    ],
  });

  return {
    identity,
    sections,
    ipss,
    days: days.filter((d) => d.voids > 0 || d.intakeCount > 0),
    definitions: [
      "Nokturia: BAK yang ditandai pasien sebagai terbangun dari tidur.",
      "Skala urgensi 0–4: 0 tidak ada, 1 ringan, 2 sedang, 3 kuat, 4 tidak tertahan.",
      "Porsi volume malam: volume BAK nokturia dibagi total volume, hanya dari hari yang semua BAK-nya diukur. Bukan indeks poliuria nokturnal baku karena BAK pertama pagi hari tidak dihitung.",
      "IPSS: 0–7 ringan, 8–19 sedang, 20–35 berat. QoL 0 (senang sekali) sampai 6 (buruk sekali).",
      "Data dicatat sendiri oleh pasien dan belum diverifikasi tenaga kesehatan.",
    ],
  };
}

export function ipssLine(e: IpssRow): string {
  const sub = ipssSubscores(e);
  const items = IPSS_QUESTIONS.map((q) => `${q.short} ${e[q.key]}`).join(", ");
  return (
    `${formatDay(e.takenOn, "medium")}: total ${e.total}/35 (${ipssCategory(e.total)}), ` +
    `QoL ${e.qol}/6 (${IPSS_QOL_OPTIONS[e.qol]}), penyimpanan ${sub.storage}/15, pengosongan ${sub.voiding}/20. ` +
    `Rincian: ${items}.`
  );
}

/** Versi teks polos untuk disalin ke pesan atau rekam medis. */
export function reportToText(report: Report): string {
  const lines: string[] = [REPORT_TITLE, ""];
  for (const [label, value] of report.identity) lines.push(`${label}: ${value}`);

  for (const section of report.sections) {
    lines.push("", section.title.toUpperCase());
    for (const [label, value] of section.rows) lines.push(`- ${label}: ${value}`);
    if (section.note) lines.push(`(${section.note})`);
  }

  lines.push("", "IPSS");
  if (report.ipss.length === 0) lines.push("- Belum ada pengisian IPSS.");
  for (const e of report.ipss) lines.push(`- ${ipssLine(e)}`);

  if (report.days.length > 0) {
    lines.push("", "REKAP HARIAN");
    for (const d of report.days) {
      lines.push(
        `- ${formatDay(d.day, "short")}: BAK ${d.voids} (malam ${d.nightVoids}), ` +
          `urin ${fmt(d.voidVolume)} ml (${d.measuredVoids}/${d.voids} diukur), ` +
          `minum ${fmt(d.intakeVolume)} ml, urgensi ${d.urgencyEpisodes}, bocor ${d.leakEpisodes}`,
      );
    }
  }

  lines.push("", "KETERANGAN");
  for (const definition of report.definitions) lines.push(`- ${definition}`);
  return lines.join("\n");
}
