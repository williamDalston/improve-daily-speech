import { Skeleton } from '@/components/ui/skeleton';

export default function EpisodeLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Skeleton className="h-11 w-11 sm:h-10 sm:w-10 rounded-md" />
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-3/4 sm:h-10" />
          </div>
        </div>
        {/* Action buttons skeleton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
      </div>

      {/* Audio player skeleton */}
      <div className="rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {/* Progress bar */}
        <Skeleton className="h-2 w-full rounded-full mb-4" />
        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Learning addons skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Transcript skeleton */}
      <div className="rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${85 + Math.random() * 15}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
