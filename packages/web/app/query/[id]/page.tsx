'use client';

import { use } from 'react';
import Link from 'next/link';
import VerificationWindow from '@/components/VerificationWindow';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QueryPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                href="/"
                className="text-gray-400 hover:text-white text-sm mb-2 inline-block transition-colors"
              >
                ← Back to Search
              </Link>
              <DecryptedTitle
                text="Query Results"
                className="text-2xl font-bold text-white"
                speed={20}
              />
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wider">
                Query ID: {id}
              </p>
            </div>
          </div>

          {/* Verification Window */}
          <VerificationWindow queryId={id} />
        </div>
      </div>
    </>
  );
}
