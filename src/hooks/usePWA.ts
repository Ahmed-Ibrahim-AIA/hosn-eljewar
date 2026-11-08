import { useState, useEffect, useCallback } from 'react';
import { APP_BASE_MAJOR_MINOR, APP_CURRENT_VERSION } from '../utils/finance';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt;
    }
    return null;
  });

  const [isInstallable, setIsInstallable] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return true;
    }
    return false;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // 1. Check if running in standalone mode (already launched from Home Screen / App Drawer)
    const checkStandalone = () => {
      const isStandaloneDisplay =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      setIsInstalled(isStandaloneDisplay);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    // 2. Check if early script in index.html already captured beforeinstallprompt
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
      setIsInstallable(true);
    }

    const syncDeferredPrompt = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
        setIsInstallable(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('borj_elnoor_pwa_installed', 'true');
      } catch {
        // Ignore storage error
      }
    };

    // 3. Ensure Service Worker (/sw.js) is registered and active
    const verifyServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const existingRegs = await navigator.serviceWorker.getRegistrations();
        if (existingRegs.length > 0) {
          setIsServiceWorkerReady(true);
        } else {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          setIsServiceWorkerReady(true);
        }
        await navigator.serviceWorker.ready;
        setIsServiceWorkerReady(true);
      } catch {
        // Ignore SW error in restricted environments
      }
    };

    verifyServiceWorker();

    const handleSwReady = () => setIsServiceWorkerReady(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', syncDeferredPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);
    window.addEventListener('pwa-sw-ready', handleSwReady);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', syncDeferredPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
      window.removeEventListener('pwa-sw-ready', handleSwReady);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isUpdatingApp, setIsUpdatingApp] = useState<boolean>(false);
  const [updateRevision, setUpdateRevision] = useState<number>(() => {
    try {
      const savedBase = localStorage.getItem('borj_elnoor_base_major_minor');
      if (savedBase !== APP_BASE_MAJOR_MINOR) {
        localStorage.setItem('borj_elnoor_base_major_minor', APP_BASE_MAJOR_MINOR);
        localStorage.setItem('borj_elnoor_update_revision', '0');
        localStorage.setItem('borj_elnoor_app_version', APP_CURRENT_VERSION);
        return 0;
      }
      const raw = localStorage.getItem('borj_elnoor_update_revision');
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
    } catch {
      return 0;
    }
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() => {
    try {
      return localStorage.getItem('borj_elnoor_last_updated_at') || '';
    } catch {
      return '';
    }
  });

  /**
   * Refreshes Service Worker registrations and purges stale asset caches
   * so that the browser always serves and installs the latest version of the app
   * while 100% preserving all localStorage financial & resident records.
   */
  const syncLatestServiceWorkerAndCache = useCallback(async (targetRev: number) => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          try {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            if (reg.active) {
              reg.active.postMessage({ type: 'PREPARE_LATEST_INSTALL' });
            }
          } catch {
            // Ignore single SW update error
          }
        }
      } catch {
        // Ignore SW query error
      }
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map(key => window.caches.delete(key)));
      } catch {
        // Ignore CacheStorage error
      }
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register(`/sw.js?v=${APP_BASE_MAJOR_MINOR}.${targetRev}`, { scope: '/' });
        setIsServiceWorkerReady(true);
      } catch {
        try {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          setIsServiceWorkerReady(true);
        } catch {
          // Ignore registration error
        }
      }
    }
  }, []);

  /**
   * Updates the installed PWA to the latest version, dynamically incrementing
   * the version revision & build timestamp while 100% preserving all localStorage data.
   */
  const updateInstalledApp = useCallback(
    async (reloadAfterUpdate = false): Promise<boolean> => {
      setIsUpdatingApp(true);
      try {
        const nextRev = updateRevision + 1;
        await syncLatestServiceWorkerAndCache(nextRev);

        const nowIso = new Date().toISOString();
        setUpdateRevision(nextRev);
        setLastUpdatedAt(nowIso);
        try {
          localStorage.setItem('borj_elnoor_base_major_minor', APP_BASE_MAJOR_MINOR);
          localStorage.setItem('borj_elnoor_update_revision', String(nextRev));
          localStorage.setItem('borj_elnoor_last_updated_at', nowIso);
          localStorage.setItem('borj_elnoor_app_version', `${APP_BASE_MAJOR_MINOR}.${nextRev}`);
        } catch {
          // Ignore storage error
        }

        if (reloadAfterUpdate && typeof window !== 'undefined') {
          window.location.reload();
        }
        return true;
      } finally {
        setIsUpdatingApp(false);
      }
    },
    [updateRevision, syncLatestServiceWorkerAndCache]
  );

  /**
   * Always prepares & syncs the latest version (Service Worker, Manifest, and Asset Cache)
   * before triggering the installation prompt so the user always installs the newest release.
   */
  const installApp = useCallback(async (): Promise<boolean> => {
    setIsUpdatingApp(true);
    try {
      await syncLatestServiceWorkerAndCache(updateRevision);
      const nowIso = new Date().toISOString();
      setLastUpdatedAt(nowIso);
      try {
        localStorage.setItem('borj_elnoor_last_updated_at', nowIso);
        localStorage.setItem('borj_elnoor_app_version', `${APP_BASE_MAJOR_MINOR}.${updateRevision}`);
      } catch {
        // Ignore storage error
      }
    } finally {
      setIsUpdatingApp(false);
    }

    const promptToUse =
      deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
    if (!promptToUse) return false;

    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt, updateRevision, syncLatestServiceWorkerAndCache]);

  return {
    isInstallable,
    isInstalled,
    isServiceWorkerReady,
    isOnline,
    isUpdatingApp,
    updateRevision,
    lastUpdatedAt,
    installApp,
    updateInstalledApp,
  };
}
