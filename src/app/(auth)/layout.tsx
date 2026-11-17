import { Credit } from "@/components/credit";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <p className="mb-6 text-sm font-semibold tracking-wide">Genitourinaria</p>
        {children}
      </main>
      <Credit className="py-6" />
    </div>
  );
}
