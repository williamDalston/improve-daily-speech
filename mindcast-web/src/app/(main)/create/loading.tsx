import { Skeleton } from '@/components/ui/skeleton';

export default function CreateLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>

      {/* Main input card */}
      <div className="rounded-2xl border border-border p-6 space-y-6">
        {/* Topic input */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        {/* Voice selector */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        {/* Submit button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Recent episodes hint */}
      <div className="text-center">
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </div>
  );
}
