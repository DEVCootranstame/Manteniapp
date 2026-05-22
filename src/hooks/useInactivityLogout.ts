import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const useInactivityLogout = (onLogout: () => void, isActive: boolean) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onLogout, INACTIVITY_TIMEOUT);
  }, [onLogout]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['touchstart', 'touchmove', 'click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start initial timer

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, resetTimer]);
};
