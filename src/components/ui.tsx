export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside && <div className="text-xs text-muted">{aside}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1">
        <span className="num text-2xl font-medium">{value}</span>
        {unit && <span className="ml-1 text-sm text-muted">{unit}</span>}
      </p>
      {note && <div className="mt-1.5 text-xs text-muted">{note}</div>}
    </div>
  );
}

export function Tag({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warn" | "danger" }) {
  const color =
    tone === "danger" ? "border-danger text-danger" : tone === "warn" ? "border-warn text-warn" : "border-line text-muted";
  return <span className={`rounded border px-1.5 py-0.5 text-xs ${color}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}
