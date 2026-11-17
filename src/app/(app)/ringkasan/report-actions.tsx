"use client";

import { useState } from "react";
import { Copy, Printer } from "lucide-react";

export function ReportActions({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <>
      <button type="button" className="btn" onClick={copy}>
        <Copy size={15} aria-hidden />
        <span aria-live="polite">
          {status === "copied" ? "Tersalin" : status === "failed" ? "Gagal menyalin" : "Salin teks"}
        </span>
      </button>
      <button type="button" className="btn btn-primary" onClick={() => window.print()}>
        <Printer size={15} aria-hidden />
        Cetak / PDF
      </button>
    </>
  );
}
