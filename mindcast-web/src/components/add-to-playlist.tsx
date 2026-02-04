'use client';

import * as React from 'react';
import { ListMusic, Plus, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Playlist {
  id: string;
  name: string;
  coverEmoji: string | null;
  episodeCount: number;
  episodes: { episodeId: string }[];
}

interface AddToPlaylistProps {
  episodeId: string;
  episodeTitle: string;
  onClose: () => void;
  className?: string;
}

export function AddToPlaylistModal({
  episodeId,
  episodeTitle,
  onClose,
  className,
}: AddToPlaylistProps) {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchPlaylists();
  }, []);

  React.useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      setPlaylists(data.playlists);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const isInPlaylist = (playlist: Playlist) =>
    playlist.episodes?.some((e) => e.episodeId === episodeId);

  const handleAddToPlaylist = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'Episode already in playlist') {
          // Remove from playlist instead
          await handleRemoveFromPlaylist(playlistId);
          return;
        }
        throw new Error('Failed to add to playlist');
      }

      // Update local state
      setPlaylists(
        playlists.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                episodeCount: p.episodeCount + 1,
                episodes: [...(p.episodes || []), { episodeId }],
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!res.ok) throw new Error('Failed to remove from playlist');

      // Update local state
      setPlaylists(
        playlists.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                episodeCount: Math.max(0, p.episodeCount - 1),
                episodes: p.episodes?.filter((e) => e.episodeId !== episodeId) || [],
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to remove from playlist:', err);
    } finally {
      setAdding(null);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newName.trim()) return;

    setAdding('new');
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to create playlist');

      const { playlist } = await res.json();

      // Add episode to the new playlist
      await fetch(`/api/playlists/${playlist.id}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      setPlaylists([
        {
          ...playlist,
          episodeCount: 1,
          episodes: [{ episodeId }],
        },
        ...playlists,
      ]);
      setNewName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4',
        className
      )}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-brand" />
            <h2 className="font-semibold text-text-primary">Add to Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface-secondary transition-colors"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>

        {/* Episode being added */}
        <div className="px-4 py-3 border-b border-border bg-surface-secondary/50">
          <p className="text-sm text-text-muted">Adding:</p>
          <p className="text-body-md text-text-primary font-medium truncate">
            {episodeTitle}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Create New Playlist */}
              {isCreating ? (
                <div className="flex gap-2 p-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePlaylist();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                    placeholder="New playlist name..."
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreatePlaylist}
                    disabled={!newName.trim() || adding === 'new'}
                  >
                    {adding === 'new' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <Plus className="h-5 w-5 text-brand" />
                  </div>
                  <span className="font-medium text-brand">Create New Playlist</span>
                </button>
              )}

              {/* Existing Playlists */}
              {playlists.map((playlist) => {
                const inPlaylist = isInPlaylist(playlist);
                const isAdding = adding === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={isAdding}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                      inPlaylist
                        ? 'bg-brand/10 hover:bg-brand/20'
                        : 'hover:bg-surface-secondary'
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-xl">
                      {playlist.coverEmoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {playlist.name}
                      </p>
                      <p className="text-caption text-text-muted">
                        {playlist.episodeCount} episodes
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isAdding ? (
                        <Loader2 className="h-5 w-5 animate-spin text-brand" />
                      ) : inPlaylist ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-border" />
                      )}
                    </div>
                  </button>
                );
              })}

              {playlists.length === 0 && !isCreating && (
                <p className="text-center text-sm text-text-muted py-4">
                  No playlists yet. Create one above!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Button component to trigger the modal
export function AddToPlaylistButton({
  episodeId,
  episodeTitle,
  className,
}: {
  episodeId: string;
  episodeTitle: string;
  className?: string;
}) {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className={className}
      >
        <ListMusic className="h-4 w-4" />
        Add to Playlist
      </Button>

      {showModal && (
        <AddToPlaylistModal
          episodeId={episodeId}
          episodeTitle={episodeTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
