import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteIntake } from "@/actions/records";
import { DayNav } from "@/components/day-nav";
import { ConfirmButton } from "@/components/form";
import { Progress } from "@/components/progress";
import { QuickIntake } from "@/components/quick-intake";
import { Empty, PageHeader, Section } from "@/components/ui";
import { drinkLabel } from "@/lib/constants";
import { getIntakes, requireUser } from "@/lib/dal";
import { fmt } from "@/lib/stats";
import { formatDay, isRealDate, nowInTz, timeOf } from "@/lib/time";
import { IntakeForm } from "./intake-form";
import Loading from "../loading";

export const metadata: Metadata = { title: "Hidrasi" };

type Props = { searchParams: Promise<{ tgl?: string | string[] }> };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function HydrationPage(props: Props) {
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

  const rows = await getIntakes(day, day);
  const total = rows.reduce((sum, row) => sum + row.volumeMl, 0);

  return (
    <>
      <PageHeader title="Hidrasi" description={formatDay(day, "long")}>
        <DayNav basePath="/hidrasi" day={day} today={today} />
      </PageHeader>

      <div className="card mb-5 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p>
            <span className="num text-2xl font-medium">{fmt(total)}</span>
            <span className="ml-1 text-sm text-muted">/ {fmt(user.fluidTargetMl)} ml</span>
          </p>
          <p className="num text-sm text-muted">
            {total >= user.fluidTargetMl
              ? "Target tercapai"
              : `Kurang ${fmt(user.fluidTargetMl - total)} ml`}
          </p>
        </div>
        <div className="mt-3">
          <Progress value={total} max={user.fluidTargetMl} label="Asupan cairan terhadap target" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <Section title="Catat minum">
          {day === today && (
            <div className="mb-5 border-b border-line pb-5">
              <QuickIntake />
            </div>
          )}
          <IntakeForm key={day} fallbackTime={`${day}T${timeOf(now)}`} live={day === today} />
        </Section>

        <Section title={`Catatan ${formatDay(day, "short")}`} aside={<span className="num">{rows.length} catatan</span>}>
          {rows.length === 0 ? (
            <Empty>Belum ada catatan minum pada tanggal ini.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {rows.map((row) => (
                <li key={row.id} className="flex items-start gap-3 py-3">
                  <span className="num w-12 shrink-0 pt-0.5 text-sm">{timeOf(row.occurredAt)}</span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p>
                      <span className="num font-medium">{row.volumeMl}</span> ml
                      <span className="text-muted"> · {drinkLabel(row.kind)}</span>
                    </p>
                    {row.notes && <p className="mt-1 text-muted">{row.notes}</p>}
                  </div>
                  <div className="no-print flex shrink-0 gap-1">
                    <Link
                      href={`/hidrasi/${row.id}`}
                      className="btn btn-sm px-2"
                      aria-label={`Ubah catatan ${timeOf(row.occurredAt)}`}
                    >
                      <Pencil size={14} aria-hidden />
                    </Link>
                    <form action={deleteIntake}>
                      <input type="hidden" name="id" value={row.id} />
                      <ConfirmButton
                        message={`Hapus catatan minum pukul ${timeOf(row.occurredAt)}?`}
                        label={`Hapus catatan ${timeOf(row.occurredAt)}`}
                        className="btn btn-sm px-2"
                      >
                        <Trash2 size={14} aria-hidden />
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
