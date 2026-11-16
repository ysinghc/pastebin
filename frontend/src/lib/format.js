const encoder = new TextEncoder();

export function byteLength(text) {
  return encoder.encode(text).length;
}

/** "812 B", "1.2 KB", "50 KB" */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb >= 10 || Number.isInteger(kb) ? Math.round(kb) : kb.toFixed(1)} KB`;
}

/** Seconds as a clock: "9:07", "59:59", "1:00:00". */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

/** Seconds in words, for screen readers and tooltips: "9 minutes 7 seconds". */
export function formatDurationWords(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts = [];
  if (m > 0) parts.push(m === 1 ? '1 minute' : `${m} minutes`);
  if (s > 0 || m === 0) parts.push(s === 1 ? '1 second' : `${s} seconds`);
  return parts.join(' ');
}

export function formatTimeOfDay(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function countLines(text) {
  if (!text) return 0;
  let lines = 1;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) lines += 1;
  }
  return lines;
}

/** First non-empty line, trimmed and shortened, to label a paste in lists. */
export function previewLine(text, max = 60) {
  const line = text.split('\n').find((candidate) => candidate.trim()) ?? '';
  const clean = line.trim().replace(/\s+/g, ' ');
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
