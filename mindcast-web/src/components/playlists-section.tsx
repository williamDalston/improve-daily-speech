'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ListMusic,
  Plus,
  Play,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatDuration } from '@/lib/utils';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverEmoji: string | null;
  episodeCount: number;
  totalDurationSecs: number;
  updatedAt: string;
}

interface PlaylistsSectionProps {
  initialPlaylists: Playlist[];
  className?: string;
}

// Emoji picker for playlist covers
const EMOJI_OPTIONS = ['📚', '🎧', '🎓', '💡', '🔬', '📖', '🧠', '🎯', '🌟', '🚀', '💪', '🎨'];

export function PlaylistsSection({ initialPlaylists, className }: PlaylistsSectionProps) {
  const [playlists, setPlaylists] = React.useState(initialPlaylists);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [selectedEmoji, setSelectedEmoji] = React.useState('📚');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [showMenu, setShowMenu] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), coverEmoji: selectedEmoji }),
      });

      if (!res.ok) throw new Error('Failed to create playlist');

      const { playlist } = await res.json();
      setPlaylists([
        {
          ...playlist,
          episodeCount: 0,
          totalDurationSecs: 0,
        },
        ...playlists,
      ]);
      setNewName('');
      setSelectedEmoji('📚');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this playlist? Episodes will not be deleted.')) return;

    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete playlist');
      setPlaylists(playlists.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
    setShowMenu(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to rename playlist');

      setPlaylists(
        playlists.map((p) => (p.id === id ? { ...p, name: editName.trim() } : p))
      );
      setEditingId(null);
    } catch (err) {
      console.error('Failed to rename playlist:', err);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-heading-lg text-text-primary flex items-center gap-2">
          <ListMusic className="h-5 w-5" />
          Playlists
        </h2>
        {!isCreating && (
          <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" />
            New Playlist
          </Button>
        )}
      </div>

      {/* Create New Playlist Form */}
      {isCreating && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      'h-10 w-10 sm:h-8 sm:w-8 rounded-lg text-xl sm:text-lg transition-all touch-manipulation',
                      selectedEmoji === emoji
                        ? 'bg-brand text-white scale-110'
                        : 'hover:bg-surface-secondary active:bg-surface-tertiary'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                  placeholder="Playlist name..."
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
                />
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playlist Grid */}
      {playlists.length === 0 && !isCreating ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-brand/10 p-3">
              <ListMusic className="h-6 w-6 text-brand" />
            </div>
            <p className="text-body-md text-text-secondary mb-3">
              Organize your episodes into playlists
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              Create First Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              className="group relative overflow-hidden transition-all hover:border-brand/30"
            >
              <Link href={`/playlist/${playlist.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-2xl">
                      {playlist.coverEmoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === playlist.id ? (
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.preventDefault()}
                        >
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(playlist.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-brand focus:outline-none"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRename(playlist.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-medium text-text-primary truncate">
                          {playlist.name}
                        </h3>
                      )}
                      <div className="flex items-center gap-3 text-caption text-text-muted mt-1">
                        <span>{playlist.episodeCount} episodes</span>
                        {playlist.totalDurationSecs > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(playlist.totalDurationSecs)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-10 w-10 sm:h-8 sm:w-8 touch-manipulation"
                    >
                      <Play className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Link>

              {/* Menu Button - always visible on mobile */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(showMenu === playlist.id ? null : playlist.id);
                  }}
                  className="rounded-lg p-2 sm:p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface-secondary active:bg-surface-tertiary transition-all touch-manipulation"
                >
                  <MoreVertical className="h-5 w-5 sm:h-4 sm:w-4 text-text-muted" />
                </button>

                {showMenu === playlist.id && (
                  <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-border bg-surface shadow-lg py-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingId(playlist.id);
                        setEditName(playlist.name);
                        setShowMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(playlist.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface-secondary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
