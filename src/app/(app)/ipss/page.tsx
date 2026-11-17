import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteIpss } from "@/actions/ipss";
import { IpssChart } from "@/components/charts";
import { ConfirmButton } from "@/components/form";
import { Empty, PageHeader, Section, Stat } from "@/components/ui";
import {
  IPSS_FREQUENCY_OPTIONS,
  IPSS_NOCTURIA_OPTIONS,
  IPSS_QOL_OPTIONS,
  IPSS_QUESTIONS,
  ipssCategory,
  ipssSubscores,
} from "@/lib/constants";
import { getIpssHistory } from "@/lib/dal";
import { formatDay } from "@/lib/time";
import Loading from "../loading";

export const metadata: Metadata = { title: "IPSS" };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function IpssPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const history = await getIpssHistory();
  const [latest, previous] = history;

  if (!latest) {
    return (
      <>
        <PageHeader title="IPSS" description="International Prostate Symptom Score" />
        <div className="card p-6 text-sm">
          <p>
            IPSS adalah kuesioner 7 pertanyaan tentang gejala berkemih selama 1 bulan terakhir, ditambah 1
            pertanyaan kualitas hidup. Skor total 0–35: ringan 0–7, sedang 8–19, berat 20–35.
          </p>
          <Link href="/ipss/baru" className="btn btn-primary mt-4">
            Isi kuesioner
          </Link>
        </div>
      </>
    );
  }

  const sub = ipssSubscores(latest);
  const change = previous ? latest.total - previous.total : null;
  const chartData = [...history]
    .reverse()
    .map((e) => ({ label: formatDay(e.takenOn, "short"), total: e.total, qol: e.qol }));

  return (
    <>
      <PageHeader title="IPSS" description="International Prostate Symptom Score">
        <Link href="/ipss/baru" className="btn btn-primary">
          Isi kuesioner
        </Link>
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        <div className="bg-surface">
          <Stat
            label={`Skor terakhir · ${formatDay(latest.takenOn, "short")}`}
            value={String(latest.total)}
            unit="/ 35"
            note={
              <>
                {ipssCategory(latest.total)}
                {change != null && change !== 0 && (
                  <span className="tabular-nums">
                    {" "}
                    · {change > 0 ? "+" : "−"}
                    {Math.abs(change)} dari sebelumnya
                  </span>
                )}
              </>
            }
          />
        </div>
        <div className="bg-surface">
          <Stat label="Kualitas hidup" value={String(latest.qol)} unit="/ 6" note={IPSS_QOL_OPTIONS[latest.qol]} />
        </div>
        <div className="bg-surface">
          <Stat label="Gejala penyimpanan" value={String(sub.storage)} unit="/ 15" note="Frekuensi, urgensi, nokturia" />
        </div>
        <div className="bg-surface">
          <Stat
            label="Gejala pengosongan"
            value={String(sub.voiding)}
            unit="/ 20"
            note="Tidak tuntas, terputus, lemah, mengejan"
          />
        </div>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Section title="Rincian skor terakhir">
          <table className="table-plain">
            <tbody>
              {IPSS_QUESTIONS.map((q, index) => {
                const value = latest[q.key];
                const options = q.key === "q7" ? IPSS_NOCTURIA_OPTIONS : IPSS_FREQUENCY_OPTIONS;
                return (
                  <tr key={q.key}>
                    <td className="num w-6 text-muted">{index + 1}</td>
                    <td>
                      {q.short}
                      <span className="block text-xs text-muted">{options[value]}</span>
                    </td>
                    <td className="num w-10 text-right font-medium">{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {latest.notes && <p className="mt-3 text-sm text-muted">Catatan: {latest.notes}</p>}
        </Section>

        <Section title="Perkembangan skor" aside="garis putus: batas 7 dan 19">
          {history.length < 2 ? (
            <Empty>Grafik muncul setelah ada dua pengisian atau lebih.</Empty>
          ) : (
            <IpssChart data={chartData} />
          )}
        </Section>
      </div>

      <Section title="Riwayat" aside={<span className="num">{history.length} pengisian</span>}>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="table-plain min-w-[34rem]">
            <thead>
              <tr>
                <th>Tanggal</th>
                {IPSS_QUESTIONS.map((q, index) => (
                  <th key={q.key} title={q.short} className="text-right">
                    {index + 1}
                  </th>
                ))}
                <th className="text-right">Total</th>
                <th>Kategori</th>
                <th className="text-right">QoL</th>
                <th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{formatDay(e.takenOn, "medium")}</td>
                  {IPSS_QUESTIONS.map((q) => (
                    <td key={q.key} className="num text-right text-muted">
                      {e[q.key]}
                    </td>
                  ))}
                  <td className="num text-right font-medium">{e.total}</td>
                  <td>{ipssCategory(e.total)}</td>
                  <td className="num text-right">{e.qol}</td>
                  <td className="no-print text-right">
                    <form action={deleteIpss}>
                      <input type="hidden" name="id" value={e.id} />
                      <ConfirmButton
                        message={`Hapus hasil IPSS ${formatDay(e.takenOn, "medium")}?`}
                        label={`Hapus hasil ${formatDay(e.takenOn, "medium")}`}
                        className="btn btn-sm px-2"
                      >
                        <Trash2 size={14} aria-hidden />
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
