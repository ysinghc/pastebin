/**
 * Browser-local state: the unpublished draft, and the pastes this browser has
 * published that are still alive. Storage can be unavailable (private windows,
 * blocked site data), so every access is guarded and the app works without it.
 */

import { useSyncExternalStore } from 'react';

const DRAFT_KEY = 'pastebin:draft';
const RECENT_KEY = 'pastebin:recent';
const THEME_KEY = 'pastebin:theme';
const RECENT_EVENT = 'pastebin:recent-changed';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a convenience here; losing it is not an error.
  }
}

/* Draft ------------------------------------------------------------------ */

export function loadDraft() {
  const draft = read(DRAFT_KEY, null);
  if (!draft || typeof draft.content !== 'string') return null;
  return {
    content: draft.content,
    language: typeof draft.language === 'string' ? draft.language : 'auto',
    ttl: draft.ttl === '1h' ? '1h' : '10m',
  };
}

export function saveDraft(draft) {
  write(DRAFT_KEY, draft && draft.content ? draft : null);
}

/* Published pastes that are still alive ----------------------------------- */

let recentSnapshot = null;

function loadRecent() {
  const list = read(RECENT_KEY, []);
  if (!Array.isArray(list)) return [];
  const now = Date.now();
  return list.filter((entry) => entry && typeof entry.id === 'string' && entry.expiresAt > now);
}

function getRecentSnapshot() {
  if (recentSnapshot === null) recentSnapshot = loadRecent();
  return recentSnapshot;
}

function setRecent(list) {
  recentSnapshot = list;
  write(RECENT_KEY, list.length ? list : null);
  window.dispatchEvent(new Event(RECENT_EVENT));
}

export function addRecent(entry) {
  setRecent([entry, ...loadRecent().filter((other) => other.id !== entry.id)].slice(0, 20));
}

export function removeRecent(id) {
  setRecent(loadRecent().filter((entry) => entry.id !== id));
}

export function findRecent(id) {
  return getRecentSnapshot().find((entry) => entry.id === id) ?? null;
}

/** Drop expired entries. Returns true when something was removed. */
export function pruneRecent() {
  const current = getRecentSnapshot();
  const alive = loadRecent();
  if (alive.length === current.length) return false;
  setRecent(alive);
  return true;
}

function subscribeRecent(callback) {
  const onStorage = (event) => {
    if (event.key === RECENT_KEY || event.key === null) {
      recentSnapshot = null;
      callback();
    }
  };
  window.addEventListener(RECENT_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(RECENT_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function useRecent() {
  return useSyncExternalStore(subscribeRecent, getRecentSnapshot);
}

/* Theme ------------------------------------------------------------------- */

export function loadThemePreference() {
  const value = read(THEME_KEY, null);
  return value === 'light' || value === 'dark' ? value : null;
}

export function saveThemePreference(value) {
  write(THEME_KEY, value);
}
