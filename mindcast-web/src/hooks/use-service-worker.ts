'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    // Register the service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker is ready
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerSW();

    // Handle controller change (when user accepts update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const update = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage('skipWaiting');
    }
  };

  return {
    ...state,
    update,
  };
}
