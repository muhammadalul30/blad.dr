import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="mt-1 text-sm text-muted">Catatan ini tidak ada atau bukan milik akun Anda.</p>
      <Link href="/dashboard" className="btn btn-primary mt-5 self-start">
        Ke dashboard
      </Link>
    </main>
  );
}
