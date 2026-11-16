import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth } from './api';
import { loadThemePreference, saveThemePreference } from './lib/storage';

/** Current time, refreshed every second while `active`. */
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** Briefly true after `trigger()`, for "Copied" confirmations. */
export function useFlash(duration = 2000) {
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const trigger = useCallback(() => {
    setOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), duration);
  }, [duration]);
  return [on, trigger];
}

const HEALTH_POLL_MS = 30_000;
const WAKING_AFTER_MS = 3_000;

/**
 * Server status: 'checking' | 'waking' | 'ok' | 'degraded' | 'offline'.
 * 'waking' means the first check is taking long enough that the host is
 * probably starting up from sleep.
 */
export function useHealth() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    let settledOnce = false;

    const wakingTimer = setTimeout(() => {
      if (!cancelled && !settledOnce) setStatus('waking');
    }, WAKING_AFTER_MS);

    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const { ok } = await getHealth();
        if (!cancelled) setStatus(ok ? 'ok' : 'degraded');
      } catch {
        if (!cancelled) setStatus('offline');
      } finally {
        settledOnce = true;
      }
    };

    check();
    const poll = setInterval(check, HEALTH_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearTimeout(wakingTimer);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return status;
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Follows the system theme until the person picks one explicitly. */
export function useTheme() {
  const [preference, setPreference] = useState(loadThemePreference);
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(systemTheme());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = preference ?? system;

  useEffect(() => {
    if (preference) document.documentElement.dataset.theme = preference;
    else delete document.documentElement.dataset.theme;
  }, [preference]);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Choosing what the system already shows means "follow the system again".
    const value = next === systemTheme() ? null : next;
    saveThemePreference(value);
    setPreference(value);
  }, [theme]);

  return [theme, toggle];
}
