import { Skeleton } from '@/components/ui/skeleton';

export default function ReflectLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* InstantHost card */}
      <div className="rounded-2xl border-2 border-brand/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-28 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Topic input */}
        <Skeleton className="h-24 w-full rounded-xl mb-4" />

        {/* Buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>

      {/* Recent conversations */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
