import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteVoid } from "@/actions/records";
import { DayNav } from "@/components/day-nav";
import { ConfirmButton } from "@/components/form";
import { Empty, PageHeader, Section, Tag } from "@/components/ui";
import type { VoidRow } from "@/db/schema";
import { LEAKAGE, SYMPTOMS, URGENCY_EPISODE_MIN, URINE_COLORS } from "@/lib/constants";
import { getVoids, requireUser } from "@/lib/dal";
import { buildDayStats, fmt } from "@/lib/stats";
import { formatDay, isRealDate, nowInTz, timeOf } from "@/lib/time";
import { VoidForm } from "./void-form";
import Loading from "../loading";

export const metadata: Metadata = { title: "Catatan BAK" };

type Props = { searchParams: Promise<{ tgl?: string | string[] }> };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function VoidsPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: Props) {
  const user = await requireUser();
  const { tgl } = await searchParams;
  const now = nowInTz(user.timezone);
  const today = now.slice(0, 10);
  const day = typeof tgl === "string" && isRealDate(tgl) && tgl <= today ? tgl : today;

  const rows = await getVoids(day, day);
  const [stat] = buildDayStats([day], rows, []);

  return (
    <>
      <PageHeader title="Catatan BAK" description={formatDay(day, "long")}>
        <DayNav basePath="/bak" day={day} today={today} />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <Section title="Catat BAK">
          <VoidForm
            key={day}
            fallbackTime={`${day}T${timeOf(now)}`}
            live={day === today}
            sleepTime={user.sleepTime}
            wakeTime={user.wakeTime}
          />
        </Section>

        <Section
          title={`Catatan ${formatDay(day, "short")}`}
          aside={
            <span className="num">
              {stat.voids} kali · malam {stat.nightVoids} · {fmt(stat.voidVolume)} ml
            </span>
          }
        >
          {rows.length === 0 ? (
            <Empty>Belum ada catatan BAK pada tanggal ini.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {rows.map((row) => (
                <VoidItem key={row.id} row={row} />
              ))}
            </ul>
          )}
          {stat.measuredVoids < stat.voids && (
            <p className="mt-4 text-xs text-muted">
              {stat.voids - stat.measuredVoids} catatan tanpa volume; total volume hari ini tidak lengkap.
            </p>
          )}
        </Section>
      </div>
    </>
  );
}

function VoidItem({ row }: { row: VoidRow }) {
  const color = URINE_COLORS.find((c) => c.value === row.color);
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="num w-12 shrink-0 pt-0.5 text-sm">{timeOf(row.occurredAt)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {row.volumeMl != null ? (
            <>
              <span className="num font-medium">{row.volumeMl}</span> ml
            </>
          ) : (
            <span className="text-muted">Volume tidak diukur</span>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {row.wokeFromSleep && <Tag>Malam</Tag>}
          {row.urgency > 0 && (
            <Tag tone={row.urgency >= URGENCY_EPISODE_MIN ? "warn" : "plain"}>Desakan {row.urgency}/4</Tag>
          )}
          {row.leakage > 0 && <Tag tone="warn">{LEAKAGE[row.leakage]}</Tag>}
          {SYMPTOMS.filter((s) => row[s.key]).map((s) => (
            <Tag key={s.key} tone={s.key === "hematuria" ? "danger" : "plain"}>
              {s.label}
            </Tag>
          ))}
          {color && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <span className="size-3 rounded-sm border border-black/20" style={{ background: color.hex }} aria-hidden />
              {color.label}
            </span>
          )}
        </div>
        {row.notes && <p className="mt-1.5 text-sm text-muted">{row.notes}</p>}
      </div>
      <div className="no-print flex shrink-0 gap-1">
        <Link href={`/bak/${row.id}`} className="btn btn-sm px-2" aria-label={`Ubah catatan ${timeOf(row.occurredAt)}`}>
          <Pencil size={14} aria-hidden />
        </Link>
        <form action={deleteVoid}>
          <input type="hidden" name="id" value={row.id} />
          <ConfirmButton
            message={`Hapus catatan BAK pukul ${timeOf(row.occurredAt)}?`}
            label={`Hapus catatan ${timeOf(row.occurredAt)}`}
            className="btn btn-sm px-2"
          >
            <Trash2 size={14} aria-hidden />
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
