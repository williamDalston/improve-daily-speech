'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Shortcut {
  key: string;
  label: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  global?: boolean;
}

// Check if user is typing in an input field
function isTyping(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    activeElement.getAttribute('contenteditable') === 'true'
  );
}

// Format shortcut key for display
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.modifier) {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    switch (shortcut.modifier) {
      case 'ctrl':
        parts.push(isMac ? '⌃' : 'Ctrl');
        break;
      case 'alt':
        parts.push(isMac ? '⌥' : 'Alt');
        break;
      case 'shift':
        parts.push(isMac ? '⇧' : 'Shift');
        break;
      case 'meta':
        parts.push(isMac ? '⌘' : 'Win');
        break;
    }
  }

  parts.push(shortcut.label);
  return parts.join(' + ');
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing
      if (isTyping()) return;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        let modifierMatch = true;
        if (shortcut.modifier) {
          switch (shortcut.modifier) {
            case 'ctrl':
              modifierMatch = event.ctrlKey;
              break;
            case 'alt':
              modifierMatch = event.altKey;
              break;
            case 'shift':
              modifierMatch = event.shiftKey;
              break;
            case 'meta':
              modifierMatch = event.metaKey;
              break;
          }
        } else {
          // If no modifier specified, ensure no modifier is pressed
          modifierMatch = !event.ctrlKey && !event.altKey && !event.metaKey;
        }

        if (keyMatch && modifierMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global shortcuts hook - use at app level
export function useGlobalShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: 'n',
      label: 'N',
      description: 'New episode',
      action: () => router.push('/create'),
      global: true,
    },
    {
      key: 'l',
      label: 'L',
      description: 'Go to library',
      action: () => router.push('/library'),
      global: true,
    },
    {
      key: 'r',
      label: 'R',
      description: 'Go to reflect',
      action: () => router.push('/reflect'),
      global: true,
    },
    {
      key: 'h',
      label: 'H',
      description: 'Go home',
      action: () => router.push('/'),
      global: true,
    },
    {
      key: '/',
      label: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      global: true,
    },
    {
      key: '?',
      label: '?',
      description: 'Show shortcuts',
      action: () => setShowHelp(true),
      modifier: 'shift',
      global: true,
    },
    {
      key: 'Escape',
      label: 'Esc',
      description: 'Close modal / Cancel',
      action: () => setShowHelp(false),
      global: true,
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return {
    shortcuts,
    showHelp,
    setShowHelp,
  };
}

// Audio player shortcuts hook
export function useAudioShortcuts(controls: {
  togglePlay: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  toggleMute: () => void;
  increaseSpeed?: () => void;
  decreaseSpeed?: () => void;
}) {
  const shortcuts: Shortcut[] = [
    {
      key: ' ',
      label: 'Space',
      description: 'Play / Pause',
      action: controls.togglePlay,
    },
    {
      key: 'ArrowRight',
      label: '→',
      description: 'Skip forward 15s',
      action: controls.skipForward,
    },
    {
      key: 'ArrowLeft',
      label: '←',
      description: 'Skip backward 15s',
      action: controls.skipBackward,
    },
    {
      key: 'm',
      label: 'M',
      description: 'Mute / Unmute',
      action: controls.toggleMute,
    },
  ];

  if (controls.increaseSpeed) {
    shortcuts.push({
      key: '>',
      label: '>',
      description: 'Increase speed',
      action: controls.increaseSpeed,
      modifier: 'shift',
    });
  }

  if (controls.decreaseSpeed) {
    shortcuts.push({
      key: '<',
      label: '<',
      description: 'Decrease speed',
      action: controls.decreaseSpeed,
      modifier: 'shift',
    });
  }

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
