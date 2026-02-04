'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Clock,
  Calendar,
  Grid,
  List as ListIcon,
  Plus,
  FolderPlus,
  Play,
  Trash2,
  MoreHorizontal,
  X,
  Check,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EpisodeCard } from '@/components/episode-card';
import { cn, formatDuration } from '@/lib/utils';

interface Episode {
  id: string;
  title: string | null;
  topic: string;
  transcript: string | null;
  audioDurationSecs: number | null;
  createdAt: Date;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
}

interface Playlist {
  id: string;
  name: string;
  episodeIds: string[];
  createdAt: Date;
}

interface LibraryViewProps {
  episodes: Episode[];
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest' | 'a-z';
type FilterOption = 'all' | 'ready' | 'processing';
type ViewMode = 'grid' | 'list';

export function LibraryView({ episodes: initialEpisodes, className }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [filterBy, setFilterBy] = React.useState<FilterOption>('all');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedEpisodes, setSelectedEpisodes] = React.useState<string[]>([]);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [activePlaylist, setActivePlaylist] = React.useState<string | null>(null);

  // Load playlists from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('mindcast-playlists');
    if (saved) {
      try {
        setPlaylists(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save playlists to localStorage
  const savePlaylists = (newPlaylists: Playlist[]) => {
    localStorage.setItem('mindcast-playlists', JSON.stringify(newPlaylists));
    setPlaylists(newPlaylists);
  };

  // Filter and sort episodes
  const filteredEpisodes = React.useMemo(() => {
    let result = [...initialEpisodes];

    // Apply playlist filter
    if (activePlaylist) {
      const playlist = playlists.find((p) => p.id === activePlaylist);
      if (playlist) {
        result = result.filter((e) => playlist.episodeIds.includes(e.id));
      }
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.topic.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      result = result.filter((e) =>
        filterBy === 'ready' ? e.status === 'READY' : e.status === 'PROCESSING'
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'longest':
          return (b.audioDurationSecs || 0) - (a.audioDurationSecs || 0);
        case 'shortest':
          return (a.audioDurationSecs || 0) - (b.audioDurationSecs || 0);
        case 'a-z':
          return (a.title || a.topic).localeCompare(b.title || b.topic);
        default:
          return 0;
      }
    });

    return result;
  }, [initialEpisodes, searchQuery, sortBy, filterBy, activePlaylist, playlists]);

  // Toggle episode selection
  const toggleSelection = (id: string) => {
    setSelectedEpisodes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Create new playlist
  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName.trim(),
      episodeIds: selectedEpisodes,
      createdAt: new Date(),
    };

    savePlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setSelectedEpisodes([]);
    setShowPlaylistModal(false);
  };

  // Add to existing playlist
  const addToPlaylist = (playlistId: string) => {
    const updated = playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            episodeIds: Array.from(new Set([...p.episodeIds, ...selectedEpisodes])),
          }
        : p
    );
    savePlaylists(updated);
    setSelectedEpisodes([]);
  };

  // Delete playlist
  const deletePlaylist = (playlistId: string) => {
    savePlaylists(playlists.filter((p) => p.id !== playlistId));
    if (activePlaylist === playlistId) {
      setActivePlaylist(null);
    }
  };

  // Stats
  const totalDuration = initialEpisodes.reduce(
    (sum, e) => sum + (e.audioDurationSecs || 0),
    0
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-brand/10 border-brand')}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>

          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand text-white'
                  : 'bg-surface hover:bg-surface-secondary'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-brand text-white'
                  : 'bg-surface hover:bg-surface-secondary'
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {selectedEpisodes.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowPlaylistModal(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              Add to Playlist ({selectedEpisodes.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-surface-secondary border border-border animate-fade-in">
          {/* Sort */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="longest">Longest first</option>
              <option value="shortest">Shortest first</option>
              <option value="a-z">A-Z</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">Status</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-end gap-4 ml-auto text-sm text-text-muted">
            <span>{filteredEpisodes.length} episodes</span>
            <span>•</span>
            <span>{formatDuration(totalDuration)} total</span>
          </div>
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActivePlaylist(null)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activePlaylist === null
                ? 'bg-brand text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            )}
          >
            All Episodes
          </button>
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => setActivePlaylist(playlist.id)}
              className={cn(
                'group flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
                activePlaylist === playlist.id
                  ? 'bg-brand text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              )}
            >
              <Layers className="h-3 w-3" />
              {playlist.name}
              <span className="text-xs opacity-70">({playlist.episodeIds.length})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(playlist.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-error"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Episodes Grid/List */}
      {filteredEpisodes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">
            {searchQuery
              ? `No episodes matching "${searchQuery}"`
              : 'No episodes in this view'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEpisodes.map((episode) => (
            <div key={episode.id} className="relative group">
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelection(episode.id)}
                className={cn(
                  'absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                  selectedEpisodes.includes(episode.id)
                    ? 'bg-brand border-brand text-white'
                    : 'border-border bg-surface/80 opacity-0 group-hover:opacity-100'
                )}
              >
                {selectedEpisodes.includes(episode.id) && (
                  <Check className="h-4 w-4" />
                )}
              </button>

              <Link href={`/episode/${episode.id}`}>
                <EpisodeCard episode={episode} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEpisodes.map((episode) => (
            <div
              key={episode.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-colors"
            >
              {/* Selection */}
              <button
                onClick={() => toggleSelection(episode.id)}
                className={cn(
                  'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                  selectedEpisodes.includes(episode.id)
                    ? 'bg-brand border-brand text-white'
                    : 'border-border'
                )}
              >
                {selectedEpisodes.includes(episode.id) && (
                  <Check className="h-4 w-4" />
                )}
              </button>

              {/* Info */}
              <Link href={`/episode/${episode.id}`} className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary truncate">
                  {episode.title || episode.topic}
                </h3>
                <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                  {episode.audioDurationSecs && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(episode.audioDurationSecs)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(episode.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>

              {/* Actions */}
              <Link href={`/episode/${episode.id}`}>
                <Button variant="ghost" size="icon">
                  <Play className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Add to Playlist
            </h3>

            {/* Existing playlists */}
            {playlists.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted">Add to existing:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        addToPlaylist(playlist.id);
                        setShowPlaylistModal(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-secondary transition-colors text-left"
                    >
                      <Layers className="h-4 w-4 text-brand" />
                      <span className="font-medium">{playlist.name}</span>
                      <span className="text-sm text-text-muted ml-auto">
                        {playlist.episodeIds.length} episodes
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create new */}
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Or create new:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                />
                <Button onClick={createPlaylist} disabled={!newPlaylistName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowPlaylistModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
