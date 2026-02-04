'use client';

import { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EpisodeCard } from '@/components/episode-card';
import { cn } from '@/lib/utils';

interface Episode {
  id: string;
  title: string | null;
  topic: string;
  transcript: string | null;
  audioDurationSecs: number | null;
  createdAt: Date | string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
  voice?: string;
}

interface LibrarySearchProps {
  episodes: Episode[];
}

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest' | 'alphabetical';
type FilterOption = 'all' | 'ready' | 'processing';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'longest', label: 'Longest' },
  { value: 'shortest', label: 'Shortest' },
  { value: 'alphabetical', label: 'A-Z' },
];

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
];

export function LibrarySearch({ episodes }: LibrarySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedEpisodes = useMemo(() => {
    let result = [...episodes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ep) =>
          ep.topic.toLowerCase().includes(query) ||
          ep.title?.toLowerCase().includes(query) ||
          ep.transcript?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterBy === 'ready') {
      result = result.filter((ep) => ep.status === 'READY');
    } else if (filterBy === 'processing') {
      result = result.filter((ep) => ep.status === 'PROCESSING' || ep.status === 'DRAFT');
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'longest':
        result.sort((a, b) => (b.audioDurationSecs || 0) - (a.audioDurationSecs || 0));
        break;
      case 'shortest':
        result.sort((a, b) => (a.audioDurationSecs || 0) - (b.audioDurationSecs || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => (a.title || a.topic).localeCompare(b.title || b.topic));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [episodes, searchQuery, sortBy, filterBy]);

  const hasActiveFilters = searchQuery || sortBy !== 'newest' || filterBy !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setFilterBy('all');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10 pr-10"
            data-search-input
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary touch-manipulation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'h-11 gap-2 touch-manipulation',
            hasActiveFilters && 'border-brand text-brand'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-white">
              {(searchQuery ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0) + (filterBy !== 'all' ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="animate-fade-in space-y-4 rounded-xl border border-border bg-surface-secondary p-4">
          {/* Sort By */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-text-muted">Sort by</span>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors touch-manipulation active:scale-95',
                    sortBy === option.value
                      ? 'bg-brand text-white'
                      : 'bg-surface hover:bg-surface-tertiary text-text-secondary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter By Status */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-text-muted">Status</span>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterBy(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors touch-manipulation active:scale-95',
                    filterBy === option.value
                      ? 'bg-brand text-white'
                      : 'bg-surface hover:bg-surface-tertiary text-text-secondary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full rounded-lg bg-surface py-2 text-sm text-text-muted hover:text-brand hover:bg-surface-tertiary touch-manipulation"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {(searchQuery || filterBy !== 'all') && (
        <p className="text-sm text-text-muted">
          {filteredAndSortedEpisodes.length} episode{filteredAndSortedEpisodes.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {/* Episode Grid */}
      {filteredAndSortedEpisodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
          <Search className="mb-3 h-8 w-8 text-text-muted" />
          <p className="text-text-secondary">No episodes match your search</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-brand hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedEpisodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </div>
  );
}
