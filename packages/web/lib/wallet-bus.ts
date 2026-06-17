/**
 * Wallet Bus — V6 Block 2 (A3). Defers the entire Reown/AppKit stack (~1.6 MB raw)
 * until first wallet intent. Module singleton + useSyncExternalStore-compatible API.
 */
'use client';

type WalletState = { requested: boolean; ready: boolean; pendingOpen: boolean };
let state: WalletState = { requested: false, ready: false, pendingOpen: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const walletBus = {
  get: (): WalletState => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  requestWallet(open = false) {
    if (state.ready && open) {
      void walletBus.openModal();
      return;
    }
    state = { ...state, requested: true, pendingOpen: state.pendingOpen || open };
    emit();
  },
  markReady() {
    state = { ...state, ready: true };
    emit();
  },
  clearPendingOpen() {
    state = { ...state, pendingOpen: false };
    emit();
  },
  async openModal() {
    try {
      const m = await import('@/components/Web3Provider');
      (m as any).appKit?.open?.();
    } catch {}
  },
  async disconnectWallet() {
    if (!state.ready) return; // nothing was ever initialized
    try {
      const m = await import('@/components/Web3Provider');
      await (m as any).appKit?.disconnect?.();
    } catch {}
  },
};

import { useSyncExternalStore } from 'react';
export function useWalletBus(): WalletState {
  return useSyncExternalStore(walletBus.subscribe, walletBus.get, walletBus.get);
}
