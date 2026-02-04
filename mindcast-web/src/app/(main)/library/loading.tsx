import { Skeleton } from '@/components/ui/skeleton';
import { EpisodeGridSkeleton } from '@/components/episode-card';

export default function LibraryLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <Skeleton className="h-8 w-24 hidden sm:block" />
          <Skeleton className="h-11 w-32 sm:h-10" />
        </div>
      </div>

      {/* Daily Drop skeleton */}
      <div className="rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Review Reminders skeleton */}
      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Playlists skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0">
              <Skeleton className="h-40 w-40 rounded-xl mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Episodes Section */}
      <div>
        <Skeleton className="h-6 w-28 mb-4" />
        <EpisodeGridSkeleton count={6} />
      </div>
    </div>
  );
}
