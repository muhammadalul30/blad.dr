import type { NextRequest } from "next/server";
import { getAllData, getUser } from "@/lib/dal";
import { todayInTz } from "@/lib/time";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const cell = (value: unknown) => {
    const text = value == null ? "" : String(value);
    // Awalan = + - @ bisa dieksekusi sebagai rumus oleh aplikasi spreadsheet.
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((c) => cell(row[c])).join(","))].join("\r\n");
}

function download(body: string, type: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": `${type}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });

  const data = await getAllData();
  const stamp = todayInTz(user.timezone);
  const { searchParams } = request.nextUrl;

  if (searchParams.get("format") === "csv") {
    const tables = { bak: data.voids, hidrasi: data.intakes, ipss: data.ipss } as const;
    const name = searchParams.get("jenis") as keyof typeof tables;
    if (!Object.hasOwn(tables, name)) {
      return Response.json({ error: "Jenis tidak dikenal." }, { status: 400 });
    }
    // BOM agar Excel membaca UTF-8 dengan benar.
    return download(`﻿${toCsv(tables[name])}`, "text/csv", `genitourinaria-${name}-${stamp}.csv`);
  }

  return download(
    JSON.stringify({ exportedOn: stamp, ...data }, null, 2),
    "application/json",
    `genitourinaria-${stamp}.json`,
  );
}
