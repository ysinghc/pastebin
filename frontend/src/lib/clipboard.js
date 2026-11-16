/** Copy text to the clipboard. Resolves true on success, false otherwise. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall through to the legacy path (older browsers, or the async clipboard
    // API refusing because the user gesture has gone stale).
  }
  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
