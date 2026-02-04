'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useGlobalShortcuts, type Shortcut } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';

interface ShortcutsContextValue {
  shortcuts: Shortcut[];
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  // Return safe defaults if not within provider (e.g., during SSR)
  if (!context) {
    return {
      shortcuts: [],
      showHelp: false,
      setShowHelp: () => {},
    };
  }
  return context;
}

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const { shortcuts, showHelp, setShowHelp } = useGlobalShortcuts();

  return (
    <ShortcutsContext.Provider value={{ shortcuts, showHelp, setShowHelp }}>
      {children}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </ShortcutsContext.Provider>
  );
}
