/** Gates AuthModal behind wallet init — AppKit hooks crash pre-createAppKit. V6 Block 2. */
'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type AuthModalStatic from '@/components/AuthModal';
import { useWalletBus, walletBus } from '@/lib/wallet-bus';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
type Props = ComponentProps<typeof AuthModalStatic>;

export default function AuthModalGate(props: Props) {
  const { ready } = useWalletBus();
  useEffect(() => {
    walletBus.requestWallet(false);
  }, []);
  if (!ready) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30">
        <div className="rounded-lg bg-white px-5 py-3 text-sm shadow">
          Initializing secure session…
        </div>
      </div>
    );
  }
  return <AuthModal {...props} />;
}
