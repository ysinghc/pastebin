/**
 * Client for the pastebin API.
 *
 * Every failure is thrown as an ApiError carrying a `kind` the UI can branch
 * on and a message written for the person reading it.
 */

const PRODUCTION_API = 'https://ysinghc-pastebin-api.hf.space';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080' : PRODUCTION_API)
).replace(/\/+$/, '');

// The API runs on a host that sleeps when idle, so the first request after a
// quiet spell can take a while. Give it room before calling it a timeout.
const REQUEST_TIMEOUT_MS = 60_000;

export const MAX_PASTE_BYTES = 50 * 1024;
export const PASTE_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

export class ApiError extends Error {
  constructor(kind, message, { status = 0, retryAfterSeconds = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function roughly(seconds) {
  const m = Math.max(1, Math.round(seconds / 60));
  if (m >= 60) return m < 90 ? 'an hour' : `${Math.round(m / 60)} hours`;
  return m === 1 ? 'a minute' : `${m} minutes`;
}

function errorFromResponse(status, body) {
  const code = body?.error;
  const retryAfterSeconds = body?.retry_after_seconds ?? null;

  if (status === 404) {
    return new ApiError('not_found', 'This paste does not exist or has already expired.', { status });
  }
  if (status === 413) {
    return new ApiError('too_large', 'This paste is over the 50 KB limit. Shorten it and publish again.', { status });
  }
  if (status === 429) {
    const wait = retryAfterSeconds ? ` Try again in about ${roughly(retryAfterSeconds)}.` : '';
    const what =
      body?.limit_type === 'bandwidth'
        ? 'You have reached the 500 KB hourly upload limit.'
        : body?.limit_type === 'paste_count'
          ? 'You have reached the limit of 20 pastes per hour.'
          : 'Too many requests from your network.';
    return new ApiError('rate_limited', what + wait, { status, retryAfterSeconds });
  }
  if (status === 422) {
    return new ApiError('invalid', 'The server rejected this paste. Check that it is not empty.', { status });
  }
  if (status === 504 || code === 'gateway_timeout') {
    return new ApiError('unavailable', 'Storage did not respond in time. Try again in a moment.', { status });
  }
  if (status === 503 || code === 'service_unavailable' || code === 'storage_error') {
    return new ApiError('unavailable', 'Storage is unreachable right now. Try again in a few minutes.', { status });
  }
  return new ApiError('unknown', body?.message || `The server answered with an error (${status}).`, { status });
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
  } catch (cause) {
    if (cause?.name === 'AbortError') {
      throw new ApiError('timeout', 'The server took too long to answer. Try again.');
    }
    throw new ApiError('network', 'Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON bodies only happen on unexpected errors; handled below.
  }

  if (!response.ok) throw errorFromResponse(response.status, body);
  if (body === null) throw new ApiError('unknown', 'The server sent a response this page could not read.');
  return body;
}

/** @returns {Promise<{id: string, expires_in: string, size_bytes: number}>} */
export function createPaste(content, ttl) {
  return request('/paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, ttl }),
  });
}

/** @returns {Promise<{content: string, ttl_remaining_seconds: number}>} */
export function getPaste(id) {
  if (!PASTE_ID_PATTERN.test(id)) {
    return Promise.reject(
      new ApiError('invalid_id', 'That is not a valid paste ID. IDs use only letters, digits, hyphens and underscores.'),
    );
  }
  return request(`/paste/${encodeURIComponent(id)}`);
}

/** Resolves with the health body for both healthy and degraded answers. */
export async function getHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    const body = await response.json();
    return { ok: response.ok && body?.status === 'ok', body };
  } finally {
    clearTimeout(timer);
  }
}
