export const URGENCY = [
  "Tidak ada desakan",
  "Ringan, bisa ditunda lama",
  "Sedang, bisa ditunda sebentar",
  "Kuat, harus segera ke toilet",
  "Tidak tertahan",
] as const;

/** Ambang "episode urgensi" pada statistik. */
export const URGENCY_EPISODE_MIN = 3;

export const LEAKAGE = ["Tidak bocor", "Beberapa tetes", "Membasahi pakaian dalam", "Membasahi pakaian luar"] as const;

export const URINE_COLORS = [
  { value: 1, hex: "#f7f3c2", label: "Sangat jernih" },
  { value: 2, hex: "#f3ea8f", label: "Kuning pucat" },
  { value: 3, hex: "#ecdc5f", label: "Kuning muda" },
  { value: 4, hex: "#e4c93a", label: "Kuning" },
  { value: 5, hex: "#d9b02a", label: "Kuning tua" },
  { value: 6, hex: "#c8921f", label: "Kuning kecokelatan" },
  { value: 7, hex: "#a8701c", label: "Cokelat muda" },
  { value: 8, hex: "#7c4a1a", label: "Cokelat tua" },
] as const;

export const SYMPTOMS = [
  { key: "pain", label: "Nyeri / perih saat BAK" },
  { key: "hematuria", label: "Urin kemerahan / berdarah" },
  { key: "weakStream", label: "Pancaran lemah" },
  { key: "straining", label: "Harus mengejan" },
  { key: "intermittent", label: "Aliran terputus-putus" },
  { key: "incomplete", label: "Terasa tidak tuntas" },
] as const;

export type SymptomKey = (typeof SYMPTOMS)[number]["key"];

export const DRINKS = [
  { value: "air", label: "Air putih", caffeine: false, alcohol: false },
  { value: "teh", label: "Teh", caffeine: true, alcohol: false },
  { value: "kopi", label: "Kopi", caffeine: true, alcohol: false },
  { value: "susu", label: "Susu", caffeine: false, alcohol: false },
  { value: "jus", label: "Jus / minuman manis", caffeine: false, alcohol: false },
  { value: "soda", label: "Minuman bersoda", caffeine: true, alcohol: false },
  { value: "kuah", label: "Kuah / sup", caffeine: false, alcohol: false },
  { value: "alkohol", label: "Alkohol", caffeine: false, alcohol: true },
  { value: "lain", label: "Lainnya", caffeine: false, alcohol: false },
] as const;

export const DRINK_VALUES = DRINKS.map((d) => d.value) as [string, ...string[]];

export function drinkLabel(kind: string): string {
  return DRINKS.find((d) => d.value === kind)?.label ?? kind;
}

/** Batas "asupan malam" pada ringkasan: mulai pukul ini sampai tengah malam. */
export const EVENING_FROM = "18:00";

export const IPSS_FREQUENCY_OPTIONS = [
  "Tidak pernah",
  "Kurang dari 1 dari 5 kali",
  "Kurang dari separuh waktu",
  "Sekitar separuh waktu",
  "Lebih dari separuh waktu",
  "Hampir selalu",
] as const;

export const IPSS_NOCTURIA_OPTIONS = [
  "Tidak pernah",
  "1 kali",
  "2 kali",
  "3 kali",
  "4 kali",
  "5 kali atau lebih",
] as const;

export const IPSS_QUESTIONS = [
  {
    key: "q1",
    short: "Tidak tuntas",
    domain: "voiding",
    text: "Seberapa sering Anda merasa kandung kemih belum kosong sepenuhnya setelah selesai berkemih?",
  },
  {
    key: "q2",
    short: "Frekuensi",
    domain: "storage",
    text: "Seberapa sering Anda harus berkemih lagi dalam waktu kurang dari 2 jam setelah selesai berkemih?",
  },
  {
    key: "q3",
    short: "Terputus-putus",
    domain: "voiding",
    text: "Seberapa sering aliran kencing berhenti lalu mulai lagi beberapa kali saat berkemih?",
  },
  {
    key: "q4",
    short: "Urgensi",
    domain: "storage",
    text: "Seberapa sering Anda sulit menahan keinginan berkemih?",
  },
  {
    key: "q5",
    short: "Pancaran lemah",
    domain: "voiding",
    text: "Seberapa sering pancaran kencing Anda lemah?",
  },
  {
    key: "q6",
    short: "Mengejan",
    domain: "voiding",
    text: "Seberapa sering Anda harus mengejan untuk mulai berkemih?",
  },
  {
    key: "q7",
    short: "Nokturia",
    domain: "storage",
    text: "Berapa kali Anda biasanya terbangun untuk berkemih sejak tidur malam sampai bangun pagi?",
  },
] as const;

export type IpssKey = (typeof IPSS_QUESTIONS)[number]["key"];

export const IPSS_QOL_QUESTION =
  "Jika harus menjalani sisa hidup dengan kondisi berkemih seperti sekarang, bagaimana perasaan Anda?";

export const IPSS_QOL_OPTIONS = [
  "Senang sekali",
  "Senang",
  "Umumnya puas",
  "Campuran puas dan tidak puas",
  "Umumnya tidak puas",
  "Tidak senang",
  "Buruk sekali",
] as const;

export function ipssCategory(total: number): "Ringan" | "Sedang" | "Berat" {
  if (total <= 7) return "Ringan";
  if (total <= 19) return "Sedang";
  return "Berat";
}

export function ipssSubscores(e: Record<IpssKey, number>) {
  return {
    storage: e.q2 + e.q4 + e.q7,
    voiding: e.q1 + e.q3 + e.q5 + e.q6,
  };
}
