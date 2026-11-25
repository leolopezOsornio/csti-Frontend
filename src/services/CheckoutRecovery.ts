import { isUUID, CheckoutError } from './Checkout.service';

export interface RecoveryReference { version: 1; accountId: number; quoteId: string; key: string; intentId: string | null }
const prefix = 'csti.checkout.v1.';
let generation = 0;
let activeAccount: number | null = null;
export const checkoutGeneration = () => generation;
export const checkoutAccount = () => activeAccount;
export function setCheckoutAccount(accountId: number | null) {
  if (activeAccount !== accountId) { activeAccount = accountId; generation++; }
}
export function parseRecovery(value: string, accountId: number): RecoveryReference {
  const r: unknown = JSON.parse(value);
  if (!r || typeof r !== 'object') throw new CheckoutError('INVALID_REFERENCE');
  const v = r as RecoveryReference;
  if (v.version !== 1 || v.accountId !== accountId || !isUUID(v.quoteId) || !isUUID(v.key) ||
      (v.intentId !== null && !isUUID(v.intentId))) throw new CheckoutError('INVALID_REFERENCE');
  return { version: 1, accountId, quoteId: v.quoteId, key: v.key, intentId: v.intentId };
}
export const recoveryStore = {
  read(accountId: number): RecoveryReference | null {
    const saved = localStorage.getItem(prefix + accountId);
    return saved ? parseRecovery(saved, accountId) : null;
  },
  write(value: RecoveryReference) {
    try { localStorage.setItem(prefix + value.accountId, JSON.stringify(value)); }
    catch { throw new CheckoutError('STORAGE_UNAVAILABLE'); }
  },
  remove(accountId: number) { localStorage.removeItem(prefix + accountId); },
};
export function clearCheckoutRecovery() {
  generation++;
  activeAccount = null;
  for (const storage of [localStorage, sessionStorage]) {
    try {
    storage.removeItem('selectedShippingRate');
    storage.removeItem('selectedAddressId');
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) storage.removeItem(key);
    }
    } catch { /* A blocked storage must not prevent logout or retain live callbacks. */ }
  }
}
