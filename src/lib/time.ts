// Utilitas tanggal untuk jam dinding lokal ("YYYY-MM-DDTHH:mm") dan
// tanggal lokal ("YYYY-MM-DD"). Tidak ada konversi UTC pada data catatan.

export const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^\d{2}:\d{2}$/;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Jam dinding saat ini di zona waktu `tz`, format "YYYY-MM-DDTHH:mm". */
export function nowInTz(tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function todayInTz(tz: string): string {
  return nowInTz(tz).slice(0, 10);
}

function toUtcDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isRealDate(day: string): boolean {
  if (!DATE_RE.test(day)) return false;
  return toUtcDate(day).toISOString().slice(0, 10) === day;
}

export function addDays(day: string, n: number): string {
  const date = toUtcDate(day);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** Daftar tanggal dari `start` sampai `end`, inklusif. */
export function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

export function formatDay(
  day: string,
  style: "long" | "medium" | "short" = "medium",
): string {
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : style === "medium"
        ? { weekday: "short", day: "numeric", month: "short", year: "numeric" }
        : { day: "numeric", month: "short" };
  return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "UTC" }).format(
    toUtcDate(day),
  );
}

export function timeOf(dateTime: string): string {
  return dateTime.slice(11, 16);
}

export function dayOf(dateTime: string): string {
  return dateTime.slice(0, 10);
}

export function ageOn(birthDate: string, today: string): number {
  const age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? age - 1 : age;
}

/** Apakah jam "HH:mm" jatuh di rentang tidur (boleh melewati tengah malam). */
export function isSleepHour(time: string, sleepTime: string, wakeTime: string): boolean {
  return sleepTime <= wakeTime
    ? time >= sleepTime && time < wakeTime
    : time >= sleepTime || time < wakeTime;
}
