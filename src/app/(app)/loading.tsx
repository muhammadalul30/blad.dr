export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="h-7 w-40 rounded bg-line/60" />
      <div className="h-28 rounded-lg border border-line bg-surface" />
      <div className="h-56 rounded-lg border border-line bg-surface" />
      <span className="sr-only">Memuat…</span>
    </div>
  );
}
