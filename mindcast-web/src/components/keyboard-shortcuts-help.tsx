'use client';

import { X, Keyboard } from 'lucide-react';
import { type Shortcut, formatShortcut } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  // Group shortcuts by category
  const globalShortcuts = shortcuts.filter((s) => s.global);
  const audioShortcuts = shortcuts.filter((s) => !s.global);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-brand" />
            <h2 className="font-semibold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Global Shortcuts */}
          {globalShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2">
                Navigation
              </h3>
              <div className="space-y-1">
                {globalShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}

          {/* Audio Shortcuts */}
          {audioShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2">
                Audio Player
              </h3>
              <div className="space-y-1">
                {audioShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-text-muted text-center">
            Press <kbd className="kbd">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-secondary">{shortcut.description}</span>
      <kbd className="kbd">{formatShortcut(shortcut)}</kbd>
    </div>
  );
}

// Compact indicator for navbar
export function KeyboardShortcutsIndicator({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-2 py-1 text-xs text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors"
      title="Keyboard shortcuts (?)"
    >
      <Keyboard className="h-3.5 w-3.5" />
      <span>?</span>
    </button>
  );
}
