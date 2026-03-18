'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum, base, optimism, polygon } from '@reown/appkit/networks'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '87e52e87cec98e1956c14088e16e232d'

const metadata = {
  name: 'AkhAI',
  description: 'Sovereign Intelligence — School of Thoughts',
  url: 'https://akhai.app',
  icons: ['https://akhai.app/favicon.ico'],
}

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [mainnet, arbitrum, base, optimism, polygon],
  metadata,
  projectId,
  features: {
    analytics: false,
  },
  allWallets: 'SHOW',
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 100,
    '--w3m-font-size-master': '9px',
    '--w3m-border-radius-master': '2px',
    '--w3m-accent': '#111111',
  },
})

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
