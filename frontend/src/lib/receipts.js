/**
 * In-memory hand-off from the composer to the paste page, so a paste you just
 * published opens instantly instead of being fetched back from the server.
 */

const receipts = new Map();

export function putReceipt(id, receipt) {
  receipts.set(id, receipt);
}

export function peekReceipt(id) {
  return receipts.get(id) ?? null;
}

/** The "link copied" confirmation is only true for the first visit. */
export function markReceiptSeen(id) {
  const receipt = receipts.get(id);
  if (receipt) receipts.set(id, { ...receipt, fresh: false });
}
