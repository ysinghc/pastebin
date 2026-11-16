/**
 * Two routes, so no router library:
 *   /                 new paste
 *   /<id>[.<ext>]     view a paste; the extension names its language
 */

import { useSyncExternalStore } from 'react';
import { PASTE_ID_PATTERN } from '../api';
import { getLanguage, languageFromExtension } from './languages';

const NAVIGATE_EVENT = 'pastebin:navigate';

export function parsePath(pathname) {
  if (pathname === '/' || pathname === '') return { name: 'new' };
  const match = pathname.match(/^\/([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9]+))?\/?$/);
  if (match && PASTE_ID_PATTERN.test(match[1])) {
    return { name: 'view', id: match[1], language: languageFromExtension(match[2]) };
  }
  return { name: 'unknown' };
}

/** Path for a paste. A known language is carried as the file extension. */
export function pastePath(id, languageId) {
  return languageId ? `/${id}.${getLanguage(languageId).ext}` : `/${id}`;
}

export function pasteUrl(id, languageId) {
  return `${window.location.origin}${pastePath(id, languageId)}`;
}

/**
 * Pull a paste reference out of whatever someone pasted into the "open" box:
 * a bare ID, an ID with extension, or a full link.
 */
export function parsePasteReference(input) {
  const value = input.trim();
  if (!value) return null;
  let path = value;
  try {
    if (/^https?:\/\//i.test(value)) path = new URL(value).pathname;
  } catch {
    return null;
  }
  const route = parsePath(path.startsWith('/') ? path : `/${path}`);
  return route.name === 'view' ? route : null;
}

export function navigate(path, { replace = false, state = null } = {}) {
  if (replace) window.history.replaceState(state, '', path);
  else window.history.pushState(state, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo(0, 0);
}

function subscribe(callback) {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** onClick for in-app links: client-side navigate unless the user wants a new tab. */
export function linkHandler(path) {
  return (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(path);
  };
}
