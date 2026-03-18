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
    swaps: false,
    onramp: false,
    email: false,
    socials: false,
  },
  allWallets: 'SHOW',
  featuredWalletIds: [
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ],
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 100,
    '--w3m-font-size-master': '7px',
    '--w3m-border-radius-master': '2px',
    '--w3m-accent': '#111111',
  },
})

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
