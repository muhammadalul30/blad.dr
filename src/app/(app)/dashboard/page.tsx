import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FluidChart, FrequencyChart } from "@/components/charts";
import { Progress } from "@/components/progress";
import { QuickIntake } from "@/components/quick-intake";
import { Empty, PageHeader, Section, Stat } from "@/components/ui";
import { drinkLabel, ipssCategory } from "@/lib/constants";
import { getIntakes, getIpssHistory, getVoids, requireUser } from "@/lib/dal";
import { buildDayStats, fmt, summarize } from "@/lib/stats";
import { addDays, dayOf, daysBetween, formatDay, timeOf, todayInTz } from "@/lib/time";
import Loading from "../loading";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES = [7, 14, 30];

type Props = { searchParams: Promise<{ rentang?: string | string[] }> };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function DashboardPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: Props) {
  const user = await requireUser();
  const { rentang } = await searchParams;
  const range = RANGES.includes(Number(rentang)) ? Number(rentang) : 14;

  const today = todayInTz(user.timezone);
  const from = addDays(today, -(range - 1));
  const [voids, intakes, [latestIpss]] = await Promise.all([
    getVoids(from, today),
    getIntakes(from, today),
    getIpssHistory(1),
  ]);

  const dayStats = buildDayStats(daysBetween(from, today), voids, intakes);
  const todayStat = dayStats[dayStats.length - 1];
  const summary = summarize(dayStats, voids, intakes);

  const timeline = [
    ...voids
      .filter((v) => dayOf(v.occurredAt) === today)
      .map((v) => ({
        key: `v${v.id}`,
        at: v.occurredAt,
        kind: "BAK",
        detail: v.volumeMl != null ? `${v.volumeMl} ml` : "tidak diukur",
        extra: [v.wokeFromSleep && "malam", v.urgency > 0 && `desakan ${v.urgency}/4`, v.leakage > 0 && "bocor"]
          .filter(Boolean)
          .join(", "),
      })),
    ...intakes
      .filter((i) => dayOf(i.occurredAt) === today)
      .map((i) => ({
        key: `i${i.id}`,
        at: i.occurredAt,
        kind: "Minum",
        detail: `${i.volumeMl} ml`,
        extra: drinkLabel(i.kind),
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader title="Dashboard" description={formatDay(today, "long")}>
        <Link href="/bak" className="btn btn-primary">
          Catat BAK
        </Link>
        <Link href="/hidrasi" className="btn">
          Catat minum
        </Link>
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        <div className="bg-surface">
          <Stat
            label="BAK hari ini"
            value={fmt(todayStat.voids)}
            unit="kali"
            note={`siang ${todayStat.dayVoids} · malam ${todayStat.nightVoids}`}
          />
        </div>
        <div className="bg-surface">
          <Stat
            label="Urin terukur hari ini"
            value={fmt(todayStat.voidVolume)}
            unit="ml"
            note={
              todayStat.voids === 0
                ? "belum ada catatan"
                : `${todayStat.measuredVoids} dari ${todayStat.voids} BAK diukur`
            }
          />
        </div>
        <div className="bg-surface">
          <Stat
            label="Asupan cairan hari ini"
            value={fmt(todayStat.intakeVolume)}
            unit={`/ ${fmt(user.fluidTargetMl)} ml`}
            note={<Progress value={todayStat.intakeVolume} max={user.fluidTargetMl} label="Asupan terhadap target" />}
          />
        </div>
        <div className="bg-surface">
          {latestIpss ? (
            <Stat
              label="IPSS terakhir"
              value={String(latestIpss.total)}
              unit="/ 35"
              note={`${ipssCategory(latestIpss.total)} · ${formatDay(latestIpss.takenOn, "short")}`}
            />
          ) : (
            <Stat
              label="IPSS terakhir"
              value="–"
              note={
                <Link href="/ipss/baru" className="text-accent underline">
                  Isi kuesioner
                </Link>
              }
            />
          )}
        </div>
      </div>

      <div className="card mb-5 p-4">
        <QuickIntake />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{range} hari terakhir</h2>
        <div className="no-print flex gap-1" role="group" aria-label="Rentang waktu">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/dashboard?rentang=${r}`}
              aria-current={r === range ? "true" : undefined}
              className={`btn btn-sm num ${r === range ? "btn-primary" : ""}`}
            >
              {r} hari
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        <div className="bg-surface">
          <Stat
            label="Frekuensi BAK"
            value={fmt(summary.avgVoids, "decimal")}
            unit="kali/hari"
            note={`${summary.voidDays} hari tercatat`}
          />
        </div>
        <div className="bg-surface">
          <Stat label="Nokturia" value={fmt(summary.avgNightVoids, "decimal")} unit="kali/malam" />
        </div>
        <div className="bg-surface">
          <Stat
            label="Volume per BAK"
            value={fmt(summary.avgVoidVolume)}
            unit="ml"
            note={summary.maxVoidVolume != null ? `maks ${fmt(summary.maxVoidVolume)} ml` : undefined}
          />
        </div>
        <div className="bg-surface">
          <Stat
            label="Asupan cairan"
            value={fmt(summary.avgIntake)}
            unit="ml/hari"
            note={`${summary.intakeDays} hari tercatat`}
          />
        </div>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Section title="Frekuensi BAK per hari">
          <FrequencyChart
            data={dayStats.map((d) => ({ label: formatDay(d.day, "short"), siang: d.dayVoids, malam: d.nightVoids }))}
          />
        </Section>
        <Section title="Asupan dan keluaran cairan (ml)" aside="garis putus: target asupan">
          <FluidChart
            target={user.fluidTargetMl}
            data={dayStats.map((d) => ({
              label: formatDay(d.day, "short"),
              asupan: d.intakeVolume,
              keluar: d.voidVolume,
            }))}
          />
        </Section>
      </div>

      <Section title="Catatan hari ini" aside={<span className="num">{timeline.length} catatan</span>}>
        {timeline.length === 0 ? (
          <Empty>Belum ada catatan hari ini.</Empty>
        ) : (
          <ul className="-my-2 divide-y divide-line">
            {timeline.map((item) => (
              <li key={item.key} className="flex items-baseline gap-3 py-2.5 text-sm">
                <span className="num w-12 shrink-0">{timeOf(item.at)}</span>
                <span className="w-14 shrink-0 text-muted">{item.kind}</span>
                <span className="num">{item.detail}</span>
                {item.extra && <span className="truncate text-muted">{item.extra}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
