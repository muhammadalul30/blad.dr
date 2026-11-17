"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function shift(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

export function DayNav({ basePath, day, today }: { basePath: string; day: string; today: string }) {
  const router = useRouter();
  const isToday = day >= today;

  return (
    <div className="no-print flex items-center gap-2">
      <Link href={`${basePath}?tgl=${shift(day, -1)}`} className="btn px-2.5" aria-label="Hari sebelumnya">
        <ChevronLeft size={18} aria-hidden />
      </Link>
      <input
        type="date"
        aria-label="Pilih tanggal"
        value={day}
        max={today}
        onChange={(event) => {
          if (event.target.value) router.push(`${basePath}?tgl=${event.target.value}`);
        }}
        className="input num w-auto"
      />
      {isToday ? (
        <span className="btn px-2.5 opacity-40" aria-hidden>
          <ChevronRight size={18} />
        </span>
      ) : (
        <Link href={`${basePath}?tgl=${shift(day, 1)}`} className="btn px-2.5" aria-label="Hari berikutnya">
          <ChevronRight size={18} aria-hidden />
        </Link>
      )}
      {!isToday && (
        <Link href={basePath} className="btn">
          Hari ini
        </Link>
      )}
    </div>
  );
}
