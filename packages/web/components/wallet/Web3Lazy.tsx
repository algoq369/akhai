/** Mounts nothing; importing Web3Provider on demand runs createAppKit (side-effect module). */
'use client';

import { useEffect, useRef } from 'react';
import { useWalletBus, walletBus } from '@/lib/wallet-bus';

export default function Web3Lazy() {
  const { requested, pendingOpen } = useWalletBus();
  const loading = useRef(false);
  useEffect(() => {
    if (!requested || loading.current) return;
    loading.current = true;
    import('@/components/Web3Provider')
      .then((m) => {
        walletBus.markReady();
        if (walletBus.get().pendingOpen) {
          (m as any).appKit?.open?.();
          walletBus.clearPendingOpen();
        }
      })
      .catch(() => {
        loading.current = false;
      });
  }, [requested, pendingOpen]);
  return null;
}
