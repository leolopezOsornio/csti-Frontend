import { checkoutService, CheckoutError, checkoutError } from './Checkout.service';
import type { CheckoutAPI, CheckoutIntent, CheckoutQuote } from './Checkout.service';
import { checkoutGeneration, parseRecovery, recoveryStore } from './CheckoutRecovery';
import type { RecoveryReference } from './CheckoutRecovery';

export type CheckoutPhase = 'idle' | 'creating_intent' | 'creating_paypal' | 'awaiting_approval' | 'capturing' |
  'pending' | 'reconciling' | 'paid' | 'cancelled' | 'attention' | 'unavailable' | 'requote';
export interface CheckoutState { phase: CheckoutPhase; intent: CheckoutIntent | null; message: string; reference: RecoveryReference | null }
const pendingStates = ['PAYPAL_ORDER_PENDING', 'CAPTURE_PENDING', 'CAPTURE_UNKNOWN', 'RECONCILIATION_REQUIRED'];

// Only serializes client callbacks; Django is responsible for distributed locks.
export class CheckoutSession {
  private value: CheckoutState = { phase: 'idle', intent: null, message: '', reference: null };
  private listeners = new Set<() => void>();
  private flight: Promise<string> | null = null;
  private busy = false;
  private lastRecovery = -Infinity;
  private recoveries = 0;
  private generation = checkoutGeneration();
  private accountId: number;
  private current: () => boolean;
  private api: CheckoutAPI;
  constructor(accountId: number, current: () => boolean, api: CheckoutAPI = checkoutService) {
    this.accountId = accountId; this.current = current; this.api = api;
    try {
      const reference = recoveryStore.read(accountId);
      if (reference) this.value = { ...this.value, reference, phase: 'pending' };
    } catch { this.value = { ...this.value, phase: 'attention', message: 'La referencia guardada no es válida. Recupera con tu código o contacta a soporte.' }; }
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.value;
  private guard() { if (!this.current() || checkoutGeneration() !== this.generation) throw new CheckoutError('SESSION_CHANGED'); }
  private update(patch: Partial<CheckoutState>) {
    this.guard(); this.value = { ...this.value, ...patch }; this.listeners.forEach(listener => listener());
  }
  private save(reference: RecoveryReference) { this.guard(); recoveryStore.write(reference); this.update({ reference }); }
  private accept(intent: CheckoutIntent) {
    this.guard();
    const ref = this.value.reference;
    if (!ref || intent.quote_id !== ref.quoteId || ref.intentId && intent.intent_id !== ref.intentId) throw new CheckoutError('INVALID_RESPONSE');
    this.save({ ...ref, intentId: intent.intent_id });
    const phase: CheckoutPhase = intent.state === 'CAPTURED' ? (intent.order_id ? 'paid' : 'attention') :
      intent.state === 'FAILED' ? 'cancelled' : pendingStates.includes(intent.state) ? 'pending' : 'awaiting_approval';
    this.update({ intent, phase, message: phase === 'attention' ? 'El pago requiere revisión: falta la orden local confirmada.' :
      intent.state === 'RECONCILIATION_REQUIRED' ? 'La compra requiere verificación por nuestro equipo. Conserva tu código y contacta a soporte; no vuelvas a pagar.' : '' });
    if (intent.state === 'FAILED') { recoveryStore.remove(this.accountId); this.update({ reference: null }); }
  }
  private failed(error: unknown) {
    const e = checkoutError(error);
    if (!this.current() || checkoutGeneration() !== this.generation) return;
    if (['paid', 'cancelled', 'unavailable', 'requote'].includes(this.value.phase)) return;
    this.update({ phase: e.code === 'CHECKOUT_DISABLED' ? 'unavailable' :
      ['QUOTE_EXPIRED', 'QUOTE_CHANGED', 'QUOTE_ALREADY_USED'].includes(e.code) ? 'requote' :
      this.value.reference ? 'pending' : 'attention', message: e.message });
  }
  start(quote: CheckoutQuote): Promise<string> {
    if (this.flight) return this.flight;
    if (this.busy) return Promise.reject(new CheckoutError('CHECKOUT_BUSY'));
    this.flight = this.startOnce(quote).finally(() => { this.flight = null; });
    return this.flight;
  }
  private async startOnce(quote: CheckoutQuote): Promise<string> {
    this.guard();
    if (!quote.selected_rate_id || !quote.total || Date.parse(quote.expires_at) <= Date.now()) throw new CheckoutError('QUOTE_EXPIRED', 409);
    if (['paid', 'cancelled', 'attention', 'unavailable', 'requote'].includes(this.value.phase)) throw new CheckoutError('CHECKOUT_BLOCKED');
    if (this.value.reference && this.value.reference.quoteId !== quote.quote_id) throw new CheckoutError('CHECKOUT_ALREADY_ACTIVE', 409);
    this.busy = true;
    try {
      let ref = this.value.reference;
      if (!ref) { ref = { version: 1, accountId: this.accountId, quoteId: quote.quote_id, key: crypto.randomUUID(), intentId: null }; this.save(ref); }
      this.update({ phase: 'creating_intent', message: '' });
      this.guard();
      const intent = ref.intentId ? await this.api.get(ref.intentId) : await this.api.createIntent(ref.quoteId, ref.key);
      this.accept(intent);
      let result = intent;
      if (intent.state === 'CREATED') {
        this.update({ phase: 'creating_paypal' }); this.guard();
        result = await this.api.createPayPal(intent.intent_id); this.accept(result);
      }
      if (result.state !== 'PAYPAL_ORDER_CREATED' || !result.paypal_order_id) throw new CheckoutError('PAYPAL_PENDING');
      return result.paypal_order_id;
    } catch (error) {
      const e = checkoutError(error);
      // A definitive rejection of intent creation cannot have reached PayPal.
      // Existing or ambiguous intents always retain their recovery reference.
      if (this.current() && checkoutGeneration() === this.generation && !this.value.reference?.intentId &&
          ['QUOTE_EXPIRED', 'QUOTE_CHANGED', 'QUOTE_ALREADY_USED'].includes(e.code) && e.status === 409) {
        recoveryStore.remove(this.accountId); this.update({ reference: null });
      }
      this.failed(error); throw error;
    }
    finally { this.busy = false; }
  }
  async approve(orderId: string): Promise<void> {
    this.guard(); if (this.busy) return;
    const intent = this.value.intent;
    if (!intent || intent.state !== 'PAYPAL_ORDER_CREATED' || this.value.phase !== 'awaiting_approval') return;
    if (orderId !== intent.paypal_order_id) { this.failed(new CheckoutError('PAYPAL_ORDER_ID_MISMATCH')); return; }
    this.busy = true;
    try { this.update({ phase: 'capturing' }); this.accept(await this.api.capture(intent.intent_id, orderId)); }
    catch (error) { this.failed(error); }
    finally { this.busy = false; }
  }
  async resumeOrder(): Promise<string> {
    this.guard();
    if (!this.value.reference?.intentId || this.busy) throw new CheckoutError('CHECKOUT_BUSY');
    this.busy = true;
    try {
      let intent = await this.api.get(this.value.reference.intentId); this.accept(intent);
      if (intent.state === 'CREATED') { this.guard(); intent = await this.api.createPayPal(intent.intent_id); this.accept(intent); }
      if (intent.state !== 'PAYPAL_ORDER_CREATED' || !intent.paypal_order_id) throw new CheckoutError('PAYPAL_PENDING');
      return intent.paypal_order_id;
    } catch (error) { this.failed(error); throw error; }
    finally { this.busy = false; }
  }
  async restore(): Promise<void> {
    this.guard(); if (this.busy || !this.value.reference?.intentId) return;
    this.busy = true;
    try { this.accept(await this.api.get(this.value.reference.intentId)); }
    catch (error) { this.failed(error); }
    finally { this.busy = false; }
  }
  async recover(): Promise<void> {
    this.guard(); if (this.busy || !this.value.reference || this.value.phase === 'paid' || this.value.phase === 'cancelled') return;
    if (Date.now() - this.lastRecovery < 10000 || this.recoveries >= 5) { this.failed(new CheckoutError('RECOVERY_LIMIT')); return; }
    this.lastRecovery = Date.now(); this.recoveries++; this.busy = true;
    try {
      this.update({ phase: 'reconciling', message: '' });
      const ref = this.value.reference!;
      let intent = ref.intentId ? await this.api.get(ref.intentId) : await this.api.createIntent(ref.quoteId, ref.key);
      this.accept(intent);
      if (pendingStates.includes(intent.state)) { this.guard(); intent = await this.api.reconcile(intent.intent_id); this.accept(intent); }
    } catch (error) { this.failed(error); }
    finally { this.busy = false; }
  }
  async cancel(): Promise<void> {
    this.guard(); if (this.busy) return;
    const intent = this.value.intent;
    if (!intent || !['CREATED', 'PAYPAL_ORDER_CREATED'].includes(intent.state) || !['awaiting_approval', 'requote'].includes(this.value.phase)) {
      if (this.value.reference) this.update({ phase: 'pending', message: 'La cancelación visual no confirma el resultado. Consulta el estado de tu compra.' });
      return;
    }
    this.busy = true;
    try {
      const result = await this.api.cancel(intent.intent_id);
      this.accept(result);
      if (result.state === 'FAILED') { recoveryStore.remove(this.accountId); this.update({ reference: null }); }
    } catch (error) { this.failed(error); }
    finally { this.busy = false; }
  }
  importCode(code: string) {
    this.guard();
    if (this.value.reference) throw new CheckoutError('CHECKOUT_ALREADY_ACTIVE');
    this.save(parseRecovery(code, this.accountId)); this.update({ phase: 'pending', intent: null, message: '' });
  }
  acknowledgePaid() {
    this.guard(); if (this.value.phase !== 'paid' || !this.value.intent?.order_id) return;
    recoveryStore.remove(this.accountId); this.update({ reference: null });
  }
  retryQuote() {
    this.guard();
    if (this.value.reference || !['attention', 'requote', 'unavailable'].includes(this.value.phase)) return;
    this.update({ phase: 'idle', message: '', intent: null });
  }
  gatewayError() { this.failed(new CheckoutError('PAYPAL_RESULT_UNKNOWN')); }
}
