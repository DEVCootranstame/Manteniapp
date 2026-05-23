import { useEffect, useRef, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVE_KEY = 'last_active_timestamp';

export const useInactivityLogout = (onLogout: () => void, isActive: boolean) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveTimestamp = useCallback(async () => {
    await Preferences.set({ key: LAST_ACTIVE_KEY, value: String(Date.now()) });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveTimestamp();
    timerRef.current = setTimeout(onLogout, INACTIVITY_TIMEOUT);
  }, [onLogout, saveTimestamp]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Check elapsed time when app resumes from background
    const resumeListener = App.addListener('appStateChange', async ({ isActive: appActive }) => {
      if (appActive) {
        const { value } = await Preferences.get({ key: LAST_ACTIVE_KEY });
        if (value) {
          const elapsed = Date.now() - Number(value);
          if (elapsed > INACTIVITY_TIMEOUT) {
            onLogout();
            return;
          }
        }
        // Resume the timer for remaining time
        resetTimer();
      } else {
        // App going to background — save timestamp, clear in-memory timer
        saveTimestamp();
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    });

    const events = ['touchstart', 'touchmove', 'click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      resumeListener.then(h => h.remove());
    };
  }, [isActive, resetTimer, onLogout, saveTimestamp]);
};
