'use client'

import { useState, useEffect, useCallback } from 'react'

interface DetectedWallet {
  name: string
  icon: string
  uuid: string
  rdns: string
  provider: any
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected: (address: string, provider: any) => void
}

// Known wallet metadata for fallback icons
const WALLET_ICONS: Record<string, string> = {
  'metamask': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23E2761B" d="M21.7 2L13.3 8.4l1.6-3.7z"/><path fill="%23E4761B" d="M2.3 2l8.3 6.5L9.1 4.7zm16.5 14.5l-2.2 3.4 4.8 1.3 1.4-4.6zm-17.2.1l1.4 4.6 4.8-1.3-2.2-3.4z"/></svg>',
  'coinbase': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle fill="%230052FF" cx="12" cy="12" r="12"/><path fill="white" d="M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm-2 4.5h4v4h-4z"/></svg>',
  'rabby': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle fill="%238697FF" cx="12" cy="12" r="12"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">R</text></svg>',
}

export default function WalletSelector({ isOpen, onClose, onConnected }: WalletModalProps) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Detect wallets via EIP-6963 (modern standard)
  useEffect(() => {
    if (!isOpen) return
    const detected: DetectedWallet[] = []

    const handler = (event: any) => {
      const { info, provider } = event.detail || {}
      if (info && provider) {
        detected.push({
          name: info.name,
          icon: info.icon || '',
          uuid: info.uuid,
          rdns: info.rdns || '',
          provider,
        })
        setWallets([...detected])
      }
    }

    window.addEventListener('eip6963:announceProvider', handler)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    // Fallback: if no EIP-6963 wallets detected after 500ms, check window.ethereum
    const fallbackTimer = setTimeout(() => {
      if (detected.length === 0 && (window as any).ethereum) {
        const eth = (window as any).ethereum
        // Check for multiple providers (MetaMask + others)
        if (eth.providers && Array.isArray(eth.providers)) {
          eth.providers.forEach((p: any, i: number) => {
            detected.push({
              name: p.isMetaMask ? 'MetaMask' : p.isCoinbaseWallet ? 'Coinbase Wallet' : `Wallet ${i + 1}`,
              icon: p.isMetaMask ? (WALLET_ICONS.metamask || '') : p.isCoinbaseWallet ? (WALLET_ICONS.coinbase || '') : '',
              uuid: `legacy-${i}`,
              rdns: '',
              provider: p,
            })
          })
        } else {
          detected.push({
            name: eth.isMetaMask ? 'MetaMask' : eth.isBraveWallet ? 'Brave Wallet' : eth.isCoinbaseWallet ? 'Coinbase Wallet' : 'Browser Wallet',
            icon: eth.isMetaMask ? (WALLET_ICONS.metamask || '') : '',
            uuid: 'legacy-0',
            rdns: '',
            provider: eth,
          })
        }
        setWallets([...detected])
      }
    }, 500)

    return () => {
      window.removeEventListener('eip6963:announceProvider', handler)
      clearTimeout(fallbackTimer)
    }
  }, [isOpen])

  const connectWallet = useCallback(async (wallet: DetectedWallet) => {
    setConnecting(wallet.uuid)
    setError('')
    try {
      const accounts = await wallet.provider.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]
      if (!address) throw new Error('No address returned')
      onConnected(address, wallet.provider)
    } catch (err: any) {
      if (!err?.message?.includes('rejected')) {
        setError(err?.message || 'Connection failed')
      }
    } finally {
      setConnecting(null)
    }
  }, [onConnected])

  if (!isOpen) return null

  return (
    <div className="space-y-2">
      <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1">← back</button>
      <h2 className="text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-1">connect wallet</h2>

      {wallets.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
            {wallets.length} wallet{wallets.length > 1 ? 's' : ''} detected
          </p>
          {wallets.map((wallet) => (
            <button
              key={wallet.uuid}
              onClick={() => connectWallet(wallet)}
              disabled={connecting !== null}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {connecting === wallet.uuid ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
              ) : wallet.icon ? (
                <img src={wallet.icon} alt="" className="w-5 h-5 rounded flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                  {wallet.name.charAt(0)}
                </div>
              )}
              <span className="flex-1 text-left">{wallet.name}</span>
              {connecting === wallet.uuid && <span className="text-[9px] text-gray-400">connecting...</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">No wallet detected</p>
          <p className="text-[9px] text-gray-400 dark:text-gray-500">Install MetaMask, Rabby, Coinbase Wallet, or any EIP-1193 wallet</p>
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 mt-2 text-center">{error}</p>}
    </div>
  )
}
