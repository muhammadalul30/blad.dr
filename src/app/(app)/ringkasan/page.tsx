import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getIntakes, getIpssHistory, getIpssInRange, getVoids, requireUser } from "@/lib/dal";
import { REPORT_TITLE, buildReport, ipssLine, reportToText } from "@/lib/report";
import { buildDayStats, fmt, summarize } from "@/lib/stats";
import { addDays, daysBetween, formatDay, isRealDate, todayInTz } from "@/lib/time";
import { ReportActions } from "./report-actions";
import Loading from "../loading";

export const metadata: Metadata = { title: "Ringkasan untuk dokter" };

const PRESETS = [7, 14, 30, 90];
const MAX_DAYS = 366;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function ReportPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: Props) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayInTz(user.timezone);

  const preset = PRESETS.includes(Number(params.hari)) ? Number(params.hari) : null;
  const dari = typeof params.dari === "string" && isRealDate(params.dari) ? params.dari : null;
  const sampai = typeof params.sampai === "string" && isRealDate(params.sampai) ? params.sampai : null;

  let to = today;
  let from = addDays(today, -((preset ?? 14) - 1));
  const custom = !preset && dari != null && sampai != null && dari <= sampai && sampai <= today;
  if (custom) {
    to = sampai;
    from = dari < addDays(sampai, -(MAX_DAYS - 1)) ? addDays(sampai, -(MAX_DAYS - 1)) : dari;
  }
  const activePreset = custom ? null : (preset ?? 14);

  const [voids, intakes, ipssInRange] = await Promise.all([
    getVoids(from, to),
    getIntakes(from, to),
    getIpssInRange(from, to),
  ]);
  // Bila tidak ada pengisian dalam periode, tampilkan hasil terakhir sebagai acuan.
  const ipss = ipssInRange.length > 0 ? ipssInRange : await getIpssHistory(1);

  const days = buildDayStats(daysBetween(from, to), voids, intakes);
  const report = buildReport({
    profile: user,
    from,
    to,
    today,
    days,
    summary: summarize(days, voids, intakes),
    ipss,
  });

  return (
    <>
      <div className="no-print mb-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Ringkasan untuk dokter</h1>
            <p className="mt-0.5 text-sm text-muted">Pilih periode, lalu cetak atau salin.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReportActions text={reportToText(report)} />
          </div>
        </div>

        <div className="card flex flex-wrap items-end gap-x-6 gap-y-3 p-4">
          <div className="flex gap-1" role="group" aria-label="Periode cepat">
            {PRESETS.map((p) => (
              <Link
                key={p}
                href={`/ringkasan?hari=${p}`}
                aria-current={p === activePreset ? "true" : undefined}
                className={`btn btn-sm num ${p === activePreset ? "btn-primary" : ""}`}
              >
                {p} hari
              </Link>
            ))}
          </div>
          <form method="get" action="/ringkasan" className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="dari" className="mb-1 block text-xs text-muted">
                Dari
              </label>
              <input id="dari" name="dari" type="date" required max={today} defaultValue={from} className="input num h-8 w-auto text-sm" />
            </div>
            <div>
              <label htmlFor="sampai" className="mb-1 block text-xs text-muted">
                Sampai
              </label>
              <input id="sampai" name="sampai" type="date" required max={today} defaultValue={to} className="input num h-8 w-auto text-sm" />
            </div>
            <button type="submit" className="btn btn-sm">
              Terapkan
            </button>
          </form>
        </div>
      </div>

      <article className="card mx-auto max-w-3xl p-5 text-sm md:p-8 print:max-w-none print:border-0 print:p-0">
        <header className="border-b-2 border-ink pb-3">
          <h2 className="text-base font-semibold tracking-wide md:text-lg">{REPORT_TITLE}</h2>
        </header>

        <dl className="mt-4 grid grid-cols-[9.5rem_1fr] gap-x-3 gap-y-1">
          {report.identity.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {report.sections.map((section) => (
          <section key={section.title} className="avoid-break mt-6">
            <h3 className="border-b border-line pb-1 text-xs font-semibold tracking-wider uppercase">
              {section.title}
            </h3>
            <table className="table-plain mt-1">
              <tbody>
                {section.rows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="w-[45%] pl-0 text-muted">{label}</td>
                    <td className="pr-0 font-medium tabular-nums">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {section.note && <p className="mt-2 text-xs text-muted">{section.note}</p>}
          </section>
        ))}

        <section className="avoid-break mt-6">
          <h3 className="border-b border-line pb-1 text-xs font-semibold tracking-wider uppercase">IPSS</h3>
          {report.ipss.length === 0 ? (
            <p className="mt-2 text-muted">Belum ada pengisian IPSS.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {report.ipss.map((e) => (
                <li key={e.id}>{ipssLine(e)}</li>
              ))}
            </ul>
          )}
        </section>

        {report.days.length > 0 && (
          <section className="mt-6">
            <h3 className="border-b border-line pb-1 text-xs font-semibold tracking-wider uppercase">
              Rekap harian
            </h3>
            <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
              <table className="table-plain mt-1 min-w-[30rem]">
                <thead>
                  <tr>
                    <th className="pl-0">Tanggal</th>
                    <th className="text-right">BAK</th>
                    <th className="text-right">Malam</th>
                    <th className="text-right">Urin (ml)</th>
                    <th className="text-right">Maks (ml)</th>
                    <th className="text-right">Minum (ml)</th>
                    <th className="text-right">Urgensi</th>
                    <th className="pr-0 text-right">Bocor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.map((d) => (
                    <tr key={d.day}>
                      <td className="pl-0 whitespace-nowrap">{formatDay(d.day, "medium")}</td>
                      <td className="num text-right">{d.voids}</td>
                      <td className="num text-right">{d.nightVoids}</td>
                      <td className="num text-right">
                        {fmt(d.voidVolume)}
                        {d.measuredVoids < d.voids && <span title="Tidak semua BAK diukur">*</span>}
                      </td>
                      <td className="num text-right">{fmt(d.maxVoid)}</td>
                      <td className="num text-right">{fmt(d.intakeVolume)}</td>
                      <td className="num text-right">{d.urgencyEpisodes}</td>
                      <td className="num pr-0 text-right">{d.leakEpisodes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">* Tidak semua BAK pada hari itu diukur volumenya.</p>
          </section>
        )}

        <section className="avoid-break mt-6 border-t border-line pt-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase">Keterangan</h3>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-muted">
            {report.definitions.map((definition) => (
              <li key={definition}>{definition}</li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
