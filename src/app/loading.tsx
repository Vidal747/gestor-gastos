import { Surface } from '@heroui/react/surface';

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-surface-tertiary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Surface key={i} className="rounded-3xl p-5">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-tertiary" />
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-surface-tertiary" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-surface-tertiary" />
          </Surface>
        ))}
      </div>
      <div className="mt-6 h-6 w-40 animate-pulse rounded-lg bg-surface-tertiary" />
      <div className="mt-3 grid gap-3">
        {[1, 2, 3].map((i) => (
          <Surface key={i} className="flex items-center justify-between gap-4 rounded-3xl p-5">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-tertiary" />
            <div className="h-6 w-20 animate-pulse rounded bg-surface-tertiary" />
          </Surface>
        ))}
      </div>
    </main>
  );
}
